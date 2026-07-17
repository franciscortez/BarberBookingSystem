import React from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  CheckCircle2,
  CalendarCheck,
  User,
  ArrowRight,
} from "lucide-react";
import type { StaffDashboard } from "../../../types";
import { DashboardSkeleton } from "../../admin/common/AdminSkeletons";

interface BarberDashboardSectionProps {
  loading: boolean;
  error: string;
  data: StaffDashboard | null;
}

const BarberDashboardSection: React.FC<BarberDashboardSectionProps> = ({
  loading,
  error,
  data,
}) => {
  if (loading) return <DashboardSkeleton />;
  if (error)
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  if (!data) return null;

  const statCards = [
    {
      label: "Today's Appointments",
      value: data.today,
      icon: Calendar,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      label: "Upcoming Total",
      value: data.upcoming,
      icon: Clock,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      label: "Confirmed",
      value: data.confirmed,
      icon: CalendarCheck,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      label: "Completed",
      value: data.completed,
      icon: CheckCircle2,
      color: "text-purple-600 bg-purple-50 border-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Barber Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Welcome back! Here is an overview of your schedule.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs transition-shadow hover:shadow-xs"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.label}
                </p>
                <div className={`rounded-lg border p-2 ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-slate-900">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {data.next_appointment ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>Next Up</span>
            </h2>
            <Link
              to="/barber/appointments"
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-900 text-lg">
                  {data.next_appointment.customer_name}
                </span>
              </div>
              <p className="text-sm text-slate-600 pl-6">
                Service:{" "}
                <span className="font-medium text-slate-900">
                  {data.next_appointment.service_name || "N/A"}
                </span>
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-right sm:text-right">
              <p className="text-xs font-semibold uppercase text-amber-700">
                {data.next_appointment.appointment_date}
              </p>
              <p className="text-lg font-bold text-amber-950">
                {data.next_appointment.start_time.slice(0, 5)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-2xs">
          No upcoming appointments scheduled today.
        </div>
      )}
    </div>
  );
};

export default BarberDashboardSection;
