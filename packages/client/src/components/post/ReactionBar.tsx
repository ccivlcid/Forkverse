import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuthStore } from '../../stores/authStore.js';
import { toastError } from '../../stores/toastStore.js';
import type { PostReactions, ReactionEmoji, ApiResponse } from '@clitoris/shared';
import { REACTION_DISPLAY } from '@clitoris/shared';

interface ReactionBarProps {
  postId: string;
  reactions: PostReactions;
  onUpdate?: (reactions: PostReactions) => void;
}

const ALL_EMOJIS: ReactionEmoji[] = ['lgtm', 'ship_it', 'fire', 'bug', 'thinking', 'rocket', 'eyes', 'heart'];

export default function ReactionBar({ postId, reactions, onUpdate }: ReactionBarProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const busy = useRef(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!pickerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPickerOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pickerOpen]);

  const handleReact = async (e: React.MouseEvent, emoji: ReactionEmoji) => {
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (busy.current) return;
    busy.current = true;

    try {
      const res = await api.post<ApiResponse<{ toggled: boolean; emoji: string; reactions: PostReactions }>>(
        `/posts/${postId}/react`,
        { emoji },
      );
      onUpdate?.(res.data.reactions);
    } catch {
      toastError('Failed to react');
    } finally {
      busy.current = false;
    }
  };

  const activeEmojis = ALL_EMOJIS.filter((e) => (reactions.counts[e] ?? 0) > 0);
  const isMine = (emoji: ReactionEmoji) => reactions.mine.includes(emoji);
  const available = ALL_EMOJIS.filter((e) => !activeEmojis.includes(e));

  return (
    <div className="flex items-center gap-1 px-5 py-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
      {activeEmojis.map((emoji) => (
        <button
          key={emoji}
          onClick={(e) => handleReact(e, emoji)}
          className={`font-mono text-[10px] px-1.5 py-0.5 border transition-colors ${
            isMine(emoji)
              ? 'border-[var(--accent-green)]/40 text-[var(--accent-green)] bg-[var(--accent-green)]/[0.08]'
              : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)]'
          }`}
          aria-label={`React with ${REACTION_DISPLAY[emoji]}`}
          aria-pressed={isMine(emoji)}
        >
          [{REACTION_DISPLAY[emoji]}] {reactions.counts[emoji]}
        </button>
      ))}

      {available.length > 0 && (
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setPickerOpen((o) => !o); }}
            className="font-mono text-[10px] px-1.5 py-0.5 border border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:border-[var(--border-hover)] transition-colors"
            aria-label="Add reaction"
          >
            +
          </button>
          {pickerOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} aria-hidden="true" />
              <div className="absolute bottom-full left-0 mb-1 bg-[var(--bg-surface)] border border-[var(--border)] z-50 flex gap-1 p-1.5 shadow-lg shadow-black/40">
                {available.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={(e) => { handleReact(e, emoji); setPickerOpen(false); }}
                    className="font-mono text-[10px] px-1.5 py-0.5 text-[var(--text-muted)] hover:text-[var(--accent-green)] hover:bg-[var(--accent-green)]/[0.08] transition-colors"
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
