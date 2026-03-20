import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useFeedStore } from '../../stores/feedStore.js';
import { useUiStore } from '../../stores/uiStore.js';
import { toastError } from '../../stores/toastStore.js';
import type { ApiResponse, PostReactions, ReactionEmoji } from '@clitoris/shared';
import { REACTION_DISPLAY } from '@clitoris/shared';

interface ActionBarProps {
  postId: string;
  replyCount: number;
  forkCount: number;
  starCount: number;
  isStarred: boolean;
  reactions?: PostReactions;
  onReactionUpdate?: (reactions: PostReactions) => void;
}

export default function ActionBar({
  postId,
  replyCount,
  forkCount,
  starCount,
  isStarred,
  reactions,
  onReactionUpdate,
}: ActionBarProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { starPost } = useFeedStore();
  const { t } = useUiStore();
  const [localForkCount, setLocalForkCount] = useState(forkCount);
  const starBusy = useRef(false);
  const forkBusy = useRef(false);

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
      toastError('Failed to star post');
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
      toastError('Failed to fork post');
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
      toastError('Failed to react');
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
    <div className="flex gap-6 px-5 py-3 border-t border-[var(--border)]">
      <button
        data-testid="reply-button"
        onClick={handleReply}
        className="font-mono text-[12px] text-[var(--text-muted)] hover:text-[var(--accent-green)] transition-colors"
        aria-label="Reply to post"
      >
        {t('post.action.reply')}
        {replyCount > 0 && <span className="ml-1.5 text-[var(--text-muted)]">{replyCount}</span>}
      </button>
      <button
        data-testid="fork-button"
        onClick={handleFork}
        className="font-mono text-[12px] text-[var(--text-muted)] hover:text-[var(--accent-blue)] transition-colors"
        aria-label="Fork post"
      >
        {t('post.action.fork')}
        {localForkCount > 0 && <span className="ml-1.5 text-[var(--text-muted)]">{localForkCount}</span>}
      </button>
      <button
        data-testid="star-button"
        onClick={handleStar}
        className={`font-mono text-[12px] transition-colors ${
          isStarred ? 'text-[var(--accent-amber)]' : 'text-[var(--text-muted)] hover:text-[var(--accent-amber)]'
        }`}
        aria-pressed={isStarred}
        aria-label="Star post"
      >
        {isStarred ? t('post.action.star') : t('post.action.unstar')}
        {starCount > 0 && (
          <span
            data-testid="star-count"
            className={`ml-1.5 ${isStarred ? 'text-[var(--accent-amber)]/70' : 'text-[var(--text-muted)]'}`}
          >
            {starCount}
          </span>
        )}
      </button>

      {/* Quick react */}
      {reactions && onReactionUpdate && (
        <div className="relative ml-auto">
          <button
            onClick={(e) => { e.stopPropagation(); setReactPickerOpen((o) => !o); }}
            className="font-mono text-[12px] text-[var(--text-muted)] hover:text-[var(--accent-green)] transition-colors"
            aria-label="Add reaction"
          >
            [react]
          </button>
          {reactPickerOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setReactPickerOpen(false)} aria-hidden="true" />
              <div className="absolute bottom-full right-0 mb-1 bg-[var(--bg-surface)] border border-[var(--border)] z-50 flex gap-1 p-1.5 shadow-lg shadow-black/40">
                {(['lgtm', 'ship_it', 'fire', 'bug', 'thinking', 'rocket', 'eyes', 'heart'] as ReactionEmoji[]).map((emoji) => (
                  <button
                    key={emoji}
                    onClick={(e) => handleQuickReact(e, emoji)}
                    className={`font-mono text-[10px] px-1 py-0.5 transition-colors ${
                      reactions.mine.includes(emoji)
                        ? 'text-[var(--accent-green)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--accent-green)]'
                    }`}
                  >
                    [{REACTION_DISPLAY[emoji]}]
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
