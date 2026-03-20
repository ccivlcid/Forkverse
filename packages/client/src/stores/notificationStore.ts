import { create } from 'zustand';
import { api } from '../api/client.js';
import { toastError } from './toastStore.js';
import type { Notification, ApiResponse } from '@clitoris/shared';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  cursor: string | null;
  hasMore: boolean;
  isLoading: boolean;

  fetchNotifications: () => Promise<void>;
  fetchNextPage: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  cursor: null,
  hasMore: true,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true, notifications: [], cursor: null, hasMore: true });
    try {
      const res = await api.get<ApiResponse<Notification[]>>('/notifications');
      set({
        notifications: res.data,
        cursor: res.meta?.cursor ?? null,
        hasMore: res.meta?.hasMore ?? false,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
      toastError('Failed to load notifications');
    }
  },

  fetchNextPage: async () => {
    const { cursor, hasMore, isLoading } = get();
    if (!hasMore || isLoading || !cursor) return;
    set({ isLoading: true });
    try {
      const res = await api.get<ApiResponse<Notification[]>>(`/notifications?cursor=${encodeURIComponent(cursor)}`);
      set((s) => ({
        notifications: [...s.notifications, ...res.data],
        cursor: res.meta?.cursor ?? null,
        hasMore: res.meta?.hasMore ?? false,
        isLoading: false,
      }));
    } catch {
      set({ isLoading: false });
      toastError('Failed to load more notifications');
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
      set({ unreadCount: res.data.count });
    } catch { /* silent */ }
  },

  markRead: async (id: string) => {
    const prev = get().notifications;
    const prevCount = get().unreadCount;
    set((s) => ({
      notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
    try {
      await api.post(`/notifications/${id}/read`);
    } catch {
      set({ notifications: prev, unreadCount: prevCount });
      toastError('Failed to mark notification as read');
    }
  },

  markAllRead: async () => {
    const prev = get().notifications;
    const prevCount = get().unreadCount;
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
    try {
      await api.post('/notifications/read-all');
    } catch {
      set({ notifications: prev, unreadCount: prevCount });
      toastError('Failed to mark all as read');
    }
  },
}));
