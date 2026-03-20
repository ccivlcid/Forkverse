import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.js';
import { useActivityStore } from '../stores/activityStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { toastSuccess } from '../stores/toastStore.js';
import type { ActivityEvent } from '@clitoris/shared';

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  if (diff < 0) return 'now';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const EVENT_ICONS: Record<string, string> = {
  github_push: '→',
  github_pr_merge: '⊕',
  github_pr_open: '⊖',
  github_release: '◆',
  github_star: '★',
  github_fork: '⑂',
  github_create: '+',
  follow: '⊹',
  star_post: '★',
  fork_post: '⑂',
  reply: '↩',
};

function eventDescription(event: ActivityEvent): string {
  const meta = event.metadata as Record<string, unknown>;
  switch (event.eventType) {
    case 'github_push':
      return `pushed ${meta.commits ?? 0} commit(s) to ${meta.repo}`;
    case 'github_pr_merge':
      return `merged PR #${meta.number} in ${meta.repo}`;
    case 'github_pr_open':
      return `opened PR #${meta.number} in ${meta.repo}`;
    case 'github_release':
      return `released ${meta.tag} for ${meta.repo}`;
    case 'github_star':
      return `starred ${meta.repo}`;
    case 'github_fork':
      return `forked ${meta.repo}`;
    case 'github_create':
      return `created ${meta.repo}`;
    case 'follow':
      return `followed ${event.targetUser?.username ?? 'a user'}`;
    case 'star_post':
      return 'starred a post';
    case 'fork_post':
      return 'forked a post';
    case 'reply':
      return 'replied to a post';
    default:
      return event.eventType;
  }
}

function ActivityItem({ event }: { event: ActivityEvent }) {
  const icon = EVENT_ICONS[event.eventType] ?? '·';
  const isGithub = event.eventType.startsWith('github_');

  return (
    <div className="flex gap-3 px-5 py-3 border-b border-[var(--border)] hover:bg-[var(--bg-surface)] transition-colors">
      <span className={`font-mono text-sm w-5 text-center shrink-0 ${isGithub ? 'text-[var(--text-muted)]' : 'text-[var(--accent-green)]'}`}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            to={`/@${event.actor.username}`}
            className="font-mono text-[12px] font-semibold text-[var(--accent-amber)] hover:text-amber-300 transition-colors"
          >
            @{event.actor.username}
          </Link>
          <span className="font-mono text-[12px] text-[var(--text-muted)]">
            {eventDescription(event)}
          </span>
        </div>
        {event.targetPost && (
          <Link
            to={`/post/${event.targetPostId}`}
            className="block font-mono text-[11px] text-[var(--text-faint)] mt-1 truncate hover:text-[var(--text-muted)] transition-colors"
          >
            {event.targetPost.messageCli}
          </Link>
        )}
        <span className="font-mono text-[10px] text-[var(--text-faint)] mt-1 block">{timeAgo(event.createdAt)}</span>
      </div>
    </div>
  );
}

export default function ActivityFeedPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { events, isLoading, hasMore, fetchActivity, fetchNextPage, syncGithub } = useActivityStore();
  const [tab, setTab] = useState<'feed' | 'global'>('feed');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchActivity(tab);
  }, [tab, isAuthenticated]);

  const handleSync = async () => {
    setSyncing(true);
    const result = await syncGithub();
    setSyncing(false);
    if (result.synced > 0) {
      toastSuccess(`Synced ${result.synced} GitHub events`);
      fetchActivity(tab);
    }
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
        <div className="flex gap-4">
          {(['feed', 'global'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-mono text-[12px] transition-colors ${
                tab === t ? 'text-[var(--accent-green)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {t === 'feed' ? '$ activity --following' : '$ activity --global'}
            </button>
          ))}
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="font-mono text-[11px] text-[var(--text-muted)] hover:text-[var(--accent-green)] disabled:opacity-50 transition-colors"
        >
          {syncing ? 'syncing...' : '↻ sync github'}
        </button>
      </div>

      {isLoading && events.length === 0 && (
        <div className="px-5 py-8 text-center font-mono text-[12px] text-[var(--text-muted)]">Loading...</div>
      )}

      {!isLoading && events.length === 0 && (
        <div className="px-5 py-8 text-center font-mono text-[12px] text-[var(--text-muted)]">
          No activity yet. Try syncing your GitHub events.
        </div>
      )}

      {events.map((event) => (
        <ActivityItem key={event.id} event={event} />
      ))}

      {hasMore && events.length > 0 && (
        <button
          onClick={fetchNextPage}
          disabled={isLoading}
          className="w-full py-3 font-mono text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors border-b border-[var(--border)]"
        >
          {isLoading ? 'loading...' : 'load more'}
        </button>
      )}
    </AppShell>
  );
}
