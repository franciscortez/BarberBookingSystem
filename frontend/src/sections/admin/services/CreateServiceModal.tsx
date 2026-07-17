import React, { useState } from "react";
import { X } from "lucide-react";
import type { StaffBarber } from "../../../types";

interface CreateServiceModalProps {
  isOpen: boolean;
  barbers: StaffBarber[];
  onClose: () => void;
  onAddService: (data: {
    barber_id: string;
    name: string;
    description: string;
    total_price: string;
    downpayment_amount: string;
    duration_mins: number;
  }) => Promise<void>;
}

const CreateServiceModal: React.FC<CreateServiceModalProps> = ({
  isOpen,
  barbers,
  onClose,
  onAddService,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    barber_id: "",
    name: "",
    description: "",
    total_price: "",
    downpayment_amount: "",
    duration_mins: 30,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onAddService({
        ...form,
        duration_mins: Number(form.duration_mins),
      });
      setForm({
        barber_id: "",
        name: "",
        description: "",
        total_price: "",
        downpayment_amount: "",
        duration_mins: 30,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            Create New Service
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
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Assigned Barber
            </label>
            <select
              required
              value={form.barber_id}
              onChange={(e) => setForm({ ...form, barber_id: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
            >
              <option value="">Select barber</option>
              {barbers
                .filter((b) => b.is_active)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Service Name
            </label>
            <input
              required
              placeholder="e.g. Premium Haircut & Beard Grooming"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Service description..."
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Total Price (PHP)
              </label>
              <input
                required
                placeholder="e.g. 500.00"
                value={form.total_price}
                onChange={(e) =>
                  setForm({ ...form, total_price: e.target.value })
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Downpayment (PHP)
              </label>
              <input
                required
                placeholder="e.g. 100.00"
                value={form.downpayment_amount}
                onChange={(e) =>
                  setForm({ ...form, downpayment_amount: e.target.value })
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Duration (Minutes)
            </label>
            <input
              required
              type="number"
              min="30"
              step="30"
              value={form.duration_mins}
              onChange={(e) =>
                setForm({ ...form, duration_mins: Number(e.target.value) })
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
            />
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
              disabled={submitting}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateServiceModal;
