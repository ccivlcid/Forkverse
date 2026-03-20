import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.js';
import { useInfluenceStore } from '../stores/influenceStore.js';
import InfluenceBadge from '../components/profile/InfluenceBadge.js';
import InfiniteScrollTrigger from '../components/feed/InfiniteScrollTrigger.js';

export default function LeaderboardPage() {
  const { leaderboard, isLoading, hasMore, fetchLeaderboard, fetchNextPage } = useInfluenceStore();

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <p className="font-mono text-[var(--accent-green)] text-sm mb-1">
            <span className="text-[var(--accent-amber)]">$</span> influence --leaderboard --sort=score
          </p>
          <p className="font-mono text-[var(--text-muted)] text-xs">
            Developers ranked by GitHub presence + CLItoris activity
          </p>
        </div>

        {/* Leaderboard */}
        <div className="space-y-1">
          {leaderboard.map((entry) => (
            <Link
              key={entry.username}
              to={`/@${entry.username}`}
              className="flex items-center gap-3 py-2.5 px-3 hover:bg-[var(--bg-surface)] transition-colors border-l-2 border-transparent hover:border-[var(--accent-green)]"
            >
              {/* Rank */}
              <span className="font-mono text-sm w-8 text-right text-[var(--text-muted)]">
                {entry.rank <= 3 ? (
                  <span className={entry.rank === 1 ? 'text-[var(--accent-amber)]' : entry.rank === 2 ? 'text-[var(--text)]' : 'text-[#cd7f32]'}>
                    #{entry.rank}
                  </span>
                ) : (
                  `#${entry.rank}`
                )}
              </span>

              {/* Avatar */}
              {entry.avatarUrl ? (
                <img src={entry.avatarUrl} alt="" className="w-8 h-8 rounded-sm" />
              ) : (
                <div className="w-8 h-8 rounded-sm bg-[var(--border)] flex items-center justify-center font-mono text-xs text-[var(--text-muted)]">
                  {entry.username[0]}
                </div>
              )}

              {/* Name + Badge */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-[var(--accent-amber)] truncate">
                    @{entry.username}
                  </span>
                  <InfluenceBadge tier={entry.tier} tierLabel={entry.tierLabel} score={entry.score} />
                </div>
                {entry.displayName && entry.displayName !== entry.username && (
                  <span className="font-mono text-[10px] text-[var(--text-muted)] truncate block">
                    {entry.displayName}
                  </span>
                )}
              </div>

              {/* Score */}
              <span className="font-mono text-sm text-[var(--text)] font-bold">
                {entry.score.toFixed(1)}
              </span>
            </Link>
          ))}
        </div>

        {/* Empty state */}
        {!isLoading && leaderboard.length === 0 && (
          <div className="text-center py-12 font-mono text-[var(--text-muted)] text-sm">
            <p>No scores calculated yet.</p>
            <p className="text-xs mt-1">Go to your profile and sync GitHub to get started.</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-8 font-mono text-[var(--text-muted)] text-xs animate-pulse">
            loading leaderboard...
          </div>
        )}

        {/* Infinite scroll */}
        {hasMore && <InfiniteScrollTrigger onTrigger={fetchNextPage} />}
      </div>
    </AppShell>
  );
}
