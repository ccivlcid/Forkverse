import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.js';
import PostCard from '../components/post/PostCard.js';
import { useAuthStore } from '../stores/authStore.js';
import { api, ApiError } from '../api/client.js';
import { toastError, toastSuccess } from '../stores/toastStore.js';
import ContributionGraph from '../components/profile/ContributionGraph.js';
import GithubFollowSync from '../components/profile/GithubFollowSync.js';
import ApiTab from '../components/settings/ApiTab.js';
import GithubTab from '../components/settings/GithubTab.js';
import type { UserProfile, Post, ApiResponse } from '@clitoris/shared';
import InfluenceBadge from '../components/profile/InfluenceBadge.js';
import InfluenceDetail from '../components/profile/InfluenceDetail.js';
import { useInfluenceStore } from '../stores/influenceStore.js';

type Tab = 'posts' | 'starred' | 'repos' | 'github' | 'api';

const BASE_TABS = ['posts', 'starred', 'repos'] as const;
const SELF_BASE_TABS = ['posts', 'starred', 'repos', 'github'] as const;
const SELF_TABS = ['api'] as const;
const ALL_TABS: Tab[] = [...SELF_BASE_TABS, ...SELF_TABS];

interface GithubRepo {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  url: string;
  updatedAt: string;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function UserProfilePage() {
  const { atUsername } = useParams<{ atUsername: string }>();
  const username = atUsername?.startsWith('@') ? atUsername.slice(1) : undefined;
  const navigate = useNavigate();
  const { user: me } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);

  const isSelf = me?.username === username;
  const { userScore, fetchUserScore, calculateScore, isCalculating } = useInfluenceStore();

  const rawTab = searchParams.get('tab') as Tab | null;
  const validTabs: Tab[] = isSelf ? ALL_TABS : [...BASE_TABS];
  const tab: Tab = rawTab && validTabs.includes(rawTab) ? rawTab : 'posts';
  const isSettingsTab = isSelf && (SELF_TABS as readonly string[]).includes(tab);

  const handleTabChange = (t: Tab) => {
    setSearchParams({ tab: t }, { replace: true });
  };

  useEffect(() => {
    if (!atUsername) return;
    if (!atUsername.startsWith('@')) navigate('/', { replace: true });
  }, [atUsername, navigate]);

  useEffect(() => {
    if (!username) return;
    setIsLoading(true);
    setNotFound(false);
    api.get<ApiResponse<UserProfile>>(`/users/@${username}`)
      .then((res) => {
        setProfile(res.data);
        setIsFollowing(res.data.isFollowing);
        setFollowerCount(res.data.followerCount);
        setIsLoading(false);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        setIsLoading(false);
      });
  }, [username]);

  useEffect(() => {
    if (username) fetchUserScore(username);
  }, [username, fetchUserScore]);

  const loadPosts = useCallback(async (reset = false, currentCursor: string | null = null) => {
    if (!username) return;
    setIsLoadingPosts(true);
    const c = reset ? undefined : currentCursor ?? undefined;
    const endpoint = tab === 'starred' ? 'starred' : 'posts';
    const path = `/users/@${username}/${endpoint}${c ? `?cursor=${encodeURIComponent(c)}` : ''}`;
    try {
      const res = await api.get<ApiResponse<Post[]>>(path);
      setPosts((prev) => reset ? res.data : [...prev, ...res.data]);
      setCursor(res.meta?.cursor ?? null);
      setHasMore(res.meta?.hasMore ?? false);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [username, tab]);

  useEffect(() => {
    if (tab === 'repos' || tab === 'github' || (SELF_TABS as readonly string[]).includes(tab)) return;
    setPosts([]);
    setCursor(null);
    setHasMore(true);
    void loadPosts(true, null);
  }, [username, tab, loadPosts]);

  useEffect(() => {
    if (tab !== 'repos' || !username) return;
    if (repos.length > 0) return;
    setIsLoadingRepos(true);
    api.get<ApiResponse<GithubRepo[]>>(`/users/@${username}/repos`)
      .then((res) => setRepos(res.data))
      .catch(() => toastError('Failed to load repositories'))
      .finally(() => setIsLoadingRepos(false));
  }, [tab, username]);

  const followBusy = useRef(false);
  const handleFollow = async () => {
    if (!me) { navigate('/login'); return; }
    if (followBusy.current) return;
    followBusy.current = true;
    const next = !isFollowing;
    setIsFollowing(next);
    setFollowerCount((c) => c + (next ? 1 : -1));
    try {
      await api.post(`/users/@${username}/follow`);
    } catch {
      setIsFollowing(!next);
      setFollowerCount((c) => c + (next ? -1 : 1));
      toastError('Failed to update follow status');
    } finally {
      followBusy.current = false;
    }
  };

  // ── 404 ──
  if (notFound) {
    return (
      <AppShell>
        <div className="p-6 space-y-6">
          <button onClick={() => navigate(-1)} className="text-[var(--text-faint)] hover:text-[var(--text-muted)] font-mono text-xs">← back</button>
          <div className="py-16 text-center space-y-3">
            <p className="text-[var(--accent-green)] font-mono text-sm">$ user --lookup=@{username}</p>
            <p className="text-[var(--accent-red)] font-mono text-sm">error: 404 user not found</p>
            <button onClick={() => navigate('/')} className="mt-4 text-[var(--accent-green)] font-mono text-sm hover:text-green-300">$ cd /</button>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── API Settings (separate view) ──
  if (isSettingsTab && username) {
    return (
      <AppShell>
        <div className="p-6 space-y-4">
          <button
            onClick={() => setSearchParams({}, { replace: true })}
            className="text-[var(--text-faint)] hover:text-[var(--text-muted)] font-mono text-xs"
          >
            ← @{username}
          </button>
          <ApiTab onToast={toastSuccess} />
        </div>
      </AppShell>
    );
  }

  // ── Profile ──
  return (
    <AppShell>
      <div className="p-6 space-y-6">

        {/* Back */}
        <button onClick={() => navigate(-1)} className="text-[var(--text-faint)] hover:text-[var(--text-muted)] font-mono text-xs">← back</button>

        {isLoading ? (
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-[var(--border)]" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-36 bg-[var(--border)] rounded" />
                <div className="h-3 w-24 bg-[var(--border)] rounded" />
              </div>
            </div>
            <div className="h-3 w-full bg-[var(--border)] rounded" />
          </div>
        ) : profile ? (
          <>
            {/* ── Hero: Avatar + Identity ── */}
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--border)] shrink-0">
                {profile.githubAvatarUrl ? (
                  <img src={profile.githubAvatarUrl} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[var(--bg-elevated)] flex items-center justify-center font-mono text-2xl text-[var(--text-faint)]">
                    {profile.username[0]?.toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name + Actions */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="font-mono text-xl font-bold text-[var(--text)]">@{profile.username}</h1>
                  {userScore && (
                    <InfluenceBadge tier={userScore.tier} tierLabel={userScore.tierLabel} score={userScore.score} size="md" />
                  )}
                </div>

                {profile.displayName && profile.displayName !== profile.username && (
                  <p className="text-[var(--text-muted)] text-sm mt-0.5">{profile.displayName}</p>
                )}

                {/* Follow button — right under the name, prominent */}
                {!isSelf && (
                  <button
                    onClick={handleFollow}
                    className={`mt-3 font-mono text-xs px-4 py-1.5 transition-all duration-150 ${
                      isFollowing
                        ? 'text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--accent-red)] hover:border-[var(--accent-red)]/30'
                        : 'text-[var(--accent-green)] border border-[var(--accent-green)]/30 bg-[var(--accent-green)]/[0.06] hover:bg-[var(--accent-green)]/[0.12]'
                    }`}
                  >
                    {isFollowing ? 'following' : 'follow'}
                  </button>
                )}
              </div>
            </div>

            {/* ── Bio ── */}
            {profile.bio && (
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">{profile.bio}</p>
            )}

            {/* ── Stats (minimal, inline) ── */}
            <div className="flex items-center gap-5 font-mono text-xs">
              <span className="text-[var(--text)]">{formatCount(followerCount)}<span className="text-[var(--text-faint)] ml-1">followers</span></span>
              <span className="text-[var(--text)]">{formatCount(profile.followingCount)}<span className="text-[var(--text-faint)] ml-1">following</span></span>
              <span className="text-[var(--text)]">{formatCount(profile.postCount)}<span className="text-[var(--text-faint)] ml-1">posts</span></span>
            </div>

            {/* ── GitHub link + Languages (one line) ── */}
            {profile.githubUsername && (
              <div className="flex items-center gap-3 flex-wrap">
                <a
                  href={profile.githubProfileUrl ?? `https://github.com/${profile.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-muted)] hover:text-[var(--text)] font-mono text-xs transition-colors"
                >
                  github.com/{profile.githubUsername}
                </a>
                {profile.topLanguages.length > 0 && (
                  <div className="flex gap-1.5">
                    {profile.topLanguages.map((lang) => (
                      <span key={lang} className="text-[var(--text-faint)] font-mono text-[10px]">{lang}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Divider ── */}
            <div className="border-t border-[var(--border)]/40" />

            {/* ── Contribution Graph ── */}
            {profile.githubUsername && (
              <ContributionGraph githubUsername={profile.githubUsername} />
            )}

            {/* ── Influence Score ── */}
            {userScore && (
              <InfluenceDetail
                score={userScore}
                isOwnProfile={isSelf}
                onRecalculate={calculateScore}
                isCalculating={isCalculating}
              />
            )}
            {!userScore && isSelf && (
              <button
                onClick={calculateScore}
                disabled={isCalculating}
                className="w-full py-3 font-mono text-xs text-[var(--text-faint)] hover:text-[var(--accent-green)] transition-colors disabled:opacity-40"
              >
                {isCalculating ? 'calculating...' : '$ influence --calculate'}
              </button>
            )}

            {/* ── GitHub Follow Sync (self only) ── */}
            {isSelf && <GithubFollowSync />}
          </>
        ) : null}

        {/* ── Tabs ── */}
        {!isLoading && profile && (
          <>
            <nav className="flex gap-0 border-b border-[var(--border)]/40">
              {(isSelf ? SELF_BASE_TABS : BASE_TABS).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTabChange(t)}
                  className={`px-4 py-2.5 font-mono text-xs transition-colors relative ${
                    tab === t
                      ? 'text-[var(--text)]'
                      : 'text-[var(--text-faint)] hover:text-[var(--text-muted)]'
                  }`}
                >
                  {t}
                  {tab === t && (
                    <span className="absolute bottom-0 left-0 right-0 h-px bg-[var(--accent-green)]" />
                  )}
                </button>
              ))}
            </nav>

            {/* ── Tab Content ── */}

            {/* Repos */}
            {tab === 'repos' && (
              isLoadingRepos ? (
                <div className="space-y-2 animate-pulse">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="h-16 bg-[var(--bg-elevated)] border border-[var(--border)]/30 rounded-sm" />
                  ))}
                </div>
              ) : repos.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-[var(--text-faint)] font-mono text-xs">no repositories</p>
                </div>
              ) : (
                <div className="space-y-px">
                  {repos.map((repo) => (
                    <a
                      key={repo.name}
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-surface)]/60 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--accent-blue)] font-mono text-sm">{repo.name}</span>
                          {repo.language && (
                            <span className="text-[var(--text-faint)] font-mono text-[10px]">{repo.language}</span>
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-[var(--text-faint)] text-xs mt-0.5 truncate">{repo.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-[var(--text-faint)] font-mono text-[10px]">
                        <span>★ {formatCount(repo.stars)}</span>
                        <span>◇ {formatCount(repo.forks)}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )
            )}

            {/* Posts / Starred */}
            {(tab === 'posts' || tab === 'starred') && (
              isLoadingPosts && posts.length === 0 ? (
                <div className="space-y-0 animate-pulse">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="h-32 border-b border-[var(--border)]/30 bg-[var(--bg-surface)]/30" />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-[var(--text-faint)] font-mono text-xs">no {tab}</p>
                </div>
              ) : (
                <div>
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                  {hasMore && (
                    <button
                      onClick={() => loadPosts(false, cursor)}
                      disabled={isLoadingPosts}
                      className="w-full py-4 font-mono text-xs text-[var(--text-faint)] hover:text-[var(--text-muted)] disabled:opacity-40 transition-colors"
                    >
                      {isLoadingPosts ? 'loading...' : 'load more'}
                    </button>
                  )}
                </div>
              )
            )}

            {/* GitHub (self only) */}
            {tab === 'github' && isSelf && <GithubTab onToast={toastSuccess} />}
          </>
        )}

      </div>
    </AppShell>
  );
}
