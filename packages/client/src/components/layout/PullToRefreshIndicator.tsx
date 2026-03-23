interface Props {
  pullDistance: number;
  refreshing: boolean;
  threshold?: number;
}

export default function PullToRefreshIndicator({ pullDistance, refreshing, threshold = 80 }: Props) {
  if (pullDistance <= 0 && !refreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const ready = progress >= 1;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-[height] duration-200 sm:hidden"
      style={{ height: refreshing ? 40 : pullDistance > 0 ? Math.min(pullDistance, threshold * 1.2) : 0 }}
    >
      <span
        className={`font-mono text-xs transition-colors ${
          refreshing ? 'text-[var(--accent-green)] animate-pulse' :
          ready ? 'text-[var(--accent-green)]' : 'text-[var(--text-faint)]'
        }`}
      >
        {refreshing ? '$ refreshing...' : ready ? '↓ release to refresh' : '↓ pull to refresh'}
      </span>
    </div>
  );
}
