import { Router } from "express";
import { db } from "../db.js";
import { requireCreatorAuth } from "../middleware/auth.js";
import { scheduleDropJob, cancelDropJob } from "../queues/dispatcher.js";

const router = Router();

// Public: paginated drops feed filtered by interests
router.get("/", async (req, res) => {
  const { categories, adult, creatorId, limit = "20", offset = "0" } = req.query;

  const where: Record<string, unknown> = {
    status: { in: ["SENT", "DRAFT"] },
    creator: { status: { not: "REMOVED" } },
  };

  if (categories) {
    where.category = { in: (categories as string).split(",").map((c) => c.trim()) };
  }
  if (adult !== "true") {
    where.isAdult = false;
  }
  if (creatorId) {
    where.creatorId = creatorId as string;
  }

  const [drops, total] = await db.$transaction([
    db.drop.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, handle: true, avatarUrl: true, status: true },
        },
      },
      orderBy: { dateSent: "desc" },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    }),
    db.drop.count({ where }),
  ]);

  res.json({ drops, total });
});

// Creator: create or schedule a drop
router.post("/", requireCreatorAuth, async (req, res) => {
  const {
    title, content, voiceName, category, tone, isAdult,
    anchorTitle, anchorSource, anchorLink, anchorTimeCode,
    transcriptContext, scheduledAt,
  } = req.body;

  if (!title || !content) return res.status(400).json({ error: "title and content required" });

  const creator = await db.creator.findUnique({ where: { id: req.creator!.creatorId } });
  if (!creator) return res.status(404).json({ error: "Creator not found" });

  const scheduled = scheduledAt ? new Date(scheduledAt) : null;
  const dropStatus = scheduled ? "SCHEDULED" : creator.status === "AUTHORIZED" ? "SENT" : "DRAFT";

  const drop = await db.drop.create({
    data: {
      creatorId: req.creator!.creatorId,
      title,
      content,
      voiceName: voiceName ?? creator.voiceName,
      category: category ?? creator.category,
      tone: tone ?? "Inspirational",
      isAdult: isAdult ?? false,
      anchorTitle: anchorTitle ?? "Direct Creator Drop",
      anchorSource: anchorSource ?? "YouTube",
      anchorLink: anchorLink ?? "",
      anchorTimeCode,
      transcriptContext,
      status: dropStatus,
      scheduledAt: scheduled,
      dateSent: scheduled ?? new Date(),
      sentAt: dropStatus === "SENT" ? new Date() : null,
    },
  });

  if (scheduled) {
    await scheduleDropJob(drop.id, scheduled);
  }

  res.status(201).json({ success: true, drop });
});

// Creator: list own drops
router.get("/mine", requireCreatorAuth, async (req, res) => {
  const drops = await db.drop.findMany({
    where: { creatorId: req.creator!.creatorId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json({ drops });
});

// Creator: cancel a scheduled drop
router.patch("/:id/cancel", requireCreatorAuth, async (req, res) => {
  const drop = await db.drop.findUnique({ where: { id: req.params.id } });
  if (!drop || drop.creatorId !== req.creator!.creatorId) {
    return res.status(404).json({ error: "Drop not found" });
  }
  if (drop.status !== "SCHEDULED") {
    return res.status(400).json({ error: "Only SCHEDULED drops can be cancelled" });
  }

  await cancelDropJob(drop.id);
  await db.drop.update({ where: { id: drop.id }, data: { status: "CANCELLED" } });

  res.json({ success: true });
});

export default router;
