import { createHash } from "crypto";

/**
 * Provenance chain — pure functions, stdlib crypto only.
 *
 * Every published Drop is committed to an append-only, hash-chained ledger:
 *
 *   entryHash_n = SHA-256( prevHash_{n-1} || contentHash || anchorHash || dropId || createdAtISO )
 *
 * - contentHash commits to what the creator said (title/content/voice/category).
 * - anchorHash commits to WHERE it came from (source, link, timecode, transcript
 *   excerpt) — the "receipts" behind the statement.
 * - The chain makes silent edits and deletions tamper-evident: mutating any
 *   published Drop, or removing/reordering ledger rows, breaks verification.
 *
 * This is the platform's core trust claim made mechanically checkable:
 * "algorithm-free, source-anchored delivery" becomes something a third party
 * can verify, not just marketing copy.
 */

export const GENESIS_HASH = "0".repeat(64);

export interface DropProvenancePayload {
  dropId: string;
  title: string;
  content: string;
  voiceName: string;
  category: string;
  anchorTitle: string;
  anchorSource: string;
  anchorLink: string;
  anchorTimeCode?: string | null;
  transcriptContext?: string | null;
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** Deterministic serialization — key order is fixed by construction. */
function canonical(fields: Array<[string, string]>): string {
  return fields.map(([k, v]) => `${k}=${v.length}:${v}`).join("|");
}

export function computeContentHash(p: DropProvenancePayload): string {
  return sha256Hex(
    canonical([
      ["dropId", p.dropId],
      ["title", p.title],
      ["content", p.content],
      ["voiceName", p.voiceName],
      ["category", p.category],
    ])
  );
}

export function computeAnchorHash(p: DropProvenancePayload): string {
  return sha256Hex(
    canonical([
      ["anchorTitle", p.anchorTitle],
      ["anchorSource", p.anchorSource],
      ["anchorLink", p.anchorLink],
      ["anchorTimeCode", p.anchorTimeCode ?? ""],
      ["transcriptContext", p.transcriptContext ?? ""],
    ])
  );
}

export function computeEntryHash(
  prevHash: string,
  contentHash: string,
  anchorHash: string,
  dropId: string,
  createdAtIso: string
): string {
  return sha256Hex(
    canonical([
      ["prev", prevHash],
      ["content", contentHash],
      ["anchor", anchorHash],
      ["dropId", dropId],
      ["createdAt", createdAtIso],
    ])
  );
}

export interface LedgerRow {
  seq: number;
  dropId: string;
  contentHash: string;
  anchorHash: string;
  prevHash: string;
  entryHash: string;
  createdAt: Date | string;
}

export interface ChainVerification {
  valid: boolean;
  entries: number;
  headHash: string | null;
  firstBrokenSeq: number | null;
  errors: string[];
}

/** Recompute and verify an entire chain (rows must be in ascending seq order). */
export function verifyChain(rows: LedgerRow[]): ChainVerification {
  const errors: string[] = [];
  let prev = GENESIS_HASH;
  let firstBrokenSeq: number | null = null;

  for (const row of rows) {
    if (row.prevHash !== prev) {
      errors.push(`seq ${row.seq}: prevHash mismatch (chain broken or reordered)`);
      if (firstBrokenSeq === null) firstBrokenSeq = row.seq;
    }
    const iso = typeof row.createdAt === "string" ? row.createdAt : row.createdAt.toISOString();
    const expected = computeEntryHash(row.prevHash, row.contentHash, row.anchorHash, row.dropId, iso);
    if (expected !== row.entryHash) {
      errors.push(`seq ${row.seq}: entryHash mismatch (row tampered)`);
      if (firstBrokenSeq === null) firstBrokenSeq = row.seq;
    }
    prev = row.entryHash;
  }

  return {
    valid: errors.length === 0,
    entries: rows.length,
    headHash: rows.length ? rows[rows.length - 1].entryHash : null,
    firstBrokenSeq,
    errors,
  };
}
