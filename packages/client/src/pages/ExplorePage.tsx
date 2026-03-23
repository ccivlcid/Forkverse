import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.js';
import { useUiStore } from '../stores/uiStore.js';
import { api } from '../api/client.js';
import { toastError } from '../stores/toastStore.js';
import type { ApiResponse } from '@forkverse/shared';

// ── Types ──────────────────────────────────────────────────────────────────

interface SearchRepo {
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
  updatedAt?: string;
  openIssues?: number;
  license?: string | null;
}

interface SearchUser {
  username: string;
  avatarUrl: string;
  url: string;
  type: string;
}

type Tab = 'repositories' | 'users';
type SortOption = 'stars' | 'forks' | 'updated';
type SinceOption = 'daily' | 'weekly' | 'monthly';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}m`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

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
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5',
  Go: '#00ADD8', Rust: '#dea584', Ruby: '#701516', Java: '#b07219',
  'C++': '#f34b7d', C: '#555555', Shell: '#89e051', Swift: '#F05138',
  Kotlin: '#A97BFF', Dart: '#00B4AB', PHP: '#4F5D95', Scala: '#c22d40',
  Zig: '#ec915c', Lua: '#000080', Haskell: '#5e5086', Elixir: '#6e4a7e',
  Vue: '#41b883', Svelte: '#ff3e00',
};

const POPULAR_LANGUAGES = [
  'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java',
  'C++', 'C', 'Ruby', 'Swift', 'Kotlin', 'Shell', 'PHP',
];

// ── Repo Card ──────────────────────────────────────────────────────────────

function RepoCard({ repo }: { repo: SearchRepo }) {
  return (
    <article className="border-b border-[var(--border)] py-5 first:pt-0 last:border-b-0">
      <div className="flex items-start gap-3">
        <img
          src={repo.ownerAvatar}
          alt={repo.owner}
          className="w-5 h-5 rounded-sm shrink-0 mt-1"
        />
        <div className="flex-1 min-w-0">
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[14px] text-[var(--accent-cyan)] hover:underline"
          >
            <span className="text-[var(--text-muted)]">{repo.owner}/</span>
            <span className="font-semibold">{repo.name}</span>
          </a>

          {repo.description && (
            <p className="mt-1.5 text-[13px] text-[var(--text-muted)] leading-relaxed line-clamp-2">
              {repo.description}
            </p>
          )}

          {repo.topics.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {repo.topics.map((t) => (
                <span
                  key={t}
                  className="font-mono text-[10px] text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/[0.08] border border-[var(--accent-cyan)]/20 px-1.5 py-0.5 hover:bg-[var(--accent-cyan)]/[0.15] transition-colors"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-2.5 flex items-center gap-4 flex-wrap text-[11px] font-mono text-[var(--text-faint)]">
            {repo.language && (
              <span className="flex items-center gap-1">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: LANG_COLORS[repo.language] ?? 'var(--text-faint)' }}
                />
                {repo.language}
              </span>
            )}
            <span className="flex items-center gap-1">★ {formatCount(repo.stars)}</span>
            <span className="flex items-center gap-1">⑂ {formatCount(repo.forks)}</span>
            {repo.license && (
              <span>{repo.license}</span>
            )}
            <span>updated {relativeTime(repo.updatedAt ?? repo.pushedAt)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

// ── User Card ──────────────────────────────────────────────────────────────

function UserCard({ user }: { user: SearchUser }) {
  return (
    <article className="border-b border-[var(--border)] py-4 first:pt-0 last:border-b-0">
      <div className="flex items-center gap-3">
        <img
          src={user.avatarUrl}
          alt={user.username}
          className="w-8 h-8 rounded-sm shrink-0"
        />
        <div className="flex-1 min-w-0">
          <a
            href={user.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[13px] text-[var(--accent-cyan)] hover:underline"
          >
            @{user.username}
          </a>
          <span className="ml-2 font-mono text-[10px] text-[var(--text-faint)] border border-[var(--border)] px-1">
            {user.type}
          </span>
        </div>
      </div>
    </article>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useUiStore();

  const query = searchParams.get('q') ?? '';
  const tab = (searchParams.get('tab') as Tab) ?? 'repositories';
  const sort = (searchParams.get('sort') as SortOption) ?? 'stars';
  const language = searchParams.get('language') ?? '';
  const since = (searchParams.get('since') as SinceOption) ?? 'daily';

  const [repos, setRepos] = useState<SearchRepo[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [trendingRepos, setTrendingRepos] = useState<SearchRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [inputValue, setInputValue] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSearchMode = query.trim().length > 0;

  // Load trending on mount & when language/since changes
  useEffect(() => {
    if (isSearchMode) return;
    setTrendingLoading(true);
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    params.set('since', since);

    api.get<ApiResponse<SearchRepo[]>>(`/github/trending?${params}`)
      .then((res) => setTrendingRepos(res.data))
      .catch(() => toastError(t('explore.fetchError')))
      .finally(() => setTrendingLoading(false));
  }, [isSearchMode, language, since, t]);

  // Search when query/tab/sort/language changes
  useEffect(() => {
    if (!isSearchMode) return;
    setLoading(true);

    if (tab === 'repositories') {
      const langQuery = language ? `${query} language:${language}` : query;
      api.get<ApiResponse<SearchRepo[]>>(
        `/github/search/repositories?q=${encodeURIComponent(langQuery)}&sort=${sort}&per_page=25`
      )
        .then((res) => {
          setRepos(res.data);
          setTotalCount((res as any).meta?.total ?? res.data.length);
        })
        .catch(() => toastError(t('explore.searchError')))
        .finally(() => setLoading(false));
    } else {
      api.get<ApiResponse<SearchUser[]>>(
        `/github/search/users?q=${encodeURIComponent(query)}&per_page=25`
      )
        .then((res) => {
          setUsers(res.data);
          setTotalCount((res as any).meta?.total ?? res.data.length);
        })
        .catch(() => toastError(t('explore.searchError')))
        .finally(() => setLoading(false));
    }
  }, [query, tab, sort, language, isSearchMode, t]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (inputValue.trim()) {
      params.set('q', inputValue.trim());
      if (!params.get('tab')) params.set('tab', 'repositories');
    } else {
      params.delete('q');
    }
    setSearchParams(params);
  }, [inputValue, searchParams, setSearchParams]);

  const setParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const clearSearch = useCallback(() => {
    setInputValue('');
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  // Focus search on / key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement).tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;
      if (e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <AppShell breadcrumb="explore">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 w-full">

        {/* Header */}
        <div className="mb-5">
          <h1 className="font-mono text-[14px] text-[var(--accent-green)]">
            <span className="text-[var(--accent-amber)]">$</span> gh search {isSearchMode ? `"${query}"` : '--trending'}
          </h1>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mb-5">
          <div className="flex items-center border border-[var(--border)] bg-[var(--bg-input)] focus-within:border-[var(--accent-cyan)]/50 transition-colors">
            <span className="pl-3 font-mono text-[12px] text-[var(--text-faint)] select-none shrink-0">
              $
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('explore.searchPlaceholder')}
              className="flex-1 bg-transparent px-2 py-2.5 font-mono text-[13px] text-[var(--text)] placeholder:text-[var(--text-faint)] outline-none"
            />
            {inputValue && (
              <button
                type="button"
                onClick={clearSearch}
                className="px-2 font-mono text-[11px] text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors"
              >
                ×
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2.5 font-mono text-[12px] text-[var(--bg)] bg-[var(--accent-green)] hover:bg-[var(--accent-green)]/90 transition-colors shrink-0"
            >
              {t('explore.search')}
            </button>
          </div>
          <p className="mt-1.5 font-mono text-[10px] text-[var(--text-faint)]">
            {t('explore.searchHint')}
          </p>
        </form>

        {/* Search mode: tabs + filters + results */}
        {isSearchMode ? (
          <>
            {/* Tabs */}
            <div className="flex border-b border-[var(--border)] mb-4" role="tablist">
              {(['repositories', 'users'] as Tab[]).map((tabId) => (
                <button
                  key={tabId}
                  role="tab"
                  aria-selected={tab === tabId}
                  onClick={() => setParam('tab', tabId)}
                  className={`font-mono text-[12px] px-4 py-2 border-b-2 transition-colors -mb-px ${
                    tab === tabId
                      ? 'text-[var(--accent-green)] border-[var(--accent-green)]'
                      : 'text-[var(--text-faint)] border-transparent hover:text-[var(--text-muted)]'
                  }`}
                >
                  [{tabId}]
                </button>
              ))}
              {!loading && (
                <span className="ml-auto self-center font-mono text-[10px] text-[var(--text-faint)]">
                  {formatCount(totalCount)} {tab === 'repositories' ? 'repos' : 'users'}
                </span>
              )}
            </div>

            {/* Filters (repos only) */}
            {tab === 'repositories' && (
              <div className="flex flex-wrap gap-3 mb-4">
                {/* Sort */}
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-[var(--text-faint)]">--sort=</span>
                  {(['stars', 'forks', 'updated'] as SortOption[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setParam('sort', s)}
                      className={`font-mono text-[11px] px-2 py-0.5 border transition-colors ${
                        sort === s
                          ? 'border-[var(--accent-green)] text-[var(--accent-green)] bg-[var(--accent-green)]/[0.06]'
                          : 'border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Language filter */}
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-[var(--text-faint)]">--lang=</span>
                  <select
                    value={language}
                    onChange={(e) => setParam('language', e.target.value)}
                    className="font-mono text-[11px] bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-muted)] px-2 py-0.5 outline-none focus:border-[var(--accent-cyan)]/50"
                  >
                    <option value="">any</option>
                    {POPULAR_LANGUAGES.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Results */}
            {loading ? (
              <div className="py-16 text-center font-mono text-[12px] text-[var(--text-faint)]">
                <span className="animate-pulse">$ searching...</span>
              </div>
            ) : tab === 'repositories' ? (
              repos.length > 0 ? (
                <div className="border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-4">
                  {repos.map((r) => <RepoCard key={r.fullName} repo={r} />)}
                </div>
              ) : (
                <EmptyState message={`$ gh search repos "${query}"  # 0 results`} />
              )
            ) : (
              users.length > 0 ? (
                <div className="border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-4">
                  {users.map((u) => <UserCard key={u.username} user={u} />)}
                </div>
              ) : (
                <EmptyState message={`$ gh search users "${query}"  # 0 results`} />
              )
            )}
          </>
        ) : (
          /* Trending mode */
          <>
            {/* Trending filters */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] text-[var(--text-faint)]">--since=</span>
                {(['daily', 'weekly', 'monthly'] as SinceOption[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setParam('since', s)}
                    className={`font-mono text-[11px] px-2 py-0.5 border transition-colors ${
                      since === s
                        ? 'border-[var(--accent-green)] text-[var(--accent-green)] bg-[var(--accent-green)]/[0.06]'
                        : 'border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] text-[var(--text-faint)]">--lang=</span>
                <select
                  value={language}
                  onChange={(e) => setParam('language', e.target.value)}
                  className="font-mono text-[11px] bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-muted)] px-2 py-0.5 outline-none focus:border-[var(--accent-cyan)]/50"
                >
                  <option value="">any</option>
                  {POPULAR_LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Trending header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-[12px] text-[var(--text-muted)]">
                {t('explore.trendingTitle')}
              </span>
              {language && (
                <span className="font-mono text-[10px] text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30 px-1.5 py-0.5">
                  {language}
                </span>
              )}
            </div>

            {/* Trending repos */}
            {trendingLoading ? (
              <div className="py-16 text-center font-mono text-[12px] text-[var(--text-faint)]">
                <span className="animate-pulse">$ fetching trending...</span>
              </div>
            ) : trendingRepos.length > 0 ? (
              <div className="border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-4">
                {trendingRepos.map((r, i) => (
                  <article key={r.fullName} className="border-b border-[var(--border)] py-4 first:pt-0 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <span className="font-mono text-[12px] text-[var(--text-faint)] w-5 text-right shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <img
                        src={r.ownerAvatar}
                        alt={r.owner}
                        className="w-5 h-5 rounded-sm shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[14px] text-[var(--accent-cyan)] hover:underline"
                        >
                          <span className="text-[var(--text-muted)]">{r.owner}/</span>
                          <span className="font-semibold">{r.name}</span>
                        </a>

                        {r.description && (
                          <p className="mt-1.5 text-[13px] text-[var(--text-muted)] leading-relaxed line-clamp-2">
                            {r.description}
                          </p>
                        )}

                        {r.topics.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {r.topics.map((topic) => (
                              <span
                                key={topic}
                                className="font-mono text-[10px] text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/[0.08] border border-[var(--accent-cyan)]/20 px-1.5 py-0.5"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-2.5 flex items-center gap-4 flex-wrap text-[11px] font-mono text-[var(--text-faint)]">
                          {r.language && (
                            <span className="flex items-center gap-1">
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: LANG_COLORS[r.language] ?? 'var(--text-faint)' }}
                              />
                              {r.language}
                            </span>
                          )}
                          <span>★ {formatCount(r.stars)}</span>
                          <span>⑂ {formatCount(r.forks)}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState message="$ gh trending  # no results" />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center font-mono text-[12px] text-[var(--text-faint)]">
      {message}
    </div>
  );
}
