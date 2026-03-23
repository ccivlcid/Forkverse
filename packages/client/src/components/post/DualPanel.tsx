import { useState, useRef, useEffect } from 'react';
import CliHighlighter from './CliHighlighter.js';
import { useUiStore } from '../../stores/uiStore.js';
import { api } from '../../api/client.js';
import { toastError } from '../../stores/toastStore.js';
import type { ApiResponse, TranslateResponse } from '@forkverse/shared';

interface DualPanelProps {
  postId: string;
  messageRaw: string;
  messageCli: string;
  tags: string[];
  postLang: string;
  showTranslate: boolean;
  uiLang: string;
}

export default function DualPanel({
  postId,
  messageRaw,
  messageCli,
  tags,
  postLang: _postLang,
  showTranslate,
  uiLang,
}: DualPanelProps) {
  const { t } = useUiStore();
  const [copied, setCopied] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(messageCli);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      toastError('Failed to copy');
    }
  };

  const handleTranslate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (translatedText !== null) { setTranslatedText(null); return; }
    setIsTranslating(true);
    try {
      const res = await api.post<ApiResponse<TranslateResponse>>(
        `/posts/${postId}/translate`,
        { targetLang: uiLang },
      );
      setTranslatedText(res.data.translatedText);
    } catch {
      toastError('Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const renderNatural = () => {
    const words = messageRaw.split(/(\s+|#\w+|@\w+)/);
    return words.map((word, i) => {
      if (word.startsWith('#')) {
        return (
          <a key={i} href={`/explore?tag=${word.slice(1)}`}
            className="text-[var(--accent-cyan)]/70 hover:text-[var(--accent-cyan)] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >{word}</a>
        );
      }
      if (word.startsWith('@')) {
        return (
          <a key={i} href={`/@${word.slice(1)}`}
            className="text-[var(--accent-amber)]/70 hover:text-[var(--accent-amber)] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >{word}</a>
        );
      }
      return <span key={i}>{word}</span>;
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2">
      {/* Natural language — warm, human */}
      <div
        data-testid="natural-panel"
        className="px-5 pt-3 pb-4 text-[var(--text)] text-[14px] leading-[1.75]"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        <p>{renderNatural()}</p>

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1">
            {tags.map((tag) => (
              <a
                key={tag}
                href={`/explore?tag=${tag}`}
                className="text-[var(--accent-cyan)]/40 hover:text-[var(--accent-cyan)]/70 text-[11px] font-mono transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                #{tag}
              </a>
            ))}
          </div>
        )}

        {translatedText !== null && (
          <div className="mt-3 pl-3 border-l-2 border-[var(--accent-purple)]/15">
            <p className="text-[var(--text-muted)] text-[13px] italic leading-[1.7]">{translatedText}</p>
          </div>
        )}

        {showTranslate && (
          <button
            data-testid="translate-button"
            onClick={handleTranslate}
            className="mt-2 text-[var(--text-faint)]/60 hover:text-[var(--accent-purple)]/60 text-[11px] font-mono transition-colors"
          >
            {isTranslating ? '...' : translatedText !== null ? 'hide' : `translate`}
          </button>
        )}
      </div>

      {/* CLI — cold, precise */}
      <div
        data-testid="cli-panel"
        className="bg-[var(--bg-cli)] px-5 pt-3 pb-4 border-t border-[var(--border)]/10 sm:border-t-0 sm:border-l sm:border-l-[var(--border)]/10"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[var(--accent-green)]/25 text-[10px] font-mono">$</span>
          <button
            data-testid="copy-cli-button"
            onClick={handleCopy}
            className="text-[var(--text-faint)]/40 hover:text-[var(--accent-green)]/60 text-[10px] font-mono transition-colors"
          >
            {copied ? <span className="text-[var(--accent-green)]/60">{t('post.copied')}</span> : 'copy'}
          </button>
        </div>
        <CliHighlighter code={messageCli} />
      </div>
    </div>
  );
}
