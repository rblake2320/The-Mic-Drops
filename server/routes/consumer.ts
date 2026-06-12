import { Router } from "express";
import { db } from "../db.js";
import { requireConsumerAuth } from "../middleware/auth.js";

const router = Router();

// Get my profile
router.get("/me", requireConsumerAuth, async (req, res) => {
  const consumer = await db.consumer.findUnique({
    where: { id: req.consumer!.sub },
    select: { id: true, email: true, interests: true, ageVerified: true, createdAt: true },
  });
  res.json({ consumer });
});

// Update declared interests and age gate
router.patch("/interests", requireConsumerAuth, async (req, res) => {
  const { interests, ageVerified } = req.body;
  await db.consumer.update({
    where: { id: req.consumer!.sub },
    data: {
      ...(Array.isArray(interests) ? { interests } : {}),
      ...(typeof ageVerified === "boolean" ? { ageVerified } : {}),
    },
  });
  res.json({ success: true });
});

// Register push subscription
router.post("/push/subscribe", requireConsumerAuth, async (req, res) => {
  const { endpoint, auth, p256dh } = req.body;
  if (!endpoint || !auth || !p256dh) {
    return res.status(400).json({ error: "endpoint, auth, and p256dh required" });
  }
  await db.consumer.update({
    where: { id: req.consumer!.sub },
    data: { pushEndpoint: endpoint, pushAuth: auth, pushP256dh: p256dh },
  });
  res.json({ success: true });
});

// Unregister push subscription
router.delete("/push/subscribe", requireConsumerAuth, async (req, res) => {
  await db.consumer.update({
    where: { id: req.consumer!.sub },
    data: { pushEndpoint: null, pushAuth: null, pushP256dh: null },
  });
  res.json({ success: true });
});

// Subscribe to a creator
router.post("/subscriptions/:creatorId", requireConsumerAuth, async (req, res) => {
  const { creatorId } = req.params;
  const consumerId = req.consumer!.sub;

  await db.subscription.upsert({
    where: { consumerId_creatorId: { consumerId, creatorId } },
    update: { status: "ACTIVE" },
    create: { consumerId, creatorId, status: "ACTIVE" },
  });

  res.json({ success: true });
});

// Unsubscribe from a creator
router.delete("/subscriptions/:creatorId", requireConsumerAuth, async (req, res) => {
  await db.subscription.updateMany({
    where: { consumerId: req.consumer!.sub, creatorId: req.params.creatorId },
    data: { status: "CANCELLED" },
  });
  res.json({ success: true });
});

// List active subscriptions
router.get("/subscriptions", requireConsumerAuth, async (req, res) => {
  const subs = await db.subscription.findMany({
    where: { consumerId: req.consumer!.sub, status: "ACTIVE" },
    include: {
      creator: {
        select: { id: true, name: true, handle: true, avatarUrl: true, status: true },
      },
    },
  });
  res.json({ subscriptions: subs });
});

export default router;
