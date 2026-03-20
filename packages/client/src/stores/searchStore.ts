import { create } from 'zustand';
import { api } from '../api/client.js';
import { toastError } from './toastStore.js';
import type { SearchResult, ApiResponse } from '@clitoris/shared';

interface SearchState {
  query: string;
  results: SearchResult | null;
  isLoading: boolean;

  setQuery: (q: string) => void;
  search: (q: string) => Promise<void>;
  clear: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  results: null,
  isLoading: false,

  setQuery: (q) => set({ query: q }),

  search: async (q) => {
    if (!q.trim()) { set({ results: null }); return; }
    set({ isLoading: true, query: q });
    try {
      const res = await api.get<ApiResponse<SearchResult>>(`/posts/search?q=${encodeURIComponent(q.trim())}`);
      set({ results: res.data, isLoading: false });
    } catch {
      set({ isLoading: false });
      toastError('Search failed');
    }
  },

  clear: () => set({ query: '', results: null }),
}));
