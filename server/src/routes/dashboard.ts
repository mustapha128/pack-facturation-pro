import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../auth.js";
import { calculerFacture } from "../calc.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/", (req: AuthedRequest, res) => {
  const factures = req.db!.prepare("SELECT * FROM factures").all() as any[];
  const clients = req.db!.prepare("SELECT COUNT(*) as c FROM clients").get() as { c: number };

  let chiffre_affaires_ttc = 0;
  let chiffre_affaires_ht = 0;
  let total_tva_collectee = 0;
  let encaisse = 0;
  let en_attente = 0;
  const parMois: Record<string, number> = {};
  const parStatut: Record<string, number> = {};

  for (const f of factures) {
    const lignes = req.db!.prepare("SELECT * FROM facture_lignes WHERE facture_id = ?").all(f.id) as any[];
    const calc = calculerFacture(lignes, f.remise_globale_pct);
    chiffre_affaires_ttc += calc.total_ttc;
    chiffre_affaires_ht += calc.total_ht_apres_remise;
    total_tva_collectee += calc.total_tva;

    if (f.statut === "payée") encaisse += calc.total_ttc;
    else if (f.statut === "envoyée" || f.statut === "en_retard") en_attente += calc.total_ttc;

    const mois = String(f.date_emission).slice(0, 7);
    parMois[mois] = (parMois[mois] || 0) + calc.total_ttc;
    parStatut[f.statut] = (parStatut[f.statut] || 0) + 1;
  }

  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  res.json({
    chiffre_affaires_ttc: round2(chiffre_affaires_ttc),
    chiffre_affaires_ht: round2(chiffre_affaires_ht),
    total_tva_collectee: round2(total_tva_collectee),
    encaisse: round2(encaisse),
    en_attente: round2(en_attente),
    nombre_factures: factures.length,
    nombre_clients: clients.c,
    panier_moyen: factures.length ? round2(chiffre_affaires_ttc / factures.length) : 0,
    evolution_mensuelle: Object.entries(parMois)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mois, total]) => ({ mois, total: round2(total) })),
    repartition_statuts: Object.entries(parStatut).map(([statut, count]) => ({ statut, count })),
  });
});
