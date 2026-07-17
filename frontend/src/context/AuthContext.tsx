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
        let res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: "include",
          headers,
        });

        if (res.status === 401) {
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true",
              },
              body: JSON.stringify({ refreshToken }),
            });
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              localStorage.setItem("token", refreshData.token);
              localStorage.setItem("refreshToken", refreshData.refreshToken);

              headers["Authorization"] = `Bearer ${refreshData.token}`;
              res = await fetch(`${API_BASE_URL}/api/auth/me`, {
                credentials: "include",
                headers,
              });
            }
          }
        }

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
        }
      } catch {
        // not authenticated
      } finally {
        setLoading(false);
      }
    };
    void checkSession();
  }, []);

  const login = useCallback(
    (u: AuthUser, token?: string, refreshToken?: string) => {
      if (token) {
        localStorage.setItem("token", token);
      }
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      setUser(u);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const refreshToken = localStorage.getItem("refreshToken");
      const headers: Record<string, string> = {
        "ngrok-skip-browser-warning": "true",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const body = refreshToken ? JSON.stringify({ refreshToken }) : undefined;
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body,
      });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
