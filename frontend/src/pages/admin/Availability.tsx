/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useState } from "react";
import AvailabilitySection from "../../sections/admin/availability/AvailabilitySection";
import { staffRequest } from "../../services/staffApi";
import type { StaffAvailability, StaffBarber } from "../../types";

const Availability: React.FC = () => {
  const [barbers, setBarbers] = useState<StaffBarber[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState("");
  const [availability, setAvailability] = useState<StaffAvailability | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAvailability = useCallback(async (barberId: string) => {
    if (!barberId) {
      setAvailability({ hours: [], blocks: [] });
      return;
    }
    try {
      const res = await staffRequest<StaffAvailability>(
        `/api/admin/availability/${barberId}`,
      );
      setAvailability(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await staffRequest<StaffBarber[]>("/api/admin/barbers");
      setBarbers(list);
      const firstId = list[0]?.id || "";
      setSelectedBarberId(firstId);
      if (firstId) {
        await loadAvailability(firstId);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [loadAvailability]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  const handleSelectBarber = (id: string) => {
    setSelectedBarberId(id);
    void loadAvailability(id);
  };

  return (
    <AvailabilitySection
      loading={loading}
      error={error}
      barbers={barbers}
      selectedBarberId={selectedBarberId}
      availability={availability}
      onSelectBarber={handleSelectBarber}
    />
  );
};

export default Availability;
