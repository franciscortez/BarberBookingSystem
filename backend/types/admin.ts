export interface Admin {
  id: string;
  username: string;
  password_hash: string;
  created_at: Date | null;
  updated_at: Date | null;
}
