import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.js';
import { useUiStore } from '../stores/uiStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { api } from '../api/client.js';
import { toastError } from '../stores/toastStore.js';
import type { ApiResponse, AnalysisWithSections, AnalysisSectionKey } from '@forkverse/shared';

const SECTION_KEYS: AnalysisSectionKey[] = [
  'summary', 'techStack', 'architecture', 'strengths', 'risks', 'improvements', 'cliView',
];

const SECTION_ICONS: Record<AnalysisSectionKey, string> = {
  summary: '◈',
  techStack: '⚙',
  architecture: '◫',
  strengths: '▲',
  risks: '⚠',
  improvements: '↑',
  cliView: '$',
};

function SectionCard({
  sectionKey,
  content,
  label,
  t,
}: {
  sectionKey: AnalysisSectionKey;
  content: string;
  label: string;
  t: (k: string) => string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toastError('Failed to copy');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: label, text: content.slice(0, 200), url });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!content) return null;

  return (
    <div
      id={`section-${sectionKey}`}
      className="border border-[var(--border)] bg-[var(--bg-elevated)] scroll-mt-20"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="text-[var(--accent-green)] font-mono text-sm">{SECTION_ICONS[sectionKey]}</span>
          <span className="font-mono text-sm text-[var(--text)]">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="font-mono text-[10px] text-[var(--text-faint)] hover:text-[var(--text-muted)] border border-[var(--border)] px-2 py-0.5 transition-colors"
            title={t('analysis.copy')}
          >
            {copied ? '✓' : 'cp'}
          </button>
          <button
            onClick={handleShare}
            className="font-mono text-[10px] text-[var(--text-faint)] hover:text-[var(--text-muted)] border border-[var(--border)] px-2 py-0.5 transition-colors"
            title={t('analysis.share')}
          >
            sh
          </button>
        </div>
      </div>
      <div className={`px-4 py-4 font-sans text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed ${sectionKey === 'cliView' ? 'font-mono text-[var(--accent-green)] bg-[#0d1117]' : ''}`}>
        {content}
      </div>
    </div>
  );
}

export default function AnalysisResultPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useUiStore();
  const { isAuthenticated } = useAuthStore();
  const [analysis, setAnalysis] = useState<AnalysisWithSections | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<AnalysisSectionKey>('summary');
  const [starring, setStarring] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get<ApiResponse<AnalysisWithSections>>(`/analyze/detail/${id}`)
      .then((res) => {
        setAnalysis(res.data);
        setError(null);
      })
      .catch(() => setError('Analysis not found'))
      .finally(() => setLoading(false));
  }, [id]);

  // Intersection observer for active section tracking
  useEffect(() => {
    if (!analysis?.sections) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const key = entry.target.id.replace('section-', '') as AnalysisSectionKey;
            setActiveSection(key);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px' },
    );

    for (const key of SECTION_KEYS) {
      const el = document.getElementById(`section-${key}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [analysis?.sections]);

  const handleStar = async () => {
    if (!analysis || starring) return;
    setStarring(true);
    try {
      const res = await api.post<ApiResponse<{ starred: boolean; starCount: number }>>(`/analyze/${analysis.id}/star`);
      setAnalysis({
        ...analysis,
        isStarred: res.data.starred,
        starCount: res.data.starCount,
      });
    } catch {
      toastError('Failed to star');
    } finally {
      setStarring(false);
    }
  };

  const scrollToSection = (key: AnalysisSectionKey) => {
    const el = document.getElementById(`section-${key}`);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <AppShell breadcrumb="analysis">
        <div className="max-w-4xl mx-auto p-4">
          <div className="font-mono text-sm text-[var(--text-faint)] animate-pulse">
            $ loading analysis...
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !analysis) {
    return (
      <AppShell breadcrumb="analysis">
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <div className="font-mono text-sm text-red-400">$ error: {error ?? 'not found'}</div>
          <Link to="/analyze" className="font-mono text-sm text-[var(--accent-green)] hover:underline">
            ← {t('analysis.backToAnalyze')}
          </Link>
        </div>
      </AppShell>
    );
  }

  const sections = analysis.sections;

  return (
    <AppShell breadcrumb="analysis">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="border border-[var(--border)] bg-[var(--bg-elevated)] p-4 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="font-mono text-sm text-[var(--text-faint)]">
                $ analyze --repo=
                <a
                  href={`https://github.com/${analysis.repoOwner}/${analysis.repoName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-blue)] hover:underline"
                >
                  {analysis.repoOwner}/{analysis.repoName}
                </a>
              </div>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="font-mono text-xs text-[var(--text-faint)]">--model={analysis.llmModel}</span>
                <span className="font-mono text-xs text-[var(--text-faint)]">--lang={analysis.lang}</span>
                <span className="font-mono text-xs text-[var(--text-faint)]">--output={analysis.outputType}</span>
                {analysis.durationMs && (
                  <span className="font-mono text-xs text-emerald-400">✓ {(analysis.durationMs / 1000).toFixed(1)}s</span>
                )}
              </div>
              {analysis.user && (
                <Link
                  to={`/@${analysis.user.username}`}
                  className="flex items-center gap-2 mt-3"
                >
                  {analysis.user.avatarUrl && (
                    <img src={analysis.user.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
                  )}
                  <span className="font-mono text-xs text-[var(--accent-amber)] hover:underline">
                    @{analysis.user.username}
                  </span>
                </Link>
              )}
            </div>

            {/* Star button */}
            <button
              onClick={handleStar}
              disabled={!isAuthenticated || starring}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 font-mono text-sm border transition-colors ${
                analysis.isStarred
                  ? 'bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] border-[var(--accent-amber)]/30'
                  : 'text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--accent-amber)] hover:border-[var(--accent-amber)]/30'
              } disabled:opacity-40`}
              title={isAuthenticated ? t('analysis.star') : t('analysis.loginToStar')}
            >
              {analysis.isStarred ? '★' : '☆'} {analysis.starCount}
            </button>
          </div>
        </div>

        {/* Layout: sidebar nav + sections */}
        <div className="flex gap-4">
          {/* Desktop section nav — hidden on mobile */}
          {sections && (
            <nav className="hidden lg:block w-48 shrink-0 sticky top-20 self-start">
              <div className="border border-[var(--border)] bg-[var(--bg-elevated)]">
                <div className="px-3 py-2 border-b border-[var(--border)]">
                  <span className="font-mono text-[10px] text-[var(--text-faint)]">// sections</span>
                </div>
                {SECTION_KEYS.map((key) => {
                  const content = sections[key];
                  if (!content) return null;
                  return (
                    <button
                      key={key}
                      onClick={() => scrollToSection(key)}
                      className={`w-full text-left px-3 py-2 font-mono text-xs transition-colors flex items-center gap-2 ${
                        activeSection === key
                          ? 'text-[var(--accent-green)] bg-[var(--accent-green)]/5 border-l-2 border-[var(--accent-green)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text)] border-l-2 border-transparent'
                      }`}
                    >
                      <span>{SECTION_ICONS[key]}</span>
                      <span>{t(`analysis.section.${key}`)}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          )}

          {/* Mobile horizontal section nav — visible on mobile only */}
          {sections && (
            <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-[var(--bg-void)]/95 backdrop-blur border-t border-[var(--border)] overflow-x-auto">
              <div className="flex px-2 py-1.5 gap-1">
                {SECTION_KEYS.map((key) => {
                  const content = sections[key];
                  if (!content) return null;
                  return (
                    <button
                      key={key}
                      onClick={() => scrollToSection(key)}
                      className={`shrink-0 px-3 py-1.5 font-mono text-[10px] rounded-sm transition-colors ${
                        activeSection === key
                          ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)] border border-[var(--accent-green)]/30'
                          : 'text-[var(--text-faint)] border border-transparent'
                      }`}
                    >
                      {SECTION_ICONS[key]} {t(`analysis.section.${key}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sections content */}
          <div className="flex-1 min-w-0 space-y-4 pb-20 lg:pb-4">
            {sections ? (
              SECTION_KEYS.map((key) => (
                <SectionCard
                  key={key}
                  sectionKey={key}
                  content={sections[key]}
                  label={t(`analysis.section.${key}`)}
                  t={t}
                />
              ))
            ) : (
              /* Fallback: flat summary for old analyses without sections */
              <div className="border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                <div className="font-mono text-sm text-[var(--text)] whitespace-pre-wrap">
                  {analysis.resultSummary}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to="/analyze"
                className="font-mono text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                ← {t('analysis.backToAnalyze')}
              </Link>
              <Link
                to="/feed"
                className="font-mono text-sm text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors"
              >
                {t('analysis.backToFeed')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
