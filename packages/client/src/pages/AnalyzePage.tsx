import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.js';
import { useAuthStore } from '../stores/authStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { api } from '../api/client.js';
import { toastError } from '../stores/toastStore.js';
import type { ApiResponse, Analysis, AnalysisProgress } from '@clitoris/shared';

type OutputType = 'report' | 'pptx' | 'video';

interface AnalysisResult extends Analysis {
  progress: AnalysisProgress[];
}

function ProgressLine({ step }: { step: AnalysisProgress }) {
  const icon =
    step.status === 'done' ? '✓ done' :
    step.status === 'failed' ? '✗ failed' :
    step.status === 'active' ? '░░░░░░░░░░' : 'pending';
  const color =
    step.status === 'done' ? 'text-emerald-400' :
    step.status === 'failed' ? 'text-red-400' :
    step.status === 'active' ? 'text-yellow-400' : 'text-[var(--text-faint)]';

  return (
    <div className="flex items-center justify-between font-mono text-sm">
      <span className="text-[var(--text-muted)]">&gt; {step.name}{step.detail ? `: ${step.detail}` : ''}...</span>
      <span className={color}>{icon}</span>
    </div>
  );
}


export default function AnalyzePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { t } = useUiStore();

  // Form state — pre-fill from URL params (from HomePage CTA)
  const [repo, setRepo] = useState(() => searchParams.get('repo') ?? '');
  const [outputType, setOutputType] = useState<OutputType>(
    () => (searchParams.get('output') as OutputType) ?? 'report'
  );
  const [llmModel, setLlmModel] = useState('');
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [lang, setLang] = useState('en');
  const [userPrompt, setUserPrompt] = useState('');
  const [promptFile, setPromptFile] = useState<string | null>(null); // filename
  const [isStarting, setIsStarting] = useState(false);
  const mdFileRef = useRef<HTMLInputElement>(null);

  // Active analysis
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisResult | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [sharedPostId, setSharedPostId] = useState<string | null>(null);
  const [showShareEditor, setShowShareEditor] = useState(false);
  const [shareCaption, setShareCaption] = useState('');


  const OUTPUT_TYPES: OutputType[] = ['report', 'pptx', 'video'];

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login?redirect=/analyze', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Build model list from CLI status + saved API keys (no hardcoded model ids)
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    async function loadModels() {
      const opts: string[] = [];
      try {
        const prov = await api.get<ApiResponse<Array<{ provider: string; source: string }>>>('/llm/providers');
        const apiKeys = prov.data.filter((p) => p.source === 'user-settings');
        await Promise.all(
          apiKeys.map(async ({ provider }) => {
            try {
              const m = await api.get<ApiResponse<string[]>>(`/llm/models/${provider}`);
              opts.push(...m.data);
            } catch { /* ignore */ }
          }),
        );
      } catch { /* ignore */ }
      if (cancelled) return;
      const uniq = [...new Set(opts)].sort();
      setModelOptions(uniq);
      setLlmModel((prev) => (prev && uniq.includes(prev) ? prev : uniq[0] ?? ''));
    }
    void loadModels();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);


  // Poll active analysis
  useEffect(() => {
    if (!activeAnalysis || activeAnalysis.status === 'completed' || activeAnalysis.status === 'failed') {
      if (pollingRef.current) clearTimeout(pollingRef.current);
      if (elapsedRef.current) clearInterval(elapsedRef.current);
      return;
    }

    const poll = () => {
      pollingRef.current = setTimeout(async () => {
        try {
          const res = await api.get<ApiResponse<AnalysisResult>>(`/analyze/${activeAnalysis.id}`);
          setActiveAnalysis(res.data);
          if (res.data.status === 'completed' || res.data.status === 'failed') {
            if (elapsedRef.current) clearInterval(elapsedRef.current);
          } else {
            poll();
          }
        } catch {
          poll();
        }
      }, 1500);
    };
    poll();

    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [activeAnalysis?.id, activeAnalysis?.status]);

  const handleShare = async () => {
    if (!activeAnalysis) return;
    setIsSharing(true);
    try {
      const body = shareCaption.trim() ? { caption: shareCaption.trim() } : {};
      const res = await api.post<ApiResponse<{ postId: string }>>(`/analyze/${activeAnalysis.id}/share`, body);
      setSharedPostId(res.data.postId);
      setShowShareEditor(false);
    } catch { toastError('Failed to share analysis'); } finally {
      setIsSharing(false);
    }
  };

  const openShareEditor = (analysis: AnalysisResult) => {
    const summary = analysis.resultSummary ?? '';
    const defaultCaption = `Analyzed ${analysis.repoOwner}/${analysis.repoName} (${analysis.outputType})\n\n${summary.slice(0, 500)}`;
    setShareCaption(defaultCaption);
    setShowShareEditor(true);
  };

  const handleMdFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setUserPrompt(content.slice(0, 500));
      setPromptFile(file.name);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleStart = async () => {
    const trimmed = repo.trim().replace(/^https?:\/\/github\.com\//, '');
    const [owner, name] = trimmed.split('/');
    if (!owner || !name || !llmModel.trim()) return;

    setIsStarting(true);
    try {
      const res = await api.post<ApiResponse<AnalysisResult>>('/analyze', {
        repoOwner: owner,
        repoName: name,
        outputType,
        llmModel,
        lang,
        ...(userPrompt.trim() ? { userPrompt: userPrompt.trim() } : {}),
      });
      setActiveAnalysis(res.data);
      setSharedPostId(null);
      setElapsed(0);
      elapsedRef.current = setInterval(() => setElapsed((e) => e + 0.1), 100);
    } finally {
      setIsStarting(false);
    }
  };

  if (authLoading) return null;

  return (
    <AppShell breadcrumb="analyze">
      <div className="max-w-2xl mx-auto p-4 space-y-6">

        {/* Analyzer Form / Active Progress */}
        <div className="border border-[var(--border)] bg-[var(--bg-elevated)] p-6 space-y-4">

          {activeAnalysis && (activeAnalysis.status === 'pending' || activeAnalysis.status === 'processing') ? (
            // Progress view
            <div className="space-y-3">
              <p className="text-[var(--text-faint)] text-xs font-mono">{t('analyze.progress.section')}</p>
              <p className="text-[var(--text)] font-mono text-sm">
                $ analyze --repo={activeAnalysis.repoOwner}/{activeAnalysis.repoName} --output={activeAnalysis.outputType}
              </p>
              <div className="space-y-2 mt-4">
                {activeAnalysis.progress.map((step, i) => (
                  <ProgressLine key={i} step={step} />
                ))}
              </div>
              <p className="text-[var(--text-faint)] font-mono text-xs mt-3">elapsed: {elapsed.toFixed(1)}s</p>
              <button
                onClick={() => {
                  setActiveAnalysis(null);
                  if (pollingRef.current) clearTimeout(pollingRef.current);
                  if (elapsedRef.current) clearInterval(elapsedRef.current);
                }}
                className="text-[var(--text-faint)] hover:text-[var(--text)] font-mono text-sm border border-[var(--border)] px-4 py-1.5 hover:border-[var(--border-hover)] transition-colors"
              >
                {t('analyze.progress.cancel')}
              </button>
            </div>
          ) : activeAnalysis?.status === 'completed' ? (
            // Result view
            <div className="space-y-3">
              <p className="text-[var(--text-faint)] text-xs font-mono">{t('analyze.result.section')}</p>
              <p className="text-emerald-400 font-mono text-sm">
                ✓ {activeAnalysis.repoOwner}/{activeAnalysis.repoName} · {activeAnalysis.durationMs ? `${(activeAnalysis.durationMs / 1000).toFixed(1)}s` : ''}
              </p>

              {activeAnalysis.outputType === 'video' ? (
                <div className="border border-[var(--border)] bg-[#0d1117] p-6 text-center space-y-3">
                  <p className="text-[var(--accent-green)] font-mono text-sm">{t('analyze.result.videoReady')}</p>
                  <p className="text-[var(--text-muted)] font-mono text-xs">{t('analyze.result.videoHint')}</p>
                  {activeAnalysis.resultUrl ? (
                    <a
                      href={`/api/analyze/${activeAnalysis.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] border border-[var(--accent-purple)]/30 px-4 py-2 font-mono text-sm hover:bg-[var(--accent-purple)]/20 transition-colors"
                    >
                      {t('analyze.result.videoOpen')}
                    </a>
                  ) : (
                    <p className="text-[var(--text-faint)] font-mono text-xs">{t('analyze.result.videoUnavailable')}</p>
                  )}
                  {activeAnalysis.resultSummary && (
                    <details className="text-left mt-2">
                      <summary className="text-[var(--text-faint)] font-mono text-xs cursor-pointer hover:text-[var(--text-muted)]">{t('analyze.result.videoSummary')}</summary>
                      <div className="border border-[var(--border)] bg-[#0d1117] p-4 font-sans text-sm text-[var(--text)] whitespace-pre-wrap max-h-64 overflow-y-auto mt-2">
                        {activeAnalysis.resultSummary}
                      </div>
                    </details>
                  )}
                </div>
              ) : activeAnalysis.outputType === 'pptx' ? (
                <div className="border border-[var(--border)] bg-[#0d1117] p-6 text-center space-y-3">
                  <p className="text-[var(--accent-green)] font-mono text-sm">{t('analyze.result.pptxReady')}</p>
                  <p className="text-[var(--text-muted)] font-mono text-xs">
                    {activeAnalysis.resultUrl ? t('analyze.result.pptxSlides') : t('analyze.result.pptxFallback')}
                  </p>
                  {activeAnalysis.resultUrl && (
                    <a
                      href={`/api/analyze/${activeAnalysis.id}/download`}
                      download
                      className="inline-block bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30 px-4 py-2 font-mono text-sm hover:bg-[var(--accent-cyan)]/20 transition-colors"
                    >
                      {t('analyze.result.pptxDownload')}
                    </a>
                  )}
                  {activeAnalysis.resultSummary && (
                    <details className="text-left mt-2">
                      <summary className="text-[var(--text-faint)] font-mono text-xs cursor-pointer hover:text-[var(--text-muted)]">{t('analyze.result.pptxSummary')}</summary>
                      <div className="border border-[var(--border)] bg-[#0d1117] p-4 font-sans text-sm text-[var(--text)] whitespace-pre-wrap max-h-64 overflow-y-auto mt-2">
                        {activeAnalysis.resultSummary}
                      </div>
                    </details>
                  )}
                </div>
              ) : (
                <div className="border border-[var(--border)] bg-[#0d1117] p-4 font-sans text-sm text-[var(--text)] whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {activeAnalysis.resultSummary}
                </div>
              )}

              {/* Share editor / status */}
              {showShareEditor && !sharedPostId ? (
                <div className="border border-[var(--border)] bg-[#0d1117] p-4 space-y-3 mt-2">
                  <p className="text-[var(--text-faint)] font-mono text-xs">{t('analyze.share.reviewTitle')}</p>
                  <textarea
                    value={shareCaption}
                    onChange={(e) => setShareCaption(e.target.value)}
                    rows={6}
                    maxLength={2000}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)] font-mono text-[16px] sm:text-sm px-3 py-2 focus:outline-none focus:border-[var(--border-hover)] resize-none transition-colors"
                  />
                  <div className="text-right font-mono text-[10px] text-[var(--text-faint)]">
                    {shareCaption.length}/2000
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleShare}
                      disabled={isSharing}
                      className="bg-[var(--accent-green)]/10 text-[var(--accent-green)] border border-[var(--accent-green)]/30 px-4 py-2 font-mono text-sm hover:bg-[var(--accent-green)]/20 disabled:opacity-40 transition-colors"
                    >
                      {isSharing ? t('analyze.result.sharing') : t('analyze.share.post')}
                    </button>
                    <button
                      onClick={() => setShowShareEditor(false)}
                      className="text-[var(--text-faint)] hover:text-[var(--text)] font-mono text-sm transition-colors"
                    >
                      {t('post.cancel')}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => { setActiveAnalysis(null); setSharedPostId(null); setShowShareEditor(false); }}
                  className="text-[var(--text-muted)] hover:text-[var(--text)] font-mono text-sm transition-colors"
                >
                  {t('analyze.result.newAnalysis')}
                </button>
                {sharedPostId ? (
                  <Link
                    to={`/post/${sharedPostId}`}
                    className="text-emerald-400 font-mono text-sm hover:underline"
                  >
                    {t('analyze.result.shared')}
                  </Link>
                ) : !showShareEditor ? (
                  <button
                    onClick={() => openShareEditor(activeAnalysis)}
                    className="bg-[var(--accent-green)]/10 text-[var(--accent-green)] border border-[var(--accent-green)]/30 px-3 py-1 font-mono text-sm hover:bg-[var(--accent-green)]/20 transition-colors"
                  >
                    {t('analyze.result.share')}
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            // Input form
            <div className="space-y-4">
              <p className="text-[var(--text-faint)] text-xs font-mono">{t('analyze.section')}</p>

              <div className="space-y-1">
                <label className="text-[var(--text-muted)] font-mono text-xs">{t('analyze.repoLabel')}</label>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-faint)] font-mono text-sm shrink-0">{t('analyze.repoPrefix')}</span>
                  <input
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                    placeholder={t('analyze.repoPlaceholder')}
                    className="flex-1 bg-[#0d1117] border border-[var(--border)] text-[var(--text)] font-mono text-[16px] sm:text-sm px-3 py-2 placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--text-muted)]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[var(--text-muted)] font-mono text-xs">{t('analyze.outputLabel')}</span>
                <div className="flex gap-2 mt-1">
                  {OUTPUT_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setOutputType(t)}
                      className={`px-3 py-1.5 font-mono text-xs border transition-colors ${
                        outputType === t
                          ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)] border-[var(--accent-green)]/30'
                          : 'text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--border-hover)]'
                      }`}
                    >
                      [{t}]
                    </button>
                  ))}
                </div>
              </div>

              {/* User prompt */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)] font-mono text-xs">{t('analyze.promptLabel')}</span>
                  <div className="flex items-center gap-2">
                    {promptFile && (
                      <span className="font-mono text-[10px] text-[var(--accent-cyan)] flex items-center gap-1">
                        📄 {promptFile}
                        <button
                          onClick={() => { setPromptFile(null); setUserPrompt(''); }}
                          className="text-[var(--text-faint)] hover:text-red-400 ml-1 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    <button
                      onClick={() => mdFileRef.current?.click()}
                      className="font-mono text-[10px] text-[var(--text-faint)] hover:text-[var(--accent-cyan)] border border-[var(--border)] px-2 py-0.5 transition-colors"
                      title={t('analyze.promptFileHint')}
                    >
                      📎 .md
                    </button>
                    <input
                      ref={mdFileRef}
                      type="file"
                      accept=".md,text/markdown"
                      className="hidden"
                      onChange={handleMdFile}
                    />
                  </div>
                </div>
                <textarea
                  value={userPrompt}
                  onChange={(e) => { setUserPrompt(e.target.value); if (promptFile) setPromptFile(null); }}
                  placeholder={t('analyze.promptPlaceholder')}
                  rows={2}
                  maxLength={500}
                  className="w-full bg-[#0d1117] border border-[var(--border)] text-[var(--text)] font-mono text-sm px-3 py-2 placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--text-muted)] resize-none transition-colors"
                />
                {userPrompt.length > 0 && (
                  <div className="text-right font-mono text-[10px] text-[var(--text-faint)]">
                    {userPrompt.length}/500
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-muted)] font-mono text-xs">{t('analyze.modelLabel')}</span>
                  <select
                    value={llmModel}
                    onChange={(e) => setLlmModel(e.target.value)}
                    className="bg-[#0d1117] border border-[var(--border)] text-[var(--text)] font-mono text-xs px-2 py-1.5 focus:outline-none"
                  >
                    {modelOptions.length === 0 ? (
                      <option value="">{t('analyze.modelEmpty')}</option>
                    ) : (
                      modelOptions.map((m) => <option key={m} value={m}>{m}</option>)
                    )}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-muted)] font-mono text-xs">{t('analyze.langLabel')}</span>
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="bg-[#0d1117] border border-[var(--border)] text-[var(--text)] font-mono text-xs px-2 py-1.5 focus:outline-none"
                  >
                    <option value="en">en</option>
                    <option value="ko">ko</option>
                    <option value="zh">zh</option>
                    <option value="ja">ja</option>
                  </select>
                </div>
              </div>

              {modelOptions.length === 0 ? (
                <div className="border border-[var(--border)] p-3 text-xs font-mono space-y-1">
                  <span className="text-[var(--text-faint)]">{t('analyze.noModel.error')}</span>
                  <div>
                    <Link
                      to="/settings"
                      className="text-[var(--accent-green)] hover:underline"
                    >
                      {t('analyze.noModel.link')}
                    </Link>
                    <span className="text-[var(--text-faint)] ml-2">{t('analyze.noModel.hint')}</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={!repo.trim() || !llmModel.trim() || isStarting}
                  className="bg-[var(--accent-green)]/10 text-[var(--accent-green)] border border-[var(--accent-green)]/30 px-4 py-2 font-mono text-sm hover:bg-[var(--accent-green)]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {isStarting ? t('analyze.starting') : t('analyze.start')}
                </button>
              )}
            </div>
          )}
        </div>


      </div>
    </AppShell>
  );
}
