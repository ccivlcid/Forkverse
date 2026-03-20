import { create } from 'zustand';
import { api } from '../api/client.js';
import { toastError } from './toastStore.js';
import type { SearchResult, ApiResponse } from '@clitoris/shared';

let searchSeq = 0;

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
    const seq = ++searchSeq;
    set({ isLoading: true, query: q });
    try {
      const res = await api.get<ApiResponse<SearchResult>>(`/posts/search?q=${encodeURIComponent(q.trim())}`);
      // Only apply if this is still the latest search request
      if (seq === searchSeq) {
        set({ results: res.data, isLoading: false });
      }
    } catch {
      if (seq === searchSeq) {
        set({ isLoading: false });
        toastError('Search failed');
      }
    }
  },

  clear: () => { searchSeq++; set({ query: '', results: null, isLoading: false }); },
}));
