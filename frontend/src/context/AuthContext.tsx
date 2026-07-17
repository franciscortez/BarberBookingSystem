import React, { useState, useEffect, useCallback } from "react";
import { AuthContext, type AuthUser } from "./AuthContextObject";

const API_BASE_URL = (
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? ""
).replace(/\/+$/, "");

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, check session via /api/auth/me (cookie sent automatically)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: "include",
          headers: { "ngrok-skip-browser-warning": "true" },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        // not authenticated
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = useCallback((u: AuthUser) => {
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "ngrok-skip-browser-warning": "true" },
      });
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
