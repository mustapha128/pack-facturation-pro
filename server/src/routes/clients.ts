import { Router } from "express";
import { z } from "zod";
import { logHistorique } from "../tenant.js";
import { requireAuth, type AuthedRequest } from "../auth.js";

export const clientsRouter = Router();
clientsRouter.use(requireAuth);

const clientSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  email: z.string().email().optional().or(z.literal("")),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  siret: z.string().optional(),
});

clientsRouter.get("/", (req: AuthedRequest, res) => {
  const { q, sort = "nom", order = "ASC" } = req.query as Record<string, string>;
  const allowedSort = new Set(["nom", "email", "created_at"]);
  const sortCol = allowedSort.has(sort) ? sort : "nom";
  const sortOrder = order.toUpperCase() === "DESC" ? "DESC" : "ASC";

  let rows;
  if (q) {
    rows = req.db!
      .prepare(
        `SELECT * FROM clients WHERE nom LIKE ? OR email LIKE ? OR telephone LIKE ? ORDER BY ${sortCol} ${sortOrder}`
      )
      .all(`%${q}%`, `%${q}%`, `%${q}%`);
  } else {
    rows = req.db!.prepare(`SELECT * FROM clients ORDER BY ${sortCol} ${sortOrder}`).all();
  }
  res.json(rows);
});

clientsRouter.get("/:id", (req: AuthedRequest, res) => {
  const client = req.db!.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
  if (!client) return res.status(404).json({ error: "Client introuvable" });
  res.json(client);
});

clientsRouter.post("/", (req: AuthedRequest, res) => {
  const parsed = clientSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const c = parsed.data;
  const info = req.db!
    .prepare("INSERT INTO clients (nom, email, telephone, adresse, siret) VALUES (?, ?, ?, ?, ?)")
    .run(c.nom, c.email || null, c.telephone || null, c.adresse || null, c.siret || null);
  logHistorique(req.db!, "clients", info.lastInsertRowid as number, "création", `Client créé: ${c.nom}`, req.user?.email);
  res.status(201).json(req.db!.prepare("SELECT * FROM clients WHERE id = ?").get(info.lastInsertRowid));
});

clientsRouter.put("/:id", (req: AuthedRequest, res) => {
  const parsed = clientSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const c = parsed.data;
  const existing = req.db!.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Client introuvable" });

  req.db!.prepare(
    `UPDATE clients SET nom=?, email=?, telephone=?, adresse=?, siret=?, updated_at=datetime('now') WHERE id=?`
  ).run(c.nom, c.email || null, c.telephone || null, c.adresse || null, c.siret || null, req.params.id);
  logHistorique(req.db!, "clients", Number(req.params.id), "modification", `Client modifié: ${c.nom}`, req.user?.email);
  res.json(req.db!.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id));
});

clientsRouter.delete("/:id", (req: AuthedRequest, res) => {
  const existing = req.db!.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id) as { nom: string } | undefined;
  if (!existing) return res.status(404).json({ error: "Client introuvable" });
  req.db!.prepare("DELETE FROM clients WHERE id = ?").run(req.params.id);
  logHistorique(req.db!, "clients", Number(req.params.id), "suppression", `Client supprimé: ${existing.nom}`, req.user?.email);
  res.status(204).send();
});
