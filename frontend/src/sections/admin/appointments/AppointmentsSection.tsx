import React from "react";
import { Link } from "react-router-dom";
import type { StaffAppointment } from "../../../types";
import { money, statusClass, titleCase } from "../adminPortalUtils";
import AdminHeader from "../common/AdminHeader";
import { AppointmentsSkeleton } from "../common/AdminSkeletons";

interface AppointmentsSectionProps {
  loading: boolean;
  error: string;
  appointments: StaffAppointment[];
  onMutateStatus: (id: string, status: string) => Promise<void>;
}

const actionStatuses = ["checked_in", "completed", "no_show", "cancelled"];

const AppointmentsSection: React.FC<AppointmentsSectionProps> = ({
  loading,
  error,
  appointments,
  onMutateStatus,
}) => {
  if (loading) {
    return <AppointmentsSkeleton />;
  }

  if (error) {
    return (
      <>
        <AdminHeader title="Appointments" />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader title="Appointments" />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                {[
                  "Customer",
                  "Schedule",
                  "Barber / Service",
                  "Payment",
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
              {appointments.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/appointments/${row.id}`}
                      className="font-semibold text-slate-900 transition-colors hover:text-amber-700"
                    >
                      {row.customer_name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {row.customer_email}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-900">
                    {row.appointment_date}
                    <p className="text-xs text-slate-500">
                      {row.start_time.slice(0, 5)}–{row.end_time.slice(0, 5)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-900">
                    {row.barber_name}
                    <p className="text-xs text-slate-500">{row.service_name}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-900">
                    {money(row.payment_amount)}
                    <p className="text-xs text-slate-500">
                      {row.payment_status}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ring-1 ${statusClass(
                        row.status,
                      )}`}
                    >
                      {titleCase(row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {actionStatuses.map((status) => (
                        <button
                          key={status}
                          onClick={() => void onMutateStatus(row.id, status)}
                          className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 transition-colors hover:border-amber-400 hover:text-amber-700"
                        >
                          {titleCase(status)}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!appointments.length && (
          <p className="p-8 text-center text-sm text-slate-500">
            No appointments found.
          </p>
        )}
      </div>
    </>
  );
};

export default AppointmentsSection;
