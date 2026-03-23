import { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.js';
import PostCard from '../components/post/PostCard.js';
import { useSearchStore } from '../stores/searchStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { api } from '../api/client.js';
import type { ApiResponse } from '@forkverse/shared';

interface TrendingTag { tag: string; count: number }

export default function SearchPage() {
  const { query, results, isLoading, search, setQuery, clear } = useSearchStore();
  const { t } = useUiStore();
  const navigate = useNavigate();
  const [input, setInput] = useState(query);
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCancel = () => {
    clear();
    navigate(-1);
  };

  useEffect(() => {
    inputRef.current?.focus();
    api.get<ApiResponse<TrendingTag[]>>('/posts/trending/tags')
      .then((res) => setTrendingTags(res.data.slice(0, 10)))
      .catch(() => { /* silent */ });
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleChange = useCallback((val: string) => {
    setInput(val);
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!val.trim()) { clear(); return; }
    timerRef.current = setTimeout(() => search(val), 300);
  }, [search, setQuery, clear]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) search(input);
  };

  const handleTagClick = (tag: string) => {
    setInput(tag);
    setQuery(tag);
    search(tag);
  };

  const hasResults = results && (results.posts.length > 0 || results.users.length > 0 || results.tags.length > 0);
  const noResults = results && !hasResults;
  const showLanding = !results && !isLoading;

  return (
    <AppShell>
      <div className="flex flex-col min-h-[calc(100dvh-48px)]">

        {/* Search input + cancel */}
        <div className={`px-4 sm:px-5 ${showLanding ? 'pt-8 sm:pt-10 pb-5' : 'pt-4 sm:pt-5 pb-4'}`}>
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="flex-1 flex items-center border border-[var(--border)] bg-[var(--bg-input)] focus-within:border-[var(--accent-cyan)]/50 transition-colors overflow-hidden">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={`$ ${t('search.placeholder')}`}
                className="flex-1 bg-transparent px-3 py-2.5 font-mono text-[13px] text-[var(--text)] placeholder:text-[var(--text-faint)] outline-none min-w-0 w-0"
                aria-label="Search"
              />
              {isLoading && (
                <span className="font-mono text-[11px] text-[var(--accent-green)]/60 animate-pulse pr-3 shrink-0">...</span>
              )}
              {input && !isLoading && (
                <button
                  onClick={() => { handleChange(''); inputRef.current?.focus(); }}
                  className="font-mono text-[11px] text-[var(--text-faint)] hover:text-[var(--text-muted)] pr-3 transition-colors shrink-0"
                  type="button"
                >
                  ×
                </button>
              )}
            </div>
            <button
              onClick={handleCancel}
              type="button"
              className="font-mono text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] active:text-[var(--text)] transition-colors shrink-0 py-2.5"
            >
              {t('search.cancel')}
            </button>
          </form>
        </div>

        {/* Trending — quiet, typographic */}
        {showLanding && trendingTags.length > 0 && (
          <div className="px-6 pt-8 leading-relaxed">
            {trendingTags.map((tag, i) => (
              <button
                key={tag.tag}
                onClick={() => handleTagClick(tag.tag)}
                className="inline text-[15px] text-[var(--text-faint)]/30 hover:text-[var(--text)] transition-colors duration-200"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {tag.tag}{i < trendingTags.length - 1 && <span className="mx-2 text-[var(--border)]">/</span>}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {hasResults && (
          <div className="flex-1">

            {/* Users */}
            {results.users.length > 0 && (
              <div className="py-2">
                {results.users.map((u) => (
                  <Link
                    key={u.username}
                    to={`/@${u.username}`}
                    className="flex items-center gap-4 px-6 py-3 hover:bg-white/[0.015] transition-colors group"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-medium shrink-0"
                      style={{
                        fontFamily: 'var(--font-sans)',
                        backgroundColor: 'var(--accent-amber)',
                        color: 'var(--bg-void)',
                        opacity: 0.85,
                      }}
                    >
                      {u.username[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[14px] text-[var(--accent-amber)] group-hover:text-amber-300 transition-colors">
                        @{u.username}
                      </span>
                      {u.displayName !== u.username && (
                        <span className="ml-2 text-[14px] text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-sans)' }}>
                          {u.displayName}
                        </span>
                      )}
                      {u.bio && (
                        <p className="text-[13px] text-[var(--text-faint)]/60 truncate mt-0.5" style={{ fontFamily: 'var(--font-sans)' }}>
                          {u.bio}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Tags */}
            {results.tags.length > 0 && (
              <div className="px-6 py-4 flex flex-wrap gap-x-4 gap-y-2">
                {results.tags.map((tag) => (
                  <Link
                    key={tag.tag}
                    to={`/explore?tag=${encodeURIComponent(tag.tag)}`}
                    className="font-mono text-[14px] text-[var(--accent-cyan)]/70 hover:text-[var(--accent-cyan)] transition-colors"
                  >
                    #{tag.tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Divider before posts */}
            {results.posts.length > 0 && (results.users.length > 0 || results.tags.length > 0) && (
              <div className="border-t border-[var(--border)]/20" />
            )}

            {/* Posts */}
            {results.posts.length > 0 && results.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* No results */}
        {noResults && (
          <div className="flex-1 flex items-start justify-center pt-20">
            <p className="text-[15px] text-[var(--text-faint)]/40" style={{ fontFamily: 'var(--font-sans)' }}>
              {t('search.noResults', { q: query })}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
