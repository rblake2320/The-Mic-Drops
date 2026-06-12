import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

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
  return req.headers.authorization?.replace("Bearer ", "") ?? null;
}

export function requireCreatorAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as CreatorJwt;
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
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as ConsumerJwt;
    if (payload.type !== "consumer") return res.status(403).json({ error: "Forbidden" });
    req.consumer = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token || token !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: "Forbidden: invalid admin token" });
  }
  next();
}
