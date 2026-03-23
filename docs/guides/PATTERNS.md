# PATTERNS.md — Implementation Patterns Reference

> **Source of truth** for implementation patterns used throughout the Forkverse codebase.
> AI agents and developers must follow these patterns when writing new features or modifying existing code.

---

## 1. Optimistic Updates (Star/Fork)

Update the UI immediately for a responsive feel, then revert if the API call fails.

```typescript
// File: packages/client/src/stores/feedStore.ts
// Pattern: Update UI immediately, revert on error
async function toggleStar(postId: string): Promise<void> {
  // 1. Save current state
  const prevPosts = get().posts;

  // 2. Optimistic update
  set({
    posts: prevPosts.map((p) =>
      p.id === postId
        ? { ...p, isStarred: !p.isStarred, starCount: p.starCount + (p.isStarred ? -1 : 1) }
        : p
    ),
  });

  // 3. API call
  try {
    const res = await fetch(`/api/posts/${postId}/star`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to star');
    const { data } = await res.json();
    // 4. Sync with server state
    set({
      posts: get().posts.map((p) =>
        p.id === postId ? { ...p, isStarred: data.starred, starCount: data.starCount } : p
      ),
    });
  } catch {
    // 5. Revert on error
    set({ posts: prevPosts });
  }
}
```

**When to use:** Any toggle action (star, follow, fork) where immediate feedback matters.

**Key rules:**
- Always snapshot state before the optimistic update
- Always sync with server response on success (server is the source of truth)
- Always revert to the snapshot on error

---

## 2. Cursor-Based Pagination

Full infinite scroll pattern using cursor-based pagination. Never use OFFSET-based pagination.

```typescript
// File: packages/client/src/stores/feedStore.ts
interface PaginatedState<T> {
  items: T[];
  cursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
}

async function loadMore(
  endpoint: string,
  cursor: string | null,
  limit: number = 20,
): Promise<{ data: unknown[]; meta: { cursor: string | null; hasMore: boolean } }> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);

  const res = await fetch(`/api/${endpoint}?${params}`);
  if (!res.ok) throw new Error(`Failed to load ${endpoint}`);
  return res.json();
}

// Usage in a Zustand store action:
async function fetchNextPage(): Promise<void> {
  const { cursor, hasMore, isLoading } = get();
  if (!hasMore || isLoading) return;

  set({ isLoading: true });

  try {
    const { data, meta } = await loadMore('posts/feed/global', cursor);
    set({
      items: [...get().items, ...data],
      cursor: meta.cursor,
      hasMore: meta.hasMore,
    });
  } catch (err) {
    console.error('Pagination error:', err);
  } finally {
    set({ isLoading: false });
  }
}
```

**Key rules:**
- First request: omit `cursor` to get the latest items
- Append new items to the existing list (do not replace)
- Guard against duplicate calls with `isLoading` check
- Stop fetching when `hasMore` is `false`

---

## 3. API Call Pattern (with Error Handling)

Standard fetch wrapper that handles common HTTP error codes consistently.

```typescript
// File: packages/client/src/lib/apiFetch.ts
interface ApiError {
  code: string;
  message: string;
  retryAfter?: number;
}

interface ApiResponse<T> {
  data: T;
  meta?: { cursor?: string; hasMore?: boolean };
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const error: ApiError = body?.error ?? { code: 'UNKNOWN', message: res.statusText };

    switch (res.status) {
      case 401:
        // Redirect to login page
        window.location.href = '/login';
        throw error;
      case 403:
        throw error;
      case 429:
        // Rate limited — expose retryAfter for caller
        error.retryAfter = error.retryAfter ?? Number(res.headers.get('Retry-After')) || 60;
        throw error;
      case 500:
        console.error('Server error:', error.message);
        throw error;
      default:
        throw error;
    }
  }

  return res.json();
}

// Usage examples:
// const { data } = await apiFetch<Post[]>('/posts/feed/global');
// const { data } = await apiFetch<Post>('/posts', { method: 'POST', body: JSON.stringify(payload) });
```

**Key rules:**
- Always set `credentials: 'include'` for session cookies
- Always parse the error envelope on non-2xx responses
- 401 triggers a redirect to `/login`
- 429 extracts `retryAfter` from the response body or header
- 500 logs to console before re-throwing

---

## 4. Zustand Store Pattern

Complete template for a typical feature store with loading, error, data, and actions.

```typescript
// File: packages/client/src/stores/feedStore.ts
import { create } from 'zustand';

interface Post {
  id: string;
  messageRaw: string;
  messageCli: string;
  starCount: number;
  isStarred: boolean;
  // ... other fields
}

interface FeedState {
  // Data
  posts: Post[];
  cursor: string | null;
  hasMore: boolean;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchFeed: () => Promise<void>;
  fetchNextPage: () => Promise<void>;
  toggleStar: (postId: string) => Promise<void>;
  reset: () => void;
}

const initialState = {
  posts: [],
  cursor: null,
  hasMore: true,
  isLoading: false,
  error: null,
};

export const useFeedStore = create<FeedState>((set, get) => ({
  ...initialState,

  fetchFeed: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, meta } = await apiFetch<Post[]>('/posts/feed/global');
      set({ posts: data, cursor: meta?.cursor ?? null, hasMore: meta?.hasMore ?? false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load feed';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchNextPage: async () => {
    const { cursor, hasMore, isLoading } = get();
    if (!hasMore || isLoading) return;

    set({ isLoading: true });
    try {
      const { data, meta } = await apiFetch<Post[]>(
        `/posts/feed/global?cursor=${cursor}&limit=20`,
      );
      set({
        posts: [...get().posts, ...data],
        cursor: meta?.cursor ?? null,
        hasMore: meta?.hasMore ?? false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load more';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleStar: async (postId: string) => {
    const prevPosts = get().posts;
    set({
      posts: prevPosts.map((p) =>
        p.id === postId
          ? { ...p, isStarred: !p.isStarred, starCount: p.starCount + (p.isStarred ? -1 : 1) }
          : p
      ),
    });

    try {
      const { data } = await apiFetch<{ starred: boolean; starCount: number }>(
        `/posts/${postId}/star`,
        { method: 'POST' },
      );
      set({
        posts: get().posts.map((p) =>
          p.id === postId ? { ...p, isStarred: data.starred, starCount: data.starCount } : p
        ),
      });
    } catch {
      set({ posts: prevPosts });
    }
  },

  reset: () => set(initialState),
}));
```

**Key rules:**
- Separate initial state into a const for easy `reset()`
- Always clear `error` at the start of an action
- Always set `isLoading: false` in `finally`
- Use `get()` inside async callbacks (not stale closure values)

---

## 5. Form Submission Pattern

Terminal-style form flow: validate, submit, handle error/success, show toast.

```typescript
// File: packages/client/src/stores/composerStore.ts
import { z } from 'zod';

const postSchema = z.object({
  messageRaw: z.string().min(1, 'Message is required').max(2000),
  lang: z.string().length(2, 'Language must be ISO 639-1'),
  tags: z.array(z.string().max(50)).max(10),
  mentions: z.array(z.string()).max(20),
  visibility: z.enum(['public', 'private', 'unlisted']),
  llmModel: z.enum(['claude-sonnet', 'gpt-4o', 'gemini-2.5-pro', 'llama-3', 'api', 'custom']),
});

async function handleSubmitPost(formData: unknown): Promise<void> {
  // 1. Validate
  const parsed = postSchema.safeParse(formData);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    showToast({ type: 'error', message: `${firstError.path.join('.')}: ${firstError.message}` });
    return;
  }

  // 2. Submit
  set({ isSubmitting: true });
  try {
    const { data } = await apiFetch<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    });

    // 3. Success
    showToast({ type: 'success', message: 'Post published' });
    resetForm();
    addPostToFeed(data);
  } catch (err: unknown) {
    // 4. Error handling
    const apiError = err as ApiError;
    if (apiError.code === 'RATE_LIMIT_EXCEEDED') {
      showToast({
        type: 'error',
        message: `Too many requests. Try again in ${apiError.retryAfter}s.`,
      });
    } else {
      showToast({ type: 'error', message: apiError.message ?? 'Failed to create post' });
    }
  } finally {
    set({ isSubmitting: false });
  }
}
```

**Key rules:**
- Always validate with zod before sending to the API
- Show the first validation error in the toast (not all at once)
- Handle rate-limit errors specially (show retry countdown)
- Reset form only on success
- Guard against double-submit with `isSubmitting`

---

## 6. Auth Guard Pattern

Hook that redirects unauthenticated users to `/login`.

```typescript
// File: packages/client/src/hooks/useAuthGuard.ts
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/**
 * Hook: redirect to /login if not authenticated.
 * Use at the top of any page component that requires auth.
 */
export function useAuthGuard(): { user: User | null; isLoading: boolean } {
  const navigate = useNavigate();
  const { user, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, isLoading, navigate]);

  return { user, isLoading };
}

// Usage in a page component:
function LocalFeedPage(): JSX.Element | null {
  const { user, isLoading } = useAuthGuard();

  if (isLoading || !user) return null;

  return <Feed endpoint="posts/feed/local" />;
}
```

**As an HOC (alternative):**

```typescript
import { ComponentType } from 'react';

function withAuth<P extends object>(WrappedComponent: ComponentType<P>): ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading } = useAuthGuard();

    if (isLoading || !user) return null;

    return <WrappedComponent {...props} />;
  };
}

// Usage:
const ProtectedLocalFeed = withAuth(LocalFeedPage);
```

**Key rules:**
- Call `checkAuth()` (which hits `GET /auth/me`) on mount
- Redirect only after loading is complete and user is null
- Return `null` while loading to prevent flash of unauthenticated content
- Use `replace: true` so the login page replaces the guarded page in history

---

## 7. Error Recovery Pattern

Toast notification on API error with a retry button.

```typescript
// File: packages/client/src/stores/feedStore.ts (error recovery in store actions)
interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

function showErrorWithRetry(message: string, retryFn: () => void): void {
  showToast({
    type: 'error',
    message,
    action: {
      label: 'Retry',
      onClick: retryFn,
    },
    duration: 8000,
  });
}

// Usage in a store action:
async function fetchFeedWithRecovery(): Promise<void> {
  set({ isLoading: true, error: null });

  try {
    const { data, meta } = await apiFetch<Post[]>('/posts/feed/global');
    set({ posts: data, cursor: meta?.cursor ?? null, hasMore: meta?.hasMore ?? false });
  } catch (err: unknown) {
    const apiError = err as ApiError;

    if (apiError.retryAfter) {
      // Rate limited: auto-retry after delay
      showToast({
        type: 'error',
        message: `Rate limited. Retrying in ${apiError.retryAfter}s...`,
        duration: apiError.retryAfter * 1000,
      });
      setTimeout(() => get().fetchFeed(), apiError.retryAfter! * 1000);
    } else {
      // General error: manual retry
      showErrorWithRetry(
        apiError.message ?? 'Failed to load feed',
        () => get().fetchFeed(),
      );
    }

    set({ error: apiError.message ?? 'Unknown error' });
  } finally {
    set({ isLoading: false });
  }
}
```

**Retry strategy summary:**
| Error | Behavior |
|-------|----------|
| `429` Rate Limited | Read `retryAfter`, wait, retry once automatically |
| `500` Server Error | Show toast with manual "Retry" button |
| Network Error | Show toast with manual "Retry" button |
| `401` Unauthorized | Redirect to `/login` (no retry) |
| `403` Forbidden | Show error toast (no retry) |

**Key rules:**
- Never retry 401 or 403 errors
- For 429: retry once automatically after the specified delay
- For 500 / network errors: let the user decide when to retry
- Always show a toast so the user knows what happened
- Set `error` state in the store for components that render error UI

---

## 8. Infinite Scroll Hook Pattern

Reusable hook that connects the IntersectionObserver to the store's `fetchNextPage` action.

```typescript
// File: packages/client/src/hooks/useInfiniteScroll.ts
import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  rootMargin?: string;
}

function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 0.1,
  rootMargin = '200px',
}: UseInfiniteScrollOptions): { sentinelRef: React.RefObject<HTMLDivElement> } {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMoreRef.current();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, threshold, rootMargin]);

  return { sentinelRef };
}

// Usage in a feed component:
function FeedList(): JSX.Element {
  const { posts, hasMore, isLoading, fetchNextPage } = useFeedStore();
  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore: fetchNextPage,
  });

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      <div ref={sentinelRef} className="h-1" />
      {isLoading && <LoadingIndicator />}
    </div>
  );
}
```

**Key rules:**
- Use `IntersectionObserver`, not scroll events (better performance)
- Set `rootMargin: '200px'` to trigger loading before the user reaches the bottom
- Guard with `hasMore && !isLoading` to prevent duplicate fetches
- Store `onLoadMore` in a ref to avoid re-creating the observer on every render
- The sentinel element is a 1px-tall div at the bottom of the list

---

## 9. Toast Notification Pattern

Centralized toast system using a Zustand store and a fixed-position container.

```typescript
// File: packages/client/src/stores/toastStore.ts
import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  action?: { label: string; onClick: () => void };
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = crypto.randomUUID();
    const newToast = { ...toast, id };

    set({ toasts: [...get().toasts.slice(-2), newToast] }); // max 3 visible

    if (toast.duration > 0) {
      setTimeout(() => get().removeToast(id), toast.duration);
    }
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));

// Convenience functions
function showToast(toast: Omit<Toast, 'id' | 'duration'> & { duration?: number }): void {
  useToastStore.getState().addToast({
    duration: 3000,
    ...toast,
  });
}

function showSuccess(message: string): void {
  showToast({ type: 'success', message });
}

function showError(message: string, retryFn?: () => void): void {
  showToast({
    type: 'error',
    message,
    duration: 8000,
    ...(retryFn ? { action: { label: 'Retry', onClick: retryFn } } : {}),
  });
}
```

### Toast Container Component

```typescript
// File: packages/client/src/components/layout/ToastContainer.tsx
function ToastContainer(): JSX.Element {
  const { toasts, removeToast } = useToastStore();

  const borderColor: Record<Toast['type'], string> = {
    success: 'border-emerald-400',
    error: 'border-red-400',
    info: 'border-sky-400',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          onClick={() => removeToast(toast.id)}
          className={`border-l-4 ${borderColor[toast.type]} bg-[#16213e] text-gray-200 font-mono text-sm px-4 py-3 cursor-pointer transition-opacity duration-300`}
        >
          {toast.message}
          {toast.action && (
            <button
              onClick={(e) => { e.stopPropagation(); toast.action!.onClick(); }}
              className="ml-3 text-green-400 hover:text-green-300 underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

**Key rules:**
- Maximum 3 toasts visible at a time (oldest is removed when 4th is added)
- Success toasts auto-dismiss after 3 seconds
- Error toasts auto-dismiss after 8 seconds (longer for reading)
- All toasts dismiss on click
- Error toasts with retry action keep the retry button
- Toast container is positioned `fixed bottom-4 right-4 z-50`
- Toasts stack upward with `gap-2`

---

## 10. Time Formatting Pattern

Consistent relative time display across the application.

```typescript
// File: packages/client/src/lib/timeAgo.ts
function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// Examples:
// timeAgo('2026-03-19T12:30:00Z') → "just now"
// timeAgo('2026-03-19T12:25:00Z') → "5m ago"
// timeAgo('2026-03-19T09:00:00Z') → "3h ago"
// timeAgo('2026-03-17T12:00:00Z') → "2d ago"
// timeAgo('2026-02-15T12:00:00Z') → "Feb 15"
```

**Key rules:**
- Use short format: `5m ago`, `3h ago`, `2d ago`
- Beyond 7 days: show date as `MMM D` (e.g., "Feb 15")
- Never show seconds (always "just now" for < 60s)
- Input is always an ISO 8601 string from the API

---

## 11. LLM Transformation Error Handling Pattern

Handles LLM-specific errors: timeout, invalid response, rate limit, provider unavailable.

```typescript
// File: packages/llm/src/transform.ts
async function transformWithRetry(
  input: TransformRequest,
  maxRetries: number = 1,
): Promise<TransformResponse> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const provider = createProvider(input.provider);
      return await provider.transform(input);
    } catch (err) {
      if (err instanceof ProviderTimeoutError) {
        // Timeout: retry once, then give up
        if (attempt < maxRetries) continue;
        throw err;
      }
      if (err instanceof ParseError && attempt < maxRetries) {
        // Invalid LLM output: retry once (non-deterministic models)
        continue;
      }
      // All other errors: do not retry
      throw err;
    }
  }
  throw new Error("Unreachable");
}
```

**Error → UI mapping:**

| Error Type | Toast Message | Auto-retry? |
|-----------|--------------|-------------|
| `ProviderTimeoutError` | "LLM request timed out. Try again." | Once, then manual |
| `ProviderConfigError` | "Missing API key for {provider}. Check settings." | No |
| `ProviderNetworkError` | "Cannot reach {provider}. Check your connection." | Manual retry button |
| `ParseError` (after retry) | "Could not generate CLI command. Showing raw output." | No (show raw) |
| `429 Rate Limit` | "Too many requests. Retrying in {n}s..." | Once after delay |

---

## 12. Debounce Pattern

Prevents rapid duplicate actions (e.g., double-click star, rapid form submit).

```typescript
// File: packages/client/src/hooks/useDebounce.ts
import { useRef, useCallback } from 'react';

function useDebounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number = 300,
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  return useCallback(
    ((...args: unknown[]) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => fn(...args), delayMs);
    }) as T,
    [fn, delayMs],
  );
}

// Usage: debounce search input
const debouncedSearch = useDebounce((query: string) => {
  fetchSearchResults(query);
}, 300);
```

**When to use:**
- Search input (300ms delay)
- Window resize handlers (150ms delay)
- Auto-save drafts (1000ms delay)

**When NOT to use (use `isSubmitting` guard instead):**
- Star/follow toggles (optimistic update handles this)
- Form submission (use `isSubmitting` flag)

---

## 13. Race Condition Prevention (isSubmitting Guard)

Prevents duplicate API calls from rapid clicks on toggle actions (star, follow, fork) and form submissions.

```typescript
// File: packages/client/src/stores/feedStore.ts
// Apply this guard to any action that mutates server state

interface StoreWithSubmitGuard {
  isSubmitting: boolean;
  // ... other fields
}

async function guardedAction(get: () => StoreWithSubmitGuard, set: (s: Partial<StoreWithSubmitGuard>) => void, action: () => Promise<void>): Promise<void> {
  if (get().isSubmitting) return;
  set({ isSubmitting: true });
  try {
    await action();
  } finally {
    set({ isSubmitting: false });
  }
}

// Usage in toggleStar:
toggleStar: async (postId: string) => {
  if (get().isSubmitting) return;
  set({ isSubmitting: true });

  const prevPosts = get().posts;
  // ... optimistic update ...

  try {
    await apiFetch(`/posts/${postId}/star`, { method: 'POST' });
  } catch {
    set({ posts: prevPosts });
  } finally {
    set({ isSubmitting: false });
  }
},
```

**When to use:**
- Star/follow/fork toggles (prevents double-toggle)
- Form submissions (prevents duplicate posts)
- Any action that calls a mutating API endpoint

**When NOT to use:**
- Read-only fetches (use `isLoading` guard instead)
- Debounced search inputs (use `useDebounce` pattern instead)

**Key rules:**
- Always set `isSubmitting: false` in `finally` block
- Check `isSubmitting` at the top of the action and return early if true
- One `isSubmitting` flag per independent action group (e.g., `isStarring`, `isForking` if they can happen concurrently)

---

## 14. Store Naming Convention

Consistent naming for all Zustand stores across the project.

| Item | Convention | Example |
|------|-----------|---------|
| File name | `camelCase` + `Store.ts` | `feedStore.ts`, `authStore.ts`, `postDetailStore.ts` |
| File path | `packages/client/src/stores/` | `packages/client/src/stores/feedStore.ts` |
| Export name | `use` + `PascalCase` + `Store` | `useFeedStore`, `useAuthStore`, `usePostDetailStore` |
| Interface | `PascalCase` + `State` | `FeedState`, `AuthState`, `PostDetailState` |
| Initial state | `const initialState` | Extracted as a const for `reset()` |

**All stores in the project:**

| Store | File | Purpose |
|-------|------|---------|
| `useFeedStore` | `feedStore.ts` | Global/local feed posts, pagination, star/fork |
| `useAuthStore` | `authStore.ts` | Current user session, login/logout |
| `useComposerStore` | `composerStore.ts` | Post creation form state, LLM model selection |
| `usePostDetailStore` | `postDetailStore.ts` | Single post view, replies |
| `useProfileStore` | `profileStore.ts` | User profile, user's posts |
| `useExploreStore` | `exploreStore.ts` | Trending, search, discover |
| `useSettingsStore` | `settingsStore.ts` | User settings |
| `useAnalyzeStore` | `analyzeStore.ts` | Repo analysis state |
| `useToastStore` | `toastStore.ts` | Toast notification queue |

---

## 15. Performance Targets

All features must meet these performance targets. Measure with browser DevTools Network/Performance tabs.

| Metric | Target | Measurement | Notes |
|--------|--------|-------------|-------|
| Feed load (first 10 posts) | < 500ms | Time from navigation to first paint | Includes API + render |
| LLM transformation | < 3s total | Time from submit to CLI output | Streaming: first token < 500ms |
| DB query (p95) | < 50ms | Server-side query execution time | Must use indexes. Log slow queries with pino |
| Page transition | < 200ms | Time between route changes | Use React Router lazy loading + Suspense |
| Time to Interactive (TTI) | < 2s | Lighthouse audit | Code-split per route |
| Bundle size (initial) | < 200KB gzipped | `vite build` output | Lazy-load heavy deps (@xyflow/react) |

**When a target is missed:**
1. Check if the correct index exists (DB queries)
2. Profile with React DevTools (component renders)
3. Check network waterfall (API calls)
4. Consider denormalization if DB query > 50ms despite indexes

---

## Ownership

This document is maintained alongside the Forkverse codebase. All implementation code must conform to these patterns. When adding a new pattern, include a full TypeScript example, a "When to use" note, and a "Key rules" checklist.

---

## B-plan: Analysis Patterns

> Added 2026-03-21 for the Repo Analysis Platform pivot.

### Analysis Polling Pattern

Analysis takes 10-60 seconds. Use polling (current) or SSE (future) to track progress.

```typescript
// File: packages/client/src/stores/analyzeStore.ts
// Pattern: Poll until terminal state
async function pollAnalysis(analysisId: string): Promise<void> {
  const POLL_INTERVAL = 1500; // 1.5 seconds
  const MAX_POLLS = 120;      // 3 minutes max

  for (let i = 0; i < MAX_POLLS; i++) {
    const res = await fetch(`/api/analyze/${analysisId}`);
    const { data } = await res.json();

    set({ currentAnalysis: data, progress: data.progress });

    if (data.status === 'completed' || data.status === 'failed') {
      return; // Terminal state — stop polling
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }

  // Timeout — mark as failed client-side
  set({ error: 'Analysis timed out' });
}
```

**Key rules:**
- Always have a max poll count to prevent infinite loops
- Only poll while status is `pending` or `processing`
- Stop immediately on terminal states (`completed`, `failed`)
- Update UI progressively as steps complete

### Home Page Pre-fill Pattern

When user enters a repo on the Home page, pass it to the Analyze page via URL params.

```typescript
// File: packages/client/src/stores/homeStore.ts
function goToAnalyze(): void {
  const { repoInput, outputType } = get();
  const params = new URLSearchParams();
  if (repoInput) params.set('repo', repoInput);
  if (outputType !== 'report') params.set('output', outputType);
  navigate(`/analyze?${params.toString()}`);
}

// File: packages/client/src/pages/AnalyzePage.tsx
// On mount, read URL params to pre-fill form
useEffect(() => {
  const params = new URLSearchParams(location.search);
  const repo = params.get('repo');
  const output = params.get('output');
  if (repo) analyzeStore.getState().setRepoInput(repo);
  if (output) analyzeStore.getState().setOutputType(output);
}, []);
```

### Analysis Result Caching Pattern

Avoid re-fetching completed analysis results.

```typescript
// File: packages/client/src/stores/analyzeStore.ts
// Pattern: Cache completed results in memory
const resultCache = new Map<string, Analysis>();

async function fetchAnalysis(id: string): Promise<Analysis> {
  const cached = resultCache.get(id);
  if (cached && cached.status === 'completed') return cached;

  const res = await fetch(`/api/analysis/${id}`);
  const { data } = await res.json();

  if (data.status === 'completed') {
    resultCache.set(id, data); // Cache only terminal results
  }
  return data;
}
```

**Key rules:**
- Only cache results with terminal status (`completed`)
- Never cache `pending` or `processing` — they will change
- Cache lives in memory — cleared on page refresh (acceptable for MVP)

---

## See Also

- [CONVENTIONS.md](./CONVENTIONS.md) — Code style and naming conventions
- [TESTING.md](../testing/TESTING.md) — Test patterns and utilities
- [API.md](../specs/API.md) — REST API specification
- [DATABASE.md](../specs/DATABASE.md) — Database schema and queries
- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) — System architecture overview
- [ANALYZE.md](../screens/ANALYZE.md) — Analyze page specification
