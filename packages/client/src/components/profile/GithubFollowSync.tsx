import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useUiStore } from '../../stores/uiStore.js';
import { toastError } from '../../stores/toastStore.js';
import type { ApiResponse } from '@forkverse/shared';

interface FollowingEntry {
  githubUsername: string;
  avatarUrl: string;
  profileUrl: string;
  forkverseUsername: string | null;
  isFollowing: boolean;
}

interface FollowerEntry {
  githubUsername: string;
  avatarUrl: string;
  profileUrl: string;
  forkverseUsername: string | null;
  iFollow: boolean;
}

type SubTab = 'following' | 'followers';

export default function GithubFollowSync({ onToast, defaultTab = 'following' }: { onToast?: (msg: string) => void; defaultTab?: SubTab }) {
  const { t } = useUiStore();
  const [subTab, setSubTab] = useState<SubTab>(defaultTab);

  useEffect(() => {
    setSubTab(defaultTab);
  }, [defaultTab]);
  const [following, setFollowing] = useState<FollowingEntry[]>([]);
  const [followers, setFollowers] = useState<FollowerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [inFlight, setInFlight] = useState<Set<string>>(new Set());

  const loadFollowing = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<ApiResponse<FollowingEntry[]>>('/github/following');
      setFollowing(res.data);
    } catch {
      toastError(t('ghSync.loadFollowingFailed'));
    }
    finally { setIsLoading(false); }
  }, []);

  const loadFollowers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<ApiResponse<FollowerEntry[]>>('/github/followers');
      setFollowers(res.data);
    } catch {
      toastError(t('ghSync.loadFollowersFailed'));
    }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    if (subTab === 'following') void loadFollowing();
    else void loadFollowers();
  }, [subTab, loadFollowing, loadFollowers]);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const res = await api.post<ApiResponse<{ followed: number; alreadyFollowing: number }>>('/github/sync-follows');
      const { followed, alreadyFollowing } = res.data;
      onToast?.(`Followed ${followed} users (already following: ${alreadyFollowing})`);
      setFollowing((prev) => prev.map((e) => e.forkverseUsername ? { ...e, isFollowing: true } : e));
    } catch {
      toastError(t('ghSync.syncFailed'));
    } finally { setIsSyncing(false); }
  };

  const toggleFollow = async (username: string, currently: boolean, src: SubTab) => {
    setInFlight((s) => new Set(s).add(username));
    const next = !currently;
    if (src === 'following') {
      setFollowing((p) => p.map((e) => e.forkverseUsername === username ? { ...e, isFollowing: next } : e));
    } else {
      setFollowers((p) => p.map((e) => e.forkverseUsername === username ? { ...e, iFollow: next } : e));
    }
    try {
      await api.post(`/users/@${username}/follow`);
    } catch {
      toastError(t('ghSync.followFailed'));
      if (src === 'following') {
        setFollowing((p) => p.map((e) => e.forkverseUsername === username ? { ...e, isFollowing: !next } : e));
      } else {
        setFollowers((p) => p.map((e) => e.forkverseUsername === username ? { ...e, iFollow: !next } : e));
      }
    } finally {
      setInFlight((s) => { const ns = new Set(s); ns.delete(username); return ns; });
    }
  };

  const list = subTab === 'following' ? following : followers;
  const onClit = list.filter((e) => e.forkverseUsername);
  const notOnClit = list.filter((e) => !e.forkverseUsername);
  const unsynced = following.filter((e) => e.forkverseUsername && !e.isFollowing);

  return (
    <div className="border border-[var(--border)] bg-[var(--bg-input)]">
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-[var(--border)]">
        <div>
          <span className="text-[var(--text-muted)] font-mono text-[12px]">{t('ghSync.title')}</span>
          <span className="text-[var(--text-faint)] font-mono text-[11px] ml-2">
            {t('ghSync.onPlatform', { n: String(following.filter((e) => e.forkverseUsername).length) })}
          </span>
        </div>
        {subTab === 'following' && !isLoading && unsynced.length > 0 && (
          <button
            onClick={() => void handleSyncAll()}
            disabled={isSyncing}
            className="font-mono text-[11px] px-3 py-1 bg-[var(--accent-green)]/10 text-[var(--accent-green)] border border-[var(--accent-green)]/20 hover:bg-[var(--accent-green)]/20 disabled:opacity-40 transition-colors"
          >
            {isSyncing ? t('ghSync.syncing') : t('ghSync.syncAll', { n: String(unsynced.length) })}
          </button>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-[var(--border)]">
        {(['following', 'followers'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`px-4 py-2 font-mono text-[11px] border-b-2 -mb-px transition-colors ${
              subTab === tab
                ? 'text-[var(--accent-green)] border-[var(--accent-green)]'
                : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text)]'
            }`}
          >
            {tab === 'following' ? t('ghSync.following', { n: String(following.length) }) : t('ghSync.followers', { n: String(followers.length) })}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-px p-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-10 animate-pulse bg-[var(--bg-surface)]" />
          ))}
        </div>
      )}

      {/* On Forkverse */}
      {!isLoading && onClit.length > 0 && (
        <div>
          <p className="text-[var(--text-faint)] font-mono text-[10px] px-4 pt-2 pb-1">{t('ghSync.onClit', { n: String(onClit.length) })}</p>
          {onClit.map((entry) => {
            const isFollowing = subTab === 'following'
              ? (entry as FollowingEntry).isFollowing
              : (entry as FollowerEntry).iFollow;
            return (
              <div key={entry.githubUsername} className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--bg-surface)] hover:bg-[var(--bg-surface)] transition-colors">
                <img src={entry.avatarUrl} alt={entry.githubUsername} className="w-6 h-6 rounded-sm shrink-0 object-cover" />
                <div className="flex-1 min-w-0">
                  <Link to={`/@${entry.forkverseUsername}`} className="font-mono text-[12px] text-[var(--accent-amber)] hover:text-amber-300 transition-colors">
                    @{entry.forkverseUsername}
                  </Link>
                  <span className="text-[var(--text-faint)] font-mono text-[10px] ml-2">{entry.githubUsername}</span>
                </div>
                <button
                  onClick={() => void toggleFollow(entry.forkverseUsername!, isFollowing, subTab)}
                  disabled={inFlight.has(entry.forkverseUsername!)}
                  className={`font-mono text-[10px] px-2.5 py-0.5 border transition-colors disabled:opacity-40 shrink-0 ${
                    isFollowing
                      ? 'text-[var(--text-muted)] border-[var(--border)] hover:text-red-400 hover:border-red-400/30'
                      : 'text-[var(--accent-green)] border-[var(--accent-green)]/20 bg-[var(--accent-green)]/5 hover:bg-[var(--accent-green)]/15'
                  }`}
                >
                  {inFlight.has(entry.forkverseUsername!) ? '...' : isFollowing ? t('ghSync.unfollow') : t('ghSync.follow')}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Not on Forkverse */}
      {!isLoading && notOnClit.length > 0 && (
        <div>
          <p className="text-[var(--text-faint)] font-mono text-[10px] px-4 pt-2 pb-1">{t('ghSync.notOnClit', { n: String(notOnClit.length) })}</p>
          {notOnClit.slice(0, 5).map((entry) => (
            <div key={entry.githubUsername} className="flex items-center gap-3 px-4 py-2 border-b border-[var(--bg-surface)] opacity-40">
              <img src={entry.avatarUrl} alt={entry.githubUsername} className="w-6 h-6 rounded-sm shrink-0 object-cover" />
              <a href={entry.profileUrl} target="_blank" rel="noopener noreferrer"
                className="font-mono text-[12px] text-[var(--text-muted)] hover:text-white transition-colors">
                {entry.githubUsername}
              </a>
            </div>
          ))}
          {notOnClit.length > 5 && (
            <p className="text-[var(--text-faint)] font-mono text-[10px] px-4 py-2">{t('ghSync.more', { n: String(notOnClit.length - 5) })}</p>
          )}
        </div>
      )}

      {!isLoading && list.length === 0 && (
        <div className="px-5 py-6 text-center">
          <p className="text-[var(--text-faint)] font-mono text-[11px]">{t('ghSync.empty', { tab: subTab })}</p>
        </div>
      )}
    </div>
  );
}
