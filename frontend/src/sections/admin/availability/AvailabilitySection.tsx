import React from "react";
import { User } from "lucide-react";

import type { StaffAvailability, StaffBarber } from "../../../types";
import AdminHeader from "../common/AdminHeader";
import { AvailabilitySkeleton } from "../common/AdminSkeletons";
import AvailabilityEditor from "./AvailabilityEditor";

interface AvailabilitySectionProps {
  loading: boolean;
  error: string;
  barbers: StaffBarber[];
  selectedBarberId: string;
  availability: StaffAvailability | null;
  onSelectBarber: (id: string) => void;
}

const AvailabilitySection: React.FC<AvailabilitySectionProps> = ({
  loading,
  error,
  barbers,
  selectedBarberId,
  availability,
  onSelectBarber,
}) => {
  if (loading) {
    return <AvailabilitySkeleton />;
  }

  if (error) {
    return (
      <>
        <AdminHeader title="Availability" />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </>
    );
  }

  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <AdminHeader title="Availability" />
        <div className="flex items-center gap-2">
          <div className="relative inline-block text-left">
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-xs focus-within:border-amber-500">
              <User className="w-4 h-4 text-slate-400" />
              <select
                value={selectedBarberId}
                onChange={(e) => onSelectBarber(e.target.value)}
                className="bg-transparent text-slate-900 focus:outline-hidden font-medium cursor-pointer"
              >
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {selectedBarber && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-base">
              {selectedBarber.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-slate-900">
                {selectedBarber.name}
              </h2>
              <p className="text-xs text-slate-500">
                {selectedBarber.email || selectedBarber.phone || "Barber Staff"}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            Working Schedule
          </span>
        </div>
      )}

      {availability && (
        <AvailabilityEditor
          value={availability}
          savePath={`/api/admin/availability/${selectedBarberId}`}
          onDone={async () => onSelectBarber(selectedBarberId)}
        />
      )}
    </>
  );
};

export default AvailabilitySection;
