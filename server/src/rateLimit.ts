import type { Request, Response, NextFunction } from "express";

// Lightweight in-memory rate limiter — no extra dependency needed for a single-instance
// deployment. Blocks repeated login/register attempts from the same IP (brute-force guard).
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      return res.status(429).json({ error: "Trop de tentatives, réessaie dans quelques minutes." });
    }

    entry.count++;
    next();
  };
}
