import { Router } from "express";
import { db } from "../db.js";
import { requireCreatorAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { dropCreateSchema } from "../schemas.js";
import { scheduleDropJob, cancelDropJob } from "../queues/dispatcher.js";
import { recordDropProvenance } from "../provenance/ledger.js";

const router = Router();

// Public: paginated drops feed filtered by interests.
// SENT only — DRAFT is unpublished creator work and must never appear publicly.
router.get("/", async (req, res) => {
  const { categories, adult, creatorId } = req.query;
  const limit = Math.min(Math.max(parseInt((req.query.limit as string) ?? "20", 10) || 20, 1), 50);
  const offset = Math.max(parseInt((req.query.offset as string) ?? "0", 10) || 0, 0);

  const where: Record<string, unknown> = {
    status: "SENT",
    creator: { status: { not: "REMOVED" } },
  };

  if (categories) {
    where.category = {
      in: (categories as string).split(",").map((c) => c.trim()).filter(Boolean).slice(0, 40),
    };
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
      take: limit,
      skip: offset,
    }),
    db.drop.count({ where }),
  ]);

  res.json({ drops, total });
});

// Creator: create or schedule a drop
router.post("/", requireCreatorAuth, validateBody(dropCreateSchema), async (req, res) => {
  const {
    title, content, voiceName, category, tone, isAdult,
    anchorTitle, anchorSource, anchorLink, anchorTimeCode,
    transcriptContext, scheduledAt,
  } = req.body;

  const creator = await db.creator.findUnique({ where: { id: req.creator!.creatorId } });
  if (!creator) return res.status(404).json({ error: "Creator not found" });

  const scheduled = scheduledAt ? new Date(scheduledAt) : null;
  if (scheduled && scheduled.getTime() < Date.now() - 60_000) {
    return res.status(400).json({ error: "scheduledAt must be in the future" });
  }
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

  // Commit published drops to the tamper-evident provenance chain.
  // Best-effort: a ledger hiccup never blocks publishing; verify surfaces gaps.
  let provenanceHash: string | null = null;
  if (dropStatus === "SENT") {
    provenanceHash = await recordDropProvenance({
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
  }

  if (scheduled) {
    await scheduleDropJob(drop.id, scheduled);
  }

  res.status(201).json({ success: true, drop, provenanceHash });
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
