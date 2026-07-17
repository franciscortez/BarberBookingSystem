/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BarbersSection from "../../sections/admin/barbers/BarbersSection";
import { staffRequest } from "../../services/staffApi";
import type { BarberInvitation, StaffBarber } from "../../types";

const Barbers: React.FC = () => {
  const { barberId } = useParams();
  const [barbers, setBarbers] = useState<StaffBarber[]>([]);
  const [invitations, setInvitations] = useState<BarberInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const path = barberId
        ? `/api/admin/barbers/${barberId}`
        : "/api/admin/barbers";
      const [barberRes, inviteRes] = await Promise.all([
        staffRequest<StaffBarber | StaffBarber[]>(path),
        barberId
          ? Promise.resolve([])
          : staffRequest<BarberInvitation[]>("/api/admin/barber-invitations"),
      ]);
      setBarbers(Array.isArray(barberRes) ? barberRes : [barberRes]);
      setInvitations(inviteRes);
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

  const handleDeleteBarber = async (id: string) => {
    if (!confirm("Are you sure you want to delete this barber?")) return;
    try {
      await staffRequest(`/api/admin/barbers/${id}`, {
        method: "DELETE",
      });
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  };

  const handleSendInvite = async (form: {
    name: string;
    email: string;
    phone: string;
  }) => {
    try {
      await staffRequest("/api/admin/barber-invitations", {
        method: "POST",
        body: JSON.stringify(form),
      });
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  };

  const handleInvitationAction = async (
    id: string,
    action: "resend" | "revoke",
  ) => {
    if (
      !confirm(`${action === "resend" ? "Resend" : "Revoke"} this invitation?`)
    )
      return;
    try {
      await staffRequest(
        `/api/admin/barber-invitations/${id}${action === "resend" ? "/resend" : ""}`,
        { method: action === "resend" ? "POST" : "DELETE" },
      );
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
      invitations={invitations}
      singleView={Boolean(barberId)}
      onUpdateBarber={handleUpdateBarber}
      onDeleteBarber={handleDeleteBarber}
      onSendInvite={handleSendInvite}
      onInvitationAction={handleInvitationAction}
    />
  );
};

export default Barbers;
