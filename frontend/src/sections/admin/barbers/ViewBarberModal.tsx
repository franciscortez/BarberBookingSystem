import React from "react";
import { X, Mail, Phone, ShieldCheck } from "lucide-react";

import type { StaffBarber } from "../../../types";

interface ViewBarberModalProps {
  barber: StaffBarber | null;
  onClose: () => void;
}

const ViewBarberModal: React.FC<ViewBarberModalProps> = ({
  barber,
  onClose,
}) => {
  if (!barber) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Barber Profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm text-slate-700">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-base shrink-0">
              {barber.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-slate-900 text-base">
                {barber.name}
              </p>
              <span
                className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                  barber.is_active
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-slate-100 text-slate-600 ring-slate-200"
                }`}
              >
                {barber.is_active ? "Active Barber" : "Inactive Barber"}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2.5 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{barber.email || "No email assigned"}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{barber.phone || "No phone assigned"}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                User Account: {barber.user_id ? "Linked" : "Invitation Pending"}
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewBarberModal;
