import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { ApiError } from "../lib/api";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [entreprise, setEntreprise] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(entreprise, email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Facturation Pro</h1>
        <p className="subtitle">{mode === "login" ? "Connexion à votre espace" : "Créer votre entreprise"}</p>
        <form onSubmit={submit}>
          {mode === "register" && (
            <div className="field">
              <label>Nom de l'entreprise</label>
              <input value={entreprise} onChange={(e) => setEntreprise(e.target.value)} required style={{ width: "100%" }} />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%" }} />
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={{ width: "100%" }}
            />
          </div>
          {error && <div className="error-text">{error}</div>}
          <button type="submit" className="btn btn-gold" style={{ width: "100%", marginTop: 8 }} disabled={loading}>
            {loading ? "Veuillez patienter..." : mode === "login" ? "Se connecter" : "Créer le compte"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: 16, fontSize: "0.85rem" }}>
          {mode === "login" ? (
            <>
              Pas de compte ?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode("register"); }}>
                Créer un compte
              </a>
            </>
          ) : (
            <>
              Déjà inscrit ?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode("login"); }}>
                Se connecter
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
