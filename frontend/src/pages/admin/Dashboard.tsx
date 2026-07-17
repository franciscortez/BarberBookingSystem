/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from "react";

import DashboardSection from "../../sections/admin/dashboard/DashboardSection";
import { staffRequest } from "../../services/staffApi";
import type { StaffDashboard } from "../../types";

const Dashboard: React.FC = () => {
  const [data, setData] = useState<StaffDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    staffRequest<StaffDashboard>("/api/admin/dashboard")
      .then((res) => {
        if (active) setData(res);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "Request failed");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return <DashboardSection loading={loading} error={error} data={data} />;
};

export default Dashboard;
