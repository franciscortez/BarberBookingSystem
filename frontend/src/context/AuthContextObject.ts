import { createContext } from 'react';
import type { AuthState } from '../types/auth';

export type { Role, AuthUser, AuthState } from '../types/auth';

export const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
});
