export interface Client {
  id: number;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  siret?: string;
  created_at: string;
}

export interface Produit {
  id: number;
  nom: string;
  description?: string;
  prix_unitaire_ht: number;
  taux_tva: number;
}

export interface LigneFacture {
  id?: number;
  produit_id?: number | null;
  designation: string;
  quantite: number;
  prix_unitaire_ht: number;
  taux_tva: number;
  remise_pct: number;
  total_ht_brut?: number;
  remise_montant?: number;
  total_ht_net?: number;
  tva_montant?: number;
  total_ttc?: number;
}

export type StatutFacture = "brouillon" | "envoyée" | "payée" | "en_retard" | "annulée";

export interface Totaux {
  sous_total_ht: number;
  remise_globale_pct: number;
  remise_globale_montant: number;
  total_ht_apres_remise: number;
  total_tva: number;
  total_ttc: number;
}

export interface Facture {
  id: number;
  numero: string;
  client_id: number;
  client_nom?: string;
  statut: StatutFacture;
  remise_globale_pct: number;
  date_emission: string;
  date_echeance?: string | null;
  notes?: string;
  lignes: LigneFacture[];
  totaux: Totaux;
}

export interface DashboardData {
  chiffre_affaires_ttc: number;
  chiffre_affaires_ht: number;
  total_tva_collectee: number;
  encaisse: number;
  en_attente: number;
  nombre_factures: number;
  nombre_clients: number;
  panier_moyen: number;
  evolution_mensuelle: { mois: string; total: number }[];
  repartition_statuts: { statut: string; count: number }[];
}
