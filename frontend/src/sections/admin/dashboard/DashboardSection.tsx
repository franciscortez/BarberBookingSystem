import React from "react";
import { Link } from "react-router-dom";
import type { StaffDashboard } from "../../../types";
import { money } from "../adminPortalUtils";
import AdminHeader from "../common/AdminHeader";
import { DashboardSkeleton } from "../common/AdminSkeletons";

interface DashboardSectionProps {
  loading: boolean;
  error: string;
  data: StaffDashboard | null;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({
  loading,
  error,
  data,
}) => {
  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <>
        <AdminHeader title="Dashboard" />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </>
    );
  }

  if (!data) return null;

  const cards = [
    ["Today", data.today],
    ["Upcoming", data.upcoming],
    ["Confirmed", data.confirmed],
    ["Completed", data.completed],
    ["Active Barbers", data.active_barbers ?? 0],
    ["Paid Total", money(data.payment_total)],
  ];

  return (
    <>
      <AdminHeader title="Dashboard" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs"
          >
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {value}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {["appointments", "barbers", "services", "availability"].map((item) => (
          <Link
            key={item}
            to={`/admin/${item}`}
            className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-900 transition-colors hover:border-amber-400 hover:text-amber-600"
          >
            Manage {item}
          </Link>
        ))}
      </div>
    </>
  );
};

export default DashboardSection;
