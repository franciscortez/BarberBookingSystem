/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useState } from "react";

import ServicesSection from "../../sections/admin/services/ServicesSection";
import { staffRequest } from "../../services/staffApi";
import type { Service, StaffBarber } from "../../types";

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<StaffBarber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [serviceRes, barberRes] = await Promise.all([
        staffRequest<Service[]>("/api/admin/services"),
        staffRequest<StaffBarber[]>("/api/admin/barbers"),
      ]);
      setServices(serviceRes);
      setBarbers(barberRes);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  const handleAddService = async (data: {
    barber_id: string;
    name: string;
    description: string;
    total_price: string;
    downpayment_amount: string;
    duration_mins: number;
  }) => {
    try {
      await staffRequest("/api/admin/services", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await loadServices();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  };

  return (
    <ServicesSection
      loading={loading}
      error={error}
      services={services}
      barbers={barbers}
      onAddService={handleAddService}
    />
  );
};

export default Services;
