import { create } from 'zustand';
import { api } from '../api/client.js';
import { toastError } from './toastStore.js';
import type { ApiResponse, DirectMessage, Conversation } from '@clitoris/shared';

interface MessageState {
  conversations: Conversation[];
  messages: DirectMessage[];
  activeUsername: string | null;
  isLoading: boolean;
  isSending: boolean;
  draft: string;

  fetchInbox: () => Promise<void>;
  fetchConversation: (username: string) => Promise<void>;
  sendMessage: (receiverUsername: string) => Promise<void>;
  setDraft: (text: string) => void;
  reset: () => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: [],
  messages: [],
  activeUsername: null,
  isLoading: false,
  isSending: false,
  draft: '',

  fetchInbox: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get<ApiResponse<Conversation[]>>('/messages');
      set({ conversations: res.data });
    } catch {
      toastError('Failed to load inbox');
    } finally {
      set({ isLoading: false });
    }
  },

  fetchConversation: async (username: string) => {
    set({ isLoading: true, activeUsername: username });
    try {
      const res = await api.get<ApiResponse<DirectMessage[]>>(`/messages/${username}`);
      set({ messages: res.data });
    } catch {
      toastError('Failed to load conversation');
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (receiverUsername: string) => {
    const { draft, messages } = get();
    if (!draft.trim()) return;
    set({ isSending: true });
    try {
      const res = await api.post<ApiResponse<DirectMessage>>('/messages', {
        receiverUsername,
        message: draft,
      });
      set({ messages: [...messages, res.data], draft: '' });
    } catch {
      toastError('Failed to send message');
    } finally {
      set({ isSending: false });
    }
  },

  setDraft: (text: string) => set({ draft: text }),

  reset: () => set({ conversations: [], messages: [], activeUsername: null, draft: '' }),
}));
