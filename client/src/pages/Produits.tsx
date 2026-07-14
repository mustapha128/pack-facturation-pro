import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { formatMontant } from "../lib/calc";
import type { Produit } from "../lib/types";

const empty = { nom: "", description: "", prix_unitaire_ht: 0, taux_tva: 20 };

export default function Produits() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Produit | null>(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    setProduits(await api.get<Produit[]>(`/produits?${params}`));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function openNew() {
    setEditing(null);
    setForm(empty);
    setError("");
    setModalOpen(true);
  }

  function openEdit(p: Produit) {
    setEditing(p);
    setForm({ nom: p.nom, description: p.description || "", prix_unitaire_ht: p.prix_unitaire_ht, taux_tva: p.taux_tva });
    setError("");
    setModalOpen(true);
  }

  async function save() {
    try {
      if (editing) await api.put(`/produits/${editing.id}`, form);
      else await api.post("/produits", form);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement");
    }
  }

  async function remove(p: Produit) {
    if (!confirm(`Supprimer le produit "${p.nom}" ?`)) return;
    await api.del(`/produits/${p.id}`);
    load();
  }

  return (
    <div>
      <div className="topbar">
        <h1>Produits &amp; Services</h1>
        <button className="btn btn-gold" onClick={openNew}>+ Nouveau produit</button>
      </div>

      <div className="toolbar">
        <input placeholder="Rechercher un produit..." value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 260 }} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Description</th>
              <th>Prix unitaire HT</th>
              <th>TVA</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {produits.map((p) => (
              <tr key={p.id}>
                <td>{p.nom}</td>
                <td className="text-muted">{p.description}</td>
                <td>{formatMontant(p.prix_unitaire_ht)}</td>
                <td>{p.taux_tva}%</td>
                <td className="text-right">
                  <button className="btn btn-sm" onClick={() => openEdit(p)}>Modifier</button>{" "}
                  <button className="btn btn-sm btn-danger" onClick={() => remove(p)}>Supprimer</button>
                </td>
              </tr>
            ))}
            {produits.length === 0 && (
              <tr><td colSpan={5} className="text-muted">Aucun produit trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "Modifier le produit" : "Nouveau produit"}</h2>
            <div className="field">
              <label>Nom *</label>
              <input style={{ width: "100%" }} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div className="field">
              <label>Description</label>
              <input style={{ width: "100%" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Prix unitaire HT (€)</label>
                <input
                  type="number" step="0.01" style={{ width: "100%" }}
                  value={form.prix_unitaire_ht}
                  onChange={(e) => setForm({ ...form, prix_unitaire_ht: Number(e.target.value) })}
                />
              </div>
              <div className="field">
                <label>Taux de TVA (%)</label>
                <input
                  type="number" step="0.1" style={{ width: "100%" }}
                  value={form.taux_tva}
                  onChange={(e) => setForm({ ...form, taux_tva: Number(e.target.value) })}
                />
              </div>
            </div>
            {error && <div className="error-text">{error}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <button className="btn" onClick={() => setModalOpen(false)}>Annuler</button>
              <button className="btn btn-gold" onClick={save}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
