import { create } from 'zustand';
import { api } from '../api/client.js';
import { toastError } from './toastStore.js';
import type { Post, ApiResponse, LlmModel } from '@clitoris/shared';
import { GLOBAL_FEED_MOCK } from '../mocks/globalFeedMock.js';

type FeedEndpoint = 'global' | 'local' | 'explore';

interface FeedState {
  posts: Post[];
  cursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  activeFilter: LlmModel | 'all';
  feedEndpoint: FeedEndpoint;
  focusedPostId: string | null;

  fetchFeed: (endpoint: FeedEndpoint) => Promise<void>;
  fetchGlobalFeed: () => Promise<void>;  // kept for GlobalFeedPage compat
  fetchNextPage: () => Promise<void>;
  setFilter: (model: LlmModel | 'all') => void;
  starPost: (postId: string, isStarred: boolean) => void;
  prependPost: (post: Post) => void;
  updatePost: (postId: string, updated: Post) => void;
  focusPost: (id: string | null) => void;
  focusNext: () => void;
  focusPrev: () => void;
  reset: () => void;
}

type FeedApiResponse = ApiResponse<Post[]>;

function buildPath(endpoint: FeedEndpoint, filter: LlmModel | 'all', cursor?: string | null): string {
  let base: string;
  if (endpoint === 'local') {
    base = '/posts/feed/local';
  } else if (endpoint === 'explore') {
    base = '/posts/feed/explore';
  } else {
    base = filter !== 'all' ? `/posts/by-llm/${filter}` : '/posts/feed/global';
  }
  return cursor ? `${base}?cursor=${encodeURIComponent(cursor)}` : base;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  cursor: null,
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  activeFilter: 'all',
  feedEndpoint: 'global',
  focusedPostId: null,

  fetchFeed: async (endpoint) => {
    set({ isLoading: true, error: null, posts: [], cursor: null, hasMore: true, feedEndpoint: endpoint });
    try {
      const res = await api.get<FeedApiResponse>(buildPath(endpoint, get().activeFilter));
      const posts = res.data.length > 0 ? res.data : (endpoint === 'global' ? GLOBAL_FEED_MOCK : []);
      set({
        posts,
        cursor: res.meta?.cursor ?? null,
        hasMore: res.data.length > 0 ? (res.meta?.hasMore ?? false) : false,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false, error: 'Failed to load feed.' });
    }
  },

  fetchGlobalFeed: async () => {
    return get().fetchFeed('global');
  },

  fetchNextPage: async () => {
    const { cursor, hasMore, isLoadingMore, posts, activeFilter, feedEndpoint } = get();
    if (!hasMore || isLoadingMore) return;

    set({ isLoadingMore: true });
    try {
      const res = await api.get<FeedApiResponse>(buildPath(feedEndpoint, activeFilter, cursor));
      set({
        posts: [...posts, ...res.data],
        cursor: res.meta?.cursor ?? null,
        hasMore: res.meta?.hasMore ?? false,
        isLoadingMore: false,
      });
    } catch {
      set({ isLoadingMore: false });
      toastError('Failed to load more posts');
    }
  },

  setFilter: (model) => {
    set({ activeFilter: model });
    get().fetchFeed(get().feedEndpoint);
  },

  starPost: (postId, isStarred) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? { ...p, isStarred, starCount: isStarred ? p.starCount + 1 : p.starCount - 1 }
          : p,
      ),
    }));
  },

  prependPost: (post) => {
    set((state) => ({ posts: [post, ...state.posts] }));
  },

  updatePost: (postId, updated) => {
    set((state) => ({
      posts: state.posts.map((p) => p.id === postId ? updated : p),
    }));
  },

  focusPost: (id) => set({ focusedPostId: id }),

  focusNext: () => {
    const { posts, focusedPostId } = get();
    if (posts.length === 0) return;
    const idx = posts.findIndex((p) => p.id === focusedPostId);
    const next = idx === -1 ? 0 : Math.min(idx + 1, posts.length - 1);
    set({ focusedPostId: posts[next]?.id ?? null });
  },

  focusPrev: () => {
    const { posts, focusedPostId } = get();
    if (posts.length === 0) return;
    const idx = posts.findIndex((p) => p.id === focusedPostId);
    const prev = idx <= 0 ? 0 : idx - 1;
    set({ focusedPostId: posts[prev]?.id ?? null });
  },

  reset: () =>
    set({ posts: [], cursor: null, hasMore: true, isLoading: false, error: null, feedEndpoint: 'global', focusedPostId: null }),
}));
