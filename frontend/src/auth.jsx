import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api.js";

const AuthContext = createContext(null);
const TOKEN_KEY = "hearth_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    api("/api/auth/me", { token })
      .then((profile) => {
        if (!cancelled) setUser(profile);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo(() => {
    const accept = (result) => {
      localStorage.setItem(TOKEN_KEY, result.token);
      setToken(result.token);
      setUser(result.user);
      setLoading(false);
    };
    return {
      token,
      user,
      loading,
      can: (permission) => !!user?.permissions?.includes(permission),
      login: async (username, password, role) => {
        const result = await api("/api/auth/login", { method: "POST", body: { username, password, role } });
        accept(result);
        return result.user;
      },
      updateProfile: async (name, email, password) => {
        const body = { name, email };
        if (password) body.password = password;
        const result = await api("/api/auth/me", { method: "PATCH", token, body });
        accept(result);
        return result.user;
      },
      register: async (username, email, password) => {
        const result = await api("/api/auth/register", { method: "POST", body: { username, email, password } });
        accept(result);
        return result.user;
      },
      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      },
      refreshUser: async () => {
        if (!token) return null;
        const profile = await api("/api/auth/me", { token });
        setUser(profile);
        return profile;
      },
    };
  }, [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
