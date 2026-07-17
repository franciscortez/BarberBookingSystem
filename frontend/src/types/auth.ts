export type Role = "admin" | "barber" | "user";

export interface AuthUser {
  id: string;
  role: Role;
  name: string;
  email?: string;
  username?: string;
  phone?: string;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser, token?: string, refreshToken?: string) => void;
  logout: () => Promise<void>;
}
