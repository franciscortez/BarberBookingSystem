import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import type { Role } from "../../types";
const RoleGuard: React.FC<{ role: Role }> = ({ role }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 text-sm text-slate-500">
        Loading account...
      </div>
    );
  if (!user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== role)
    return (
      <Navigate
        to={
          user.role === "admin"
            ? "/admin/dashboard"
            : user.role === "barber"
              ? "/barber/dashboard"
              : "/"
        }
        replace
      />
    );
  return <Outlet />;
};
export default RoleGuard;
