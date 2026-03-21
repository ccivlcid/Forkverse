import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePostStore } from '../stores/postStore.js';
import { useFeedStore } from '../stores/feedStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { useUiStore } from '../stores/uiStore.js';

const ACCEPT = 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime';

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { t } = useUiStore();
  const {
    draft, selectedLang,
    isSubmitting, isUploading, uploadError,
    attachedRepo, attachedMedia,
    setDraft, setLang, removeRepo, attachRepo,
    uploadMedia, removeMedia, submitPost,
  } = usePostStore();
  const { prependPost } = useFeedStore();

  const [repoInput, setRepoInput] = useState('');
  const [showRepo, setShowRepo] = useState(false);
  const [posted, setPosted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const apiBase = import.meta.env.VITE_API_URL ?? '/api';
  const mediaUrl = (url: string) => `${apiBase.replace(/\/api$/, '')}${url}`;

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [draft]);

  // Paste image
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files: File[] = [];
      for (const item of e.clipboardData?.items ?? []) {
        if (item.kind === 'file' && (item.type.startsWith('image/') || item.type.startsWith('video/'))) {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length) { e.preventDefault(); uploadMedia(files); }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [uploadMedia]);

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') navigate(-1); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate]);

  // Focus on mount
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 60);
  }, []);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    uploadMedia(Array.from(files));
  }, [uploadMedia]);

  const handleRepoAttach = () => {
    const trimmed = repoInput.trim().replace(/^https?:\/\/github\.com\//, '');
    const match = trimmed.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
    if (!match?.[1] || !match?.[2]) return;
    attachRepo(match[1], match[2]);
    setRepoInput('');
    setShowRepo(false);
  };

  const handleSubmit = async () => {
    const post = await submitPost();
    if (post) {
      prependPost(post);
      setPosted(true);
      setTimeout(() => navigate('/feed'), 500);
    }
  };

  const isBusy = isSubmitting || isUploading;
  const canPost = (draft.trim().length > 0 || attachedMedia.length > 0) && !isBusy;

  if (posted) {
    return (
      <div className="fixed inset-0 bg-[var(--bg-void)] sm:bg-black/60 flex items-center justify-center z-50">
        <span className="text-[var(--accent-green)] font-mono text-lg">✓</span>
      </div>
    );
  }

  // ── Shared inner content (mobile full-screen / desktop modal) ──
  const inner = (
    <div className="flex flex-col w-full h-full sm:h-auto sm:max-h-[80vh]">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 h-12 shrink-0 border-b border-[var(--border)]/30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-[var(--text-faint)] hover:text-[var(--text)] transition-colors p-1 -ml-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          {/* Desktop only: title */}
          <span className="hidden sm:inline font-mono text-[11px] text-[var(--text-faint)]">
            <span className="text-[var(--accent-green)]">$</span> post --new
          </span>
        </div>

        <button
          onClick={() => void handleSubmit()}
          disabled={!canPost}
          className={`font-sans text-[13px] font-semibold px-5 py-1.5 rounded-full transition-all ${
            canPost
              ? 'bg-white text-black hover:bg-white/90 active:scale-95'
              : 'bg-white/10 text-white/25 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? '...' : t('composer.button.submit')}
        </button>
      </header>

      {/* ── Writing area ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 flex flex-col gap-3">

        {/* Author */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)]/40 flex items-center justify-center font-mono text-xs text-[var(--accent-amber)] shrink-0">
            {user?.username[0]?.toUpperCase() ?? '?'}
          </div>
          <span className="font-mono text-[13px] text-[var(--accent-amber)]">@{user?.username}</span>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="무슨 생각을 하고 있나요?"
          disabled={isBusy}
          rows={4}
          className="w-full bg-transparent text-[var(--text)] text-[16px] sm:text-[15px] leading-relaxed resize-none outline-none placeholder:text-[var(--text-faint)]/40 overflow-hidden"
          style={{ fontFamily: 'var(--font-sans)', minHeight: '120px' }}
        />

        {/* Repo input */}
        {showRepo && (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRepoAttach();
                if (e.key === 'Escape') setShowRepo(false);
              }}
              placeholder="owner/repo"
              autoFocus
              className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)]/60 text-[var(--text)] font-mono text-sm px-3 py-2 outline-none focus:border-[var(--accent-blue)]/60"
            />
            <button onClick={handleRepoAttach} className="text-[var(--accent-blue)] font-mono text-sm px-2 py-2">↵</button>
            <button onClick={() => setShowRepo(false)} className="text-[var(--text-faint)] font-mono text-sm py-2 px-1">×</button>
          </div>
        )}

        {/* Attached repo chip */}
        {attachedRepo && (
          <div className="flex items-center gap-2 self-start bg-[var(--bg-elevated)] border border-[var(--border)]/40 px-3 py-1 font-mono text-xs">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[var(--accent-blue)]">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
            <span className="text-[var(--accent-blue)]">{attachedRepo.owner}/{attachedRepo.name}</span>
            <button onClick={removeRepo} className="text-[var(--text-faint)] hover:text-red-400 transition-colors ml-0.5">×</button>
          </div>
        )}

        {uploadError && (
          <p className="font-mono text-xs text-red-400">{uploadError}</p>
        )}

        {/* Media grid */}
        {attachedMedia.length > 0 && (
          <div className={`grid gap-1 overflow-hidden ${
            attachedMedia.length === 1 ? 'grid-cols-1' :
            attachedMedia.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
          }`}>
            {attachedMedia.map((media) => (
              <div key={media.id} className="relative aspect-square bg-[var(--bg-elevated)] overflow-hidden group">
                {media.mimeType.startsWith('video/') ? (
                  <video src={mediaUrl(media.url)} className="w-full h-full object-cover" muted playsInline />
                ) : (
                  <img src={mediaUrl(media.url)} alt="" className="w-full h-full object-cover" />
                )}
                <button
                  onClick={() => removeMedia(media.id)}
                  className="absolute top-1.5 right-1.5 bg-black/60 text-white text-xs w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity rounded-full"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {isUploading && (
          <p className="font-mono text-[11px] text-[var(--text-faint)] animate-pulse">uploading...</p>
        )}
      </div>

      {/* ── Bottom bar ── */}
      <div className="shrink-0 border-t border-[var(--border)]/30 pb-safe">
        <div className="flex items-center px-3 sm:px-4 py-2 gap-1">

          {/* Photo */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={attachedMedia.length >= 4 || isUploading}
            className="p-2.5 text-[var(--accent-blue)] disabled:opacity-30 transition-opacity rounded-full hover:bg-[var(--accent-blue)]/10 active:bg-[var(--accent-blue)]/20"
            aria-label="사진/동영상 첨부"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </button>
          <input ref={fileInputRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />

          {/* Repo */}
          <button
            onClick={() => setShowRepo((v) => !v)}
            className={`p-2.5 transition-colors rounded-full ${
              showRepo || attachedRepo
                ? 'text-[var(--accent-blue)] bg-[var(--accent-blue)]/10'
                : 'text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:bg-white/5'
            }`}
            aria-label="GitHub 저장소 첨부"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
          </button>

          {/* Language — right side */}
          <div className="ml-auto">
            <select
              value={selectedLang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-transparent text-[var(--text-faint)] font-mono text-[11px] outline-none cursor-pointer hover:text-[var(--text-muted)] transition-colors"
            >
              {['auto', 'en', 'ko', 'zh', 'ja'].map((l) => (
                <option key={l} value={l} className="bg-[var(--bg-elevated)]">{l}</option>
              ))}
            </select>
          </div>

        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: full-screen */}
      <div className="sm:hidden fixed inset-0 z-50 bg-[var(--bg-void)] flex flex-col">
        {inner}
      </div>

      {/* Desktop: centered modal with backdrop */}
      <div
        className="hidden sm:flex fixed inset-0 z-50 items-start justify-center pt-[8vh] bg-black/60 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) navigate(-1); }}
      >
        <div className="w-full max-w-[600px] bg-[var(--bg-surface)] border border-[var(--border)]/60 shadow-2xl shadow-black/80 flex flex-col max-h-[80vh]">
          {inner}
        </div>
      </div>
    </>
  );
}
