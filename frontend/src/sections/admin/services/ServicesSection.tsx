import React, { useState } from "react";
import { Plus } from "lucide-react";
import type { Service, StaffBarber } from "../../../types";
import { money } from "../adminPortalUtils";
import AdminHeader from "../common/AdminHeader";
import { ServicesSkeleton } from "../common/AdminSkeletons";
import CreateServiceModal from "./CreateServiceModal";

interface ServicesSectionProps {
  loading: boolean;
  error: string;
  services: Service[];
  barbers: StaffBarber[];
  onAddService: (data: {
    barber_id: string;
    name: string;
    description: string;
    total_price: string;
    downpayment_amount: string;
    duration_mins: number;
  }) => Promise<void>;
}

const ServicesSection: React.FC<ServicesSectionProps> = ({
  loading,
  error,
  services,
  barbers,
  onAddService,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) {
    return <ServicesSkeleton />;
  }

  if (error) {
    return (
      <>
        <AdminHeader title="Services" />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <AdminHeader title="Services" />
        <div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-xs hover:bg-amber-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Service</span>
          </button>
        </div>
      </div>

      {/* Services Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                {[
                  "Service",
                  "Barber",
                  "Total Price",
                  "Downpayment",
                  "Duration",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900">{row.name}</span>
                    {row.description && (
                      <p className="text-xs text-slate-500">
                        {row.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium">
                    {row.barber_name}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {money(row.total_price)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {money(row.downpayment_amount)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.duration_mins} mins
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!services.length && (
          <p className="p-8 text-center text-sm text-slate-500">
            No services found.
          </p>
        )}
      </div>

      <CreateServiceModal
        isOpen={isModalOpen}
        barbers={barbers}
        onClose={() => setIsModalOpen(false)}
        onAddService={onAddService}
      />
    </>
  );
};

export default ServicesSection;
