import { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, PointElement, LineElement } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { api } from "../lib/api";
import { formatMontant } from "../lib/calc";
import type { DashboardData } from "../lib/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, PointElement, LineElement);

const GOLD = "#d4af37";
const GOLD_DIM = "#8a7328";
const STATUT_COLORS: Record<string, string> = {
  brouillon: "#9a968a",
  "envoyée": "#e0a95a",
  "payée": "#4caf7d",
  en_retard: "#e05a5a",
  "annulée": "#5a5a5a",
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  async function load() {
    setData(await api.get<DashboardData>("/dashboard"));
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <p className="text-muted">Chargement du tableau de bord...</p>;

  return (
    <div>
      <div className="topbar">
        <h1>Tableau de bord</h1>
      </div>

      <div className="kpi-grid">
        <Kpi label="Chiffre d'affaires TTC" value={formatMontant(data.chiffre_affaires_ttc)} />
        <Kpi label="Chiffre d'affaires HT" value={formatMontant(data.chiffre_affaires_ht)} />
        <Kpi label="TVA collectée" value={formatMontant(data.total_tva_collectee)} />
        <Kpi label="Encaissé" value={formatMontant(data.encaisse)} />
        <Kpi label="En attente" value={formatMontant(data.en_attente)} />
        <Kpi label="Panier moyen" value={formatMontant(data.panier_moyen)} />
        <Kpi label="Factures" value={String(data.nombre_factures)} neutral />
        <Kpi label="Clients" value={String(data.nombre_clients)} neutral />
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="mt-0">Évolution du chiffre d'affaires (TTC)</h3>
          {data.evolution_mensuelle.length === 0 ? (
            <p className="text-muted">Aucune donnée pour le moment.</p>
          ) : (
            <Bar
              data={{
                labels: data.evolution_mensuelle.map((m) => m.mois),
                datasets: [
                  {
                    label: "CA TTC",
                    data: data.evolution_mensuelle.map((m) => m.total),
                    backgroundColor: GOLD,
                    borderColor: GOLD_DIM,
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { color: "#9a968a" }, grid: { color: "#2a2a2a" } },
                  y: { ticks: { color: "#9a968a" }, grid: { color: "#2a2a2a" } },
                },
              }}
            />
          )}
        </div>
        <div className="card">
          <h3 className="mt-0">Répartition des statuts</h3>
          {data.repartition_statuts.length === 0 ? (
            <p className="text-muted">Aucune donnée pour le moment.</p>
          ) : (
            <Doughnut
              data={{
                labels: data.repartition_statuts.map((s) => s.statut),
                datasets: [
                  {
                    data: data.repartition_statuts.map((s) => s.count),
                    backgroundColor: data.repartition_statuts.map((s) => STATUT_COLORS[s.statut] || "#666"),
                    borderColor: "#161616",
                  },
                ],
              }}
              options={{ plugins: { legend: { labels: { color: "#f2f0e9" } } } }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, neutral }: { label: string; value: string; neutral?: boolean }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${neutral ? "neutral" : ""}`}>{value}</div>
    </div>
  );
}
