export interface Appointment {
  id: string;
  user_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  barber_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  management_token?: string;
  created_at?: string;
  updated_at?: string;
  barber_name?: string;
  service_name?: string;
  total_price?: number | string;
  downpayment_amount?: number | string;
  payment_reference_number?: string;
  paymongo_checkout_id?: string | null;
  paymongo_payment_id?: string | null;
}

export interface AvailabilitySlot {
  time: string;
  available: boolean;
}
