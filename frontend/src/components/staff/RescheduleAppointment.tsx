import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { staffRequest } from "../../services/staffApi";
const RescheduleAppointment: React.FC<{ role: "admin" | "barber" }> = ({
  role,
}) => {
  const { appointmentId } = useParams();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [message, setMessage] = useState("");
  if (!appointmentId) return null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("Reschedule this appointment and notify customer?")) return;
    try {
      await staffRequest(
        `/api/${role}/appointments/${appointmentId}/schedule`,
        {
          method: "PATCH",
          body: JSON.stringify({ appointment_date: date, start_time: time }),
        },
      );
      setMessage("Appointment rescheduled.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Reschedule failed");
    }
  };
  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="mt-5 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      <label className="text-sm font-medium">
        New date
        <input
          required
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block rounded-md border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="text-sm font-medium">
        New time
        <input
          required
          type="time"
          step="1800"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="mt-1 block rounded-md border border-slate-300 px-3 py-2"
        />
      </label>
      <button className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold">
        Reschedule
      </button>
      {message && <p className="w-full text-sm text-slate-600">{message}</p>}
    </form>
  );
};
export default RescheduleAppointment;
