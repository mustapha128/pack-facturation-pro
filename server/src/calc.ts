export interface LigneCalc {
  designation?: string;
  quantite: number;
  prix_unitaire_ht: number;
  taux_tva: number;
  remise_pct: number;
}

export interface LigneCalculee extends LigneCalc {
  total_ht_brut: number;
  remise_montant: number;
  total_ht_net: number;
  tva_montant: number;
  total_ttc: number;
}

export interface FactureCalculee {
  lignes: LigneCalculee[];
  sous_total_ht: number;
  remise_globale_pct: number;
  remise_globale_montant: number;
  total_ht_apres_remise: number;
  total_tva: number;
  total_ttc: number;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function calculerLigne(l: LigneCalc): LigneCalculee {
  const total_ht_brut = l.quantite * l.prix_unitaire_ht;
  const remise_montant = total_ht_brut * (l.remise_pct / 100);
  const total_ht_net = total_ht_brut - remise_montant;
  const tva_montant = total_ht_net * (l.taux_tva / 100);
  const total_ttc = total_ht_net + tva_montant;
  return {
    ...l,
    total_ht_brut: round2(total_ht_brut),
    remise_montant: round2(remise_montant),
    total_ht_net: round2(total_ht_net),
    tva_montant: round2(tva_montant),
    total_ttc: round2(total_ttc),
  };
}

export function calculerFacture(lignes: LigneCalc[], remiseGlobalePct: number): FactureCalculee {
  const lignesCalculees = lignes.map(calculerLigne);
  const sous_total_ht = round2(lignesCalculees.reduce((s, l) => s + l.total_ht_net, 0));
  const remise_globale_montant = round2(sous_total_ht * (remiseGlobalePct / 100));
  const total_ht_apres_remise = round2(sous_total_ht - remise_globale_montant);

  const ratio = sous_total_ht === 0 ? 0 : total_ht_apres_remise / sous_total_ht;
  const total_tva = round2(lignesCalculees.reduce((s, l) => s + l.tva_montant, 0) * ratio);
  const total_ttc = round2(total_ht_apres_remise + total_tva);

  return {
    lignes: lignesCalculees,
    sous_total_ht,
    remise_globale_pct: remiseGlobalePct,
    remise_globale_montant,
    total_ht_apres_remise,
    total_tva,
    total_ttc,
  };
}
