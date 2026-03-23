import { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useUiStore } from '../../stores/uiStore.js';
import type { ApiResponse } from '@forkverse/shared';

interface ContributionDay {
  date: string;
  contributionCount: number;
  color: string;
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

interface ContributionData {
  total: number;
  weeks: ContributionWeek[];
}

// Map GitHub's contribution colors to our dark theme
function levelColor(count: number): string {
  if (count === 0) return 'var(--bg-surface)';
  if (count <= 2) return '#0f3d24';
  if (count <= 5) return '#1a6b3a';
  if (count <= 10) return '#26994f';
  return 'var(--accent-green)';
}

export default function ContributionGraph({ githubUsername }: { githubUsername: string }) {
  const { t } = useUiStore();
  const [data, setData] = useState<ContributionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.get<ApiResponse<ContributionData>>(`/github/contributions/${githubUsername}`)
      .then((res) => setData(res.data))
      .catch(() => { /* graph is optional — fail silently */ })
      .finally(() => setIsLoading(false));
  }, [githubUsername]);

  if (isLoading) {
    return (
      <div className="h-[72px] animate-pulse bg-[var(--bg-input)] border border-[var(--border)]" />
    );
  }

  if (!data) return null;

  // Show last 26 weeks for compact display
  const weeks = data.weeks.slice(-26);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-faint)] font-mono text-[10px]">{t('contrib.title')}</span>
        <span className="text-[var(--text-muted)] font-mono text-[10px]">{t('contrib.thisYear', { n: data.total.toLocaleString() })}</span>
      </div>
      <div className="flex gap-[3px]" role="img" aria-label={`${data.total} contributions this year`}>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.contributionDays.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.contributionCount} contributions`}
                style={{ backgroundColor: levelColor(day.contributionCount) }}
                className="w-[10px] h-[10px] rounded-[2px] transition-colors hover:opacity-80"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
