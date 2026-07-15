import { Router, raw } from "express";
import Stripe from "stripe";
import { requireAuth, type AuthedRequest } from "../auth.js";
import { platformDb } from "../platform.js";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const APP_URL = process.env.APP_URL || "http://localhost:5173";

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

export const billingRouter = Router();

// Raw-body parser mounted separately in index.ts, before express.json(), because
// Stripe webhook signature verification needs the untouched request body.
export const billingWebhookRaw = raw({ type: "application/json" });

billingRouter.get("/status", requireAuth, (req: AuthedRequest, res) => {
  const org = platformDb.prepare("SELECT plan, statut_abonnement FROM organisations WHERE id = ?").get(req.user!.organisation_id);
  res.json(org ?? { plan: "essai", statut_abonnement: "essai" });
});

billingRouter.post("/checkout", requireAuth, async (req: AuthedRequest, res) => {
  if (!stripe || !STRIPE_PRICE_ID) {
    return res.status(501).json({
      error: "Paiement non configuré. Renseigne STRIPE_SECRET_KEY et STRIPE_PRICE_ID côté serveur (voir .env.example).",
    });
  }

  const org = platformDb.prepare("SELECT * FROM organisations WHERE id = ?").get(req.user!.organisation_id) as any;

  // Paiement unique (licence à vie), pas un abonnement récurrent : mode "payment", pas "subscription".
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
    customer: org?.stripe_customer_id || undefined,
    client_reference_id: String(req.user!.organisation_id),
    success_url: `${APP_URL}/?paiement=succes`,
    cancel_url: `${APP_URL}/?paiement=annule`,
  });

  res.json({ url: session.url });
});

// Stripe calls this directly (no JWT) — identity is verified via the webhook signature instead.
billingRouter.post("/webhook", async (req, res) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return res.status(501).json({ error: "Webhook non configuré." });
  }

  let event: Stripe.Event;
  try {
    const signature = req.headers["stripe-signature"] as string;
    event = stripe.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Signature webhook invalide`);
  }

  // Paiement unique confirmé : on active définitivement l'accès (pas de renouvellement,
  // pas d'annulation d'abonnement à gérer puisqu'il n'y en a pas).
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const organisationId = Number(session.client_reference_id);
    if (organisationId) {
      platformDb
        .prepare("UPDATE organisations SET statut_abonnement = 'actif', plan = 'pack_complet', stripe_customer_id = ? WHERE id = ?")
        .run(String(session.customer), organisationId);
    }
  }

  res.json({ received: true });
});
