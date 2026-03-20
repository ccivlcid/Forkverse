import { useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.js';
import PostCard from '../components/post/PostCard.js';
import { usePostDetailStore } from '../stores/postDetailStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { api } from '../api/client.js';
import type { ApiResponse } from '@clitoris/shared';

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

// ── Reply Composer ────────────────────────────────────────────

function ReplyComposer({ parentId, parentUsername }: { parentId: string; parentUsername: string }) {
  const { isAuthenticated } = useAuthStore();
  const { draft, cliPreview, isTransforming, isSubmitting, transformError, setDraft, transformReply, submitReply, clearTransformError } =
    usePostDetailStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void submitReply(parentId);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="py-8 text-center">
        <p className="text-[var(--text-faint)] font-mono text-[12px] mb-4">
          reply requires authentication
        </p>
        <button
          onClick={() => navigate(`/login?redirect=/post/${parentId}`)}
          className="text-[var(--accent-green)] font-mono text-[12px] hover:text-[var(--accent-green)]/80 transition-colors"
        >
          $ ssh connect
        </button>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[var(--text-faint)] font-mono text-[11px]">
          <span className="text-[var(--accent-green)]">$</span> reply --to=<span className="text-[var(--accent-amber)]">@{parentUsername}</span>
        </span>
      </div>

      <textarea
        ref={textareaRef}
        data-testid="reply-composer-input"
        aria-label={`Reply to @${parentUsername}`}
        value={draft}
        onChange={(e) => { setDraft(e.target.value); if (transformError) clearTransformError(); }}
        onKeyDown={handleKeyDown}
        placeholder="Write your reply..."
        rows={3}
        className="w-full bg-transparent text-[var(--text)] text-[14px] leading-[1.7] resize-none outline-none placeholder:text-[var(--text-faint)]/40 border-b border-[var(--border)]/30 focus:border-[var(--accent-green)]/20 pb-3 transition-colors"
        style={{ fontFamily: 'var(--font-sans)' }}
      />

      {cliPreview && (
        <div className="mt-3 pl-4 border-l-2 border-[var(--accent-green)]/20">
          <pre className="text-[var(--accent-green)]/70 font-mono text-[11px] whitespace-pre-wrap">{cliPreview}</pre>
        </div>
      )}

      {transformError && (
        <p className="mt-2 text-[var(--color-error)] font-mono text-[11px]">
          {transformError}
        </p>
      )}

      <div className="flex items-center justify-between mt-4">
        <span className="text-[var(--text-faint)] text-[10px] font-mono">
          ctrl+enter to reply
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => transformReply(parentId)}
            disabled={!draft.trim() || isTransforming}
            className="text-[var(--text-muted)] hover:text-[var(--text)] font-mono text-[11px] disabled:opacity-30 transition-colors"
          >
            {isTransforming ? 'transforming...' : 'preview'}
          </button>
          <button
            data-testid="reply-composer-submit"
            onClick={() => submitReply(parentId)}
            disabled={!draft.trim() || isSubmitting}
            className="text-[var(--accent-green)] font-mono text-[12px] hover:text-[var(--accent-green)]/80 disabled:opacity-30 transition-colors"
          >
            {isSubmitting ? 'sending...' : 'reply'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { post, replies, forkedFrom, isLoading, error, starPost, fetchPost, reset } = usePostDetailStore();
  const replyThreadRef = useRef<HTMLDivElement>(null);

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

  // ── Error state ──
  if (error) {
    return (
      <AppShell>
        <div className="max-w-[600px] mx-auto px-5 py-16 text-center space-y-6">
          <p className="text-[var(--text-faint)] font-mono text-[12px]">
            <span className="text-[var(--accent-green)]">$</span> post --id={id?.slice(0, 8)}
          </p>
          <p className="text-[var(--color-error)] font-mono text-[13px]">
            404: not found
          </p>
          <p className="text-[var(--text-muted)] text-[13px]" style={{ fontFamily: 'var(--font-sans)' }}>
            This post doesn&apos;t exist or has been deleted.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <button
              onClick={() => navigate(-1)}
              className="text-[var(--text-muted)] hover:text-[var(--text)] font-mono text-[12px] transition-colors"
            >
              back
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-[var(--accent-green)] hover:text-[var(--accent-green)]/80 font-mono text-[12px] transition-colors"
            >
              feed
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Main ──
  return (
    <AppShell>
      <div className="max-w-[600px] mx-auto">

        {/* Navigation — minimal, out of the way */}
        <div className="px-5 pt-5 pb-2">
          <button
            data-testid="back-button"
            onClick={() => navigate(-1)}
            className="text-[var(--text-faint)] hover:text-[var(--text-muted)] font-mono text-[11px] transition-colors"
          >
            <span className="text-[var(--accent-green)]">$</span> cd ..
          </button>
        </div>

        {/* Forked-from — quiet context, not a visual block */}
        {!isLoading && forkedFrom && (
          <Link
            data-testid="forked-from-banner"
            to={`/post/${forkedFrom.id}`}
            className="block px-5 py-2 text-[var(--text-faint)] text-[11px] font-mono hover:text-[var(--text-muted)] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            forked from <span className="text-[var(--accent-amber)]">@{forkedFrom.user.username}</span>
          </Link>
        )}

        {/* Main post — the hero, given full breathing room */}
        {isLoading ? (
          <div className="px-5"><SkeletonPost /></div>
        ) : post ? (
          <div data-testid="main-post-card">
            <PostCard post={post} focused />
          </div>
        ) : null}

        {/* Divider — a single breath between post and thread */}
        <div className="mx-5 border-t border-[var(--border)]/20 my-1" />

        {/* Reply thread */}
        <div
          ref={replyThreadRef}
          data-testid="reply-thread"
          aria-label={`${replies.length} replies`}
          aria-live="polite"
          className="px-5"
        >
          {/* Reply count — information, not decoration */}
          <div className="py-3">
            <span data-testid="reply-count" className="text-[var(--text-faint)] text-[11px] font-mono">
              {isLoading ? '...' : replies.length === 0 ? 'no replies yet' : `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
            </span>
          </div>

          {/* Loading skeletons */}
          {isLoading && (
            <div className="divide-y divide-[var(--border)]/10">
              <SkeletonReply />
              <SkeletonReply />
            </div>
          )}

          {/* Reply cards — clean separation, no boxes */}
          {!isLoading && replies.length > 0 && (
            <div className="divide-y divide-[var(--border)]/10">
              {replies.map((reply) => (
                <div key={reply.id} data-testid="reply-card">
                  <PostCard post={reply} />
                </div>
              ))}
            </div>
          )}

          {/* Reply composer — always present, inviting */}
          {post && (
            <ReplyComposer parentId={post.id} parentUsername={post.user.username} />
          )}
        </div>

      </div>
    </AppShell>
  );
}
