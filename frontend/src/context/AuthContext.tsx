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

  // On mount, check session via /api/auth/me (cookie or Bearer token sent automatically)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers: Record<string, string> = {
          "ngrok-skip-browser-warning": "true",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: "include",
          headers,
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          localStorage.removeItem("token");
        }
      } catch {
        // not authenticated
      } finally {
        setLoading(false);
      }
    };
    void checkSession();
  }, []);

  const login = useCallback((u: AuthUser, token?: string) => {
    if (token) {
      localStorage.setItem("token", token);
    }
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "ngrok-skip-browser-warning": "true",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers,
      });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
