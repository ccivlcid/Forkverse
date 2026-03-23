import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useFeedStore } from '../../stores/feedStore.js';
import { useUiStore } from '../../stores/uiStore.js';
import { toastError } from '../../stores/toastStore.js';
import type { ApiResponse, PostReactions, ReactionEmoji } from '@forkverse/shared';
import { REACTION_DISPLAY } from '@forkverse/shared';

interface ActionBarProps {
  postId: string;
  replyCount: number;
  forkCount: number;
  starCount: number;
  isStarred: boolean;
  reactions?: PostReactions;
  onReactionUpdate?: (reactions: PostReactions) => void;
  isAuthor?: boolean;
  onEdit?: () => void;
}

export default function ActionBar({
  postId,
  replyCount,
  forkCount,
  starCount,
  isStarred,
  reactions,
  onReactionUpdate,
  isAuthor,
  onEdit,
}: ActionBarProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { starPost } = useFeedStore();
  const { t } = useUiStore();
  const starBusy = useRef(false);
  const forkBusy = useRef(false);
  const [localForkCount, setLocalForkCount] = useState(forkCount);
  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${postId}`;

    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {
        /* user cancelled — ignore */
      }
    } else {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const handleStar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (starBusy.current) return;
    starBusy.current = true;
    starPost(postId, !isStarred);
    try {
      await api.post<ApiResponse<{ isStarred: boolean; starCount: number }>>(`/posts/${postId}/star`);
    } catch {
      starPost(postId, isStarred);
      toastError(t('action.starFailed'));
    } finally {
      starBusy.current = false;
    }
  };

  const handleFork = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (forkBusy.current) return;
    forkBusy.current = true;
    setLocalForkCount((c) => c + 1);
    try {
      await api.post(`/posts/${postId}/fork`);
    } catch {
      setLocalForkCount((c) => c - 1);
      toastError(t('action.forkFailed'));
    } finally {
      forkBusy.current = false;
    }
  };

  const reactBusy = useRef(false);
  const [reactPickerOpen, setReactPickerOpen] = useState(false);

  const handleQuickReact = async (e: React.MouseEvent, emoji: ReactionEmoji) => {
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (reactBusy.current) return;
    reactBusy.current = true;
    try {
      const res = await api.post<ApiResponse<{ toggled: boolean; emoji: string; reactions: PostReactions }>>(
        `/posts/${postId}/react`,
        { emoji },
      );
      onReactionUpdate?.(res.data.reactions);
    } catch {
      toastError(t('action.reactFailed'));
    } finally {
      reactBusy.current = false;
      setReactPickerOpen(false);
    }
  };

  const handleReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/post/${postId}`);
  };

  return (
    <div className="flex items-center gap-5 px-5 py-2.5">
      {/* Reply */}
      <button
        data-testid="reply-button"
        onClick={handleReply}
        className="font-mono text-[11px] text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors"
      >
        {t('action.reply')}{replyCount > 0 && <span className="ml-1 text-[var(--text-faint)]/60">{replyCount}</span>}
      </button>

      {/* Fork */}
      <button
        data-testid="fork-button"
        onClick={handleFork}
        className="font-mono text-[11px] text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors"
      >
        {t('action.fork')}{localForkCount > 0 && <span className="ml-1 text-[var(--text-faint)]/60">{localForkCount}</span>}
      </button>

      {/* Star */}
      <button
        data-testid="star-button"
        onClick={handleStar}
        className={`font-mono text-[11px] transition-colors ${
          isStarred
            ? 'text-[var(--accent-amber)]/80'
            : 'text-[var(--text-faint)] hover:text-[var(--accent-amber)]/60'
        }`}
        aria-pressed={isStarred}
      >
        {isStarred ? t('action.starred') : t('action.star')}
        {starCount > 0 && (
          <span data-testid="star-count" className="ml-1 opacity-60">{starCount}</span>
        )}
      </button>

      {/* Edit (author only) */}
      {isAuthor && onEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="font-mono text-[11px] text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors"
        >
          {t('action.edit')}
        </button>
      )}

      {/* Share */}
      <button
        onClick={handleShare}
        className={`font-mono text-[11px] transition-colors ${
          shareCopied ? 'text-[var(--accent-green)]' : 'text-[var(--text-faint)] hover:text-[var(--text-muted)]'
        }`}
      >
        {shareCopied ? t('action.copied') : t('action.share')}
      </button>

      {/* React */}
      {reactions && onReactionUpdate && (
        <div className="relative ml-auto">
          <button
            onClick={(e) => { e.stopPropagation(); setReactPickerOpen((o) => !o); }}
            className="font-mono text-[11px] text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors"
          >
            +
          </button>
          {reactPickerOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setReactPickerOpen(false)} aria-hidden="true" />
              <div className="absolute bottom-full right-0 mb-1 bg-[var(--bg-surface)] border border-[var(--border)]/40 z-50 flex gap-0.5 p-1 shadow-lg shadow-black/40">
                {(['lgtm', 'ship_it', 'fire', 'bug', 'thinking', 'rocket', 'eyes', 'heart'] as ReactionEmoji[]).map((emoji) => (
                  <button
                    key={emoji}
                    onClick={(e) => handleQuickReact(e, emoji)}
                    className={`font-mono text-[10px] px-1.5 py-0.5 transition-colors ${
                      reactions.mine.includes(emoji)
                        ? 'text-[var(--accent-green)]'
                        : 'text-[var(--text-faint)] hover:text-[var(--text-muted)]'
                    }`}
                  >
                    {REACTION_DISPLAY[emoji]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
