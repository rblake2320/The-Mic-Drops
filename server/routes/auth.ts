import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db.js";
import { env } from "../env.js";
import { validateBody } from "../middleware/validate.js";
import { consumerRegisterSchema, creatorRegisterSchema, loginSchema } from "../schemas.js";

const router = Router();

function signConsumerToken(consumerId: string): string {
  return jwt.sign({ sub: consumerId, role: "consumer", type: "consumer" }, env.JWT_SECRET, {
    expiresIn: "30d",
  });
}

function signCreatorToken(userId: string, creatorId: string): string {
  return jwt.sign({ sub: userId, creatorId, role: "creator", type: "creator" }, env.JWT_SECRET, {
    expiresIn: "30d",
  });
}

// Consumer register
router.post("/consumer/register", validateBody(consumerRegisterSchema), async (req, res) => {
  const { email, password, interests, ageVerified } = req.body;

  if (await db.consumer.findUnique({ where: { email } })) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const consumer = await db.consumer.create({
    data: { email, passwordHash, interests, ageVerified },
  });

  res.status(201).json({ success: true, token: signConsumerToken(consumer.id), consumerId: consumer.id });
});

// Consumer login
router.post("/consumer/login", validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const consumer = await db.consumer.findUnique({ where: { email } });
  // Hash comparison runs even for unknown emails to keep response timing uniform.
  const hash = consumer?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";
  const ok = await bcrypt.compare(password, hash);
  if (!consumer || !ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.json({ success: true, token: signConsumerToken(consumer.id), consumerId: consumer.id });
});

// Creator register (requires an existing Creator record + admin approval)
router.post("/creator/register", validateBody(creatorRegisterSchema), async (req, res) => {
  const { email, password, creatorId } = req.body;

  const creator = await db.creator.findUnique({ where: { id: creatorId } });
  if (!creator) return res.status(404).json({ error: "Creator not found" });

  if (await db.creatorUser.findUnique({ where: { email } })) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.creatorUser.create({
    data: { email, passwordHash, creatorId },
  });

  res.status(201).json({ success: true, token: signCreatorToken(user.id, creatorId), creatorId });
});

// Creator login
router.post("/creator/login", validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await db.creatorUser.findUnique({ where: { email } });
  const hash = user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";
  const ok = await bcrypt.compare(password, hash);
  if (!user || !ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.json({ success: true, token: signCreatorToken(user.id, user.creatorId), creatorId: user.creatorId });
});

export default router;
