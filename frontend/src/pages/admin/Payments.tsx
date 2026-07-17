/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from "react";

import PaymentsSection from "../../sections/admin/payments/PaymentsSection";
import { staffRequest } from "../../services/staffApi";
import type { StaffPayment } from "../../types";

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<StaffPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    staffRequest<StaffPayment[]>("/api/admin/payments")
      .then((res) => {
        if (active) setPayments(res);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "Request failed");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <PaymentsSection loading={loading} error={error} payments={payments} />
  );
};

export default Payments;
