import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.js';
import { useAuthStore } from '../stores/authStore.js';
import { api } from '../api/client.js';
import { toastError } from '../stores/toastStore.js';
import type { ApiResponse } from '@forkverse/shared';

// ── Types ────────────────────────────────────────────────────────────────────

interface StarredRepo {
  starredAt: string;
  repo: {
    fullName: string;
    name: string;
    owner: string;
    ownerAvatar: string;
    description: string | null;
    stars: number;
    forks: number;
    language: string | null;
    url: string;
    topics: string[];
    pushedAt: string;
  };
}

interface GhNotification {
  id: string;
  reason: string;
  unread: boolean;
  updatedAt: string;
  title: string;
  type: string;
  repoFullName: string;
  repoUrl: string;
  url: string;
}

interface GhIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  type: 'issue' | 'pr';
  url: string;
  repoFullName: string;
  labels: Array<{ name: string; color: string }>;
  author: string;
  createdAt: string;
  updatedAt: string;
}

type Tab = 'stars' | 'notifications' | 'issues';

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return 'now';
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Shell: '#89e051',
};

function langDot(lang: string | null) {
  if (!lang) return null;
  const color = LANG_COLORS[lang] ?? 'var(--text-muted)';
  return <span style={{ color }} className="text-[10px]">● {lang}</span>;
}

const REASON_LABEL: Record<string, string> = {
  assign: 'assigned',
  mention: 'mentioned',
  review_requested: 'review-req',
  subscribed: 'watching',
  author: 'author',
  comment: 'comment',
  state_change: 'state-change',
  team_mention: 'team-mention',
};

// ── Stars Tab ────────────────────────────────────────────────────────────────

function StarsTab() {
  const [items, setItems] = useState<StarredRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<ApiResponse<StarredRepo[]>>('/github/stars')
      .then((res) => setItems(res.data))
      .catch((err) => {
        const msg = err?.response?.data?.error?.message ?? 'Failed to load stars';
        setError(msg);
        toastError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBox message={error} />;
  if (items.length === 0) return <EmptyBox message="$ git star --list  # no results" />;

  return (
    <div className="flex flex-col gap-3">
      {items.map(({ starredAt, repo }) => (
        <article
          key={repo.fullName}
          tabIndex={0}
          className="border border-[var(--border)] bg-[var(--bg-surface)] p-4 hover:border-[var(--border-hover)] transition-colors focus-visible:ring-1 focus-visible:ring-[var(--accent-green)]/40 outline-none"
        >
          <div className="flex items-start gap-3">
            <img
              src={repo.ownerAvatar}
              alt={repo.owner}
              className="w-8 h-8 rounded-sm shrink-0 mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[13px] text-[var(--accent-cyan)] hover:underline"
                >
                  {repo.fullName}
                </a>
                {repo.topics.map((t) => (
                  <span key={t} className="font-mono text-[10px] text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30 px-1.5 py-0.5">
                    #{t}
                  </span>
                ))}
              </div>
              {repo.description && (
                <p className="mt-1 text-[12px] text-[var(--text-muted)] leading-relaxed truncate">
                  {repo.description}
                </p>
              )}
              <div className="mt-2 flex items-center gap-4 text-[11px] font-mono text-[var(--text-faint)]">
                {langDot(repo.language)}
                <span>★ {repo.stars.toLocaleString()}</span>
                <span>⑂ {repo.forks.toLocaleString()}</span>
                <span className="ml-auto text-[10px]">starred {relativeTime(starredAt)}</span>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

// ── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab({ onUnreadCount }: { onUnreadCount: (n: number) => void }) {
  const [items, setItems] = useState<GhNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState<Set<string>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    api.get<ApiResponse<GhNotification[]>>('/github/notifications')
      .then((res) => {
        setItems(res.data);
        onUnreadCount(res.data.filter((n) => n.unread).length);
      })
      .catch((err) => {
        const msg = err?.response?.data?.error?.message ?? 'Failed to load notifications';
        setError(msg);
        toastError(msg);
      })
      .finally(() => setLoading(false));
  }, [onUnreadCount]);

  const markRead = useCallback(async (id: string) => {
    setMarking((prev) => new Set(prev).add(id));
    try {
      await api.post(`/github/notifications/${id}/mark-read`, {});
      setItems((prev) => {
        const next = prev.map((n) => n.id === id ? { ...n, unread: false } : n);
        onUnreadCount(next.filter((n) => n.unread).length);
        return next;
      });
    } catch {
      toastError('Failed to mark notification as read');
    } finally {
      setMarking((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
  }, [onUnreadCount]);

  const markAllRead = useCallback(async () => {
    const unreadIds = items.filter((n) => n.unread).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setMarkingAll(true);
    const results = await Promise.allSettled(unreadIds.map((id) => markRead(id)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) toastError(`Failed to mark ${failed} notification(s) as read`);
    setMarkingAll(false);
  }, [items, markRead]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBox message={error} />;

  const unreadCount = items.filter((n) => n.unread).length;

  return (
    <div className="flex flex-col gap-2">
      {unreadCount > 0 && (
        <div className="flex justify-end mb-1">
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="font-mono text-[11px] text-[var(--text-muted)] hover:text-[var(--accent-green)] transition-colors border border-[var(--border)] hover:border-[var(--accent-green)]/40 px-3 py-1 disabled:opacity-40"
          >
            {markingAll ? '$ marking...' : `$ mark-read --all (${unreadCount})`}
          </button>
        </div>
      )}
      {items.length === 0 && <EmptyBox message="$ gh notifications --all  # inbox zero" />}
      {items.map((n) => (
        <article
          key={n.id}
          tabIndex={0}
          className={`border p-3 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-green)]/40 ${
            n.unread
              ? 'border-[var(--border-hover)] bg-[var(--bg-input)] hover:border-[var(--accent-green)]/40'
              : 'border-[var(--border)] bg-[var(--bg-surface)] opacity-60 hover:opacity-80'
          }`}
        >
          <div className="flex items-start gap-2">
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.unread ? 'bg-[var(--accent-green)]' : 'bg-transparent'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] text-[var(--text-faint)] border border-[var(--border)] px-1">
                  {n.type}
                </span>
                <span className="font-mono text-[10px] text-[var(--accent-amber)]">
                  {REASON_LABEL[n.reason] ?? n.reason}
                </span>
                <span className="font-mono text-[10px] text-[var(--accent-cyan)]">{n.repoFullName}</span>
              </div>
              <p className="mt-1 font-mono text-[12px] text-[var(--text)] leading-snug">
                {n.title}
              </p>
              <div className="mt-1.5 flex items-center gap-3">
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] text-[var(--accent-cyan)] hover:underline"
                >
                  → open
                </a>
                {n.unread && (
                  <button
                    onClick={() => markRead(n.id)}
                    disabled={marking.has(n.id)}
                    className="font-mono text-[10px] text-[var(--text-faint)] hover:text-[var(--accent-green)] transition-colors disabled:opacity-40"
                  >
                    {marking.has(n.id) ? '...' : '✓ mark read'}
                  </button>
                )}
                <span className="ml-auto font-mono text-[10px] text-[var(--text-faint)]">
                  {relativeTime(n.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

// ── Issues Tab ───────────────────────────────────────────────────────────────

const FILTER_OPTIONS = ['assigned', 'created', 'mentioned'] as const;
type FilterOption = typeof FILTER_OPTIONS[number];

function IssuesTab() {
  const [items, setItems] = useState<GhIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterOption>('assigned');

  const load = useCallback((f: FilterOption) => {
    setLoading(true);
    setError(null);
    api.get<ApiResponse<GhIssue[]>>(`/github/issues?filter=${f}`)
      .then((res) => setItems(res.data))
      .catch((err) => {
        const msg = err?.response?.data?.error?.message ?? 'Failed to load issues';
        setError(msg);
        toastError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(filter); }, [filter, load]);

  return (
    <div className="flex flex-col gap-3">
      {/* Filter bar */}
      <div className="flex gap-2 font-mono text-[11px]">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 border transition-colors ${
              filter === f
                ? 'border-[var(--accent-green)] text-[var(--accent-green)] bg-[var(--accent-green)]/[0.06]'
                : 'border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:border-[var(--border-hover)]'
            }`}
          >
            --{f}
          </button>
        ))}
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && items.length === 0 && (
        <EmptyBox message={`$ gh issue list --${filter}  # no open items`} />
      )}
      {!loading && !error && items.map((item) => (
        <article
          key={item.id}
          tabIndex={0}
          className="border border-[var(--border)] bg-[var(--bg-surface)] p-3 hover:border-[var(--border-hover)] transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-green)]/40"
        >
          <div className="flex items-start gap-2">
            <span className={`font-mono text-[11px] mt-0.5 shrink-0 ${
              item.type === 'pr' ? 'text-purple-400' : 'text-[var(--accent-green)]'
            }`}>
              {item.type === 'pr' ? '⑂' : '#'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[12px] text-[var(--text)] hover:text-[var(--accent-cyan)] transition-colors"
                >
                  {item.title}
                </a>
              </div>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] text-[var(--accent-cyan)]">{item.repoFullName}</span>
                <span className="font-mono text-[10px] text-[var(--text-faint)]">#{item.number}</span>
                {item.labels.map((l) => (
                  <span
                    key={l.name}
                    className="font-mono text-[10px] px-1.5 border"
                    style={{ color: `#${l.color}`, borderColor: `#${l.color}40` }}
                  >
                    {l.name}
                  </span>
                ))}
                <span className="ml-auto font-mono text-[10px] text-[var(--text-faint)]">
                  {relativeTime(item.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

// ── Shared UI ────────────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="py-12 text-center font-mono text-[12px] text-[var(--text-faint)]">
      <span className="animate-pulse">$ fetching...</span>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="border border-red-900/40 bg-red-950/20 p-4 font-mono text-[12px] text-red-400">
      error: {message}
    </div>
  );
}

function EmptyBox({ message }: { message: string }) {
  return (
    <div className="py-12 text-center font-mono text-[12px] text-[var(--text-faint)]">{message}</div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; cmd: string }[] = [
  { id: 'stars',         label: 'stars',         cmd: 'gh star list'          },
  { id: 'notifications', label: 'notifications', cmd: 'gh notifications'       },
  { id: 'issues',        label: 'issues & PRs',  cmd: 'gh issue list --assigned' },
];

export default function GitHubFeedPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [tab, setTab] = useState<Tab>('stars');
  const [unreadCount, setUnreadCount] = useState(0);

  // Auth guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Keyboard navigation for tabs
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement).tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;

      if (e.key === '1') setTab('stars');
      else if (e.key === '2') setTab('notifications');
      else if (e.key === '3') setTab('issues');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleUnreadCount = useCallback((n: number) => {
    setUnreadCount(n);
  }, []);

  if (isLoading) return <AppShell><LoadingSpinner /></AppShell>;
  if (!isAuthenticated) return null;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-mono text-[14px] text-[var(--accent-green)]">
            <span className="text-[var(--accent-amber)]">$</span> github --connect
          </h1>
          <p className="mt-1 font-mono text-[11px] text-[var(--text-faint)]">
            {TABS.find((t) => t.id === tab)?.cmd}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] mb-5" role="tablist">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`font-mono text-[12px] px-4 py-2 border-b-2 transition-colors -mb-px ${
                tab === id
                  ? 'text-[var(--accent-green)] border-[var(--accent-green)]'
                  : 'text-[var(--text-faint)] border-transparent hover:text-[var(--text-muted)]'
              }`}
            >
              [{label}]
              {id === 'notifications' && unreadCount > 0 && (
                <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] align-middle" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div role="tabpanel">
          {tab === 'stars'         && <StarsTab />}
          {tab === 'notifications' && <NotificationsTab onUnreadCount={handleUnreadCount} />}
          {tab === 'issues'        && <IssuesTab />}
        </div>
      </div>
    </AppShell>
  );
}
