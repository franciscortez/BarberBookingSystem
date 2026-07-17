/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, User, Scissors } from "lucide-react";
import { staffRequest } from "../../../services/staffApi";
import { errorToast, successToast } from "../../../utils/alert";
import type { StaffBarber } from "../../../types";

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

interface ServiceItem {
  id: string;
  name: string;
  total_price: string;
  duration_mins: number;
}

export const CreateAppointmentModal: React.FC<CreateAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [barbers, setBarbers] = useState<StaffBarber[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    barber_id: "",
    service_id: "",
    appointment_date: new Date().toISOString().split("T")[0],
    start_time: "09:00",
  });

  // Fetch active barbers on open
  useEffect(() => {
    if (!isOpen) return;
    const fetchBarbers = async () => {
      try {
        const list = await staffRequest<StaffBarber[]>("/api/admin/barbers");
        const active = list.filter((b) => b.is_active);
        setBarbers(active);
        if (active.length > 0) {
          setForm((f) => ({ ...f, barber_id: active[0].id }));
        }
      } catch (e: unknown) {
        errorToast(
          "Error",
          e instanceof Error ? e.message : "Failed to load barbers",
        );
      }
    };
    void fetchBarbers();
  }, [isOpen]);

  // Fetch services when selected barber changes
  useEffect(() => {
    if (!form.barber_id) {
      setServices([]);
      return;
    }
    const fetchServices = async () => {
      try {
        const list = await staffRequest<ServiceItem[]>(
          `/api/admin/services?barberId=${form.barber_id}`,
        );
        setServices(list);
        if (list.length > 0) {
          setForm((f) => ({ ...f, service_id: list[0].id }));
        } else {
          setForm((f) => ({ ...f, service_id: "" }));
        }
      } catch (e: unknown) {
        errorToast(
          "Error",
          e instanceof Error ? e.message : "Failed to load services",
        );
      }
    };
    void fetchServices();
  }, [form.barber_id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await staffRequest("/api/admin/appointments", {
        method: "POST",
        body: JSON.stringify(form),
      });
      successToast(
        "Walk-In Booking Created",
        `Walk-in appointment for ${form.customer_name} is confirmed.`,
      );
      setForm({
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        barber_id: barbers[0]?.id || "",
        service_id: "",
        appointment_date: new Date().toISOString().split("T")[0],
        start_time: "09:00",
      });
      await onSuccess();
      onClose();
    } catch (err: unknown) {
      errorToast(
        "Failed to Create Booking",
        err instanceof Error ? err.message : "Request failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            Book Walk-In Customer
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Customer Name
              </label>
              <input
                required
                placeholder="e.g. Juan dela Cruz"
                value={form.customer_name}
                onChange={(e) =>
                  setForm({ ...form, customer_name: e.target.value })
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Phone Number
              </label>
              <input
                required
                placeholder="e.g. 09171234567"
                value={form.customer_phone}
                onChange={(e) =>
                  setForm({ ...form, customer_phone: e.target.value })
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Email Address (Optional)
            </label>
            <input
              placeholder="e.g. customer@email.com"
              type="email"
              value={form.customer_email}
              onChange={(e) =>
                setForm({ ...form, customer_email: e.target.value })
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Barber Selection
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={form.barber_id}
                  onChange={(e) =>
                    setForm({ ...form, barber_id: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 bg-white text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                >
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Service
              </label>
              <div className="relative">
                <Scissors className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  required
                  value={form.service_id}
                  onChange={(e) =>
                    setForm({ ...form, service_id: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 bg-white text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden disabled:opacity-50"
                  disabled={services.length === 0}
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.duration_mins} mins)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Appointment Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  required
                  type="date"
                  value={form.appointment_date}
                  onChange={(e) =>
                    setForm({ ...form, appointment_date: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Start Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  required
                  type="time"
                  value={form.start_time}
                  onChange={(e) =>
                    setForm({ ...form, start_time: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.service_id}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {submitting ? "Booking..." : "Confirm Walk-In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAppointmentModal;
