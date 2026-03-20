import { create } from 'zustand';
import { api } from '../api/client.js';
import { toastError } from './toastStore.js';
import type { ActivityEvent, ApiResponse } from '@clitoris/shared';

type FeedType = 'feed' | 'global';

interface ActivityState {
  events: ActivityEvent[];
  cursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  feedType: FeedType;

  fetchActivity: (type: FeedType) => Promise<void>;
  fetchNextPage: () => Promise<void>;
  syncGithub: () => Promise<{ synced: number }>;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  events: [],
  cursor: null,
  hasMore: true,
  isLoading: false,
  feedType: 'feed',

  fetchActivity: async (type) => {
    set({ isLoading: true, events: [], cursor: null, hasMore: true, feedType: type });
    try {
      const res = await api.get<ApiResponse<ActivityEvent[]>>(`/activity/${type}`);
      set({
        events: res.data,
        cursor: res.meta?.cursor ?? null,
        hasMore: res.meta?.hasMore ?? false,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
      toastError('Failed to load activity feed');
    }
  },

  fetchNextPage: async () => {
    const { cursor, hasMore, isLoading, events, feedType } = get();
    if (!hasMore || isLoading || !cursor) return;
    set({ isLoading: true });
    try {
      const res = await api.get<ApiResponse<ActivityEvent[]>>(`/activity/${feedType}?cursor=${encodeURIComponent(cursor)}`);
      set({
        events: [...events, ...res.data],
        cursor: res.meta?.cursor ?? null,
        hasMore: res.meta?.hasMore ?? false,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
      toastError('Failed to load more activity');
    }
  },

  syncGithub: async () => {
    try {
      const res = await api.post<ApiResponse<{ synced: number; total: number }>>('/activity/sync-github');
      return { synced: res.data.synced };
    } catch {
      toastError('Failed to sync GitHub activity');
      return { synced: 0 };
    }
  },
}));
