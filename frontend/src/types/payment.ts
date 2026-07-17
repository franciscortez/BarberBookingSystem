export interface Payment {
  id: string;
  appointment_id: string;
  paymongo_checkout_id: string | null;
  paymongo_payment_id: string | null;
  amount: number | string;
  status: "pending" | "paid" | "failed";
  idempotency_key: string;
  created_at?: string;
  updated_at?: string;
}
