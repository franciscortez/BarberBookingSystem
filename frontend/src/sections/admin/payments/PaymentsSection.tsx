import React from "react";
import type { StaffPayment } from "../../../types";
import { money, statusClass } from "../adminPortalUtils";
import AdminHeader from "../common/AdminHeader";
import { PaymentsSkeleton } from "../common/AdminSkeletons";

interface PaymentsSectionProps {
  loading: boolean;
  error: string;
  payments: StaffPayment[];
}

const PaymentsSection: React.FC<PaymentsSectionProps> = ({
  loading,
  error,
  payments,
}) => {
  if (loading) {
    return <PaymentsSkeleton />;
  }

  if (error) {
    return (
      <>
        <AdminHeader title="Payments" />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader title="Payments" />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              {["Customer", "Barber", "Amount", "Status", "Reference"].map(
                (h) => (
                  <th key={h} className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {payments.map((row) => (
              <tr
                key={row.id}
                className="border-t border-slate-100 hover:bg-slate-50/50"
              >
                <td className="px-4 py-3 text-slate-900">
                  <span className="font-medium">{row.customer_name}</span>
                  <p className="text-xs text-slate-500">{row.customer_email}</p>
                </td>
                <td className="px-4 py-3 text-slate-900">{row.barber_name}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {money(row.amount)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ring-1 ${statusClass(
                      row.status,
                    )}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {row.paymongo_payment_id ||
                    row.paymongo_checkout_id ||
                    "Pending"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!payments.length && (
          <p className="p-8 text-center text-sm text-slate-500">
            No payments found.
          </p>
        )}
      </div>
    </>
  );
};

export default PaymentsSection;
