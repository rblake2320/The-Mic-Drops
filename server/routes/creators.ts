import { Router } from "express";
import { db } from "../db.js";
import { requireAdminAuth } from "../middleware/auth.js";

const router = Router();

// Public: list all non-removed creators
router.get("/", async (_req, res) => {
  const creators = await db.creator.findMany({
    where: { status: { not: "REMOVED" } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, name: true, handle: true, avatarUrl: true, category: true,
      followersCount: true, voiceName: true, description: true,
      videoChannelContext: true, status: true,
    },
  });
  res.json({ creators });
});

// Public: single creator
router.get("/:id", async (req, res) => {
  const creator = await db.creator.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, name: true, handle: true, avatarUrl: true, category: true,
      followersCount: true, voiceName: true, description: true,
      videoChannelContext: true, status: true,
    },
  });
  if (!creator || creator.status === "REMOVED") {
    return res.status(404).json({ error: "Creator not found" });
  }
  res.json({ creator });
});

// Admin: update creator status (pitch → authorized → removed)
router.patch("/:id/status", requireAdminAuth, async (req, res) => {
  const { status, consentRecord, pitchContactEmail, youtubeChannelId } = req.body;
  if (!["PITCH", "AUTHORIZED", "REMOVED"].includes(status)) {
    return res.status(400).json({ error: "status must be PITCH | AUTHORIZED | REMOVED" });
  }

  const update: Record<string, unknown> = { status };

  if (status === "AUTHORIZED") {
    update.consentSignedAt = new Date();
    if (consentRecord) update.consentRecord = consentRecord;
    if (youtubeChannelId) update.youtubeChannelId = youtubeChannelId;
  }

  if (status === "REMOVED") {
    // Anonymize — drop PII while keeping analytics history
    update.pitchContactEmail = null;
    update.consentRecord = null;
    update.youtubeChannelId = null;
  }

  if (pitchContactEmail) update.pitchContactEmail = pitchContactEmail;

  const creator = await db.creator.update({
    where: { id: req.params.id },
    data: update,
  });

  res.json({ success: true, creator });
});

// Admin: create a pitch-mode creator slot
router.post("/", requireAdminAuth, async (req, res) => {
  const { name, handle, avatarUrl, category, followersCount, voiceName, description, videoChannelContext, pitchContactEmail } = req.body;
  if (!name || !handle || !category || !voiceName) {
    return res.status(400).json({ error: "name, handle, category, voiceName required" });
  }

  const creator = await db.creator.create({
    data: {
      name,
      handle,
      avatarUrl: avatarUrl ?? "",
      category,
      followersCount: followersCount ?? "",
      voiceName,
      description: description ?? "",
      videoChannelContext,
      pitchContactEmail,
      status: "PITCH",
    },
  });

  res.status(201).json({ success: true, creator });
});

export default router;
