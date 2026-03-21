import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Navigate, Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.js';
import PostCard from '../components/post/PostCard.js';
import { useAuthStore } from '../stores/authStore.js';
import { api, ApiError } from '../api/client.js';
import { toastError, toastSuccess } from '../stores/toastStore.js';
import ContributionGraph from '../components/profile/ContributionGraph.js';
import GithubFollowSync from '../components/profile/GithubFollowSync.js';
import ApiTab from '../components/settings/ApiTab.js';
import type { UserProfile, Post, ApiResponse } from '@clitoris/shared';
import InfluenceBadge from '../components/profile/InfluenceBadge.js';
import InfluenceDetail from '../components/profile/InfluenceDetail.js';
import { useInfluenceStore } from '../stores/influenceStore.js';
import { useUiStore } from '../stores/uiStore.js';

type Tab = 'posts' | 'starred' | 'repos' | 'api';

const BASE_TABS = ['posts', 'starred', 'repos'] as const;
const SELF_BASE_TABS = ['posts', 'starred', 'repos'] as const;
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
  const { user: me, logout } = useAuthStore();
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
  const [showFollowList, setShowFollowList] = useState<'followers' | 'following' | null>(null);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [isSavingBio, setIsSavingBio] = useState(false);

  const isSelf = me?.username === username;
  const { t } = useUiStore();
  const { userScore, fetchUserScore, calculateScore, isCalculating } = useInfluenceStore();

  const rawTab = searchParams.get('tab') as Tab | null;
  const validTabs: Tab[] = isSelf ? ALL_TABS : [...BASE_TABS];
  const tab: Tab = rawTab && validTabs.includes(rawTab) ? rawTab : 'posts';

  const handleTabChange = (t: Tab) => {
    setSearchParams({ tab: t }, { replace: true });
  };

  // Redirect non-@ paths immediately (render-phase, no extra history entry)
  if (!atUsername || !atUsername.startsWith('@')) {
    return <Navigate to="/" replace />;
  }

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
    if (tab === 'repos' || (SELF_TABS as readonly string[]).includes(tab)) return;
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

  const handleBioSave = async () => {
    if (isSavingBio) return;
    setIsSavingBio(true);
    try {
      await api.put('/auth/me', { bio: bioDraft.trim() || null });
      setProfile((prev) => prev ? { ...prev, bio: bioDraft.trim() || null } : prev);
      setIsEditingBio(false);
      toastSuccess(t('post.updated'));
    } catch {
      toastError(t('post.saveFailed'));
    } finally {
      setIsSavingBio(false);
    }
  };

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
        <div className="flex flex-col items-center justify-center py-24 px-6">
          <p className="font-mono text-[14px] text-[var(--accent-green)] mb-2">$ user --lookup=@{username}</p>
          <p className="font-mono text-[13px] text-[var(--text-faint)] mb-6">{t('profile.notFound')}</p>
          <button
            onClick={() => navigate('/')}
            className="font-mono text-[13px] text-[var(--accent-green)] hover:text-green-300 transition-colors"
          >
            {t('profile.goHome')}
          </button>
        </div>
      </AppShell>
    );
  }


  // ── Profile ──
  return (
    <AppShell>
      <div className="flex flex-col">

        {/* ── Hero ── */}
        {isLoading ? (
          <div className="px-6 pt-8 pb-6 animate-pulse">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[var(--border)]/50" />
              <div className="space-y-3 flex-1">
                <div className="h-5 w-40 bg-[var(--border)]/50 rounded" />
                <div className="h-3 w-28 bg-[var(--border)]/30 rounded" />
              </div>
            </div>
          </div>
        ) : profile ? (
          <>
            {/* Cover — subtle gradient bar */}
            <div className="h-20 sm:h-28 bg-gradient-to-br from-[var(--accent-green)]/[0.06] via-transparent to-[var(--accent-purple)]/[0.04]" />

            <div className="px-5 sm:px-6">
              {/* Avatar — overlaps cover */}
              <div className="-mt-10 sm:-mt-12 mb-4 flex items-end gap-4 sm:gap-5">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-[3px] border-[var(--bg-void)] shrink-0 bg-[var(--bg-surface)]">
                  {profile.githubAvatarUrl ? (
                    <img src={profile.githubAvatarUrl} alt={profile.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl text-[var(--text-faint)]" style={{ fontFamily: 'var(--font-sans)' }}>
                      {profile.username[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Actions — aligned with avatar */}
                <div className="mb-1 ml-auto flex items-center gap-2">
                  {isSelf ? (
                    <button
                      onClick={async () => { await logout(); navigate('/login'); }}
                      className="font-mono text-[13px] px-4 py-2 text-[var(--text-faint)] border border-[var(--border)] hover:text-[var(--color-error)] hover:border-[var(--color-error)]/30 transition-colors"
                    >
                      {t('menu.logout')}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => navigate(`/messages/${username}`)}
                        className="font-mono text-[13px] px-4 py-2 text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--border-hover)] transition-colors"
                        title="Send message"
                      >
                        msg
                      </button>
                      <button
                        onClick={handleFollow}
                        className={`font-mono text-[13px] px-5 py-2 transition-all duration-150 ${
                          isFollowing
                            ? 'text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--accent-red)] hover:border-[var(--accent-red)]/30'
                            : 'text-[var(--bg-void)] bg-[var(--accent-green)] hover:bg-[var(--accent-green)]/80'
                        }`}
                      >
                        {isFollowing ? t('profile.followingBtn') : t('profile.followBtn')}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Identity */}
              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-mono text-[20px] sm:text-[22px] font-bold text-[var(--text)] leading-tight">
                    @{profile.username}
                  </h1>
                  {userScore && (
                    <InfluenceBadge tier={userScore.tier} tierLabel={userScore.tierLabel} score={userScore.score} size="md" />
                  )}
                </div>

                {profile.displayName && profile.displayName !== profile.username && (
                  <p className="text-[15px] text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-sans)' }}>
                    {profile.displayName}
                  </p>
                )}

                {/* Bio / Status message — inline editable for self */}
                {isSelf ? (
                  isEditingBio ? (
                    <div className="max-w-lg space-y-2">
                      <textarea
                        value={bioDraft}
                        onChange={(e) => setBioDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            void handleBioSave();
                          }
                          if (e.key === 'Escape') setIsEditingBio(false);
                        }}
                        placeholder={t('profile.bioPlaceholder')}
                        maxLength={300}
                        rows={3}
                        autoFocus
                        disabled={isSavingBio}
                        className="w-full bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--accent-green)]/30 text-[14px] text-[var(--text)] leading-relaxed px-3 py-2 resize-none outline-none transition-colors disabled:opacity-40"
                        style={{ fontFamily: 'var(--font-sans)' }}
                      />
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-[var(--text-faint)]">
                          {bioDraft.length}/300 · ctrl+enter {t('post.save')} · esc {t('post.cancel')}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setIsEditingBio(false)}
                            className="font-mono text-[11px] text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors"
                            disabled={isSavingBio}
                          >
                            {t('post.cancel')}
                          </button>
                          <button
                            onClick={() => void handleBioSave()}
                            disabled={isSavingBio}
                            className="font-mono text-[11px] text-[var(--accent-green)] hover:text-green-300 disabled:opacity-40 transition-colors"
                          >
                            {isSavingBio ? t('post.saving') : t('post.save')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setBioDraft(profile.bio ?? ''); setIsEditingBio(true); }}
                      className="text-left max-w-lg group"
                    >
                      {profile.bio ? (
                        <p className="text-[14px] text-[var(--text-muted)] leading-relaxed group-hover:text-[var(--text)] transition-colors" style={{ fontFamily: 'var(--font-sans)' }}>
                          {profile.bio}
                          <span className="ml-2 text-[var(--text-faint)] text-[11px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                        </p>
                      ) : (
                        <p className="text-[14px] text-[var(--text-faint)]/40 hover:text-[var(--text-faint)] transition-colors" style={{ fontFamily: 'var(--font-sans)' }}>
                          {t('profile.bioPlaceholder')}
                        </p>
                      )}
                    </button>
                  )
                ) : profile.bio ? (
                  <p className="text-[14px] text-[var(--text-muted)] leading-relaxed max-w-lg" style={{ fontFamily: 'var(--font-sans)' }}>
                    {profile.bio}
                  </p>
                ) : null}
              </div>

              {/* Stats — click followers/following to expand list */}
              <div className="flex items-center gap-5 sm:gap-6 mb-5">
                <button
                  onClick={() => setShowFollowList(showFollowList === 'followers' ? null : 'followers')}
                  className={`text-[14px] transition-colors ${showFollowList === 'followers' ? 'opacity-100' : 'hover:opacity-80'}`}
                >
                  <span className="font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-sans)' }}>{formatCount(followerCount)}</span>
                  <span className="text-[var(--text-faint)] ml-1.5 text-[13px]" style={{ fontFamily: 'var(--font-sans)' }}>{t('profile.followers')}</span>
                </button>
                <button
                  onClick={() => setShowFollowList(showFollowList === 'following' ? null : 'following')}
                  className={`text-[14px] transition-colors ${showFollowList === 'following' ? 'opacity-100' : 'hover:opacity-80'}`}
                >
                  <span className="font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-sans)' }}>{formatCount(profile.followingCount)}</span>
                  <span className="text-[var(--text-faint)] ml-1.5 text-[13px]" style={{ fontFamily: 'var(--font-sans)' }}>{t('profile.following')}</span>
                </button>
                <span className="text-[14px]">
                  <span className="font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-sans)' }}>{formatCount(profile.postCount)}</span>
                  <span className="text-[var(--text-faint)] ml-1.5 text-[13px]" style={{ fontFamily: 'var(--font-sans)' }}>{t('profile.posts')}</span>
                </span>
              </div>

              {/* Follow list — inline expand */}
              {showFollowList && (
                <div className="mb-5">
                  <GithubFollowSync defaultTab={showFollowList} />
                </div>
              )}

              {/* GitHub + Languages */}
              {profile.githubUsername && (
                <div className="flex items-center gap-3 flex-wrap mb-6">
                  <a
                    href={profile.githubProfileUrl ?? `https://github.com/${profile.githubUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-[var(--accent-blue)]/70 hover:text-[var(--accent-blue)] font-mono transition-colors"
                  >
                    github.com/{profile.githubUsername}
                  </a>
                  {profile.topLanguages.length > 0 && (
                    <div className="flex gap-2">
                      {profile.topLanguages.map((lang) => (
                        <span key={lang} className="text-[12px] text-[var(--text-faint)]/50 font-mono">{lang}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Contribution Graph */}
              {profile.githubUsername && (
                <div className="mb-6">
                  <ContributionGraph githubUsername={profile.githubUsername} />
                </div>
              )}

              {/* Influence */}
              {userScore && (
                <div className="mb-6">
                  <InfluenceDetail
                    score={userScore}
                    isOwnProfile={isSelf}
                    onRecalculate={calculateScore}
                    isCalculating={isCalculating}
                  />
                </div>
              )}
              {!userScore && isSelf && (
                <button
                  onClick={calculateScore}
                  disabled={isCalculating}
                  className="mb-6 w-full py-3 font-mono text-[13px] text-[var(--text-faint)] hover:text-[var(--accent-green)] border border-[var(--border)]/40 hover:border-[var(--accent-green)]/20 transition-colors disabled:opacity-40"
                >
                  {isCalculating ? t('profile.calculating') : t('profile.calculateInfluence')}
                </button>
              )}

            </div>
          </>
        ) : null}

        {/* ── Quick actions (self only) ── */}
        {!isLoading && profile && isSelf && (
          <div className="px-5 sm:px-6 pb-4 flex gap-2 overflow-x-auto">
            <Link
              to="/chat"
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 border border-[var(--border)]/40 hover:border-[var(--accent-green)]/30 font-mono text-[11px] text-[var(--text-muted)] hover:text-[var(--accent-green)] transition-colors"
            >
              <span>⊙</span> {t('profile.chat')}
            </Link>
            <Link
              to="/messages"
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 border border-[var(--border)]/40 hover:border-[var(--accent-cyan)]/30 font-mono text-[11px] text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
            >
              <span>✉</span> {t('profile.messages')}
            </Link>
            <Link
              to="/github"
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 border border-[var(--border)]/40 hover:border-[var(--accent-blue)]/30 font-mono text-[11px] text-[var(--text-muted)] hover:text-[var(--accent-blue)] transition-colors"
            >
              <span>⑂</span> github
            </Link>
          </div>
        )}

        {/* ── Tabs ── */}
        {!isLoading && profile && (
          <>
            <nav className="flex border-b border-[var(--border)]/30 px-5 sm:px-6 sticky top-0 bg-[var(--bg-void)] z-10 overflow-x-auto">
              {(isSelf ? [...SELF_BASE_TABS, ...SELF_TABS] : BASE_TABS).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTabChange(t)}
                  className={`px-4 sm:px-5 py-3 text-[13px] transition-colors relative shrink-0 ${
                    tab === t
                      ? 'text-[var(--text)] font-medium'
                      : 'text-[var(--text-faint)] hover:text-[var(--text-muted)]'
                  }`}
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {t}
                  {tab === t && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[var(--accent-green)]" />
                  )}
                </button>
              ))}
            </nav>

            {/* ── Tab Content ── */}

            {/* Repos */}
            {tab === 'repos' && (
              isLoadingRepos ? (
                <div className="animate-pulse">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="h-[72px] border-b border-[var(--border)]/15" />
                  ))}
                </div>
              ) : repos.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-[14px] text-[var(--text-faint)]/50" style={{ fontFamily: 'var(--font-sans)' }}>{t('profile.noRepos')}</p>
                </div>
              ) : (
                <div>
                  {repos.map((repo) => {
                    const repoOwner = repo.url.replace('https://github.com/', '').split('/')[0] ?? '';
                    return (
                      <div
                        key={repo.name}
                        className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-[var(--border)]/10 group hover:bg-white/[0.015] transition-colors"
                      >
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-0"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-[14px] text-[var(--accent-blue)] group-hover:text-blue-300 transition-colors">{repo.name}</span>
                            {repo.language && (
                              <span className="text-[12px] text-[var(--text-faint)]/40 font-mono">{repo.language}</span>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-[13px] text-[var(--text-faint)]/60 truncate mt-1" style={{ fontFamily: 'var(--font-sans)' }}>{repo.description}</p>
                          )}
                        </a>
                        <div className="flex items-center gap-3 shrink-0 font-mono text-[12px] text-[var(--text-faint)]/50">
                          <span>★ {formatCount(repo.stars)}</span>
                          <span>◇ {formatCount(repo.forks)}</span>
                          {isSelf && (
                            <Link
                              to={`/analyze?repo=${repoOwner}/${repo.name}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] text-[var(--text-faint)] hover:text-[var(--accent-green)] transition-colors border border-[var(--border)] hover:border-[var(--accent-green)]/30 px-2 py-0.5"
                            >
                              analyze
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* Posts / Starred */}
            {(tab === 'posts' || tab === 'starred') && (
              isLoadingPosts && posts.length === 0 ? (
                <div className="animate-pulse">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="h-36 border-b border-[var(--border)]/10" />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-[14px] text-[var(--text-faint)]/50" style={{ fontFamily: 'var(--font-sans)' }}>{t('profile.noItems', { tab })}</p>
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
                      className="w-full py-5 text-[13px] text-[var(--text-faint)]/50 hover:text-[var(--text-muted)] disabled:opacity-40 transition-colors"
                      style={{ fontFamily: 'var(--font-sans)' }}
                    >
                      {isLoadingPosts ? t('profile.loading') : t('profile.loadMore')}
                    </button>
                  )}
                </div>
              )
            )}

            {/* API (self only) */}
            {tab === 'api' && isSelf && (
              <div className="px-5 sm:px-6 py-5">
                <ApiTab onToast={toastSuccess} />
              </div>
            )}
          </>
        )}

      </div>
    </AppShell>
  );
}
