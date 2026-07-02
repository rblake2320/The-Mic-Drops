import { describe, it, expect } from "vitest";
import {
  GENESIS_HASH,
  computeContentHash,
  computeAnchorHash,
  computeEntryHash,
  verifyChain,
  LedgerRow,
  DropProvenancePayload,
} from "../server/provenance/chain";

function payload(overrides: Partial<DropProvenancePayload> = {}): DropProvenancePayload {
  return {
    dropId: "drop-1",
    title: "Actions Over Routine Playbooks",
    content: "Pick up the phone and call fifty clients.",
    voiceName: "Kore",
    category: "Inspirational / Wisdom",
    anchorTitle: "SOHK Episode 12",
    anchorSource: "YouTube",
    anchorLink: "https://youtu.be/abc123",
    anchorTimeCode: "02:15",
    transcriptContext: "…call fifty clients today…",
    ...overrides,
  };
}

function buildChain(n: number): LedgerRow[] {
  const rows: LedgerRow[] = [];
  let prev = GENESIS_HASH;
  for (let i = 1; i <= n; i++) {
    const p = payload({ dropId: `drop-${i}`, content: `content ${i}` });
    const contentHash = computeContentHash(p);
    const anchorHash = computeAnchorHash(p);
    const createdAt = new Date(2026, 0, i).toISOString();
    const entryHash = computeEntryHash(prev, contentHash, anchorHash, p.dropId, createdAt);
    rows.push({ seq: i, dropId: p.dropId, contentHash, anchorHash, prevHash: prev, entryHash, createdAt });
    prev = entryHash;
  }
  return rows;
}

describe("provenance chain", () => {
  it("content hash is deterministic and order-independent of construction", () => {
    expect(computeContentHash(payload())).toBe(computeContentHash(payload()));
  });

  it("content hash changes when any committed field changes", () => {
    const base = computeContentHash(payload());
    expect(computeContentHash(payload({ content: "edited" }))).not.toBe(base);
    expect(computeContentHash(payload({ title: "Edited" }))).not.toBe(base);
    expect(computeContentHash(payload({ dropId: "drop-2" }))).not.toBe(base);
  });

  it("length-prefixed canonicalization prevents field-boundary collisions", () => {
    // "ab" + "c" must not hash equal to "a" + "bc"
    const a = computeContentHash(payload({ title: "ab", content: "c" }));
    const b = computeContentHash(payload({ title: "a", content: "bc" }));
    expect(a).not.toBe(b);
  });

  it("anchor hash commits to source link and timecode", () => {
    const base = computeAnchorHash(payload());
    expect(computeAnchorHash(payload({ anchorLink: "https://youtu.be/other" }))).not.toBe(base);
    expect(computeAnchorHash(payload({ anchorTimeCode: "03:00" }))).not.toBe(base);
  });

  it("verifies an intact chain", () => {
    const result = verifyChain(buildChain(5));
    expect(result.valid).toBe(true);
    expect(result.entries).toBe(5);
    expect(result.errors).toHaveLength(0);
    expect(result.headHash).toBe(buildChain(5)[4].entryHash);
  });

  it("detects a tampered row (content swap)", () => {
    const rows = buildChain(5);
    rows[2].contentHash = "f".repeat(64);
    const result = verifyChain(rows);
    expect(result.valid).toBe(false);
    expect(result.firstBrokenSeq).toBe(3);
  });

  it("detects a deleted row (broken linkage)", () => {
    const rows = buildChain(5);
    rows.splice(1, 1); // remove seq 2
    const result = verifyChain(rows);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("prevHash mismatch"))).toBe(true);
  });

  it("detects reordered rows", () => {
    const rows = buildChain(4);
    [rows[1], rows[2]] = [rows[2], rows[1]];
    expect(verifyChain(rows).valid).toBe(false);
  });

  it("empty chain is trivially valid", () => {
    const result = verifyChain([]);
    expect(result.valid).toBe(true);
    expect(result.headHash).toBeNull();
  });
});
