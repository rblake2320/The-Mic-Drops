import { Router } from "express";
import { db } from "../db.js";
import { optionalConsumerAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { analyticsEventSchema } from "../schemas.js";

const router = Router();

// Record a consumer analytics event.
// Identity comes from the bearer token when present — NEVER from the body.
// Anonymous events are allowed but carry no consumerId, so nobody can write
// poisoned events attributed to another user.
router.post("/event", optionalConsumerAuth, validateBody(analyticsEventSchema), async (req, res) => {
  const { type, creatorId, dropId, metadata } = req.body;

  await db.analyticsEvent.create({
    data: {
      type,
      consumerId: req.consumer?.sub ?? null,
      creatorId,
      dropId,
      metadata,
    },
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
