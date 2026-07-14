import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

const links = [
  { to: "/", label: "Tableau de bord", icon: "📊" },
  { to: "/factures", label: "Factures", icon: "🧾" },
  { to: "/clients", label: "Clients", icon: "👤" },
  { to: "/produits", label: "Produits", icon: "📦" },
  { to: "/historique", label: "Historique", icon: "🕘" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand">
          PACK FACTURATION PRO
          <span>{user?.email}</span>
        </div>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={() => setOpen(false)}
          >
            <span>{l.icon}</span> {l.label}
          </NavLink>
        ))}
        <div style={{ marginTop: "auto", paddingTop: 16 }}>
          <button className="btn" style={{ width: "100%" }} onClick={logout}>
            Se déconnecter
          </button>
        </div>
      </aside>
      <main className="main-content">
        <button className="hamburger" onClick={() => setOpen((o) => !o)}>☰</button>
        <Outlet />
      </main>
    </div>
  );
}
