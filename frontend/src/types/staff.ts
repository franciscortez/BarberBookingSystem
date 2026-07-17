export interface StaffAppointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  barber_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  barber_name: string;
  service_name: string;
  total_price: string;
  downpayment_amount: string;
  payment_status: string;
  payment_amount: string;
}
export interface StaffBarber {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  account_active: boolean | null;
}
export interface StaffPayment {
  id: string;
  amount: string;
  status: string;
  paymongo_checkout_id: string | null;
  paymongo_payment_id: string | null;
  created_at: string;
  appointment_id: string;
  customer_name: string;
  customer_email: string;
  barber_name: string;
}
export interface StaffDashboard {
  today: string;
  upcoming: string;
  confirmed: string;
  completed: string;
  cancelled: string;
  no_show: string;
  active_barbers?: number;
  payment_total?: number;
  next_appointment?: {
    id: string;
    customer_name: string;
    appointment_date: string;
    start_time: string;
    service_name?: string;
  } | null;
}
export interface WorkingHour {
  id?: string;
  weekday: number;
  start_time: string;
  end_time: string;
}
export interface AvailabilityBlock {
  id: string;
  block_date: string;
  start_time: string;
  end_time: string;
  reason?: string;
}
export interface StaffAvailability {
  hours: WorkingHour[];
  blocks: AvailabilityBlock[];
}

export interface BarberInvitation {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
}
