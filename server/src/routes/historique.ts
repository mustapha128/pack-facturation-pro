import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../auth.js";

export const historiqueRouter = Router();
historiqueRouter.use(requireAuth);

historiqueRouter.get("/", (req: AuthedRequest, res) => {
  const { entite, limit = "100" } = req.query as Record<string, string>;
  let sql = "SELECT * FROM historique WHERE 1=1";
  const params: any[] = [];
  if (entite) {
    sql += " AND entite = ?";
    params.push(entite);
  }
  sql += " ORDER BY created_at DESC LIMIT ?";
  params.push(Number(limit) || 100);
  res.json(req.db!.prepare(sql).all(...params));
});
