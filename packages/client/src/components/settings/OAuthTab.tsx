import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore.js';
import { api } from '../../api/client.js';
import type { ApiResponse } from '@clitoris/shared';

export default function OAuthTab() {
  const { user, checkSession } = useAuthStore();
  const [syncingProfile, setSyncingProfile] = useState(false);
  const [syncingActivity, setSyncingActivity] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [activityMsg, setActivityMsg] = useState<string | null>(null);

  if (!user) return null;

  const connectedAt = new Date(user.githubConnectedAt).toISOString();

  const handleSyncProfile = async () => {
    setSyncingProfile(true);
    setProfileMsg(null);
    try {
      const res = await api.post<ApiResponse<{ synced: boolean; reposCount: number }>>('/users/sync-profile');
      await checkSession();
      setProfileMsg(`✓ synced — repos: ${res.data.reposCount}`);
    } catch {
      setProfileMsg('✗ sync failed');
    } finally {
      setSyncingProfile(false);
    }
  };

  const handleSyncActivity = async () => {
    setSyncingActivity(true);
    setActivityMsg(null);
    try {
      const res = await api.post<ApiResponse<{ created: number; total: number }>>('/users/sync-activity');
      setActivityMsg(`✓ ${res.data.created} new posts created (${res.data.total} events scanned)`);
    } catch {
      setActivityMsg('✗ sync failed');
    } finally {
      setSyncingActivity(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* GitHub */}
      <div className="border border-[var(--border)] bg-[var(--bg-elevated)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-gray-600 text-xs font-mono">// oauth connections</p>
          <span className="text-emerald-400 font-mono text-xs bg-emerald-400/10 px-2 py-0.5">connected</span>
        </div>

        <div className="font-mono text-sm space-y-1.5">
          <p className="text-gray-400">$ oauth --provider=github --status</p>
          <p className="text-gray-500">
            &gt; connected:{' '}
            <a
              href={`https://github.com/${user.githubUsername}`}
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:underline"
            >
              github.com/{user.githubUsername}
            </a>
          </p>
          <p className="text-gray-500">&gt; scope: read:user, user:email</p>
          <p className="text-gray-600">&gt; repos: {user.githubReposCount}</p>
          <p className="text-gray-600">&gt; connected at: {connectedAt}</p>
        </div>

        {/* Sync profile */}
        <div className="pt-2 border-t border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-mono text-sm">$ github --sync-profile</span>
            <button
              onClick={handleSyncProfile}
              disabled={syncingProfile}
              className="text-sky-400 border border-sky-400/30 px-3 py-1 font-mono text-xs hover:bg-sky-400/10 disabled:opacity-40 transition-colors"
            >
              {syncingProfile ? '[syncing...]' : '[sync profile]'}
            </button>
          </div>
          {profileMsg && (
            <p className={`font-mono text-xs ${profileMsg.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>
              &gt; {profileMsg}
            </p>
          )}
          <p className="text-gray-700 font-mono text-xs">// re-fetch avatar, bio, display name, repos count from GitHub</p>
        </div>

        {/* Sync activity */}
        <div className="pt-2 border-t border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-mono text-sm">$ github --sync-activity</span>
            <button
              onClick={handleSyncActivity}
              disabled={syncingActivity}
              className="text-green-400 border border-green-400/30 px-3 py-1 font-mono text-xs hover:bg-green-400/10 disabled:opacity-40 transition-colors"
            >
              {syncingActivity ? '[importing...]' : '[import activity]'}
            </button>
          </div>
          {activityMsg && (
            <p className={`font-mono text-xs ${activityMsg.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>
              &gt; {activityMsg}
            </p>
          )}
          <p className="text-gray-700 font-mono text-xs">// import recent GitHub events (pushes, PRs, releases) as posts</p>
        </div>

        {/* Disconnect */}
        <div className="pt-2 border-t border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-mono text-sm">$ oauth --provider=github --disconnect</span>
            <button
              disabled
              title="GitHub is your only login method. Disconnect will be available when more auth providers are added."
              className="text-gray-700 border border-gray-800 px-3 py-1 font-mono text-xs cursor-not-allowed"
            >
              [disconnect]
            </button>
          </div>
          <p className="text-gray-700 font-mono text-xs">
            // disconnect unavailable — github is your only login method
          </p>
        </div>
      </div>

      {/* Future providers */}
      <div className="border border-[var(--border)] bg-[var(--bg-elevated)] p-6 space-y-3">
        <p className="text-gray-600 text-xs font-mono">// future providers</p>
        {['gitlab', 'gitea'].map((provider) => (
          <div key={provider} className="flex items-center justify-between">
            <span className="text-gray-600 font-mono text-sm">$ oauth --provider={provider}</span>
            <span className="text-gray-700 font-mono text-xs">[coming soon]</span>
          </div>
        ))}
      </div>
    </div>
  );
}
