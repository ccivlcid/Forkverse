import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePostStore } from '../../stores/postStore.js';
import { useFeedStore } from '../../stores/feedStore.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useUiStore } from '../../stores/uiStore.js';

const LANGS = ['auto', 'en', 'ko', 'zh', 'ja'];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ComposerModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const {
    draft, cliPreview, selectedLang, selectedModel,
    isTransforming, isSubmitting, transformError, attachedRepo,
    setDraft, setLang, removeRepo, attachRepo, transformToCli, submitPost,
  } = usePostStore();
  const { prependPost } = useFeedStore();
  const { t } = useUiStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [repoInput, setRepoInput] = useState('');
  const [showRepoInput, setShowRepoInput] = useState(false);

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleSubmit = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const post = await submitPost();
    if (post) {
      prependPost(post);
      onClose();
    }
  };

  const handleTransform = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    await transformToCli();
  };

  const handleRepoAttach = () => {
    const match = repoInput.trim().match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
    if (!match?.[1] || !match?.[2]) return;
    attachRepo(match[1], match[2]);
    setRepoInput('');
    setShowRepoInput(false);
  };

  if (!open) return null;

  const isBusy = isTransforming || isSubmitting;
  const noModel = !selectedModel;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />

      {/* Modal */}
      <div className="relative w-full max-w-[600px] bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl shadow-black/50 flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]/40">
          <span className="font-mono text-[12px] text-[var(--text-muted)]">
            <span className="text-[var(--accent-green)]">$</span> new post
          </span>
          <button
            onClick={onClose}
            className="text-[var(--text-faint)] hover:text-[var(--text)] font-mono text-[11px] transition-colors"
          >
            [esc]
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Textarea */}
          <div className="px-5 pt-4 pb-3">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
              }}
              placeholder={t('composer.placeholder')}
              rows={5}
              disabled={isBusy}
              className="w-full bg-transparent text-[var(--text)] text-[15px] leading-[1.7] resize-none outline-none placeholder:text-[var(--text-faint)]/60 disabled:opacity-40"
              style={{ fontFamily: 'var(--font-sans)' }}
            />
          </div>

          {/* Repo attachment */}
          {attachedRepo && (
            <div className="mx-5 mb-3 flex items-center gap-2 bg-[var(--bg-void)] border border-[var(--border)] px-3 py-1.5 font-mono text-[11px]">
              <span className="text-[var(--accent-blue)]">{attachedRepo.owner}/{attachedRepo.name}</span>
              <button onClick={removeRepo} className="text-[var(--text-faint)] hover:text-[var(--color-error)] ml-auto transition-colors">
                {t('composer.repo.remove')}
              </button>
            </div>
          )}

          {/* CLI preview */}
          {cliPreview && (
            <div className="mx-5 mb-3 bg-[var(--bg-cli)] border border-[var(--border)] px-4 py-3">
              <span className="text-[var(--text-faint)] text-[10px] font-mono block mb-1">$</span>
              <pre className="text-[var(--accent-green)] font-mono text-[12px] whitespace-pre-wrap">{cliPreview}</pre>
            </div>
          )}

          {/* Error */}
          {transformError && (
            <p className="mx-5 mb-3 px-3 py-2 bg-[var(--color-error-bg)] text-[var(--color-error)] border border-[var(--color-error-border)] font-mono text-[11px]">
              error: {transformError}
            </p>
          )}

          {/* Repo input */}
          {showRepoInput && (
            <div className="px-5 pb-3 flex items-center gap-2">
              <input
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRepoAttach();
                  if (e.key === 'Escape') { setShowRepoInput(false); setRepoInput(''); }
                }}
                placeholder="owner/repo"
                className="flex-1 bg-[var(--bg-void)] border border-[var(--border)] text-[var(--text)] font-mono text-[11px] px-3 py-1.5 outline-none focus:border-[var(--accent-blue)]/30 placeholder:text-[var(--text-faint)] transition-colors"
                autoFocus
              />
              <button onClick={handleRepoAttach} disabled={!repoInput.match(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/)} className="text-[var(--accent-blue)] font-mono text-[11px] disabled:opacity-30">attach</button>
              <button onClick={() => { setShowRepoInput(false); setRepoInput(''); }} className="text-[var(--text-faint)] font-mono text-[11px]">cancel</button>
            </div>
          )}
        </div>

        {/* Footer toolbar */}
        <div className="border-t border-[var(--border)]/40 px-5 py-3 flex items-center gap-2">
          {/* Attachment buttons */}
          <div className="flex items-center gap-1">
            {!attachedRepo && (
              <button
                onClick={() => setShowRepoInput((v) => !v)}
                className={`font-mono text-[11px] px-2 py-1 border transition-colors ${
                  showRepoInput
                    ? 'text-[var(--accent-blue)] border-[var(--accent-blue)]/30 bg-[var(--accent-blue)]/5'
                    : 'text-[var(--text-faint)] border-[var(--border)] hover:text-[var(--text-muted)]'
                }`}
                title="Attach GitHub repo"
              >
                repo
              </button>
            )}

            <select
              value={selectedLang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-[var(--bg-void)] border border-[var(--border)] text-[var(--text-muted)] text-[11px] px-2 py-1 font-mono outline-none cursor-pointer"
            >
              {LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 ml-auto">
            {selectedModel && (
              <span className="text-[var(--text-faint)] font-mono text-[10px] border border-[var(--border)] px-2 py-0.5">
                {selectedModel}
              </span>
            )}
            {noModel && (
              <span className="text-[var(--accent-amber)]/60 font-mono text-[10px]">
                select model →
              </span>
            )}

            <button
              onClick={() => void handleTransform()}
              disabled={!draft.trim() || isBusy || noModel}
              className="border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] px-3 py-1.5 font-mono text-[11px] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {isTransforming ? t('composer.button.transforming') : t('composer.button.transform')}
            </button>

            <button
              onClick={() => void handleSubmit()}
              disabled={!draft.trim() || isBusy || noModel}
              className="bg-[var(--accent-green)]/10 text-[var(--accent-green)] border border-[var(--accent-green)]/20 px-4 py-1.5 font-mono text-[12px] hover:bg-[var(--accent-green)]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? t('composer.button.submitting') : t('composer.button.submit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
