import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  CreditCard,
  LayoutDashboard,
  Menu,
  Scissors,
  UserRound,
  UsersRound,
  X,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
const adminLinks = [
  ["Dashboard", "dashboard", LayoutDashboard],
  ["Appointments", "appointments", CalendarDays],
  ["Barbers", "barbers", UsersRound],
  ["Services", "services", Scissors],
  ["Availability", "availability", Clock3],
  ["Payments", "payments", CreditCard],
] as const;
const barberLinks = [
  ["Dashboard", "dashboard", LayoutDashboard],
  ["Appointments", "appointments", CalendarDays],
  ["Availability", "availability", Clock3],
  ["Profile", "profile", UserRound],
] as const;
const StaffShell: React.FC<{ role: "admin" | "barber" }> = ({ role }) => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const links = role === "admin" ? adminLinks : barberLinks;
  const base = `/${role}`;
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <button
        className="fixed left-4 top-4 z-50 rounded-md border border-slate-200 bg-white p-2 lg:hidden"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-slate-100 p-4 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-8 px-2 pt-2">
          <p className="font-bold text-slate-900">Gentlemen&apos;s Quarters</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-amber-600">
            {role} portal
          </p>
        </div>
        <nav className="space-y-1">
          {links.map(([label, path, Icon]) => (
            <NavLink
              key={path}
              to={`${base}/${path}`}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium ${isActive ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-white/70"}`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4 border-t border-slate-200 pt-4">
          <p className="truncate text-sm font-semibold">{user?.name}</p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
          <button
            onClick={() => void logout()}
            className="mt-3 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-600 hover:bg-white"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </aside>
      <main className="min-h-screen lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 lg:px-8 lg:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
export default StaffShell;
