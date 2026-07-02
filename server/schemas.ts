import { z } from "zod";

/** Shared request-body schemas. Every mutating endpoint validates its input. */

const cuidish = z.string().min(3).max(64).regex(/^[A-Za-z0-9_-]+$/, "invalid id");

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z
  .string()
  .min(10, "password must be at least 10 characters")
  .max(128);

export const consumerRegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  interests: z.array(z.string().min(1).max(80)).max(40).default([]),
  ageVerified: z.boolean().default(false),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const creatorRegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  creatorId: cuidish,
});

export const dropCreateSchema = z.object({
  title: z.string().trim().min(1).max(140),
  content: z.string().trim().min(1).max(2000),
  voiceName: z.string().max(40).optional(),
  category: z.string().max(80).optional(),
  tone: z.string().max(40).optional(),
  isAdult: z.boolean().optional(),
  anchorTitle: z.string().max(200).optional(),
  anchorSource: z
    .enum(["YouTube", "Netflix", "Radio", "Podcast", "Website", "Broadcast"])
    .optional(),
  anchorLink: z.string().url().max(500).or(z.literal("")).optional(),
  anchorTimeCode: z.string().max(16).optional(),
  transcriptContext: z.string().max(4000).optional(),
  scheduledAt: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
});

export const analyticsEventSchema = z.object({
  type: z.enum(["open", "play", "skip", "subscribe", "unsubscribe", "push_clicked"]),
  creatorId: cuidish.optional(),
  dropId: cuidish.optional(),
  metadata: z.record(z.unknown()).optional(),
  // NOTE: consumerId is intentionally NOT accepted from the body.
  // Identity is derived from the (optional) bearer token server-side.
});

export const ingestYouTubeSchema = z.object({
  youtubeUrl: z.string().url().max(500),
  timeCode: z
    .string()
    .regex(/^(\d{1,2}:)?[0-5]?\d:[0-5]\d$|^\d{1,5}$/, "timeCode must be s, mm:ss, or hh:mm:ss")
    .optional(),
  windowSeconds: z.coerce.number().int().min(10).max(600).default(120),
});

export const generateDropSchema = z.object({
  rawInput: z.string().trim().min(1).max(4000),
  creatorName: z.string().max(120).optional(),
  contextType: z.string().max(120).optional(),
});

export const ttsSchema = z.object({
  text: z.string().trim().min(1).max(1200),
  voiceName: z.enum(["Zephyr", "Fenrir", "Kore", "Puck", "Charon"]).optional(),
});

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url().max(1000),
  auth: z.string().min(1).max(256),
  p256dh: z.string().min(1).max(256),
});

export const interestsUpdateSchema = z.object({
  interests: z.array(z.string().min(1).max(80)).max(40).optional(),
  ageVerified: z.boolean().optional(),
});
