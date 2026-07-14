import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const tenantsDir = path.resolve(process.cwd(), "data", "tenants");
if (!fs.existsSync(tenantsDir)) fs.mkdirSync(tenantsDir, { recursive: true });

const cache = new Map<number, DatabaseSync>();

const SCHEMA = `
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  adresse TEXT,
  siret TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS produits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  description TEXT,
  prix_unitaire_ht REAL NOT NULL DEFAULT 0,
  taux_tva REAL NOT NULL DEFAULT 20,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS factures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero TEXT NOT NULL UNIQUE,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  statut TEXT NOT NULL DEFAULT 'brouillon',
  remise_globale_pct REAL NOT NULL DEFAULT 0,
  date_emission TEXT NOT NULL DEFAULT (date('now')),
  date_echeance TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS facture_lignes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  facture_id INTEGER NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  produit_id INTEGER REFERENCES produits(id) ON DELETE SET NULL,
  designation TEXT NOT NULL,
  quantite REAL NOT NULL DEFAULT 1,
  prix_unitaire_ht REAL NOT NULL DEFAULT 0,
  taux_tva REAL NOT NULL DEFAULT 20,
  remise_pct REAL NOT NULL DEFAULT 0,
  ordre INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS historique (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entite TEXT NOT NULL,
  entite_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  detail TEXT,
  user_email TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_lignes_facture ON facture_lignes(facture_id);
CREATE INDEX IF NOT EXISTS idx_factures_client ON factures(client_id);
`;

export function getTenantDb(organisationId: number): DatabaseSync {
  const cached = cache.get(organisationId);
  if (cached) return cached;

  const filePath = path.join(tenantsDir, `org_${organisationId}.db`);
  const db = new DatabaseSync(filePath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(SCHEMA);
  cache.set(organisationId, db);
  return db;
}

export function logHistorique(db: DatabaseSync, entite: string, entiteId: number, action: string, detail: string, userEmail?: string) {
  db.prepare(
    `INSERT INTO historique (entite, entite_id, action, detail, user_email) VALUES (?, ?, ?, ?, ?)`
  ).run(entite, entiteId, action, detail, userEmail ?? null);
}
