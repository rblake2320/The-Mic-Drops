import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db.js";

const router = Router();

// Consumer register
router.post("/consumer/register", async (req, res) => {
  const { email, password, interests = [], ageVerified = false } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email and password required" });

  if (await db.consumer.findUnique({ where: { email } })) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const consumer = await db.consumer.create({
    data: { email, passwordHash, interests, ageVerified },
  });

  const token = jwt.sign(
    { sub: consumer.id, role: "consumer", type: "consumer" },
    process.env.JWT_SECRET!,
    { expiresIn: "30d" }
  );

  res.status(201).json({ success: true, token, consumerId: consumer.id });
});

// Consumer login
router.post("/consumer/login", async (req, res) => {
  const { email, password } = req.body;
  const consumer = await db.consumer.findUnique({ where: { email } });
  if (!consumer || !(await bcrypt.compare(password, consumer.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { sub: consumer.id, role: "consumer", type: "consumer" },
    process.env.JWT_SECRET!,
    { expiresIn: "30d" }
  );

  res.json({ success: true, token, consumerId: consumer.id });
});

// Creator register (requires an existing Creator record + admin approval)
router.post("/creator/register", async (req, res) => {
  const { email, password, creatorId } = req.body;
  if (!email || !password || !creatorId) {
    return res.status(400).json({ error: "email, password, and creatorId required" });
  }

  const creator = await db.creator.findUnique({ where: { id: creatorId } });
  if (!creator) return res.status(404).json({ error: "Creator not found" });

  if (await db.creatorUser.findUnique({ where: { email } })) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.creatorUser.create({
    data: { email, passwordHash, creatorId },
  });

  const token = jwt.sign(
    { sub: user.id, creatorId, role: "creator", type: "creator" },
    process.env.JWT_SECRET!,
    { expiresIn: "30d" }
  );

  res.status(201).json({ success: true, token, creatorId });
});

// Creator login
router.post("/creator/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await db.creatorUser.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { sub: user.id, creatorId: user.creatorId, role: "creator", type: "creator" },
    process.env.JWT_SECRET!,
    { expiresIn: "30d" }
  );

  res.json({ success: true, token, creatorId: user.creatorId });
});

export default router;
