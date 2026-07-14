import type { LigneFacture, Totaux } from "./types";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function calculerLigne(l: LigneFacture): Required<Pick<LigneFacture,
  "total_ht_brut" | "remise_montant" | "total_ht_net" | "tva_montant" | "total_ttc"
>> {
  const total_ht_brut = (l.quantite || 0) * (l.prix_unitaire_ht || 0);
  const remise_montant = total_ht_brut * ((l.remise_pct || 0) / 100);
  const total_ht_net = total_ht_brut - remise_montant;
  const tva_montant = total_ht_net * ((l.taux_tva || 0) / 100);
  const total_ttc = total_ht_net + tva_montant;
  return {
    total_ht_brut: round2(total_ht_brut),
    remise_montant: round2(remise_montant),
    total_ht_net: round2(total_ht_net),
    tva_montant: round2(tva_montant),
    total_ttc: round2(total_ttc),
  };
}

export function calculerFacture(lignes: LigneFacture[], remiseGlobalePct: number): Totaux {
  const calculees = lignes.map((l) => ({ ...l, ...calculerLigne(l) }));
  const sous_total_ht = round2(calculees.reduce((s, l) => s + l.total_ht_net, 0));
  const remise_globale_montant = round2(sous_total_ht * ((remiseGlobalePct || 0) / 100));
  const total_ht_apres_remise = round2(sous_total_ht - remise_globale_montant);
  const ratio = sous_total_ht === 0 ? 0 : total_ht_apres_remise / sous_total_ht;
  const total_tva = round2(calculees.reduce((s, l) => s + l.tva_montant, 0) * ratio);
  const total_ttc = round2(total_ht_apres_remise + total_tva);

  return {
    sous_total_ht,
    remise_globale_pct: remiseGlobalePct || 0,
    remise_globale_montant,
    total_ht_apres_remise,
    total_tva,
    total_ttc,
  };
}

export function formatMontant(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n || 0);
}
