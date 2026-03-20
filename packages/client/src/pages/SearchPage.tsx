import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.js';
import PostCard from '../components/post/PostCard.js';
import { useSearchStore } from '../stores/searchStore.js';

export default function SearchPage() {
  const { query, results, isLoading, search, setQuery, clear } = useSearchStore();
  const [input, setInput] = useState(query);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
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

  return (
    <AppShell>
      <div className="border-b border-[var(--border)] px-5 py-3">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <span className="font-mono text-[12px] text-[var(--accent-green)]">$</span>
          <span className="font-mono text-[12px] text-[var(--text-muted)]">grep</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="search posts, users, tags..."
            className="flex-1 bg-transparent font-mono text-[12px] text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
            aria-label="Search"
          />
          {isLoading && (
            <span className="font-mono text-[10px] text-[var(--text-faint)]">searching...</span>
          )}
        </form>
      </div>

      {results && (
        <div>
          {/* Users */}
          {results.users.length > 0 && (
            <div className="border-b border-[var(--border)]">
              <div className="px-5 py-2 font-mono text-[10px] text-[var(--text-faint)] uppercase tracking-wider">
                users
              </div>
              {results.users.map((u) => (
                <Link
                  key={u.username}
                  to={`/@${u.username}`}
                  className="flex items-center gap-3 px-5 py-2 hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <span className="font-mono text-[12px] font-semibold text-[var(--accent-amber)]">@{u.username}</span>
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">{u.displayName}</span>
                  {u.bio && (
                    <span className="font-mono text-[10px] text-[var(--text-faint)] truncate ml-auto">{u.bio}</span>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Tags */}
          {results.tags.length > 0 && (
            <div className="border-b border-[var(--border)]">
              <div className="px-5 py-2 font-mono text-[10px] text-[var(--text-faint)] uppercase tracking-wider">
                tags
              </div>
              <div className="flex flex-wrap gap-2 px-5 py-2">
                {results.tags.map((t) => (
                  <Link
                    key={t.tag}
                    to={`/explore?tag=${encodeURIComponent(t.tag)}`}
                    className="font-mono text-[11px] text-[var(--accent-cyan)] hover:text-cyan-300 transition-colors"
                  >
                    #{t.tag} <span className="text-[var(--text-faint)]">({t.count})</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Posts */}
          {results.posts.length > 0 && (
            <div>
              <div className="px-5 py-2 font-mono text-[10px] text-[var(--text-faint)] uppercase tracking-wider border-b border-[var(--border)]">
                posts
              </div>
              {results.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* No results */}
          {results.posts.length === 0 && results.users.length === 0 && results.tags.length === 0 && (
            <div className="px-5 py-8 text-center font-mono text-[12px] text-[var(--text-muted)]">
              No results found for &quot;{query}&quot;
            </div>
          )}
        </div>
      )}

      {!results && !isLoading && (
        <div className="px-5 py-8 text-center font-mono text-[12px] text-[var(--text-muted)]">
          Search for posts, users, or tags
        </div>
      )}
    </AppShell>
  );
}
