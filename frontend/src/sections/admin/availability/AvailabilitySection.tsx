import React, { useState, useRef, useEffect } from "react";
import { User, ChevronDown, Search, Check } from "lucide-react";

import type { StaffAvailability, StaffBarber } from "../../../types";
import AdminHeader from "../common/AdminHeader";
import { AvailabilitySkeleton } from "../common/AdminSkeletons";
import AvailabilityEditor from "./AvailabilityEditor";

interface AvailabilitySectionProps {
  loading: boolean;
  error: string;
  barbers: StaffBarber[];
  selectedBarberId: string;
  availability: StaffAvailability | null;
  onSelectBarber: (id: string) => void;
}

const AvailabilitySection: React.FC<AvailabilitySectionProps> = ({
  loading,
  error,
  barbers,
  selectedBarberId,
  availability,
  onSelectBarber,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = barbers.filter((b) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      b.name.toLowerCase().includes(q) ||
      (b.email ?? "").toLowerCase().includes(q)
    );
  });

  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);

  if (loading) {
    return <AvailabilitySkeleton />;
  }

  if (error) {
    return (
      <>
        <AdminHeader title="Availability" />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <AdminHeader title="Availability" />

        {/* Searchable dropdown */}
        <div ref={containerRef} className="relative w-full sm:w-64">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="w-full flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-xs hover:border-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
          >
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="flex-1 text-left truncate">
              {selectedBarber?.name ?? "Select barber"}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
            />
          </button>

          {open && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
              {/* Search input */}
              <div className="p-2 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Options list */}
              <ul className="max-h-52 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <li className="px-3 py-2 text-xs text-slate-400 text-center">
                    No barbers found
                  </li>
                ) : (
                  filtered.map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectBarber(b.id);
                          setOpen(false);
                          setSearch("");
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                          b.id === selectedBarberId
                            ? "bg-amber-50 text-amber-900 font-semibold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            b.id === selectedBarberId
                              ? "bg-amber-500 text-white"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {b.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="flex-1 truncate">{b.name}</span>
                        {b.id === selectedBarberId && (
                          <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {selectedBarber && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-base">
              {selectedBarber.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-slate-900">
                {selectedBarber.name}
              </h2>
              <p className="text-xs text-slate-500">
                {selectedBarber.email || selectedBarber.phone || "Barber Staff"}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            Working Schedule
          </span>
        </div>
      )}

      {availability && (
        <AvailabilityEditor
          value={availability}
          savePath={`/api/admin/availability/${selectedBarberId}`}
          onDone={async () => onSelectBarber(selectedBarberId)}
        />
      )}
    </>
  );
};

export default AvailabilitySection;
