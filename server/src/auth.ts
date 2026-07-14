import type { Request, Response, NextFunction } from "express";
import type { DatabaseSync } from "node:sqlite";
import jwt from "jsonwebtoken";
import { getTenantDb } from "./tenant.js";

export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me-in-production";

export interface AuthPayload {
  id: number;
  email: string;
  role: string;
  organisation_id: number;
}

export interface AuthedRequest extends Request {
  user?: AuthPayload;
  db?: DatabaseSync;
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Non authentifié" });
  }
  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.db = getTenantDb(req.user.organisation_id);
    next();
  } catch {
    return res.status(401).json({ error: "Session invalide ou expirée" });
  }
}
