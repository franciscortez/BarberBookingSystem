import React from "react";
import type { StaffAvailability } from "../../../types";
import { AvailabilityEditor } from "../../admin/availability/AvailabilityEditor";
import { AvailabilitySkeleton } from "../../admin/common/AdminSkeletons";

interface BarberAvailabilitySectionProps {
  loading: boolean;
  error: string;
  availability: StaffAvailability | null;
  onRefresh: () => Promise<void>;
}

const BarberAvailabilitySection: React.FC<BarberAvailabilitySectionProps> = ({
  loading,
  error,
  availability,
  onRefresh,
}) => {
  if (loading) return <AvailabilitySkeleton />;
  if (error)
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  if (!availability) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Work Schedule & Time Off
        </h1>
        <p className="text-sm text-slate-500">
          View your assigned shift hours (managed by admin) and set day-off or
          time-block overrides.
        </p>
      </div>

      <AvailabilityEditor
        value={availability}
        savePath="/api/barber/availability"
        onDone={onRefresh}
        readOnlyHours={true}
      />
    </div>
  );
};

export default BarberAvailabilitySection;
