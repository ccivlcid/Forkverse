import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.js';
import PostCard from '../components/post/PostCard.js';
import { usePostDetailStore } from '../stores/postDetailStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { api } from '../api/client.js';
import type { ApiResponse, Post } from '@forkverse/shared';

// ── Types ─────────────────────────────────────────────────────

interface MentionUser {
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface ReplyTarget {
  id: string;
  username: string;
}

// ── Skeleton ─────────────────────────────────────────────────

function SkeletonPost() {
  return (
    <div className="animate-pulse space-y-4 py-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/[0.04]" />
        <div className="space-y-2">
          <div className="h-3 w-24 bg-white/[0.06] rounded" />
          <div className="h-2.5 w-16 bg-white/[0.04] rounded" />
        </div>
      </div>
      <div className="space-y-2.5 pt-2">
        <div className="h-3 w-full bg-white/[0.05] rounded" />
        <div className="h-3 w-4/5 bg-white/[0.05] rounded" />
        <div className="h-3 w-3/5 bg-white/[0.04] rounded" />
      </div>
    </div>
  );
}

function SkeletonReply() {
  return (
    <div className="animate-pulse py-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-full bg-white/[0.04]" />
        <div className="h-2.5 w-20 bg-white/[0.05] rounded" />
      </div>
      <div className="space-y-2 pl-[38px]">
        <div className="h-2.5 w-full bg-white/[0.04] rounded" />
        <div className="h-2.5 w-2/3 bg-white/[0.04] rounded" />
      </div>
    </div>
  );
}

// ── Mention Autocomplete ─────────────────────────────────────

function useMentionAutocomplete() {
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }
    setSelectedIdx(0);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get<ApiResponse<{ users: MentionUser[] }>>(
          `/posts/search?q=${encodeURIComponent(query)}&limit=5`
        );
        setSuggestions(res.data.users ?? []);
      } catch {
        setSuggestions([]);
      }
    }, 200);
  }, []);

  const clear = useCallback(() => {
    setSuggestions([]);
    setSelectedIdx(0);
  }, []);

  return { suggestions, selectedIdx, setSelectedIdx, search, clear };
}

function getMentionContext(text: string, cursorPos: number): string | null {
  const before = text.slice(0, cursorPos);
  const match = before.match(/@(\w*)$/);
  if (!match) return null;
  return match[1] ?? '';
}

function extractMentions(text: string): string[] {
  const matches = text.match(/@(\w+)/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.slice(1)))];
}

// ── Reply Composer ────────────────────────────────────────────
// Jobs: One text field. One button. Nothing else.

function ReplyComposer({
  parentId,
  parentUsername,
  replyTarget,
  onClearReplyTarget,
}: {
  parentId: string;
  parentUsername: string;
  replyTarget: ReplyTarget | null;
  onClearReplyTarget: () => void;
}) {
  const { isAuthenticated } = useAuthStore();
  const { t } = useUiStore();
  const { draft, isSubmitting, transformError, setDraft, submitReply, clearTransformError } =
    usePostDetailStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const mention = useMentionAutocomplete();

  const targetId = replyTarget?.id ?? parentId;
  const targetUsername = replyTarget?.username ?? parentUsername;
  const canSubmit = draft.trim().length > 0 && !isSubmitting;

  // Auto-prepend @username when reply target changes
  useEffect(() => {
    if (replyTarget) {
      const prefix = `@${replyTarget.username} `;
      if (!draft.startsWith(prefix)) {
        setDraft(prefix + draft);
      }
      textareaRef.current?.focus();
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = prefix.length;
          textareaRef.current.selectionEnd = prefix.length;
        }
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replyTarget?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setDraft(val);
    if (transformError) clearTransformError();

    const cursorPos = e.target.selectionStart;
    const mentionCtx = getMentionContext(val, cursorPos);
    if (mentionCtx !== null) {
      mention.search(mentionCtx);
    } else {
      mention.clear();
    }
  };

  const insertMention = (username: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const cursorPos = textarea.selectionStart;
    const before = draft.slice(0, cursorPos);
    const after = draft.slice(cursorPos);
    const atIdx = before.lastIndexOf('@');
    if (atIdx === -1) return;
    const newDraft = before.slice(0, atIdx) + `@${username} ` + after;
    setDraft(newDraft);
    mention.clear();
    setTimeout(() => {
      const newPos = atIdx + username.length + 2;
      textarea.focus();
      textarea.selectionStart = newPos;
      textarea.selectionEnd = newPos;
    }, 0);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const mentions = extractMentions(draft);
    const result = await submitReply(targetId, mentions);
    if (result) onClearReplyTarget();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Mention autocomplete
    if (mention.suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        mention.setSelectedIdx((mention.selectedIdx + 1) % mention.suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        mention.setSelectedIdx((mention.selectedIdx - 1 + mention.suggestions.length) % mention.suggestions.length);
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        if (mention.suggestions[mention.selectedIdx]) {
          e.preventDefault();
          insertMention(mention.suggestions[mention.selectedIdx]!.username);
          return;
        }
      }
      if (e.key === 'Escape') {
        mention.clear();
        return;
      }
    }

    // Cmd/Ctrl+Enter → submit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void handleSubmit();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="py-8 text-center">
        <p className="text-[var(--text-faint)] font-mono text-[12px] mb-4">
          {t('detail.replyAuth')}
        </p>
        <button
          onClick={() => navigate(`/login?redirect=/post/${parentId}`)}
          className="text-[var(--accent-green)] font-mono text-[12px] hover:text-[var(--accent-green)]/80 transition-colors"
        >
          {t('sidebar.sshConnect')}
        </button>
      </div>
    );
  }

  return (
    <div className="pt-4 pb-6">
      {/* Reply target indicator */}
      {replyTarget && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[var(--text-faint)] font-mono text-[11px]">
            ↩ <span className="text-[var(--accent-amber)]">@{targetUsername}</span>
          </span>
          <button
            onClick={onClearReplyTarget}
            className="font-mono text-[10px] text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Input + Send — one line of intent */}
      <div className="relative">
        <div className="flex items-end gap-2 bg-[var(--bg-surface)] border border-[var(--border)]/40 focus-within:border-[var(--accent-green)]/30 transition-colors">
          <textarea
            ref={textareaRef}
            data-testid="reply-composer-input"
            aria-label={`Reply to @${targetUsername}`}
            value={draft}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={t('detail.replyPlaceholder')}
            rows={2}
            className="flex-1 bg-transparent text-[var(--text)] text-[16px] sm:text-[14px] leading-[1.6] resize-none outline-none placeholder:text-[var(--text-faint)]/40 px-3 py-3 sm:py-2.5"
            style={{ fontFamily: 'var(--font-sans)' }}
          />

          {/* Submit — the only action. Big, green, obvious. */}
          <button
            data-testid="reply-composer-submit"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`shrink-0 font-mono text-[12px] px-4 sm:px-3 py-3 sm:py-2.5 transition-all ${
              canSubmit
                ? 'text-[var(--bg-surface)] bg-[var(--accent-green)] active:bg-[var(--accent-green)]/80'
                : 'text-[var(--text-faint)] bg-transparent'
            }`}
          >
            {isSubmitting ? '...' : '↵'}
          </button>
        </div>

        {/* Mention autocomplete */}
        {mention.suggestions.length > 0 && (
          <div className="absolute left-0 right-0 bottom-full mb-1 z-50 bg-[var(--bg-surface)] border border-[var(--border)] shadow-lg shadow-black/40 max-h-[180px] overflow-y-auto">
            {mention.suggestions.map((user, i) => (
              <button
                key={user.username}
                onMouseDown={(e) => { e.preventDefault(); insertMention(user.username); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 sm:py-2 text-left transition-colors ${
                  i === mention.selectedIdx
                    ? 'bg-[var(--accent-green)]/[0.08] text-[var(--text)]'
                    : 'text-[var(--text-muted)] hover:bg-white/[0.03]'
                }`}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-5 h-5 rounded-full shrink-0" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-[var(--text-faint)]/20 shrink-0 flex items-center justify-center font-mono text-[9px] text-[var(--text-faint)]">
                    {user.username[0]?.toUpperCase()}
                  </span>
                )}
                <span className="font-mono text-[12px] text-[var(--accent-amber)]">@{user.username}</span>
                {user.displayName && user.displayName !== user.username && (
                  <span className="font-mono text-[10px] text-[var(--text-faint)] truncate">{user.displayName}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error — only when something actually fails */}
      {transformError && (
        <p className="mt-2 text-[var(--color-error)] font-mono text-[11px]">
          {transformError}
        </p>
      )}
    </div>
  );
}

// ── Reply Card ───────────────────────────────────────────────

function ReplyCard({ reply, onReplyTo }: { reply: Post; onReplyTo: (target: ReplyTarget) => void }) {
  return (
    <div data-testid="reply-card">
      <PostCard post={reply} />
      <div className="px-5 -mt-1 pb-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReplyTo({ id: reply.id, username: reply.user.username });
          }}
          className="font-mono text-[10px] text-[var(--text-faint)] hover:text-[var(--accent-green)] active:text-[var(--accent-green)] transition-colors py-1"
        >
          ↩ reply
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { post, replies, forkedFrom, isLoading, error, starPost, fetchPost, reset } = usePostDetailStore();
  const { t } = useUiStore();
  const replyThreadRef = useRef<HTMLDivElement>(null);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);

  useEffect(() => {
    if (id) void fetchPost(id);
    return () => reset();
  }, [id, fetchPost, reset]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Backspace' || e.key === 'ArrowLeft') navigate(-1);
      if ((e.key === 'r' || e.key === '/') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        replyThreadRef.current?.querySelector('textarea')?.focus();
      }
      if (e.key === 's' && post) void handleStar(post.id, !post.isStarred);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [post, navigate]);

  const handleStar = async (postId: string, starred: boolean) => {
    starPost(postId, starred);
    try {
      await api.post<ApiResponse<{ starred: boolean; starCount: number }>>(`/posts/${postId}/star`);
    } catch {
      starPost(postId, !starred);
    }
  };

  const handleReplyTo = useCallback((target: ReplyTarget) => {
    setReplyTarget(target);
    setTimeout(() => {
      replyThreadRef.current?.querySelector('textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }, []);

  const handleClearReplyTarget = useCallback(() => {
    setReplyTarget(null);
  }, []);

  if (error) {
    return (
      <AppShell>
        <div className="max-w-[600px] mx-auto px-5 py-16 text-center space-y-6">
          <p className="text-[var(--text-faint)] font-mono text-[12px]">
            <span className="text-[var(--accent-green)]">$</span> post --id={id?.slice(0, 8)}
          </p>
          <p className="text-[var(--color-error)] font-mono text-[13px]">
            {t('detail.notFound')}
          </p>
          <p className="text-[var(--text-muted)] text-[13px]" style={{ fontFamily: 'var(--font-sans)' }}>
            {t('detail.notFoundBody')}
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <button
              onClick={() => navigate(-1)}
              className="text-[var(--text-muted)] hover:text-[var(--text)] font-mono text-[12px] transition-colors"
            >
              {t('detail.back')}
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-[var(--accent-green)] hover:text-[var(--accent-green)]/80 font-mono text-[12px] transition-colors"
            >
              {t('detail.feed')}
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-[600px] mx-auto">

        <div className="px-5 pt-5 pb-2">
          <button
            data-testid="back-button"
            onClick={() => navigate(-1)}
            className="text-[var(--text-faint)] hover:text-[var(--text-muted)] font-mono text-[11px] transition-colors"
          >
            <span className="text-[var(--accent-green)]">$</span> cd ..
          </button>
        </div>

        {!isLoading && forkedFrom && (
          <Link
            data-testid="forked-from-banner"
            to={`/post/${forkedFrom.id}`}
            className="block px-5 py-2 text-[var(--text-faint)] text-[11px] font-mono hover:text-[var(--text-muted)] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {t('detail.forkedFrom')} <span className="text-[var(--accent-amber)]">@{forkedFrom.user.username}</span>
          </Link>
        )}

        {isLoading ? (
          <div className="px-5"><SkeletonPost /></div>
        ) : post ? (
          <div data-testid="main-post-card">
            <PostCard post={post} focused />
          </div>
        ) : null}

        <div className="mx-5 border-t border-[var(--border)]/20 my-1" />

        <div
          ref={replyThreadRef}
          data-testid="reply-thread"
          aria-label={`${replies.length} replies`}
          aria-live="polite"
          className="px-5"
        >
          <div className="py-3">
            <span data-testid="reply-count" className="text-[var(--text-faint)] text-[11px] font-mono">
              {isLoading ? '...' : replies.length === 0 ? t('detail.noReplies') : t(replies.length === 1 ? 'detail.replyCount' : 'detail.repliesCount', { n: String(replies.length) })}
            </span>
          </div>

          {isLoading && (
            <div className="divide-y divide-[var(--border)]/10">
              <SkeletonReply />
              <SkeletonReply />
            </div>
          )}

          {!isLoading && replies.length > 0 && (
            <div className="divide-y divide-[var(--border)]/10">
              {replies.map((reply) => (
                <ReplyCard key={reply.id} reply={reply} onReplyTo={handleReplyTo} />
              ))}
            </div>
          )}

          {post && (
            <ReplyComposer
              parentId={post.id}
              parentUsername={post.user.username}
              replyTarget={replyTarget}
              onClearReplyTarget={handleClearReplyTarget}
            />
          )}
        </div>

      </div>
    </AppShell>
  );
}
