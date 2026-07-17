import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  UserPlus,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

import type { StaffBarber } from "../../../types";
import AdminHeader from "../common/AdminHeader";
import { BarbersSkeleton } from "../common/AdminSkeletons";
import CreateBarberModal from "./CreateBarberModal";
import ViewBarberModal from "./ViewBarberModal";
import EditBarberModal from "./EditBarberModal";

interface BarbersSectionProps {
  loading: boolean;
  error: string;
  barbers: StaffBarber[];
  singleView?: boolean;
  onUpdateBarber: (
    id: string,
    data: { name: string; phone: string },
  ) => Promise<void>;
  onDeleteBarber: (id: string, name: string) => Promise<void>;
  onCreateBarber: (form: {
    name: string;
    email: string;
    phone: string;
    password?: string;
  }) => Promise<void>;
}

const BarbersSection: React.FC<BarbersSectionProps> = ({
  loading,
  error,
  barbers,
  singleView = false,
  onUpdateBarber,
  onDeleteBarber,
  onCreateBarber,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingBarber, setViewingBarber] = useState<StaffBarber | null>(null);
  const [editingBarber, setEditingBarber] = useState<StaffBarber | null>(null);

  if (loading) {
    return <BarbersSkeleton />;
  }

  if (error) {
    return (
      <>
        <AdminHeader title="Barbers" />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <AdminHeader title="Barbers" />
        {!singleView && (
          <div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-xs hover:bg-amber-400 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Barber</span>
            </button>
          </div>
        )}
      </div>

      {/* Barbers & Pending Invitations Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                {["Name", "Email", "Phone", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Active / Registered Barber Rows */}
              {barbers.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/barbers/${row.id}`}
                      className="font-bold text-slate-900 transition-colors hover:text-amber-700"
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.phone || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ring-1 ${
                        row.is_active
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-slate-100 text-slate-600 ring-slate-200"
                      }`}
                    >
                      {row.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewingBarber(row)}
                        title="View Details"
                        className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingBarber(row)}
                        title="Edit Barber"
                        className="p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => void onDeleteBarber(row.id, row.name)}
                        title="Delete Barber"
                        className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!barbers.length && (
          <p className="p-8 text-center text-sm text-slate-500">
            No barbers found.
          </p>
        )}
      </div>

      <CreateBarberModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateBarber={onCreateBarber}
      />

      <ViewBarberModal
        barber={viewingBarber}
        onClose={() => setViewingBarber(null)}
      />

      <EditBarberModal
        barber={editingBarber}
        onClose={() => setEditingBarber(null)}
        onUpdateBarber={onUpdateBarber}
      />
    </>
  );
};

export default BarbersSection;
