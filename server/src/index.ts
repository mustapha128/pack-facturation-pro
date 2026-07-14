import express from "express";
import cors from "cors";
import "./platform.js";
import { authRouter } from "./routes/auth.js";
import { clientsRouter } from "./routes/clients.js";
import { produitsRouter } from "./routes/produits.js";
import { facturesRouter } from "./routes/factures.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { exportRouter } from "./routes/export.js";
import { historiqueRouter } from "./routes/historique.js";
import { billingRouter, billingWebhookRaw } from "./routes/billing.js";

const app = express();
app.use(cors());
// Stripe webhook needs the raw, untouched body to verify its signature — every
// other route gets normal JSON parsing.
app.use("/api/billing/webhook", billingWebhookRaw);
app.use((req, res, next) => {
  if (req.path === "/api/billing/webhook") return next();
  express.json()(req, res, next);
});

app.use("/api/auth", authRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/produits", produitsRouter);
app.use("/api/factures", facturesRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/export", exportRouter);
app.use("/api/historique", historiqueRouter);
app.use("/api/billing", billingRouter);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Erreur interne du serveur" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Pack Facturation Pro — API démarrée sur http://localhost:${PORT}`);
});
