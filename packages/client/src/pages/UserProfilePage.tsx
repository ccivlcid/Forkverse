import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.js';
import PostCard from '../components/post/PostCard.js';
import { useAuthStore } from '../stores/authStore.js';
import { api, ApiError } from '../api/client.js';
import { toastError, toastSuccess } from '../stores/toastStore.js';
import ContributionGraph from '../components/profile/ContributionGraph.js';
import GithubFollowSync from '../components/profile/GithubFollowSync.js';
import ProfileTab from '../components/settings/ProfileTab.js';
import LanguageTab from '../components/settings/LanguageTab.js';
import CliTab from '../components/settings/CliTab.js';
import ApiTab from '../components/settings/ApiTab.js';
import OAuthTab from '../components/settings/OAuthTab.js';
import ChannelTab from '../components/settings/ChannelTab.js';
import GithubTab from '../components/settings/GithubTab.js';
import type { UserProfile, Post, ApiResponse } from '@clitoris/shared';

type Tab = 'posts' | 'starred' | 'repos' | 'profile' | 'language' | 'cli' | 'api' | 'oauth' | 'channel' | 'github';

const BASE_TABS = ['posts', 'starred', 'repos'] as const;
/** Shown only via ?tab=… (sidebar / header / bookmarks) — no separate “settings” tab row */
const SELF_TABS = ['profile', 'language', 'cli', 'api', 'oauth', 'channel', 'github'] as const;
const ALL_TABS: Tab[] = [...BASE_TABS, ...SELF_TABS];

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

function SkeletonProfile() {
  return (
    <div className="border border-[var(--border)] bg-[var(--bg-elevated)] p-6 animate-pulse space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-[var(--border)] rounded-sm shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 bg-[var(--border)] rounded" />
          <div className="h-3 w-24 bg-[var(--border)] rounded" />
          <div className="h-3 w-48 bg-[var(--border)] rounded" />
        </div>
      </div>
      <div className="h-3 w-full bg-[var(--border)] rounded" />
      <div className="h-3 w-3/4 bg-[var(--border)] rounded" />
    </div>
  );
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

  const rawTab = searchParams.get('tab') as Tab | null;
  const validTabs: Tab[] = isSelf ? ALL_TABS : [...BASE_TABS];
  const tab: Tab = rawTab && validTabs.includes(rawTab) ? rawTab : 'posts';

  const handleTabChange = (t: Tab) => {
    setSearchParams({ tab: t }, { replace: true });
  };

  // Guard: only /@username shape should render this page.
  useEffect(() => {
    if (!atUsername) return;
    if (!atUsername.startsWith('@')) {
      navigate('/', { replace: true });
    }
  }, [atUsername, navigate]);

  // Load profile
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

  // Load posts or starred
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
    if (tab === 'repos' || (SELF_TABS as readonly string[]).includes(tab)) return;
    setPosts([]);
    setCursor(null);
    setHasMore(true);
    void loadPosts(true, null);
  }, [username, tab, loadPosts]);

  useEffect(() => {
    if (tab !== 'repos' || !username) return;
    if (repos.length > 0) return; // already loaded
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

  if (notFound) {
    return (
      <AppShell breadcrumb={`@${username ?? ''}`}>
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-300 font-mono text-sm">
            ← back
          </button>
          <div className="border border-red-400/30 bg-[var(--bg-elevated)] p-8 text-center space-y-3">
            <p className="text-green-400 font-mono text-sm">$ user --lookup=@{username}</p>
            <p className="text-red-400 font-mono text-sm">error: 404 user not found</p>
            <p className="text-gray-400 font-sans text-sm">This user doesn&apos;t exist.</p>
            <button onClick={() => navigate('/')} className="mt-2 bg-green-400/10 text-green-400 border border-green-400/30 px-4 py-1.5 font-mono text-sm hover:bg-green-400/20">
              $ feed --global
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumb={`@${username ?? ''}`}>
      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Back */}
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-300 font-mono text-sm transition-colors">
          ← back
        </button>

        {/* Profile Header */}
        {isLoading ? (
          <SkeletonProfile />
        ) : profile ? (
          <div className="border border-[var(--border)] bg-[var(--bg-elevated)] p-6 space-y-4">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 border border-[var(--border)] bg-[var(--bg-input)] flex items-center justify-center shrink-0 text-[var(--text-faint)] font-mono text-xl">
                {profile.githubAvatarUrl ? (
                  <img src={profile.githubAvatarUrl} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  profile.username.slice(0, 2).toUpperCase()
                )}
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-amber-400 font-mono font-semibold">@{profile.username}</span>
                  {profile.domain && (
                    <span className="text-gray-500 text-xs font-mono">{profile.domain}</span>
                  )}
                </div>
                {profile.displayName && profile.displayName !== profile.username && (
                  <p className="text-gray-300 text-sm mt-0.5">{profile.displayName}</p>
                )}
                {profile.bio && (
                  <p className="text-gray-400 font-sans text-sm mt-2">{profile.bio}</p>
                )}
              </div>
            </div>

            {/* GitHub info */}
            {profile.githubUsername && (
              <div className="text-xs font-mono space-y-1.5">
                <a
                  href={profile.githubProfileUrl ?? `https://github.com/${profile.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors flex items-center gap-1.5"
                >
                  <span className="text-[var(--text-faint)]">■</span> github.com/{profile.githubUsername}
                  <span className="text-[var(--text-faint)]">({profile.githubReposCount} repos)</span>
                </a>
                {profile.topLanguages.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {profile.topLanguages.map((lang) => (
                      <span
                        key={lang}
                        className="px-2 py-0.5 border border-[var(--border)] text-[var(--text-muted)] font-mono text-[10px]"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
              <span><span className="text-gray-300">{followerCount}</span> followers</span>
              <span>·</span>
              <span><span className="text-gray-300">{profile.followingCount}</span> following</span>
              <span>·</span>
              <span><span className="text-gray-300">{profile.postCount}</span> posts</span>
            </div>

            {/* Contribution Graph */}
            {profile.githubUsername && (
              <ContributionGraph githubUsername={profile.githubUsername} />
            )}

            {/* Follow button */}
            {!isSelf && (
              <button
                onClick={handleFollow}
                className={`font-mono text-sm px-4 py-1.5 border transition-colors ${
                  isFollowing
                    ? 'text-gray-400 border-gray-600 hover:text-red-400 hover:border-red-400/50'
                    : 'bg-green-400/10 text-green-400 border-green-400/30 hover:bg-green-400/20'
                }`}
              >
                {isFollowing ? '$ unfollow @' + username : '$ follow @' + username}
              </button>
            )}
          </div>
        ) : null}

        {/* GitHub Follow Sync — 내 프로필에서만 */}
        {isSelf && <GithubFollowSync />}

        {/* Tabs */}
        <div className="flex flex-wrap border-b border-[var(--border)]">
          {BASE_TABS.map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`px-4 py-2 font-mono text-sm transition-colors ${
                tab === t
                  ? 'text-green-400 border-b-2 border-green-400 -mb-px'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              [{t}]
            </button>
          ))}
          {profile && (
            <Link
              to={`/@${username}/raw`}
              className="px-4 py-2 font-mono text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              [posts --raw]
            </Link>
          )}
        </div>

        {/* Self-only panels (CLI, API keys, …): opened via ?tab= — no duplicate “settings” tab strip */}
        {isSelf && username && (SELF_TABS as readonly string[]).includes(tab) && (
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-input)]/40 px-2 py-2">
            <Link
              to={`/@${username}`}
              className="px-3 py-1 font-mono text-xs text-gray-500 hover:text-green-400 border border-[var(--border)] hover:border-green-400/40 transition-colors"
            >
              [← posts]
            </Link>
            <span className="text-gray-600 font-mono text-xs">$ tab={tab}</span>
          </div>
        )}

        {/* Repos tab */}
        {tab === 'repos' && (
          isLoadingRepos ? (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="border border-[var(--border)] h-16 bg-[var(--bg-elevated)]" />
              ))}
            </div>
          ) : repos.length === 0 ? (
            <div className="border border-[var(--border)] bg-[var(--bg-elevated)] p-8 text-center space-y-2">
              <p className="text-green-400 font-mono text-sm">$ repos --user=@{username}</p>
              <p className="text-orange-400 font-mono text-sm">&gt; 0 repos found.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {repos.map((repo) => (
                <a
                  key={repo.name}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 hover:border-[var(--border-hover)] transition-colors group"
                >
                  <span className="text-gray-600 font-mono text-xs shrink-0 mt-0.5 group-hover:text-gray-400">■</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sky-400 font-mono text-sm font-semibold">{repo.name}</span>
                      {repo.language && (
                        <span className="text-gray-600 font-mono text-[10px]">{repo.language}</span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-gray-500 font-sans text-xs mt-0.5 truncate">{repo.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-gray-600 font-mono text-[10px]">
                    <span>★ {formatCount(repo.stars)}</span>
                    <span>◇ {formatCount(repo.forks)}</span>
                  </div>
                </a>
              ))}
            </div>
          )
        )}

        {/* Posts list */}
        {(tab === 'posts' || tab === 'starred') && (isLoadingPosts && posts.length === 0 ? (
          <div className="space-y-0">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="border border-[var(--border)] animate-pulse">
                <div className="h-24 bg-[var(--bg-elevated)]" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="border border-[var(--border)] bg-[var(--bg-elevated)] p-8 text-center space-y-2">
            <p className="text-green-400 font-mono text-sm">$ {tab} --user=@{username}</p>
            <p className="text-orange-400 font-mono text-sm">&gt; 0 {tab} found.</p>
            <p className="text-gray-400 font-sans text-sm">No {tab} yet.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {hasMore && (
              <button
                onClick={() => loadPosts(false, cursor)}
                disabled={isLoadingPosts}
                className="w-full border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-gray-500 font-mono text-xs hover:text-gray-300 disabled:opacity-40 transition-colors"
              >
                {isLoadingPosts ? '$ loading...' : '$ fetch --more'}
              </button>
            )}
          </div>
        ))}

        {/* Settings tabs (isSelf only) */}
        {tab === 'profile'  && isSelf && <ProfileTab  onToast={toastSuccess} />}
        {tab === 'language' && isSelf && <LanguageTab />}
        {tab === 'cli'      && isSelf && <CliTab      onToast={toastSuccess} />}
        {tab === 'api'      && isSelf && <ApiTab      onToast={toastSuccess} />}
        {tab === 'oauth'    && isSelf && <OAuthTab />}
        {tab === 'channel'  && isSelf && <ChannelTab />}
        {tab === 'github'   && isSelf && <GithubTab   onToast={toastSuccess} />}

      </div>
    </AppShell>
  );
}
