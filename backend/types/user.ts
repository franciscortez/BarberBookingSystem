export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  password_hash: string;
  created_at: Date | null;
  updated_at: Date | null;
}
