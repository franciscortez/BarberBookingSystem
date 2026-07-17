/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BarbersSection from "../../sections/admin/barbers/BarbersSection";
import { staffRequest } from "../../services/staffApi";
import type { StaffBarber } from "../../types";
import { confirmDelete, errorToast } from "../../utils/alert";

const Barbers: React.FC = () => {
  const { barberId } = useParams();
  const [barbers, setBarbers] = useState<StaffBarber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const path = barberId
        ? `/api/admin/barbers/${barberId}`
        : "/api/admin/barbers";
      const barberRes = await staffRequest<StaffBarber | StaffBarber[]>(path);
      setBarbers(Array.isArray(barberRes) ? barberRes : [barberRes]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [barberId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleUpdateBarber = async (
    id: string,
    data: { name: string; phone: string },
  ) => {
    try {
      await staffRequest(`/api/admin/barbers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  };

  const handleDeleteBarber = async (id: string, name: string) => {
    const ok = await confirmDelete({
      title: `Delete ${name}?`,
      text: "This will permanently remove the barber and their account.",
      confirmText: "Delete Barber",
    });
    if (!ok) return;
    try {
      await staffRequest(`/api/admin/barbers/${id}`, {
        method: "DELETE",
      });
      await loadData();
    } catch (e: unknown) {
      errorToast(
        "Delete Failed",
        e instanceof Error ? e.message : "Request failed",
      );
      setError(e instanceof Error ? e.message : "Request failed");
    }
  };

  const handleCreateBarber = async (form: {
    name: string;
    email: string;
    phone: string;
    password?: string;
  }) => {
    try {
      await staffRequest("/api/admin/barbers", {
        method: "POST",
        body: JSON.stringify(form),
      });
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  };

  return (
    <BarbersSection
      loading={loading}
      error={error}
      barbers={barbers}
      singleView={Boolean(barberId)}
      onUpdateBarber={handleUpdateBarber}
      onDeleteBarber={handleDeleteBarber}
      onCreateBarber={handleCreateBarber}
    />
  );
};

export default Barbers;
