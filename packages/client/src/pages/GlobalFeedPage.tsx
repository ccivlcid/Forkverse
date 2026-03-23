import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.js';
import FeedList from '../components/feed/FeedList.js';
import { useAuthStore } from '../stores/authStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { useFeedStore } from '../stores/feedStore.js';
import { api } from '../api/client.js';
import { toastError } from '../stores/toastStore.js';
import type { ApiResponse } from '@forkverse/shared';

type FeedTab = 'global' | 'local';

export default function GlobalFeedPage() {
  const { isAuthenticated } = useAuthStore();
  const { lang, t } = useUiStore();
  const navigate = useNavigate();
  const { posts, focusedPostId, focusNext, focusPrev, focusPost, starPost, fetchFeed, reset } = useFeedStore();

  const [tab, setTab] = useState<FeedTab>('global');

  // Set HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Fetch feed when tab changes
  useEffect(() => {
    if (tab === 'local' && !isAuthenticated) {
      setTab('global');
      return;
    }
    reset();
    fetchFeed(tab);
  }, [tab, reset, fetchFeed, isAuthenticated]);

  // Scroll focused post into view
  useEffect(() => {
    if (!focusedPostId) return;
    const el = document.querySelector(`[data-post-id="${focusedPostId}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedPostId]);

  const handleStar = useCallback(async (postId: string) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    starPost(postId, !post.isStarred);
    try {
      await api.post<ApiResponse<{ isStarred: boolean; starCount: number }>>(`/posts/${postId}/star`);
    } catch {
      starPost(postId, post.isStarred);
      toastError('Failed to star post');
    }
  }, [posts, isAuthenticated, navigate, starPost]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement).tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;

      switch (e.key) {
        case 'j': focusNext(); break;
        case 'k': focusPrev(); break;
        case 'Escape': focusPost(null); break;
        case 's':
          if (focusedPostId) void handleStar(focusedPostId);
          break;
        case 'o':
        case 'Enter':
          if (focusedPostId) navigate(`/post/${focusedPostId}`);
          break;
        case 'r':
          if (focusedPostId) navigate(`/post/${focusedPostId}`);
          break;
        case 'f':
          if (focusedPostId && isAuthenticated) {
            void api.post(`/posts/${focusedPostId}/fork`).catch(() => toastError('Failed to fork post'));
          }
          break;
        // Tab switching: 1 = global, 2 = local
        case '1': setTab('global'); break;
        case '2': if (isAuthenticated) setTab('local'); break;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate, focusedPostId, focusNext, focusPrev, focusPost, handleStar, isAuthenticated]);

  const handleRefresh = useCallback(async () => {
    reset();
    await fetchFeed(tab);
  }, [tab, reset, fetchFeed]);

  return (
    <AppShell onRefresh={handleRefresh}>
      <div className="max-w-[680px] mx-auto">
        {/* Feed header — search + tabs */}
        <div className="sticky top-0 z-10 bg-[var(--bg-void)]/95 backdrop-blur-sm border-b border-[var(--border)]/30">
          {/* Search bar */}
          <div className="px-4 pt-3 pb-2">
            <button
              onClick={() => navigate('/search')}
              className="w-full flex items-center bg-[var(--bg-surface)] border border-[var(--border)]/50 hover:border-[var(--border-hover)] px-3 py-2 transition-colors"
            >
              <span className="font-mono text-[12px] text-[var(--text-faint)]">
                $ grep "<span className="text-[var(--text-muted)]">{t('feed.searchPlaceholder')}</span>"
              </span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex" role="tablist">
            <button
              role="tab"
              aria-selected={tab === 'global'}
              onClick={() => setTab('global')}
              className={`flex-1 py-2.5 font-mono text-[12px] text-center transition-colors border-b-2 ${
                tab === 'global'
                  ? 'text-[var(--text)] border-[var(--accent-green)]'
                  : 'text-[var(--text-faint)] border-transparent hover:text-[var(--text-muted)]'
              }`}
            >
              {t('feed.tab.global')}
            </button>
            {isAuthenticated && (
              <button
                role="tab"
                aria-selected={tab === 'local'}
                onClick={() => setTab('local')}
                className={`flex-1 py-2.5 font-mono text-[12px] text-center transition-colors border-b-2 ${
                  tab === 'local'
                    ? 'text-[var(--text)] border-[var(--accent-green)]'
                    : 'text-[var(--text-faint)] border-transparent hover:text-[var(--text-muted)]'
                }`}
              >
                {t('feed.tab.local')}
              </button>
            )}
          </div>
        </div>

        <FeedList
          {...(tab === 'local' ? { emptyTitle: '$ feed --local', emptyBody: t('feed.local.emptyBody') } : {})}
        />
      </div>
    </AppShell>
  );
}
