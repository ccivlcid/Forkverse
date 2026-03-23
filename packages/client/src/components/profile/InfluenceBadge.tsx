import { INFLUENCE_TIERS } from '@forkverse/shared';

interface Props {
  tier: number;
  tierLabel: string;
  score: number;
  size?: 'sm' | 'md';
}

export default function InfluenceBadge({ tier, tierLabel, score, size = 'sm' }: Props) {
  const tierDef = INFLUENCE_TIERS.find((t) => t.tier === tier) ?? INFLUENCE_TIERS[0];
  const color = tierDef.color;

  if (size === 'md') {
    return (
      <span
        className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 border rounded-sm"
        style={{ color, borderColor: color + '40' }}
      >
        <span style={{ color }}>{tierLabel}</span>
        <span className="text-[var(--text-faint)]">@</span>
        <span style={{ color }}>{score.toFixed(1)}</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center font-mono text-[10px] px-1.5 py-0.5 border rounded-sm"
      style={{ color, borderColor: color + '30' }}
      title={`Influence: ${tierLabel} (${score.toFixed(1)})`}
    >
      {tierLabel}
    </span>
  );
}
