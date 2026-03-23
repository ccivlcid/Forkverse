import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { useUiStore, type UiLang } from '../../stores/uiStore.js';
import { useState, useEffect, useRef } from 'react';
import NotificationBell from './NotificationBell.js';

const LANGS: UiLang[] = ['en', 'ko', 'zh', 'ja'];

export default function HeaderBar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { lang, setLang, t } = useUiStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <header className="h-11 sm:h-12 bg-[var(--bg-surface)] border-b border-[var(--border)]/60 flex items-center justify-between px-3 sm:px-5 shrink-0">

      {/* ── Left: Logo ── */}
      <Link to="/feed" className="hover:opacity-90 transition-opacity shrink-0">
        <span className="font-mono text-[13px] sm:text-sm font-bold text-white tracking-tight">
          <span className="text-[var(--accent-green)]">⑂</span>
          <span className="text-white">Fork</span>
          <span className="text-[var(--accent-green)]">verse</span>
        </span>
      </Link>

      {/* ── Center: Language (mobile only) ── */}
      <div className="sm:hidden flex items-center gap-0.5">
        {LANGS.map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-2 py-2 font-mono text-[11px] transition-colors ${
              lang === l
                ? 'text-[var(--accent-green)]'
                : 'text-[var(--text-faint)]'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* ── Right: Actions ── */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">

        {/* Notifications */}
        {isAuthenticated && <NotificationBell />}

        {/* User menu — desktop only */}
        {isAuthenticated && user ? (
          <div className="relative hidden sm:block" ref={menuRef}>
            <button
              className="font-mono text-xs text-[var(--accent-amber)] hover:text-amber-300 flex items-center gap-1 transition-colors"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="text-[var(--text-muted)]">@</span>
              {user.username}
              <span className="text-[var(--text-muted)] text-[10px] ml-0.5">▾</span>
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden="true"
                />
                <div
                  className="absolute right-0 top-8 bg-[var(--bg-surface)] border border-[var(--border)] w-36 z-50 py-1 shadow-xl shadow-black/60"
                  role="menu"
                >
                  <Link
                    to={`/@${user.username}`}
                    className="block px-4 py-2 text-[var(--text-muted)] hover:text-white font-mono text-[11px] transition-colors"
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                  >
                    {t('menu.profile')}
                  </Link>
                  <div className="border-t border-[var(--border)] my-0.5" />
                  <button
                    className="w-full text-left px-4 py-2 text-[var(--text-muted)] hover:text-[var(--color-error)] font-mono text-[11px] transition-colors"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    {t('menu.logout')}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="font-mono text-[12px] text-[var(--text-muted)] hover:text-white transition-colors hidden sm:inline"
          >
            {t('header.connect')}
          </Link>
        )}

        {/* Keyboard help — desktop only */}
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))}
          className="hidden sm:inline-block font-mono text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
        >
          [?]
        </button>
      </div>
    </header>
  );
}
