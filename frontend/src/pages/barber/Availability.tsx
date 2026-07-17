/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useState } from "react";
import BarberAvailabilitySection from "../../sections/barber/availability/BarberAvailabilitySection";
import { staffRequest } from "../../services/staffApi";
import type { StaffAvailability } from "../../types";

const Availability: React.FC = () => {
  const [availability, setAvailability] = useState<StaffAvailability | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await staffRequest<StaffAvailability>(
        "/api/barber/availability",
      );
      setAvailability(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAvailability();
  }, [fetchAvailability]);

  return (
    <BarberAvailabilitySection
      loading={loading}
      error={error}
      availability={availability}
      onRefresh={fetchAvailability}
    />
  );
};

export default Availability;
