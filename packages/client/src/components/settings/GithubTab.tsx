import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useUiStore } from '../../stores/uiStore.js';
import type { ApiResponse } from '@forkverse/shared';

interface ReviewPR {
  id: number;
  number: number;
  title: string;
  url: string;
  author: string;
  authorAvatar: string;
  repoFullName: string;
  labels: Array<{ name: string; color: string }>;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return 'now';
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function GithubTab({ onToast: _onToast }: { onToast: (msg: string) => void }) {
  const { user } = useAuthStore();
  const { t } = useUiStore();
  const [reviews, setReviews] = useState<ReviewPR[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    setReviewError(null);
    try {
      const res = await api.get<ApiResponse<ReviewPR[]> & { meta?: { total?: number } }>('/github/reviews');
      setReviews(res.data);
      setTotal(res.meta?.total ?? res.data.length);
    } catch {
      setReviewError(t('github.reviewLoadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  return (
    <div className="space-y-5">

      {/* ── Connection status ── */}
      <div className="border border-[var(--border)] bg-[var(--bg-input)] px-5 py-4">
        <p className="text-[var(--text-faint)] font-mono text-[10px] mb-3">// {t('github.connectionStatus')}</p>
        <div className="flex items-center gap-3">
          {user?.githubAvatarUrl && (
            <img src={user.githubAvatarUrl} alt="" className="w-10 h-10 rounded-full shrink-0 border border-[var(--border)]" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[var(--accent-green)] font-mono text-[11px]">●</span>
              <a
                href={`https://github.com/${user?.githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[13px] text-[var(--text)] hover:text-[var(--accent-amber)] transition-colors"
              >
                @{user?.githubUsername}
              </a>
            </div>
            {user?.githubConnectedAt && (
              <p className="font-mono text-[10px] text-[var(--text-faint)] mt-0.5">
                {t('github.connectedSince')} {new Date(user.githubConnectedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <div className="border border-[var(--border)] bg-[var(--bg-input)] px-5 py-4">
        <p className="text-[var(--text-faint)] font-mono text-[10px] mb-3">// {t('github.features')}</p>
        <div className="space-y-2 font-mono text-[12px]">
          <div className="flex items-center gap-2">
            <span className="text-[var(--accent-green)]">✓</span>
            <span className="text-[var(--text-muted)]">{t('github.featureProfile')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--accent-green)]">✓</span>
            <span className="text-[var(--text-muted)]">{t('github.featureRepos')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--accent-green)]">✓</span>
            <span className="text-[var(--text-muted)]">{t('github.featureContrib')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--accent-green)]">✓</span>
            <span className="text-[var(--text-muted)]">{t('github.featureFollowSync')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--accent-green)]">✓</span>
            <span className="text-[var(--text-muted)]">{t('github.featureReviews')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--accent-green)]">✓</span>
            <span className="text-[var(--text-muted)]">{t('github.featureInfluence')}</span>
          </div>
        </div>
      </div>

      {/* ── PR Reviews ── */}
      <div className="border border-[var(--border)] bg-[var(--bg-input)]">
        <div className="px-5 py-3 border-b border-[var(--border)]/40 flex items-center justify-between">
          <div>
            <p className="text-[var(--text)] font-mono text-[12px]">$ gh pr list --review-requested=@me</p>
            <p className="text-[var(--text-faint)] font-mono text-[10px] mt-0.5">{t('github.reviewSubtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isLoading && !reviewError && (
              <span className="font-mono text-[10px] text-[var(--text-muted)] border border-[var(--border)] px-2 py-0.5">
                {total} open
              </span>
            )}
            <button
              onClick={() => void loadReviews()}
              className="text-[var(--text-faint)] hover:text-[var(--text-muted)] font-mono text-[10px] transition-colors"
            >
              [↺]
            </button>
          </div>
        </div>

        {/* Error */}
        {reviewError && (
          <div className="px-5 py-3 bg-[var(--color-error-bg)] text-[var(--color-error)] font-mono text-[11px] flex items-center justify-between">
            {reviewError}
            <button onClick={() => void loadReviews()} className="underline hover:opacity-80 ml-3">retry</button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="p-4 space-y-1">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-14 animate-pulse bg-[var(--bg-surface)]" />
            ))}
          </div>
        )}

        {/* PR list */}
        {!isLoading && !reviewError && reviews.length > 0 && (
          <div>
            {reviews.map((pr) => (
              <a
                key={pr.id}
                href={pr.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 border-b border-[var(--border)]/15 px-5 py-3 hover:bg-white/[0.02] transition-colors group"
              >
                <img src={pr.authorAvatar} alt={pr.author} className="w-6 h-6 rounded-sm shrink-0 mt-0.5 object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[var(--text-faint)] font-mono text-[10px]">{pr.repoFullName}</span>
                    <span className="text-[var(--text-faint)] font-mono text-[10px]">#{pr.number}</span>
                    {pr.isDraft && (
                      <span className="font-mono text-[9px] px-1 border border-[var(--text-faint)]/40 text-[var(--text-faint)]">draft</span>
                    )}
                  </div>
                  <p className="text-[var(--text)] font-mono text-[12px] mt-0.5 group-hover:text-white transition-colors truncate">
                    {pr.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[var(--text-muted)] font-mono text-[10px]">by {pr.author}</span>
                    <span className="text-[var(--text-faint)] font-mono text-[10px]">{timeAgo(pr.updatedAt)}</span>
                    {pr.labels.map((l) => (
                      <span
                        key={l.name}
                        className="font-mono text-[9px] px-1 border"
                        style={{ borderColor: `#${l.color}40`, color: `#${l.color}` }}
                      >
                        {l.name}
                      </span>
                    ))}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && !reviewError && reviews.length === 0 && (
          <div className="px-5 py-6 text-center">
            <p className="text-[var(--accent-green)] font-mono text-[11px]">&gt; 0 reviews pending.</p>
            <p className="text-[var(--text-faint)] font-mono text-[10px] mt-1">{t('github.noReviews')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
