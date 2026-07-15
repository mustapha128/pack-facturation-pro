import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ApiError, downloadFile } from "../lib/api";
import { calculerFacture, calculerLigne, formatMontant } from "../lib/calc";
import type { Client, Facture, LigneFacture, Produit, StatutFacture } from "../lib/types";

const statuts: StatutFacture[] = ["brouillon", "envoyée", "payée", "en_retard", "annulée"];

function nouvelleLigne(): LigneFacture {
  return { designation: "", quantite: 1, prix_unitaire_ht: 0, taux_tva: 20, remise_pct: 0 };
}

export default function FactureEditor() {
  const { id } = useParams();
  const isNew = id === "nouvelle";
  const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [clientId, setClientId] = useState<number | "">("");
  const [statut, setStatut] = useState<StatutFacture>("brouillon");
  const [remiseGlobale, setRemiseGlobale] = useState(0);
  const [dateEcheance, setDateEcheance] = useState("");
  const [notes, setNotes] = useState("");
  const [lignes, setLignes] = useState<LigneFacture[]>([nouvelleLigne()]);
  const [numero, setNumero] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [loaded, setLoaded] = useState(isNew);

  useEffect(() => {
    api.get<Client[]>("/clients").then(setClients);
    api.get<Produit[]>("/produits").then(setProduits);
  }, []);

  useEffect(() => {
    if (!isNew && id) {
      api.get<Facture>(`/factures/${id}`).then((f) => {
        setClientId(f.client_id);
        setStatut(f.statut);
        setRemiseGlobale(f.remise_globale_pct);
        setDateEcheance(f.date_echeance || "");
        setNotes(f.notes || "");
        setLignes(f.lignes.length ? f.lignes : [nouvelleLigne()]);
        setNumero(f.numero);
        setLoaded(true);
      });
    }
  }, [id, isNew]);

  // Recalcul automatique et instantané à chaque changement
  const totaux = useMemo(() => calculerFacture(lignes, remiseGlobale), [lignes, remiseGlobale]);

  // Sauvegarde automatique : dès qu'un champ change, l'enregistrement se déclenche seul
  // après une courte pause de frappe — aucun clic requis, conformément au cahier des charges.
  useEffect(() => {
    if (!loaded) return;
    if (!clientId) return;
    if (lignes.every((l) => !l.designation.trim())) return;

    const timeout = setTimeout(() => {
      save(true);
    }, 700);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, clientId, statut, remiseGlobale, dateEcheance, notes, JSON.stringify(lignes)]);

  function updateLigne(idx: number, patch: Partial<LigneFacture>) {
    setLignes((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function selectProduit(idx: number, produitId: string) {
    const p = produits.find((pr) => pr.id === Number(produitId));
    if (!p) {
      updateLigne(idx, { produit_id: null });
      return;
    }
    updateLigne(idx, {
      produit_id: p.id,
      designation: p.nom,
      prix_unitaire_ht: p.prix_unitaire_ht,
      taux_tva: p.taux_tva,
    });
  }

  function addLigne() {
    setLignes((prev) => [...prev, nouvelleLigne()]);
  }

  function removeLigne(idx: number) {
    setLignes((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  }

  async function save(silent = false) {
    if (!silent) setError("");
    if (!clientId) { if (!silent) setError("Veuillez sélectionner un client"); return; }
    if (lignes.some((l) => !l.designation.trim())) { if (!silent) setError("Toutes les lignes doivent avoir une désignation"); return; }

    if (silent) setAutoSaveState("saving");
    else setSaving(true);
    try {
      const payload = {
        client_id: clientId,
        statut,
        remise_globale_pct: remiseGlobale,
        date_echeance: dateEcheance || null,
        notes,
        lignes: lignes.map((l) => ({
          produit_id: l.produit_id ?? null,
          designation: l.designation,
          quantite: l.quantite,
          prix_unitaire_ht: l.prix_unitaire_ht,
          taux_tva: l.taux_tva,
          remise_pct: l.remise_pct,
        })),
      };
      if (isNew) {
        const f = await api.post<Facture>("/factures", payload);
        navigate(`/factures/${f.id}`, { replace: true });
      } else {
        await api.put<Facture>(`/factures/${id}`, payload);
      }
      if (silent) setAutoSaveState("saved");
    } catch (err) {
      if (!silent) setError(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement");
      if (silent) setAutoSaveState("idle");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="topbar">
        <h1>{isNew ? "Nouvelle facture" : `Facture ${numero ?? ""}`}</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="text-muted" style={{ fontSize: "0.8rem" }}>
            {autoSaveState === "saving" && "Enregistrement automatique..."}
            {autoSaveState === "saved" && "✓ Enregistré automatiquement"}
          </span>
          {!isNew && (
            <>
              <button className="btn" onClick={() => downloadFile(`/export/factures/${id}/pdf`, `${numero}.pdf`)}>Export PDF</button>
              <button className="btn" onClick={() => downloadFile(`/export/factures/${id}/csv`, `${numero}.csv`)}>Export CSV/Excel</button>
            </>
          )}
          <button className="btn btn-gold" onClick={() => save()} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</button>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="field-row">
            <div className="field">
              <label>Client *</label>
              <select style={{ width: "100%" }} value={clientId} onChange={(e) => setClientId(Number(e.target.value))}>
                <option value="">Sélectionner...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Statut</label>
              <select style={{ width: "100%" }} value={statut} onChange={(e) => setStatut(e.target.value as StatutFacture)}>
                {statuts.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Échéance</label>
              <input type="date" style={{ width: "100%" }} value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} />
            </div>
          </div>

          <h3>Lignes de facturation</h3>
          <div className="ligne-row" style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            <span>Désignation</span><span>Qté</span><span>PU HT</span><span>Remise %</span><span>TVA %</span><span>Total TTC</span><span></span>
          </div>
          {lignes.map((l, idx) => {
            const c = calculerLigne(l);
            return (
              <div className="ligne-row" key={idx}>
                <div>
                  <select
                    value={l.produit_id ?? ""}
                    onChange={(e) => selectProduit(idx, e.target.value)}
                    style={{ width: "100%", marginBottom: 4 }}
                  >
                    <option value="">Ligne libre...</option>
                    {produits.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
                  </select>
                  <input
                    placeholder="Désignation"
                    value={l.designation}
                    onChange={(e) => updateLigne(idx, { designation: e.target.value })}
                    style={{ width: "100%" }}
                  />
                </div>
                <input type="number" min={0} step="0.01" value={l.quantite} onChange={(e) => updateLigne(idx, { quantite: Number(e.target.value) })} />
                <input type="number" min={0} step="0.01" value={l.prix_unitaire_ht} onChange={(e) => updateLigne(idx, { prix_unitaire_ht: Number(e.target.value) })} />
                <input type="number" min={0} max={100} step="0.1" value={l.remise_pct} onChange={(e) => updateLigne(idx, { remise_pct: Number(e.target.value) })} />
                <input type="number" min={0} max={100} step="0.1" value={l.taux_tva} onChange={(e) => updateLigne(idx, { taux_tva: Number(e.target.value) })} />
                <strong>{formatMontant(c.total_ttc)}</strong>
                <button className="btn btn-sm btn-danger" onClick={() => removeLigne(idx)} title="Supprimer la ligne">✕</button>
              </div>
            );
          })}
          <button className="btn btn-sm" onClick={addLigne} style={{ marginTop: 8 }}>+ Ajouter une ligne</button>

          <div className="field" style={{ marginTop: 20 }}>
            <label>Notes</label>
            <textarea rows={3} style={{ width: "100%" }} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && <div className="error-text">{error}</div>}
        </div>

        <div className="card" style={{ alignSelf: "start" }}>
          <h3 className="mt-0">Récapitulatif</h3>
          <div className="field">
            <label>Remise globale (%)</label>
            <input
              type="number" min={0} max={100} step="0.1" style={{ width: "100%" }}
              value={remiseGlobale}
              onChange={(e) => setRemiseGlobale(Number(e.target.value))}
            />
          </div>
          <div className="totaux-box">
            <div className="totaux-line"><span>Sous-total HT</span><span>{formatMontant(totaux.sous_total_ht)}</span></div>
            <div className="totaux-line"><span>Remise globale</span><span>- {formatMontant(totaux.remise_globale_montant)}</span></div>
            <div className="totaux-line"><span>Total HT</span><span>{formatMontant(totaux.total_ht_apres_remise)}</span></div>
            <div className="totaux-line"><span>TVA</span><span>{formatMontant(totaux.total_tva)}</span></div>
            <div className="totaux-line total"><span>Total TTC</span><span>{formatMontant(totaux.total_ttc)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
