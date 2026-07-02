import { db } from "../db.js";
import {
  GENESIS_HASH,
  DropProvenancePayload,
  computeContentHash,
  computeAnchorHash,
  computeEntryHash,
  verifyChain,
  ChainVerification,
  LedgerRow,
} from "./chain.js";

/**
 * DB glue for the provenance chain. Recording is best-effort by design: a
 * ledger outage must never block a creator publishing (mirrors the existing
 * BullMQ-graceful philosophy). Verification later exposes any gap honestly.
 */

export async function recordDropProvenance(payload: DropProvenancePayload): Promise<string | null> {
  try {
    const entry = await db.$transaction(async (tx: any) => {
      const last = await tx.provenanceEntry.findFirst({ orderBy: { seq: "desc" } });
      const prevHash: string = last?.entryHash ?? GENESIS_HASH;
      const contentHash = computeContentHash(payload);
      const anchorHash = computeAnchorHash(payload);
      const createdAt = new Date();
      const entryHash = computeEntryHash(
        prevHash,
        contentHash,
        anchorHash,
        payload.dropId,
        createdAt.toISOString()
      );
      return tx.provenanceEntry.create({
        data: { dropId: payload.dropId, contentHash, anchorHash, prevHash, entryHash, createdAt },
      });
    });
    return entry.entryHash as string;
  } catch (err: any) {
    console.warn(`[Provenance] Could not record entry for ${payload.dropId}:`, err.message);
    return null;
  }
}

export interface FullVerification extends ChainVerification {
  driftedDrops: Array<{ dropId: string; reason: string }>;
}

/**
 * Verify the whole ledger AND cross-check each entry against the live Drop
 * row — detecting both ledger tampering and silent post-publish edits.
 */
export async function verifyLedger(): Promise<FullVerification> {
  const rows: LedgerRow[] = await db.provenanceEntry.findMany({ orderBy: { seq: "asc" } });
  const chain = verifyChain(rows);
  const driftedDrops: Array<{ dropId: string; reason: string }> = [];

  for (const row of rows) {
    const drop = await db.drop.findUnique({ where: { id: row.dropId } });
    if (!drop) {
      driftedDrops.push({ dropId: row.dropId, reason: "drop deleted after publication" });
      continue;
    }
    const recomputed = computeContentHash({
      dropId: drop.id,
      title: drop.title,
      content: drop.content,
      voiceName: drop.voiceName,
      category: drop.category,
      anchorTitle: drop.anchorTitle,
      anchorSource: drop.anchorSource,
      anchorLink: drop.anchorLink,
      anchorTimeCode: drop.anchorTimeCode,
      transcriptContext: drop.transcriptContext,
    });
    if (recomputed !== row.contentHash) {
      driftedDrops.push({ dropId: row.dropId, reason: "content changed after ledger commit" });
    }
  }

  return { ...chain, valid: chain.valid && driftedDrops.length === 0, driftedDrops };
}

/** Per-drop receipt: the ledger entry plus a live integrity check. */
export async function getDropReceipt(dropId: string) {
  const entry = await db.provenanceEntry.findUnique({ where: { dropId } });
  if (!entry) return null;

  const drop = await db.drop.findUnique({ where: { id: dropId } });
  let intact = false;
  if (drop) {
    intact =
      computeContentHash({
        dropId: drop.id,
        title: drop.title,
        content: drop.content,
        voiceName: drop.voiceName,
        category: drop.category,
        anchorTitle: drop.anchorTitle,
        anchorSource: drop.anchorSource,
        anchorLink: drop.anchorLink,
        anchorTimeCode: drop.anchorTimeCode,
        transcriptContext: drop.transcriptContext,
      }) === entry.contentHash;
  }

  return {
    dropId,
    seq: entry.seq,
    contentHash: entry.contentHash,
    anchorHash: entry.anchorHash,
    prevHash: entry.prevHash,
    entryHash: entry.entryHash,
    committedAt: entry.createdAt,
    contentIntact: intact,
  };
}
