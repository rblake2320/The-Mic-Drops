import { Router } from "express";
import { db } from "../db.js";

const router = Router();

const VALID_TYPES = ["open", "play", "skip", "subscribe", "unsubscribe", "push_clicked"];

// Record a consumer analytics event
router.post("/event", async (req, res) => {
  const { type, consumerId, creatorId, dropId, metadata } = req.body;
  if (!type || !VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(", ")}` });
  }

  await db.analyticsEvent.create({
    data: { type, consumerId, creatorId, dropId, metadata },
  });

  res.json({ success: true });
});

// Summary for a specific drop (counts by event type)
router.get("/drops/:dropId", async (req, res) => {
  const events = await db.analyticsEvent.groupBy({
    by: ["type"],
    where: { dropId: req.params.dropId },
    _count: { type: true },
  });
  res.json({ events });
});

// Summary for a specific creator
router.get("/creators/:creatorId", async (req, res) => {
  const events = await db.analyticsEvent.groupBy({
    by: ["type"],
    where: { creatorId: req.params.creatorId },
    _count: { type: true },
  });
  res.json({ events });
});

export default router;
