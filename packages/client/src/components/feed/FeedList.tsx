import { useEffect, useCallback } from 'react';
import { useFeedStore } from '../../stores/feedStore.js';
import { useUiStore } from '../../stores/uiStore.js';
import PostCard from '../post/PostCard.js';
import InfiniteScrollTrigger from './InfiniteScrollTrigger.js';

function SkeletonCard() {
  return (
    <div aria-hidden="true" className="animate-pulse py-6 px-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-white/[0.04]" />
        <div className="space-y-1.5">
          <div className="h-3 w-24 bg-white/[0.06] rounded" />
          <div className="h-2 w-14 bg-white/[0.03] rounded" />
        </div>
      </div>
      <div className="space-y-2.5">
        <div className="h-3 w-full bg-white/[0.05] rounded" />
        <div className="h-3 w-4/5 bg-white/[0.04] rounded" />
        <div className="h-3 w-3/5 bg-white/[0.03] rounded" />
      </div>
    </div>
  );
}

interface FeedListProps {
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyBody?: string;
}

export default function FeedList({ emptyTitle, emptySubtitle: _emptySubtitle, emptyBody }: FeedListProps = {}) {
  const { posts, isLoading, isLoadingMore, hasMore, error, focusedPostId, fetchGlobalFeed, fetchNextPage } =
    useFeedStore();
  const { t } = useUiStore();

  useEffect(() => {
    fetchGlobalFeed();
  }, [fetchGlobalFeed]);

  const handleLoadMore = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  // Loading
  if (isLoading) {
    return (
      <div aria-busy="true" className="divide-y divide-[var(--border)]/10">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Error
  if (error && posts.length === 0) {
    return (
      <div data-testid="feed-error" className="py-20 px-5 text-center">
        <p className="text-[var(--text-faint)] font-mono text-[12px] mb-2">
          {t('feed.error.title')}
        </p>
        <p className="text-[var(--color-error)] font-mono text-[12px] mb-6">
          {t('feed.error.message')}
        </p>
        <button
          data-testid="feed-retry"
          onClick={fetchGlobalFeed}
          className="text-[var(--accent-green)] font-mono text-[12px] hover:text-[var(--accent-green)]/80 transition-colors"
        >
          {t('feed.error.retry')}
        </button>
      </div>
    );
  }

  // Empty
  if (posts.length === 0) {
    return (
      <div data-testid="feed-empty" className="py-20 px-5 text-center">
        <p className="text-[var(--text-faint)] font-mono text-[12px] mb-1">
          {emptyTitle ?? t('feed.empty.title')}
        </p>
        <p className="text-[var(--text-muted)] text-[13px] mt-3" style={{ fontFamily: 'var(--font-sans)' }}>
          {emptyBody ?? t('feed.empty.body')}
        </p>
      </div>
    );
  }

  // Feed
  return (
    <div aria-live="polite">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} focused={focusedPostId === post.id} />
      ))}

      {isLoadingMore && (
        <div data-testid="feed-loading" className="py-6 text-center">
          <span className="text-[var(--text-faint)] font-mono text-[11px]">loading...</span>
        </div>
      )}

      {hasMore && !isLoadingMore && (
        <InfiniteScrollTrigger onTrigger={handleLoadMore} />
      )}
    </div>
  );
}
