/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useState } from "react";
import BarberDashboardSection from "../../sections/barber/dashboard/BarberDashboardSection";
import { staffRequest } from "../../services/staffApi";
import type { StaffDashboard } from "../../types";

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<StaffDashboard | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await staffRequest<StaffDashboard>("/api/barber/dashboard");
      setDashboardData(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  return (
    <BarberDashboardSection
      loading={loading}
      error={error}
      data={dashboardData}
    />
  );
};

export default Dashboard;
