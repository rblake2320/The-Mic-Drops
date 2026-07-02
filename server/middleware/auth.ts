import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { timingSafeEqual } from "crypto";
import { env } from "../env.js";

export interface CreatorJwt {
  sub: string;
  creatorId: string;
  role: "creator";
  type: "creator";
}

export interface ConsumerJwt {
  sub: string;
  role: "consumer";
  type: "consumer";
}

declare global {
  namespace Express {
    interface Request {
      creator?: CreatorJwt;
      consumer?: ConsumerJwt;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

/** Constant-time string comparison — admin token check must not leak timing. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) {
    // Compare against self to keep timing uniform, then reject.
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

export function requireCreatorAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as CreatorJwt;
    if (payload.type !== "creator") return res.status(403).json({ error: "Forbidden" });
    req.creator = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireConsumerAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as ConsumerJwt;
    if (payload.type !== "consumer") return res.status(403).json({ error: "Forbidden" });
    req.consumer = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Attach consumer identity when a valid token is present; continue anonymously
 * otherwise. Used by endpoints (e.g. analytics) that accept anonymous traffic
 * but must never trust a client-supplied consumerId.
 */
export function optionalConsumerAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as ConsumerJwt;
      if (payload.type === "consumer") req.consumer = payload;
    } catch {
      // Anonymous fallthrough — invalid token on an optional-auth route is not fatal.
    }
  }
  next();
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token || !safeEqual(token, env.ADMIN_SECRET)) {
    return res.status(403).json({ error: "Forbidden: invalid admin token" });
  }
  next();
}
