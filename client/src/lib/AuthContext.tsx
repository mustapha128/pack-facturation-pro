import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setToken } from "./api";

interface User {
  id: number;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (entreprise: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("fp_user");
    const token = localStorage.getItem("fp_token");
    if (raw && token) setUser(JSON.parse(raw));
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post<{ token: string; user: User }>("/auth/login", { email, password });
    setToken(res.token);
    localStorage.setItem("fp_user", JSON.stringify(res.user));
    setUser(res.user);
  }

  async function register(entreprise: string, email: string, password: string) {
    const res = await api.post<{ token: string; user: User }>("/auth/register", { entreprise, email, password });
    setToken(res.token);
    localStorage.setItem("fp_user", JSON.stringify(res.user));
    setUser(res.user);
  }

  function logout() {
    setToken(null);
    localStorage.removeItem("fp_user");
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
