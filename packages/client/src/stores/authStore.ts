import { create } from 'zustand';
import { api, ApiError } from '../api/client.js';
import type { User, ApiResponse } from '@forkverse/shared';

export type ConnectionStatus = 'idle' | 'redirecting' | 'callback' | 'success' | 'error';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;

  checkSession: () => Promise<void>;
  initiateGitHubOAuth: () => void;
  logout: () => Promise<void>;
  clearError: () => void;
  updateProfile: (data: Partial<Pick<User, 'displayName' | 'bio'>>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  connectionStatus: 'idle',

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get<ApiResponse<User>>('/auth/me');
      set({ user: res.data, isAuthenticated: true, isLoading: false });
      // Auto-sync GitHub follows on each session restore
      api.post('/github/sync-follows').catch(() => { /* silent */ });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        set({ user: null, isAuthenticated: false, isLoading: false });
      } else {
        set({ isLoading: false, user: null, isAuthenticated: false });
      }
    }
  },

  initiateGitHubOAuth: () => {
    set({ connectionStatus: 'redirecting', error: null });
    window.location.href = '/api/auth/github';
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      set({ user: null, isAuthenticated: false, connectionStatus: 'idle' });
    }
  },

  clearError: () => set({ error: null }),

  updateProfile: async (data) => {
    const res = await api.put<ApiResponse<User>>('/auth/me', data);
    set({ user: res.data });
  },
}));
