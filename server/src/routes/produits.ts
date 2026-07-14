import { Router } from "express";
import { z } from "zod";
import { logHistorique } from "../tenant.js";
import { requireAuth, type AuthedRequest } from "../auth.js";

export const produitsRouter = Router();
produitsRouter.use(requireAuth);

const produitSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  prix_unitaire_ht: z.number().nonnegative(),
  taux_tva: z.number().min(0).max(100),
});

produitsRouter.get("/", (req: AuthedRequest, res) => {
  const { q, sort = "nom", order = "ASC" } = req.query as Record<string, string>;
  const allowedSort = new Set(["nom", "prix_unitaire_ht", "created_at"]);
  const sortCol = allowedSort.has(sort) ? sort : "nom";
  const sortOrder = order.toUpperCase() === "DESC" ? "DESC" : "ASC";

  let rows;
  if (q) {
    rows = req.db!
      .prepare(`SELECT * FROM produits WHERE nom LIKE ? OR description LIKE ? ORDER BY ${sortCol} ${sortOrder}`)
      .all(`%${q}%`, `%${q}%`);
  } else {
    rows = req.db!.prepare(`SELECT * FROM produits ORDER BY ${sortCol} ${sortOrder}`).all();
  }
  res.json(rows);
});

produitsRouter.post("/", (req: AuthedRequest, res) => {
  const parsed = produitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const p = parsed.data;
  const info = req.db!
    .prepare("INSERT INTO produits (nom, description, prix_unitaire_ht, taux_tva) VALUES (?, ?, ?, ?)")
    .run(p.nom, p.description || null, p.prix_unitaire_ht, p.taux_tva);
  logHistorique(req.db!, "produits", info.lastInsertRowid as number, "création", `Produit créé: ${p.nom}`, req.user?.email);
  res.status(201).json(req.db!.prepare("SELECT * FROM produits WHERE id = ?").get(info.lastInsertRowid));
});

produitsRouter.put("/:id", (req: AuthedRequest, res) => {
  const parsed = produitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const p = parsed.data;
  const existing = req.db!.prepare("SELECT * FROM produits WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Produit introuvable" });

  req.db!.prepare(
    `UPDATE produits SET nom=?, description=?, prix_unitaire_ht=?, taux_tva=?, updated_at=datetime('now') WHERE id=?`
  ).run(p.nom, p.description || null, p.prix_unitaire_ht, p.taux_tva, req.params.id);
  logHistorique(req.db!, "produits", Number(req.params.id), "modification", `Produit modifié: ${p.nom}`, req.user?.email);
  res.json(req.db!.prepare("SELECT * FROM produits WHERE id = ?").get(req.params.id));
});

produitsRouter.delete("/:id", (req: AuthedRequest, res) => {
  const existing = req.db!.prepare("SELECT * FROM produits WHERE id = ?").get(req.params.id) as { nom: string } | undefined;
  if (!existing) return res.status(404).json({ error: "Produit introuvable" });
  req.db!.prepare("DELETE FROM produits WHERE id = ?").run(req.params.id);
  logHistorique(req.db!, "produits", Number(req.params.id), "suppression", `Produit supprimé: ${existing.nom}`, req.user?.email);
  res.status(204).send();
});
