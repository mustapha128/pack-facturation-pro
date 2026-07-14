import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import type { Client } from "../lib/types";

const empty: Omit<Client, "id" | "created_at"> = { nom: "", email: "", telephone: "", adresse: "", siret: "" };

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("nom");
  const [order, setOrder] = useState<"ASC" | "DESC">("ASC");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  async function load() {
    const params = new URLSearchParams({ sort, order });
    if (q) params.set("q", q);
    setClients(await api.get<Client[]>(`/clients?${params}`));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sort, order]);

  function openNew() {
    setEditing(null);
    setForm(empty);
    setError("");
    setModalOpen(true);
  }

  function openEdit(c: Client) {
    setEditing(c);
    setForm({ nom: c.nom, email: c.email || "", telephone: c.telephone || "", adresse: c.adresse || "", siret: c.siret || "" });
    setError("");
    setModalOpen(true);
  }

  async function save() {
    try {
      if (editing) await api.put(`/clients/${editing.id}`, form);
      else await api.post("/clients", form);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement");
    }
  }

  async function remove(c: Client) {
    if (!confirm(`Supprimer le client "${c.nom}" ? Cette action supprimera aussi ses factures.`)) return;
    await api.del(`/clients/${c.id}`);
    load();
  }

  function toggleSort(col: string) {
    if (sort === col) setOrder(order === "ASC" ? "DESC" : "ASC");
    else { setSort(col); setOrder("ASC"); }
  }

  return (
    <div>
      <div className="topbar">
        <h1>Clients</h1>
        <button className="btn btn-gold" onClick={openNew}>+ Nouveau client</button>
      </div>

      <div className="toolbar">
        <input placeholder="Rechercher un client..." value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 260 }} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th onClick={() => toggleSort("nom")} style={{ cursor: "pointer" }}>Nom {sort === "nom" ? (order === "ASC" ? "▲" : "▼") : ""}</th>
              <th onClick={() => toggleSort("email")} style={{ cursor: "pointer" }}>Email {sort === "email" ? (order === "ASC" ? "▲" : "▼") : ""}</th>
              <th>Téléphone</th>
              <th>SIRET</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td>{c.nom}</td>
                <td>{c.email}</td>
                <td>{c.telephone}</td>
                <td>{c.siret}</td>
                <td className="text-right">
                  <button className="btn btn-sm" onClick={() => openEdit(c)}>Modifier</button>{" "}
                  <button className="btn btn-sm btn-danger" onClick={() => remove(c)}>Supprimer</button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={5} className="text-muted">Aucun client trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "Modifier le client" : "Nouveau client"}</h2>
            <div className="field">
              <label>Nom *</label>
              <input style={{ width: "100%" }} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Email</label>
                <input style={{ width: "100%" }} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="field">
                <label>Téléphone</label>
                <input style={{ width: "100%" }} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Adresse</label>
              <input style={{ width: "100%" }} value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
            </div>
            <div className="field">
              <label>SIRET</label>
              <input style={{ width: "100%" }} value={form.siret} onChange={(e) => setForm({ ...form, siret: e.target.value })} />
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
