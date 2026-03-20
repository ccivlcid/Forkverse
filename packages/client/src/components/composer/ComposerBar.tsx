import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePostStore } from '../../stores/postStore.js';
import { useFeedStore } from '../../stores/feedStore.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useUiStore } from '../../stores/uiStore.js';
const LANGS = ['auto', 'en', 'ko', 'zh', 'ja'];

export default function ComposerBar() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [repoInput, setRepoInput] = useState('');
  const [showRepoInput, setShowRepoInput] = useState(false);
  const {
    draft,
    cliPreview,
    selectedLang,
    selectedModel,
    isTransforming,
    isSubmitting,
    transformError,
    attachedRepo,
    setDraft,
    setLang,
    removeRepo,
    attachRepo,
    transformToCli,
    submitPost,
  } = usePostStore();
  const { prependPost } = useFeedStore();
  const { t } = useUiStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Expose focus via "/" hotkey
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      textareaRef.current?.blur();
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const post = await submitPost();
    if (post) {
      prependPost(post);
    }
  };

  const handleTransform = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    await transformToCli();
  };

  const handleRepoAttach = () => {
    const trimmed = repoInput.trim();
    const match = trimmed.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
    const owner = match?.[1];
    const name = match?.[2];
    if (!owner || !name) return;
    attachRepo(owner, name);
    setRepoInput('');
    setShowRepoInput(false);
  };

  const isBusy = isTransforming || isSubmitting;
  const noModel = !selectedModel;

  return (
    <div className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
      {/* Textarea */}
      <div className="px-5 pt-5 pb-3">
        <textarea
          ref={textareaRef}
          data-testid="composer-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('composer.placeholder')}
          rows={3}
          disabled={isBusy}
          aria-label="Write a new post"
          className="w-full bg-transparent text-[var(--text)] text-[15px] leading-[1.7] resize-none outline-none placeholder:text-[var(--text-faint)]/60 disabled:opacity-40"
          style={{ fontFamily: 'var(--font-sans)' }}
        />
      </div>

      {/* Repo attachment preview */}
      {attachedRepo && (
        <div
          data-testid="repo-attach-preview"
          className="mx-5 mb-2 flex items-center gap-2 bg-[var(--bg-void)] border border-[var(--border)] px-3 py-1.5 font-mono text-[11px]"
        >
          <span className="text-[var(--accent-blue)]">📎 {attachedRepo.owner}/{attachedRepo.name}</span>
          <button
            data-testid="repo-remove-button"
            onClick={removeRepo}
            className="text-[var(--text-faint)] hover:text-[var(--color-error)] ml-auto transition-colors"
            aria-label="Remove attached repository"
          >
            {t('composer.repo.remove')}
          </button>
        </div>
      )}

      {/* CLI preview */}
      {cliPreview && (
        <div className="mx-5 mb-2 bg-[var(--bg-cli)] border border-[var(--border)] px-4 py-3">
          <span className="text-[var(--text-faint)] text-[10px] font-mono block mb-1">$</span>
          <pre className="text-[var(--accent-green)] font-mono text-[12px] whitespace-pre-wrap">{cliPreview}</pre>
        </div>
      )}

      {/* Transform error */}
      {transformError && (
        <p className="mx-5 mb-2 px-3 py-2 bg-[var(--color-error-bg)] text-[var(--color-error)] border border-[var(--color-error-border)] font-mono text-[11px]">
          error: {transformError}
        </p>
      )}

      {/* Repo input */}
      {showRepoInput && (
        <div className="px-5 pb-2 flex items-center gap-2">
          <input
            type="text"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRepoAttach();
              if (e.key === 'Escape') { setShowRepoInput(false); setRepoInput(''); }
            }}
            placeholder="owner/repo"
            aria-label="Repository in owner/repo format"
            className="flex-1 bg-[var(--bg-void)] border border-[var(--border)] text-[var(--text)] font-mono text-[11px] px-3 py-1.5 outline-none focus:border-[var(--accent-blue)]/30 placeholder:text-[var(--text-faint)] transition-colors"
            autoFocus
          />
          <button
            onClick={handleRepoAttach}
            disabled={!repoInput.match(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/)}
            className="text-[var(--accent-blue)] font-mono text-[11px] hover:text-[#93c5fd] disabled:opacity-30 transition-colors"
          >
            attach
          </button>
          <button
            onClick={() => { setShowRepoInput(false); setRepoInput(''); }}
            className="text-[var(--text-faint)] hover:text-[var(--text-muted)] font-mono text-[11px] transition-colors"
          >
            cancel
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="border-t border-[var(--bg-void)] px-5 py-2.5 flex items-center gap-3">
        <span className="text-[var(--text-muted)] font-mono text-[10px] hidden sm:block">
          {t('composer.hint')}
        </span>

        <div className="flex items-center gap-2 ml-auto">
          {selectedModel && (
            <span className="text-[var(--text-muted)] font-mono text-[10px] border border-[var(--border-hover)] px-2 py-0.5">
              {selectedModel}
            </span>
          )}

          {/* No model hint */}
          {noModel && (
            <span className="text-[var(--accent-amber)]/60 font-mono text-[10px]">
              select model →
            </span>
          )}

          <select
            value={selectedLang}
            onChange={(e) => setLang(e.target.value)}
            className="bg-[var(--bg-void)] border border-[var(--border-hover)] text-[var(--text-muted)] text-[11px] px-2 py-1 font-mono outline-none hover:border-[var(--border-hover)] transition-colors cursor-pointer"
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          {!attachedRepo && (
            <button
              onClick={() => setShowRepoInput((v) => !v)}
              className={`font-mono text-[11px] px-2 py-1 border transition-colors ${
                showRepoInput
                  ? 'text-[var(--accent-blue)] border-[var(--accent-blue)]/30 bg-[var(--accent-blue)]/5'
                  : 'text-[var(--text-muted)] border-[var(--border-hover)] hover:text-[var(--text)]'
              }`}
              title="Attach GitHub repo"
            >
              {t('composer.repo.attach')}
            </button>
          )}

          <button
            onClick={() => void handleTransform()}
            disabled={!draft.trim() || isBusy || noModel}
            title={noModel ? 'Select an LLM model first' : !draft.trim() ? 'Write something first' : ''}
            className="border border-[var(--border-hover)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-hover)] px-3 py-1.5 font-mono text-[11px] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {isTransforming ? t('composer.button.transforming') : t('composer.button.transform')}
          </button>

          <button
            data-testid="composer-submit"
            onClick={() => void handleSubmit()}
            disabled={!draft.trim() || isBusy || noModel}
            title={noModel ? 'Select an LLM model first' : !draft.trim() ? 'Write something first' : ''}
            className="bg-[var(--accent-green)]/10 text-[var(--accent-green)] border border-[var(--accent-green)]/20 px-4 py-1.5 font-mono text-[12px] hover:bg-[var(--accent-green)]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? t('composer.button.submitting') : t('composer.button.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
