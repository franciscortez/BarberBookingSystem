export interface Barber {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Service {
  id: string;
  barber_id: string;
  name: string;
  description: string | null;
  total_price: number | string;
  downpayment_amount: number | string;
  duration_mins: number;
  created_at?: string;
  updated_at?: string;
}

export interface Appointment {
  id: string;
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
  // Optional join fields from API responses
  barber_name?: string;
  service_name?: string;
  total_price?: number | string;
  downpayment_amount?: number | string;
  payment_reference_number?: string;
  paymongo_checkout_id?: string | null;
  paymongo_payment_id?: string | null;
}

export interface Payment {
  id: string;
  appointment_id: string;
  paymongo_checkout_id: string | null;
  paymongo_payment_id: string | null;
  amount: number | string;
  status: 'pending' | 'paid' | 'failed';
  idempotency_key: string;
  created_at?: string;
  updated_at?: string;
}

export interface AvailabilitySlot {
  time: string; // "HH:MM"
  available: boolean;
}
