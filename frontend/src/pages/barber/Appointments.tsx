/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BarberAppointmentsSection from "../../sections/barber/appointments/BarberAppointmentsSection";
import RescheduleAppointment from "../../components/staff/RescheduleAppointment";
import { staffRequest } from "../../services/staffApi";
import type { StaffAppointment } from "../../types";
import { confirmAction, errorToast } from "../../utils/alert";

const Appointments: React.FC = () => {
  const { appointmentId } = useParams();
  const [appointments, setAppointments] = useState<StaffAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const path = appointmentId
        ? `/api/barber/appointments/${appointmentId}`
        : "/api/barber/appointments";
      const result = await staffRequest<StaffAppointment | StaffAppointment[]>(
        path,
      );
      setAppointments(Array.isArray(result) ? result : [result]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    void fetchAppointments();
  }, [fetchAppointments]);

  const handleMutateStatus = async (id: string, status: string) => {
    const label = status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const ok = await confirmAction({
      title: `Mark as ${label}?`,
      text: `This will update the appointment status to "${label}".`,
      confirmText: `Yes, ${label}`,
      variant:
        status === "cancelled" || status === "no_show" ? "danger" : "primary",
    });
    if (!ok) return;

    try {
      await staffRequest(`/api/barber/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await fetchAppointments();
    } catch (e: unknown) {
      errorToast(
        "Update Failed",
        e instanceof Error ? e.message : "Request failed",
      );
      setError(e instanceof Error ? e.message : "Request failed");
    }
  };

  return (
    <>
      <BarberAppointmentsSection
        loading={loading}
        error={error}
        appointments={appointments}
        onMutateStatus={handleMutateStatus}
        onRefresh={fetchAppointments}
      />
      <RescheduleAppointment role="barber" />
    </>
  );
};

export default Appointments;
