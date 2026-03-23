import { useState } from 'react';
import type { InfluenceScore } from '@forkverse/shared';
import { INFLUENCE_TIERS } from '@forkverse/shared';
import { useUiStore } from '../../stores/uiStore.js';

interface Props {
  score: InfluenceScore;
  isOwnProfile: boolean;
  onRecalculate?: () => void;
  isCalculating?: boolean;
}

const BREAKDOWN_LABELS: Array<{ key: keyof InfluenceScore['breakdown']; label: string; icon: string }> = [
  { key: 'ghRepos', label: 'gh:repos', icon: '📦' },
  { key: 'ghStars', label: 'gh:stars', icon: '⭐' },
  { key: 'ghFollowers', label: 'gh:followers', icon: '👥' },
  { key: 'cliPosts', label: 'posts', icon: '📝' },
  { key: 'cliFollowers', label: 'followers', icon: '🔗' },
  { key: 'cliStars', label: 'stars_recv', icon: '✦' },
  { key: 'cliForks', label: 'forks_recv', icon: '⑂' },
];

export default function InfluenceDetail({ score, isOwnProfile, onRecalculate, isCalculating }: Props) {
  const { t } = useUiStore();
  const tierDef = INFLUENCE_TIERS.find((td) => td.tier === score.tier) ?? INFLUENCE_TIERS[0];
  const maxComponent = Math.max(...Object.values(score.breakdown), 1);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[var(--border)] bg-[var(--bg-surface)] font-mono text-xs">
      {/* Header — always visible, clickable to toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[var(--text-muted)]">{t('influence.status')}</span>
          <span className="text-lg font-bold" style={{ color: tierDef.color }}>
            {score.score.toFixed(1)}
          </span>
          <span
            className="text-[11px] px-1.5 py-0.5 border rounded-sm"
            style={{ color: tierDef.color, borderColor: tierDef.color + '40' }}
          >
            {score.tierLabel}
          </span>
        </div>
        <span className="text-[var(--text-faint)] text-[11px]">
          {expanded ? '▴' : '▾'}
        </span>
      </button>

      {/* Expandable detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[var(--border)]/30">
          {/* Recalculate */}
          {isOwnProfile && onRecalculate && (
            <div className="flex justify-end pt-2 pb-1">
              <button
                onClick={onRecalculate}
                disabled={isCalculating}
                className="text-[var(--text-muted)] hover:text-[var(--accent-green)] transition-colors disabled:opacity-40"
              >
                {isCalculating ? t('influence.calculating') : t('influence.recalculate')}
              </button>
            </div>
          )}

          {/* Progress to next tier */}
          {score.tier < 6 && (() => {
            const nextTier = INFLUENCE_TIERS.find((td) => td.tier === score.tier + 1);
            if (!nextTier) return null;
            const currentMin = INFLUENCE_TIERS.find((td) => td.tier === score.tier)!.min;
            const progress = Math.min(((score.score - currentMin) / (nextTier.min - currentMin)) * 100, 100);
            return (
              <div className="mb-3 mt-2">
                <div className="flex justify-between text-[var(--text-muted)] text-[10px] mb-1">
                  <span>{score.tierLabel}</span>
                  <span>{nextTier.label}</span>
                </div>
                <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progress}%`, backgroundColor: tierDef.color }}
                  />
                </div>
              </div>
            );
          })()}

          {/* Breakdown */}
          <div className="space-y-1.5 mt-2">
            {BREAKDOWN_LABELS.map(({ key, label, icon }) => {
              const value = score.breakdown[key];
              const pct = (value / maxComponent) * 100;
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-4 text-center">{icon}</span>
                  <span className="w-24 text-[var(--text-muted)]">{label}</span>
                  <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: tierDef.color + '80' }}
                    />
                  </div>
                  <span className="w-10 text-right text-[var(--text-muted)]">{value.toFixed(1)}</span>
                </div>
              );
            })}
          </div>

          {/* Timestamp */}
          {score.calculatedAt && (
            <div className="mt-3 text-[var(--text-faint)] text-[10px]">
              {t('influence.calculated')} {new Date(score.calculatedAt + 'Z').toLocaleDateString()}
              {score.stale && <span className="text-[var(--accent-amber)] ml-2">{t('influence.stale')}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
