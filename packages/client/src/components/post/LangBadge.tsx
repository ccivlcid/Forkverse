interface LangBadgeProps {
  lang: string;
}

export default function LangBadge({ lang }: LangBadgeProps) {
  return (
    <span className="text-[var(--accent-purple)]/30 text-[10px] font-mono shrink-0">
      {lang}
    </span>
  );
}
