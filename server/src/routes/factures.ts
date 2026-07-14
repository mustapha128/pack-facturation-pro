import { Router } from "express";
import { z } from "zod";
import { logHistorique } from "../tenant.js";
import { requireAuth, type AuthedRequest } from "../auth.js";
import { calculerFacture } from "../calc.js";
import type { DatabaseSync } from "node:sqlite";

export const facturesRouter = Router();
facturesRouter.use(requireAuth);

const ligneSchema = z.object({
  produit_id: z.number().nullable().optional(),
  designation: z.string().min(1),
  quantite: z.number().positive(),
  prix_unitaire_ht: z.number().nonnegative(),
  taux_tva: z.number().min(0).max(100),
  remise_pct: z.number().min(0).max(100).default(0),
});

const factureSchema = z.object({
  client_id: z.number(),
  statut: z.enum(["brouillon", "envoyée", "payée", "en_retard", "annulée"]).default("brouillon"),
  remise_globale_pct: z.number().min(0).max(100).default(0),
  date_emission: z.string().optional(),
  date_echeance: z.string().nullable().optional(),
  notes: z.string().optional(),
  lignes: z.array(ligneSchema).min(1, "Au moins une ligne est requise"),
});

function nextNumero(db: DatabaseSync): string {
  const year = new Date().getFullYear();
  const count = (db.prepare("SELECT COUNT(*) as c FROM factures WHERE numero LIKE ?").get(`FA-${year}-%`) as {
    c: number;
  }).c;
  return `FA-${year}-${String(count + 1).padStart(4, "0")}`;
}

function attachCalc(db: DatabaseSync, facture: any) {
  const lignes = db
    .prepare("SELECT * FROM facture_lignes WHERE facture_id = ? ORDER BY ordre")
    .all(facture.id) as any[];
  const calc = calculerFacture(lignes, facture.remise_globale_pct);
  return { ...facture, lignes: calc.lignes, totaux: calc };
}

facturesRouter.get("/", (req: AuthedRequest, res) => {
  const { q, statut, sort = "date_emission", order = "DESC" } = req.query as Record<string, string>;
  const allowedSort = new Set(["numero", "date_emission", "date_echeance", "statut"]);
  const sortCol = allowedSort.has(sort) ? sort : "date_emission";
  const sortOrder = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

  let sql = `SELECT f.*, c.nom as client_nom FROM factures f JOIN clients c ON c.id = f.client_id WHERE 1=1`;
  const params: any[] = [];
  if (q) {
    sql += ` AND (f.numero LIKE ? OR c.nom LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`);
  }
  if (statut) {
    sql += ` AND f.statut = ?`;
    params.push(statut);
  }
  sql += ` ORDER BY f.${sortCol} ${sortOrder}`;

  const rows = req.db!.prepare(sql).all(...params) as any[];
  const withTotals = rows.map((f) => {
    const lignes = req.db!.prepare("SELECT * FROM facture_lignes WHERE facture_id = ?").all(f.id) as any[];
    const calc = calculerFacture(lignes, f.remise_globale_pct);
    return { ...f, totaux: calc };
  });
  res.json(withTotals);
});

facturesRouter.get("/:id", (req: AuthedRequest, res) => {
  const facture = req.db!.prepare("SELECT * FROM factures WHERE id = ?").get(req.params.id);
  if (!facture) return res.status(404).json({ error: "Facture introuvable" });
  res.json(attachCalc(req.db!, facture));
});

function saveLignes(db: DatabaseSync, factureId: number, lignes: z.infer<typeof ligneSchema>[]) {
  db.prepare("DELETE FROM facture_lignes WHERE facture_id = ?").run(factureId);
  const insert = db.prepare(
    `INSERT INTO facture_lignes (facture_id, produit_id, designation, quantite, prix_unitaire_ht, taux_tva, remise_pct, ordre)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  lignes.forEach((l, idx) => {
    insert.run(factureId, l.produit_id ?? null, l.designation, l.quantite, l.prix_unitaire_ht, l.taux_tva, l.remise_pct, idx);
  });
}

facturesRouter.post("/", (req: AuthedRequest, res) => {
  const parsed = factureSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const f = parsed.data;

  const client = req.db!.prepare("SELECT id FROM clients WHERE id = ?").get(f.client_id);
  if (!client) return res.status(400).json({ error: "Client introuvable" });

  const numero = nextNumero(req.db!);
  const info = req.db!
    .prepare(
      `INSERT INTO factures (numero, client_id, statut, remise_globale_pct, date_emission, date_echeance, notes)
       VALUES (?, ?, ?, ?, COALESCE(?, date('now')), ?, ?)`
    )
    .run(numero, f.client_id, f.statut, f.remise_globale_pct, f.date_emission || null, f.date_echeance || null, f.notes || null);

  const factureId = info.lastInsertRowid as number;
  saveLignes(req.db!, factureId, f.lignes);
  logHistorique(req.db!, "factures", factureId, "création", `Facture créée: ${numero}`, req.user?.email);

  const facture = req.db!.prepare("SELECT * FROM factures WHERE id = ?").get(factureId);
  res.status(201).json(attachCalc(req.db!, facture));
});

facturesRouter.put("/:id", (req: AuthedRequest, res) => {
  const parsed = factureSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const f = parsed.data;
  const existing = req.db!.prepare("SELECT * FROM factures WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Facture introuvable" });

  req.db!.prepare(
    `UPDATE factures SET client_id=?, statut=?, remise_globale_pct=?, date_emission=COALESCE(?, date_emission),
     date_echeance=?, notes=?, updated_at=datetime('now') WHERE id=?`
  ).run(f.client_id, f.statut, f.remise_globale_pct, f.date_emission || null, f.date_echeance || null, f.notes || null, req.params.id);

  saveLignes(req.db!, Number(req.params.id), f.lignes);
  logHistorique(req.db!, "factures", Number(req.params.id), "modification", `Facture modifiée`, req.user?.email);

  const facture = req.db!.prepare("SELECT * FROM factures WHERE id = ?").get(req.params.id);
  res.json(attachCalc(req.db!, facture));
});

facturesRouter.delete("/:id", (req: AuthedRequest, res) => {
  const existing = req.db!.prepare("SELECT * FROM factures WHERE id = ?").get(req.params.id) as { numero: string } | undefined;
  if (!existing) return res.status(404).json({ error: "Facture introuvable" });
  req.db!.prepare("DELETE FROM factures WHERE id = ?").run(req.params.id);
  logHistorique(req.db!, "factures", Number(req.params.id), "suppression", `Facture supprimée: ${existing.numero}`, req.user?.email);
  res.status(204).send();
});
