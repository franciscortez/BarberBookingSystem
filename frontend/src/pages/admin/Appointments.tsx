/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useState } from "react";

import { useParams } from "react-router-dom";
import RescheduleAppointment from "../../components/staff/RescheduleAppointment";
import AppointmentsSection from "../../sections/admin/appointments/AppointmentsSection";
import { staffRequest } from "../../services/staffApi";
import type { StaffAppointment } from "../../types";

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
        ? `/api/admin/appointments/${appointmentId}`
        : "/api/admin/appointments";
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
    if (!confirm("Confirm this action?")) return;
    try {
      await staffRequest(`/api/admin/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await fetchAppointments();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  };

  return (
    <>
      <AppointmentsSection
        loading={loading}
        error={error}
        appointments={appointments}
        onMutateStatus={handleMutateStatus}
      />
      <RescheduleAppointment role="admin" />
    </>
  );
};

export default Appointments;
