import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, downloadFile } from "../lib/api";
import { formatMontant } from "../lib/calc";
import type { Facture, StatutFacture } from "../lib/types";

const statuts: StatutFacture[] = ["brouillon", "envoyée", "payée", "en_retard", "annulée"];

export default function Factures() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [q, setQ] = useState("");
  const [statut, setStatut] = useState("");
  const [sort, setSort] = useState("date_emission");
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
  const navigate = useNavigate();

  async function load() {
    const params = new URLSearchParams({ sort, order });
    if (q) params.set("q", q);
    if (statut) params.set("statut", statut);
    setFactures(await api.get<Facture[]>(`/factures?${params}`));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, statut, sort, order]);

  async function remove(f: Facture) {
    if (!confirm(`Supprimer la facture ${f.numero} ?`)) return;
    await api.del(`/factures/${f.id}`);
    load();
  }

  function toggleSort(col: string) {
    if (sort === col) setOrder(order === "ASC" ? "DESC" : "ASC");
    else { setSort(col); setOrder("ASC"); }
  }

  return (
    <div>
      <div className="topbar">
        <h1>Factures</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => downloadFile("/export/factures/csv", "factures.csv")}>Exporter tout (CSV/Excel)</button>
          <button className="btn btn-gold" onClick={() => navigate("/factures/nouvelle")}>+ Nouvelle facture</button>
        </div>
      </div>

      <div className="toolbar">
        <input placeholder="Rechercher (numéro, client)..." value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 240 }} />
        <select value={statut} onChange={(e) => setStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          {statuts.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th onClick={() => toggleSort("numero")} style={{ cursor: "pointer" }}>N° {sort === "numero" ? (order === "ASC" ? "▲" : "▼") : ""}</th>
              <th>Client</th>
              <th onClick={() => toggleSort("date_emission")} style={{ cursor: "pointer" }}>Émission {sort === "date_emission" ? (order === "ASC" ? "▲" : "▼") : ""}</th>
              <th>Échéance</th>
              <th>Statut</th>
              <th className="text-right">Total TTC</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {factures.map((f) => (
              <tr key={f.id}>
                <td><Link to={`/factures/${f.id}`}>{f.numero}</Link></td>
                <td>{f.client_nom}</td>
                <td>{f.date_emission}</td>
                <td>{f.date_echeance || "—"}</td>
                <td><span className={`badge badge-${f.statut}`}>{f.statut}</span></td>
                <td className="text-right">{formatMontant(f.totaux.total_ttc)}</td>
                <td className="text-right">
                  <button className="btn btn-sm" onClick={() => navigate(`/factures/${f.id}`)}>Ouvrir</button>{" "}
                  <button className="btn btn-sm btn-danger" onClick={() => remove(f)}>Supprimer</button>
                </td>
              </tr>
            ))}
            {factures.length === 0 && (
              <tr><td colSpan={7} className="text-muted">Aucune facture trouvée.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
