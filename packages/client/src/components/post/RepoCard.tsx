import type { RepoAttachment } from '@clitoris/shared';

interface RepoCardProps {
  repo: RepoAttachment;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function RepoCard({ repo }: RepoCardProps) {
  const url = `https://github.com/${repo.repoOwner}/${repo.repoName}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-3 mx-4 mb-3 px-3 py-2 border border-[var(--border)] bg-[var(--bg-input)] hover:border-[var(--border-hover)] transition-colors"
    >
      <span className="text-gray-600 font-mono text-xs shrink-0">■</span>
      <div className="flex-1 min-w-0">
        <span className="text-sky-400 font-mono text-xs">
          {repo.repoOwner}/<span className="font-semibold">{repo.repoName}</span>
        </span>
        {repo.repoLanguage && (
          <span className="ml-2 text-gray-600 font-mono text-[10px]">{repo.repoLanguage}</span>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0 text-gray-600 font-mono text-[10px]">
        <span>★ {formatCount(repo.repoStars)}</span>
        <span>◇ {formatCount(repo.repoForks)}</span>
      </div>
    </a>
  );
}
