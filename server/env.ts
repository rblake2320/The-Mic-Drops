import dotenv from "dotenv";
import { z } from "zod";
import { randomBytes } from "crypto";

// Load .env before anything reads process.env. Every module that needs config
// imports { env } from here, so ordering is guaranteed by the module graph.
dotenv.config();

/**
 * Fail-fast environment validation.
 *
 * Production: weak or missing secrets kill the process at boot (never limp
 * along with an insecure JWT signing key).
 * Development: missing secrets are replaced with ephemeral random values and
 * a loud warning, preserving the zero-config demo path.
 */

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  ADMIN_SECRET: z.string().min(24, "ADMIN_SECRET must be at least 24 characters"),
  DATABASE_URL: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().optional(),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  API_ONLY: z.enum(["true", "false"]).default("false"),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_EMAIL: z.string().optional(),
});

function loadEnv() {
  const raw: Record<string, string | undefined> = { ...process.env };

  if (!IS_PRODUCTION) {
    if (!raw.JWT_SECRET || raw.JWT_SECRET.length < 32 || raw.JWT_SECRET.startsWith("change-this")) {
      raw.JWT_SECRET = randomBytes(48).toString("hex");
      console.warn(
        "[env] JWT_SECRET missing/weak — using an ephemeral dev secret. Tokens will not survive a restart."
      );
    }
    if (!raw.ADMIN_SECRET || raw.ADMIN_SECRET.length < 24 || raw.ADMIN_SECRET.startsWith("change-this")) {
      raw.ADMIN_SECRET = randomBytes(32).toString("hex");
      console.warn("[env] ADMIN_SECRET missing/weak — using an ephemeral dev secret.");
    }
  }

  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("[env] Invalid environment configuration:");
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    // In production this is fatal — refuse to serve with insecure config.
    process.exit(1);
  }

  if (IS_PRODUCTION && parsed.data.CORS_ORIGIN.includes("localhost")) {
    console.warn("[env] CORS_ORIGIN is localhost in production — set it to your Pages URL.");
  }

  return parsed.data;
}

export const env = loadEnv();
export type Env = typeof env;
