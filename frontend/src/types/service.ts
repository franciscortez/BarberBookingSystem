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
  barber_name?: string;
}
