import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.js';
import { useActivityStore } from '../stores/activityStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { toastSuccess } from '../stores/toastStore.js';
import type { ActivityEvent } from '@forkverse/shared';

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  if (diff < 60_000) return 'now';
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

function groupLabel(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const d = Math.floor(diff / 86_400_000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7) return 'This week';
  return 'Earlier';
}

interface EventConfig {
  icon: string;
  color: string;
  bg: string;
  label: (event: ActivityEvent) => string;
}

const EVENT_CONFIG: Record<string, EventConfig> = {
  github_push:    { icon: '↑', color: 'text-[var(--accent-blue)]',   bg: 'bg-[var(--accent-blue)]/10',   label: (e) => { const m = e.metadata as any; return `pushed ${m.commits ?? 0} commit${m.commits !== 1 ? 's' : ''} to ${m.repo}`; } },
  github_pr_merge:{ icon: '⊕', color: 'text-[var(--accent-purple)]', bg: 'bg-[var(--accent-purple)]/10', label: (e) => { const m = e.metadata as any; return `merged PR #${m.number} in ${m.repo}`; } },
  github_pr_open: { icon: '⊖', color: 'text-[var(--accent-cyan)]',   bg: 'bg-[var(--accent-cyan)]/10',   label: (e) => { const m = e.metadata as any; return `opened PR #${m.number} in ${m.repo}`; } },
  github_release: { icon: '◆', color: 'text-[var(--accent-amber)]',  bg: 'bg-[var(--accent-amber)]/10',  label: (e) => { const m = e.metadata as any; return `released ${m.tag} for ${m.repo}`; } },
  github_star:    { icon: '★', color: 'text-[var(--accent-amber)]',  bg: 'bg-[var(--accent-amber)]/10',  label: (e) => { const m = e.metadata as any; return `starred ${m.repo}`; } },
  github_fork:    { icon: '⑂', color: 'text-[var(--accent-blue)]',   bg: 'bg-[var(--accent-blue)]/10',   label: (e) => { const m = e.metadata as any; return `forked ${m.repo}`; } },
  github_create:  { icon: '+', color: 'text-[var(--accent-green)]',  bg: 'bg-[var(--accent-green)]/10',  label: (e) => { const m = e.metadata as any; return `created ${m.repo}`; } },
  follow:         { icon: '→', color: 'text-[var(--accent-green)]',  bg: 'bg-[var(--accent-green)]/10',  label: (e) => `followed ${e.targetUser?.username ?? 'someone'}` },
  star_post:      { icon: '★', color: 'text-[var(--accent-amber)]',  bg: 'bg-[var(--accent-amber)]/10',  label: () => 'starred a post' },
  fork_post:      { icon: '⑂', color: 'text-[var(--accent-cyan)]',   bg: 'bg-[var(--accent-cyan)]/10',   label: () => 'forked a post' },
  reply:          { icon: '↩', color: 'text-[var(--accent-green)]',  bg: 'bg-[var(--accent-green)]/10',  label: () => 'replied to a post' },
};

const FALLBACK_CONFIG: EventConfig = {
  icon: '·', color: 'text-[var(--text-faint)]', bg: 'bg-white/5',
  label: (e) => e.eventType,
};

// --- Collapsing logic ---
interface CollapsedGroup {
  key: string;
  events: ActivityEvent[];
  // collapsed label overrides single-event label
  collapsedLabel?: string;
}

function getCollapseKey(e: ActivityEvent): string {
  const m = e.metadata as Record<string, unknown>;
  const repo = (m?.repo as string) ?? '';
  return `${e.actor.username}::${e.eventType}::${repo}`;
}

function collapseEvents(events: ActivityEvent[]): CollapsedGroup[] {
  const groups: CollapsedGroup[] = [];
  for (const event of events) {
    const key = getCollapseKey(event);
    const last = groups[groups.length - 1];
    // Only collapse GitHub events (social events should stay individual)
    const isGithub = event.eventType.startsWith('github_');
    if (isGithub && last && last.key === key) {
      last.events.push(event);
    } else {
      groups.push({ key, events: [event] });
    }
  }
  // Build collapsed labels for groups with >1 event
  return groups.map((g) => {
    if (g.events.length <= 1) return g;
    const e = g.events[0]!;
    const m = e.metadata as Record<string, unknown>;
    const repo = (m?.repo as string) ?? '';
    let collapsedLabel = `×${g.events.length} `;
    switch (e.eventType) {
      case 'github_push': {
        const total = g.events.reduce((sum, ev) => sum + (((ev.metadata as any)?.commits as number) ?? 0), 0);
        collapsedLabel += `pushed ${total} commits to ${repo}`;
        break;
      }
      case 'github_pr_open':   collapsedLabel += `opened ${g.events.length} PRs in ${repo}`; break;
      case 'github_pr_merge':  collapsedLabel += `merged ${g.events.length} PRs in ${repo}`; break;
      case 'github_star':      collapsedLabel += `starred ${g.events.length} repos`; break;
      default:                 collapsedLabel += `${e.eventType.replace('github_', '')} ×${g.events.length} in ${repo}`; break;
    }
    return { ...g, collapsedLabel };
  });
}

function Avatar({ username }: { username: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)]/50 flex items-center justify-center font-mono text-[11px] font-bold text-[var(--accent-amber)] shrink-0">
      {username[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

function ActivityItem({ group }: { group: CollapsedGroup }) {
  const event = group.events[0]!;
  const cfg = EVENT_CONFIG[event.eventType] ?? FALLBACK_CONFIG;
  const isGithub = event.eventType.startsWith('github_');
  const isCollapsed = group.events.length > 1;
  const label = isCollapsed ? group.collapsedLabel! : cfg.label(event);

  return (
    <div className="flex gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors">
      {/* Avatar */}
      <Link to={`/@${event.actor.username}`} className="shrink-0">
        <Avatar username={event.actor.username} />
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start gap-2 flex-wrap">
          {/* Event icon badge */}
          <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-mono font-bold shrink-0 mt-0.5 ${cfg.color} ${cfg.bg}`}>
            {cfg.icon}
          </span>

          <div className="flex-1 min-w-0">
            <span className="font-mono text-[13px]">
              <Link
                to={`/@${event.actor.username}`}
                className="text-[var(--accent-amber)] hover:text-amber-300 transition-colors font-semibold"
              >
                @{event.actor.username}
              </Link>
              <span className={`ml-1.5 ${isCollapsed ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
                {label}
              </span>
            </span>
          </div>

          <span className="font-mono text-[11px] text-[var(--text-faint)] shrink-0 mt-0.5 whitespace-nowrap">
            {timeAgo(event.createdAt)}
          </span>
        </div>

        {/* Target post preview (only on non-collapsed) */}
        {!isCollapsed && event.targetPost && event.targetPostId && (
          <Link
            to={`/post/${event.targetPostId}`}
            className="block ml-7 mt-1 pl-3 border-l-2 border-[var(--border)]/60 hover:border-[var(--accent-green)]/40 transition-colors"
          >
            <p className="font-mono text-[11px] text-[var(--text-faint)] truncate hover:text-[var(--text-muted)] transition-colors leading-relaxed">
              {event.targetPost.messageRaw?.slice(0, 100) ?? event.targetPost.messageCli?.slice(0, 100)}
            </p>
          </Link>
        )}

        {/* GitHub tag or collapsed count badge */}
        <div className="ml-7 flex items-center gap-2">
          {isGithub && (
            <span className="font-mono text-[10px] text-[var(--text-faint)] bg-white/[0.04] px-1.5 py-0.5 rounded">
              github
            </span>
          )}
          {isCollapsed && (
            <span className="font-mono text-[10px] text-[var(--accent-blue)]/70 bg-[var(--accent-blue)]/5 px-1.5 py-0.5 rounded">
              {group.events.length} events collapsed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonItem() {
  return (
    <div className="flex gap-3 px-4 py-3.5 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-white/[0.06] shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="flex gap-2">
          <div className="w-5 h-5 rounded bg-white/[0.06]" />
          <div className="h-4 bg-white/[0.06] rounded w-3/4" />
        </div>
        <div className="h-3 bg-white/[0.04] rounded w-1/2 ml-7" />
      </div>
    </div>
  );
}

export default function ActivityFeedPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { events, isLoading, hasMore, fetchActivity, fetchNextPage, syncGithub } = useActivityStore();
  const [tab, setTab] = useState<'feed' | 'global'>('feed');
  const [filter, setFilter] = useState<'all' | 'social' | 'github'>('all');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchActivity(tab);
  }, [tab, isAuthenticated]);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    const result = await syncGithub();
    setSyncing(false);
    if (result.synced > 0) {
      toastSuccess(`Synced ${result.synced} GitHub events`);
      fetchActivity(tab);
    }
  };

  // Filter by type
  const filtered = events.filter((e) => {
    if (filter === 'github') return e.eventType.startsWith('github_');
    if (filter === 'social') return !e.eventType.startsWith('github_');
    return true;
  });

  // Collapse consecutive same-actor+type+repo GitHub events
  const collapsed = collapseEvents(filtered);

  // Group by day
  const groups: { label: string; items: CollapsedGroup[] }[] = [];
  for (const group of collapsed) {
    const label = groupLabel(group.events[0]!.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(group);
    } else {
      groups.push({ label, items: [group] });
    }
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--bg-void)]/90 backdrop-blur-sm border-b border-[var(--border)]/40">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Tabs */}
            <div className="flex gap-1 flex-wrap">
              {([
                { id: 'feed',   label: 'following' },
                { id: 'global', label: 'everyone'  },
              ] as const).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`px-3 py-1.5 font-mono text-[12px] rounded-full transition-colors ${
                    tab === id
                      ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]'
                      : 'text-[var(--text-faint)] hover:text-[var(--text-muted)]'
                  }`}
                >
                  {label}
                </button>
              ))}
              <span className="text-[var(--border)]/60 font-mono text-[12px] self-center px-1">|</span>
              {([
                { id: 'all',    label: 'all'    },
                { id: 'social', label: 'social' },
                { id: 'github', label: 'github' },
              ] as const).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className={`px-2.5 py-1.5 font-mono text-[11px] rounded-full transition-colors ${
                    filter === id
                      ? 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]'
                      : 'text-[var(--text-faint)] hover:text-[var(--text-muted)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sync */}
            <button
              onClick={handleSync}
              disabled={syncing}
              className={`flex items-center gap-1.5 font-mono text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
                syncing
                  ? 'border-[var(--border)]/40 text-[var(--text-faint)] opacity-60'
                  : 'border-[var(--border)]/40 text-[var(--text-faint)] hover:text-[var(--accent-green)] hover:border-[var(--accent-green)]/30'
              }`}
            >
              <span className={syncing ? 'animate-spin inline-block' : ''}>↻</span>
              {syncing ? 'syncing...' : 'sync gh'}
            </button>
          </div>
        </div>

        {/* Loading skeletons */}
        {isLoading && events.length === 0 && (
          <div className="divide-y divide-[var(--border)]/20">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonItem key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
            <span className="text-[var(--text-faint)] font-mono text-2xl">●</span>
            <p className="font-mono text-[13px] text-[var(--text-muted)]">
              {tab === 'feed' ? 'No activity from people you follow.' : 'No global activity yet.'}
            </p>
            {tab === 'feed' && (
              <p className="font-mono text-[11px] text-[var(--text-faint)]">
                Follow people or sync your GitHub to get started.
              </p>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="mt-2 font-mono text-[12px] text-[var(--accent-green)] border border-[var(--accent-green)]/30 px-4 py-2 hover:bg-[var(--accent-green)]/10 transition-colors disabled:opacity-50"
            >
              {syncing ? 'syncing...' : '↻ sync github'}
            </button>
          </div>
        )}

        {/* Grouped events */}
        {groups.map(({ label, items }) => (
          <div key={label}>
            {/* Day header */}
            <div className="px-4 py-2 sticky top-[52px] z-[5] bg-[var(--bg-void)]/80 backdrop-blur-sm">
              <span className="font-mono text-[10px] text-[var(--text-faint)] uppercase tracking-widest">
                {label}
              </span>
            </div>
            {/* Items */}
            <div className="divide-y divide-[var(--border)]/20">
              {items.map((group) => (
                <ActivityItem key={group.events[0]!.id} group={group} />
              ))}
            </div>
          </div>
        ))}

        {/* Load more */}
        {hasMore && events.length > 0 && (
          <div className="px-4 py-6 flex justify-center">
            <button
              onClick={fetchNextPage}
              disabled={isLoading}
              className="font-mono text-[12px] text-[var(--text-faint)] hover:text-[var(--text-muted)] border border-[var(--border)]/40 px-5 py-2 hover:border-[var(--border-hover)] transition-colors disabled:opacity-40"
            >
              {isLoading ? 'loading...' : '+ load more'}
            </button>
          </div>
        )}

      </div>
    </AppShell>
  );
}
