import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface Entry {
  id: number;
  entite: string;
  entite_id: number;
  action: string;
  detail: string;
  user_email: string;
  created_at: string;
}

export default function Historique() {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    api.get<Entry[]>("/historique?limit=200").then(setEntries);
  }, []);

  return (
    <div>
      <div className="topbar">
        <h1>Historique des modifications</h1>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Entité</th>
              <th>Action</th>
              <th>Détail</th>
              <th>Utilisateur</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="text-muted">{e.created_at}</td>
                <td>{e.entite}</td>
                <td><span className="badge badge-brouillon">{e.action}</span></td>
                <td>{e.detail}</td>
                <td className="text-muted">{e.user_email}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan={5} className="text-muted">Aucune activité enregistrée.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
