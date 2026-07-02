import { Router } from "express";
import { verifyLedger, getDropReceipt } from "../provenance/ledger.js";

const router = Router();

/**
 * Public trust surface. Deliberately unauthenticated — the whole point is
 * that ANYONE (a consumer, a journalist, a creator's lawyer) can verify that
 * published Drops have not been silently edited, deleted, or reordered.
 */

// Full-chain verification summary
router.get("/verify", async (_req, res) => {
  const result = await verifyLedger();
  res.json(result);
});

// Per-drop provenance receipt
router.get("/drops/:dropId", async (req, res) => {
  const receipt = await getDropReceipt(req.params.dropId);
  if (!receipt) return res.status(404).json({ error: "No provenance entry for this drop" });
  res.json({ receipt });
});

export default router;
