import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.js';
import FeedList from '../components/feed/FeedList.js';
import { useAuthStore } from '../stores/authStore.js';
import { useFeedStore } from '../stores/feedStore.js';
import { LOCAL_FEED_MOCK } from '../mocks/localFeedMock.js';

export default function LocalFeedPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { fetchFeed, reset } = useFeedStore();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login?redirect=/feed/local', { replace: true });
      return;
    }
    if (isAuthenticated) {
      reset();
      fetchFeed('local').then(() => {
        const { posts } = useFeedStore.getState();
        if (posts.length === 0) {
          useFeedStore.setState({ posts: LOCAL_FEED_MOCK, hasMore: false, isLoading: false });
        }
      });
    }
  }, [isAuthenticated, authLoading]);

  if (authLoading) return null;

  return (
    <AppShell breadcrumb="feed --local">
      <div className="max-w-2xl mx-auto">
        <FeedList emptyTitle="$ feed --local" emptySubtitle="> 0 posts found." emptyBody={'No posts from people you follow.\nFollow someone to see their posts here.'} />
      </div>
    </AppShell>
  );
}
