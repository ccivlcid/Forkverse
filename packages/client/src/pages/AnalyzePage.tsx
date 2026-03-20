import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.js';
import { useAuthStore } from '../stores/authStore.js';
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
    step.status === 'active' ? 'text-yellow-400' : 'text-gray-600';

  return (
    <div className="flex items-center justify-between font-mono text-sm">
      <span className="text-gray-400">&gt; {step.name}{step.detail ? `: ${step.detail}` : ''}...</span>
      <span className={color}>{icon}</span>
    </div>
  );
}

function AnalysisCard({ analysis, onSelect }: { analysis: AnalysisResult; onSelect: () => void }) {
  const elapsed = analysis.durationMs ? `${(analysis.durationMs / 1000).toFixed(1)}s` : null;
  const statusColor =
    analysis.status === 'completed' ? 'text-emerald-400' :
    analysis.status === 'failed' ? 'text-red-400' :
    'text-yellow-400';

  return (
    <button
      onClick={onSelect}
      className="w-full text-left border border-gray-700 bg-[#16213e] p-4 hover:border-gray-600 transition-colors space-y-1"
    >
      <div className="flex items-center justify-between">
        <span className="text-gray-200 font-mono text-sm">■ {analysis.repoOwner}/{analysis.repoName}</span>
        <span className={`font-mono text-xs ${statusColor}`}>{analysis.status}</span>
      </div>
      <div className="text-gray-500 font-mono text-xs flex gap-3">
        <span>{analysis.outputType}</span>
        <span>·</span>
        <span>{analysis.llmModel}</span>
        {elapsed && <><span>·</span><span>{elapsed}</span></>}
      </div>
      {analysis.resultSummary && (
        <p className="text-gray-400 font-sans text-xs mt-2 line-clamp-2">
          {analysis.resultSummary.slice(0, 120)}...
        </p>
      )}
    </button>
  );
}

export default function AnalyzePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  // Form state
  const [repo, setRepo] = useState('');
  const [outputType, setOutputType] = useState<OutputType>('report');
  const [llmModel, setLlmModel] = useState('');
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [lang, setLang] = useState('en');
  const [isStarting, setIsStarting] = useState(false);

  // Active analysis
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisResult | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [sharedPostId, setSharedPostId] = useState<string | null>(null);

  // History
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

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

  // Load history
  useEffect(() => {
    if (!isAuthenticated) return;
    api.get<ApiResponse<AnalysisResult[]>>('/analyze')
      .then((res) => setHistory(res.data))
      .catch(() => toastError('Failed to load analysis history'))
      .finally(() => setHistoryLoading(false));
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
            setHistory((h) => [res.data, ...h.filter((a) => a.id !== res.data.id)]);
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
      const res = await api.post<ApiResponse<{ postId: string }>>(`/analyze/${activeAnalysis.id}/share`);
      setSharedPostId(res.data.postId);
    } catch { toastError('Failed to share analysis'); } finally {
      setIsSharing(false);
    }
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
        <div className="border border-gray-700 bg-[#16213e] p-6 space-y-4">

          {activeAnalysis && (activeAnalysis.status === 'pending' || activeAnalysis.status === 'processing') ? (
            // Progress view
            <div className="space-y-3">
              <p className="text-gray-600 text-xs font-mono">// analyzing repo</p>
              <p className="text-gray-300 font-mono text-sm">
                $ analyze --repo={activeAnalysis.repoOwner}/{activeAnalysis.repoName} --output={activeAnalysis.outputType}
              </p>
              <div className="space-y-2 mt-4">
                {activeAnalysis.progress.map((step, i) => (
                  <ProgressLine key={i} step={step} />
                ))}
              </div>
              <p className="text-gray-600 font-mono text-xs mt-3">elapsed: {elapsed.toFixed(1)}s</p>
              <button
                onClick={() => {
                  setActiveAnalysis(null);
                  if (pollingRef.current) clearTimeout(pollingRef.current);
                  if (elapsedRef.current) clearInterval(elapsedRef.current);
                }}
                className="text-gray-600 hover:text-gray-300 font-mono text-sm border border-gray-700 px-4 py-1.5 hover:border-gray-600 transition-colors"
              >
                $ cancel
              </button>
            </div>
          ) : activeAnalysis?.status === 'completed' ? (
            // Result view
            <div className="space-y-3">
              <p className="text-gray-600 text-xs font-mono">// analysis complete</p>
              <p className="text-emerald-400 font-mono text-sm">
                ✓ {activeAnalysis.repoOwner}/{activeAnalysis.repoName} · {activeAnalysis.durationMs ? `${(activeAnalysis.durationMs / 1000).toFixed(1)}s` : ''}
              </p>

              {activeAnalysis.outputType === 'video' ? (
                <div className="border border-gray-700 bg-[#0d1117] p-6 text-center space-y-3">
                  <p className="text-green-400 font-mono text-sm">■ terminal animation ready</p>
                  <p className="text-gray-400 font-mono text-xs">interactive HTML — plays in browser</p>
                  {activeAnalysis.resultUrl ? (
                    <a
                      href={`/api/analyze/${activeAnalysis.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-purple-400/10 text-purple-400 border border-purple-400/30 px-4 py-2 font-mono text-sm hover:bg-purple-400/20 transition-colors"
                    >
                      ▶ open animation
                    </a>
                  ) : (
                    <p className="text-gray-600 font-mono text-xs">// animation unavailable — see summary</p>
                  )}
                  {activeAnalysis.resultSummary && (
                    <details className="text-left mt-2">
                      <summary className="text-gray-600 font-mono text-xs cursor-pointer hover:text-gray-400">// view summary text</summary>
                      <div className="border border-gray-700 bg-[#0d1117] p-4 font-sans text-sm text-gray-300 whitespace-pre-wrap max-h-64 overflow-y-auto mt-2">
                        {activeAnalysis.resultSummary}
                      </div>
                    </details>
                  )}
                </div>
              ) : activeAnalysis.outputType === 'pptx' ? (
                <div className="border border-gray-700 bg-[#0d1117] p-6 text-center space-y-3">
                  <p className="text-green-400 font-mono text-sm">■ presentation ready</p>
                  <p className="text-gray-400 font-mono text-xs">
                    {activeAnalysis.resultUrl ? '5 slides generated' : 'summary generated (pptx unavailable)'}
                  </p>
                  {activeAnalysis.resultUrl && (
                    <a
                      href={`/api/analyze/${activeAnalysis.id}/download`}
                      download
                      className="inline-block bg-sky-400/10 text-sky-400 border border-sky-400/30 px-4 py-2 font-mono text-sm hover:bg-sky-400/20 transition-colors"
                    >
                      ↓ download .pptx
                    </a>
                  )}
                  {activeAnalysis.resultSummary && (
                    <details className="text-left mt-2">
                      <summary className="text-gray-600 font-mono text-xs cursor-pointer hover:text-gray-400">// view summary text</summary>
                      <div className="border border-gray-700 bg-[#0d1117] p-4 font-sans text-sm text-gray-300 whitespace-pre-wrap max-h-64 overflow-y-auto mt-2">
                        {activeAnalysis.resultSummary}
                      </div>
                    </details>
                  )}
                </div>
              ) : (
                <div className="border border-gray-700 bg-[#0d1117] p-4 font-sans text-sm text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {activeAnalysis.resultSummary}
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => { setActiveAnalysis(null); setSharedPostId(null); }}
                  className="text-gray-500 hover:text-gray-300 font-mono text-sm transition-colors"
                >
                  ← new analysis
                </button>
                {sharedPostId ? (
                  <Link
                    to={`/post/${sharedPostId}`}
                    className="text-emerald-400 font-mono text-sm hover:underline"
                  >
                    ✓ shared → view post
                  </Link>
                ) : (
                  <button
                    onClick={handleShare}
                    disabled={isSharing}
                    className="bg-green-400/10 text-green-400 border border-green-400/30 px-3 py-1 font-mono text-sm hover:bg-green-400/20 disabled:opacity-40 transition-colors"
                  >
                    {isSharing ? '$ sharing...' : '$ share --to=feed'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            // Input form
            <div className="space-y-4">
              <p className="text-gray-600 text-xs font-mono">// analyze github repo</p>

              <div className="space-y-1">
                <label className="text-gray-500 font-mono text-xs">$ analyze</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 font-mono text-sm shrink-0">--repo=</span>
                  <input
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                    placeholder="owner/repo or github.com/owner/repo"
                    className="flex-1 bg-[#0d1117] border border-gray-700 text-gray-200 font-mono text-sm px-3 py-2 placeholder-gray-700 focus:outline-none focus:border-gray-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-gray-500 font-mono text-xs">--output=</span>
                <div className="flex gap-2 mt-1">
                  {OUTPUT_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setOutputType(t)}
                      className={`px-3 py-1.5 font-mono text-xs border transition-colors ${
                        outputType === t
                          ? 'bg-green-400/10 text-green-400 border-green-400/30'
                          : 'text-gray-500 border-gray-700 hover:text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      [{t}]
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-mono text-xs">--model=</span>
                  <select
                    value={llmModel}
                    onChange={(e) => setLlmModel(e.target.value)}
                    className="bg-[#0d1117] border border-gray-700 text-gray-300 font-mono text-xs px-2 py-1.5 focus:outline-none"
                  >
                    {modelOptions.length === 0 ? (
                      <option value="">— load models from CLI or Settings (API keys) —</option>
                    ) : (
                      modelOptions.map((m) => <option key={m} value={m}>{m}</option>)
                    )}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-mono text-xs">--lang=</span>
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="bg-[#0d1117] border border-gray-700 text-gray-300 font-mono text-xs px-2 py-1.5 focus:outline-none"
                  >
                    <option value="en">en</option>
                    <option value="ko">ko</option>
                    <option value="zh">zh</option>
                    <option value="ja">ja</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleStart}
                disabled={!repo.trim() || !llmModel.trim() || isStarting}
                className="bg-green-400/10 text-green-400 border border-green-400/30 px-4 py-2 font-mono text-sm hover:bg-green-400/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isStarting ? '$ starting...' : '[Enter] start analysis'}
              </button>
            </div>
          )}
        </div>

        {/* History */}
        <div className="space-y-3">
          <p className="text-gray-600 font-mono text-xs border-b border-gray-700 pb-2">// your analyses</p>

          {historyLoading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-700 bg-[#16213e] p-4 h-16" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="border border-gray-700 bg-[#16213e] p-6 text-center">
              <p className="text-green-400 font-mono text-sm">$ analyses --list</p>
              <p className="text-orange-400 font-mono text-sm mt-1">&gt; 0 analyses found.</p>
              <p className="text-gray-400 font-sans text-sm mt-2">Start your first repo analysis above.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {history.map((a) => (
                <AnalysisCard
                  key={a.id}
                  analysis={a}
                  onSelect={() => setActiveAnalysis(a)}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
