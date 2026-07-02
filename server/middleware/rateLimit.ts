import rateLimit from "express-rate-limit";

/**
 * Rate-limit tiers.
 *
 * authLimiter      — credential endpoints: blunt brute-force / stuffing.
 * aiLimiter        — Gemini-backed endpoints: they cost real money per call.
 * analyticsLimiter — unauthenticated write endpoint: blunt event-spam poisoning.
 * apiLimiter       — general ceiling for everything under /api.
 *
 * Backed by in-memory store — correct for a single pm2 process. If the API is
 * ever scaled horizontally, swap in rate-limit-redis using the existing
 * REDIS_URL so limits are shared across instances.
 */

const common = {
  standardHeaders: "draft-7" as const,
  legacyHeaders: false,
};

export const authLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { error: "Too many authentication attempts. Try again later." },
});

export const aiLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  limit: 10,
  message: { error: "AI rate limit reached. Slow down and retry shortly." },
});

export const analyticsLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  limit: 60,
  message: { error: "Too many events." },
});

export const apiLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  limit: 300,
  message: { error: "Rate limit exceeded." },
});
