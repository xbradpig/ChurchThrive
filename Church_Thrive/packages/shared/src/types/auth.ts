import type { Database } from './database';

export type UserRole = 'superadmin' | 'admin' | 'pastor' | 'staff' | 'leader' | 'member';
export type MemberStatus = 'pending' | 'active' | 'inactive' | 'transferred';

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthState {
  session: AuthSession | null;
  user: AuthUser | null;
  member: Database['public']['Tables']['members']['Row'] | null;
  church: Database['public']['Tables']['churches']['Row'] | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
}

export interface SignUpData {
  email?: string;
  phone?: string;
  password: string;
  name: string;
}
