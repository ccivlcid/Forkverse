import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { useUiStore } from '../../stores/uiStore.js';
import { useState, useEffect, useRef } from 'react';
import NotificationBell from './NotificationBell.js';
import ComposerModal from '../composer/ComposerModal.js';

export default function HeaderBar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { t } = useUiStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Close dropdown on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMenuOpen(false); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // "/" hotkey opens composer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !composerOpen && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setComposerOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [composerOpen]);

  return (
    <header className="h-12 bg-[var(--bg-surface)] border-b border-[var(--border)]/60 flex items-center justify-between px-5 shrink-0">
      <Link
        to="/"
        className="flex items-center gap-1.5 hover:opacity-90 transition-opacity"
      >
        <span className="font-mono text-sm font-bold text-white tracking-tight">
          <span className="text-white">{'>'}&#x5f;</span>
          <span className="text-[var(--accent-green)]">CLI</span>
          <span className="text-white">toris</span>
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {isAuthenticated && (
          <button
            onClick={() => setComposerOpen(true)}
            className="font-mono text-[11px] text-[var(--bg-surface)] bg-[var(--accent-green)] hover:bg-[var(--accent-green)]/80 px-3 py-1 transition-colors"
          >
            + post
          </button>
        )}

        {isAuthenticated && <NotificationBell />}

        {isAuthenticated && user ? (
          <div className="relative" ref={menuRef}>
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
            className="font-mono text-[12px] text-[var(--text-muted)] hover:text-white transition-colors"
          >
            connect
          </Link>
        )}

        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))}
          className="font-mono text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
        >
          [?]
        </button>
      </div>

      <ComposerModal open={composerOpen} onClose={() => setComposerOpen(false)} />
    </header>
  );
}
