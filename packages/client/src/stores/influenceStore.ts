import { create } from 'zustand';
import { api } from '../api/client.js';
import type { ApiResponse, InfluenceScore, LeaderboardEntry } from '@clitoris/shared';

interface InfluenceState {
  leaderboard: LeaderboardEntry[];
  cursor: number | null;
  hasMore: boolean;
  isLoading: boolean;
  userScore: InfluenceScore | null;
  isCalculating: boolean;

  fetchLeaderboard: () => Promise<void>;
  fetchNextPage: () => Promise<void>;
  fetchUserScore: (username: string) => Promise<void>;
  calculateScore: () => Promise<void>;
  reset: () => void;
}

export const useInfluenceStore = create<InfluenceState>((set, get) => ({
  leaderboard: [],
  cursor: null,
  hasMore: false,
  isLoading: false,
  userScore: null,
  isCalculating: false,

  fetchLeaderboard: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get<ApiResponse<LeaderboardEntry[]>>('/influence/leaderboard?limit=20');
      set({ leaderboard: res.data, cursor: Number(res.meta?.cursor) || null, hasMore: res.meta?.hasMore ?? false });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchNextPage: async () => {
    const { cursor, hasMore, isLoading, leaderboard } = get();
    if (!hasMore || isLoading || cursor == null) return;
    set({ isLoading: true });
    try {
      const res = await api.get<ApiResponse<LeaderboardEntry[]>>(`/influence/leaderboard?cursor=${cursor}&limit=20`);
      set({
        leaderboard: [...leaderboard, ...res.data],
        cursor: Number(res.meta?.cursor) || null,
        hasMore: res.meta?.hasMore ?? false,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUserScore: async (username: string) => {
    try {
      const res = await api.get<ApiResponse<InfluenceScore | null>>(`/influence/@${username}`);
      set({ userScore: res.data });
    } catch {
      set({ userScore: null });
    }
  },

  calculateScore: async () => {
    set({ isCalculating: true });
    try {
      const res = await api.post<ApiResponse<InfluenceScore>>('/influence/calculate');
      set({ userScore: res.data });
    } finally {
      set({ isCalculating: false });
    }
  },

  reset: () => set({ leaderboard: [], cursor: null, hasMore: false, userScore: null }),
}));
