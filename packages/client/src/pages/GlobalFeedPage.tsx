import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.js';
import FeedList from '../components/feed/FeedList.js';
import { useAuthStore } from '../stores/authStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { useFeedStore } from '../stores/feedStore.js';
import { api } from '../api/client.js';
import { toastError } from '../stores/toastStore.js';
import type { ApiResponse } from '@clitoris/shared';

export default function GlobalFeedPage() {
  const { isAuthenticated } = useAuthStore();
  const { lang } = useUiStore();
  const navigate = useNavigate();
  const { posts, focusedPostId, focusNext, focusPrev, focusPost, starPost } = useFeedStore();

  // Set HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

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

  // Keyboard navigation: j/k/s/f/o/Enter/r/Escape
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
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate, focusedPostId, focusNext, focusPrev, focusPost, handleStar, isAuthenticated]);

  return (
    <AppShell>
      <div className="max-w-[680px] mx-auto">
        <FeedList />
      </div>
    </AppShell>
  );
}
