import { api, refreshSession, setAccessToken, getAccessToken } from '@/lib/api-client';
import type { AuthSession, UserProfile } from '@/types';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  mobile?: string;
}

export const authService = {
  async login(input: LoginInput): Promise<AuthSession> {
    const session = await api.post<AuthSession>('/auth/login', input, { auth: false });
    setAccessToken(session.accessToken);
    return session;
  },

  async register(input: RegisterInput): Promise<AuthSession> {
    const session = await api.post<AuthSession>('/auth/register', input, { auth: false });
    setAccessToken(session.accessToken);
    return session;
  },

  async refresh(): Promise<AuthSession | null> {
    return refreshSession();
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout', undefined, { auth: false });
    } finally {
      setAccessToken(null);
    }
  },

  async me(): Promise<UserProfile> {
    return api.get<UserProfile>('/auth/me');
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/forgot-password', { email }, { auth: false });
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return api.post<{ message: string }>(
      '/auth/reset-password',
      { token, password },
      { auth: false },
    );
  },

  hasToken(): boolean {
    return getAccessToken() !== null;
  },
};
