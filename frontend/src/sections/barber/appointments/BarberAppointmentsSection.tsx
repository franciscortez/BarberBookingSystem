import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, CalendarCheck, RefreshCw } from "lucide-react";
import type { StaffAppointment } from "../../../types";
import { money, statusClass, titleCase } from "../../admin/adminPortalUtils";
import { AppointmentsSkeleton } from "../../admin/common/AdminSkeletons";

interface BarberAppointmentsSectionProps {
  loading: boolean;
  error: string;
  appointments: StaffAppointment[];
  onMutateStatus: (id: string, status: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const actionStatuses = ["checked_in", "completed", "no_show", "cancelled"];

const BarberAppointmentsSection: React.FC<BarberAppointmentsSectionProps> = ({
  loading,
  error,
  appointments,
  onMutateStatus,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  if (loading) return <AppointmentsSkeleton />;
  if (error)
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );

  const filteredAppointments = appointments.filter((app) => {
    const matchesSearch =
      app.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.customer_phone.includes(searchTerm) ||
      app.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.service_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ? true : app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Assigned Appointments
          </h1>
          <p className="text-sm text-slate-500">
            Manage your daily bookings and update client statuses.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onRefresh()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client name, email, phone, or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-hidden"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="completed">Completed</option>
            <option value="no_show">No Show</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                {[
                  "Customer",
                  "Schedule",
                  "Service",
                  "Downpayment",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/barber/appointments/${row.id}`}
                      className="font-bold text-slate-900 hover:text-amber-600 transition-colors"
                    >
                      {row.customer_name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {row.customer_phone} · {row.customer_email}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-900 font-medium">
                    {row.appointment_date}
                    <p className="text-xs font-normal text-slate-500">
                      {row.start_time.slice(0, 5)} – {row.end_time.slice(0, 5)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-900">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <CalendarCheck className="w-3.5 h-3.5 text-amber-500" />
                      {row.service_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-900">
                    {money(row.payment_amount)}
                    <p className="text-xs text-slate-500">
                      {row.payment_status}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass(
                        row.status,
                      )}`}
                    >
                      {titleCase(row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {actionStatuses.map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => void onMutateStatus(row.id, st)}
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800"
                        >
                          {titleCase(st)}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filteredAppointments.length && (
          <p className="p-8 text-center text-sm text-slate-500">
            No appointments match your filter criteria.
          </p>
        )}
      </div>
    </div>
  );
};

export default BarberAppointmentsSection;
