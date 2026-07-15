import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { platformDb } from "../platform.js";
import { signToken } from "../auth.js";
import { rateLimit } from "../rateLimit.js";

export const authRouter = Router();
const authLimiter = rateLimit(10, 15 * 60 * 1000); // 10 tentatives / 15 min par IP

const registerSchema = z.object({
  entreprise: z.string().min(1, "Le nom de l'entreprise est requis"),
  email: z.string().email(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

authRouter.post("/register", authLimiter, (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { entreprise, email, password } = parsed.data;

  const existing = platformDb.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "Un compte existe déjà avec cet email" });

  const orgInfo = platformDb
    .prepare("INSERT INTO organisations (nom, plan, statut_abonnement) VALUES (?, 'essai', 'essai')")
    .run(entreprise);
  const organisationId = orgInfo.lastInsertRowid as number;

  const password_hash = bcrypt.hashSync(password, 10);
  const userInfo = platformDb
    .prepare("INSERT INTO users (organisation_id, email, password_hash, role) VALUES (?, ?, ?, 'admin')")
    .run(organisationId, email, password_hash);

  const token = signToken({ id: userInfo.lastInsertRowid as number, email, role: "admin", organisation_id: organisationId });
  res.status(201).json({ token, user: { id: userInfo.lastInsertRowid, email, role: "admin", organisation_id: organisationId, entreprise } });
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

authRouter.post("/login", authLimiter, (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Identifiants invalides" });
  const { email, password } = parsed.data;

  const user = platformDb.prepare("SELECT * FROM users WHERE email = ?").get(email) as
    | { id: number; email: string; password_hash: string; role: string; organisation_id: number }
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Email ou mot de passe incorrect" });
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role, organisation_id: user.organisation_id });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, organisation_id: user.organisation_id } });
});
