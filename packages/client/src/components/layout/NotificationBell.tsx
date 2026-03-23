import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNotificationStore } from '../../stores/notificationStore.js';
import type { Notification } from '@forkverse/shared';

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  if (diff < 0) return 'now';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const NOTIF_ICONS: Record<string, string> = {
  star: '★',
  reply: '↩',
  follow: '⊹',
  mention: '@',
  fork: '⑂',
  reaction: '♡',
  quote: '❝',
};

function notifText(n: Notification): string {
  switch (n.type) {
    case 'star': return 'starred your post';
    case 'reply': return 'replied to your post';
    case 'follow': return 'followed you';
    case 'mention': return 'mentioned you';
    case 'fork': return 'forked your post';
    case 'reaction': return `reacted ${n.message ? `[${n.message}]` : ''}`;
    case 'quote': return 'quoted your post';
    default: return n.type;
  }
}

export default function NotificationBell() {
  const { unreadCount, notifications, fetchUnreadCount, fetchNotifications, markRead, markAllRead } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (!open) return;
    const isMobile = window.innerWidth < 640;
    if (!isMobile) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleClick = (n: Notification) => {
    if (!n.read) markRead(n.id);
    setOpen(false);
  };

  const hasUnread = unreadCount > 0;

  return (
    <div className="relative" ref={ref}>
      {/* Trigger — minimal, purposeful */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-7 h-7 sm:w-auto sm:h-auto flex items-center justify-center transition-colors"
        aria-label={`Notifications${hasUnread ? ` (${unreadCount} unread)` : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {/* Mobile: just an icon-like glyph */}
        <span className={`sm:hidden font-mono text-[14px] ${hasUnread ? 'text-[var(--text)]' : 'text-[var(--text-faint)]'}`}>
          ⊙
        </span>

        {/* Desktop: text label */}
        <span className="hidden sm:inline font-mono text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
          [bell]
        </span>

        {/* Badge — a single decisive dot */}
        {hasUnread && (
          <span className="absolute top-0.5 right-0 sm:-top-1 sm:-right-2 bg-[var(--color-error)] text-[var(--bg-void)] font-mono text-[8px] sm:text-[9px] font-bold min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/0 sm:bg-transparent"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel — mobile: full-width sheet from top, desktop: dropdown */}
          <div className="
            fixed inset-x-0 top-11 bottom-0 z-50
            sm:absolute sm:inset-auto sm:right-0 sm:top-7 sm:w-80 sm:max-h-96 sm:bottom-auto
            bg-[var(--bg-surface)] border-b sm:border border-[var(--border)] overflow-y-auto
            shadow-xl shadow-black/60
          ">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[var(--bg-surface)] flex items-center justify-between px-4 sm:px-3 py-3 sm:py-2 border-b border-[var(--border)]">
              <span className="font-mono text-[11px] sm:text-[10px] text-[var(--text-faint)] uppercase tracking-wider">
                notifications
              </span>
              <div className="flex items-center gap-3">
                {notifications.some(n => !n.read) && (
                  <button
                    onClick={markAllRead}
                    className="font-mono text-[11px] sm:text-[10px] text-[var(--text-muted)] hover:text-[var(--accent-green)] transition-colors"
                  >
                    mark all read
                  </button>
                )}
                {/* Close button — mobile only */}
                <button
                  onClick={() => setOpen(false)}
                  className="sm:hidden font-mono text-[12px] text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Empty */}
            {notifications.length === 0 && (
              <div className="px-4 py-12 sm:py-6 text-center font-mono text-[12px] sm:text-[11px] text-[var(--text-faint)]">
                &gt; 0 notifications.
              </div>
            )}

            {/* List */}
            {notifications.slice(0, 20).map((n) => (
              <Link
                key={n.id}
                to={n.postId ? `/post/${n.postId}` : `/@${n.actor.username}`}
                onClick={() => handleClick(n)}
                className={`flex gap-3 sm:gap-2 px-4 sm:px-3 py-3 sm:py-2 border-b border-[var(--border)]/40 hover:bg-white/[0.025] transition-colors active:bg-white/[0.04] ${
                  !n.read ? 'bg-[var(--accent-green)]/[0.03]' : ''
                }`}
              >
                {/* Icon */}
                <span className={`font-mono text-[13px] sm:text-[11px] w-5 sm:w-4 text-center shrink-0 mt-0.5 ${
                  !n.read ? 'text-[var(--accent-green)]' : 'text-[var(--text-faint)]'
                }`}>
                  {NOTIF_ICONS[n.type] ?? '·'}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div>
                    <span className="font-mono text-[12px] sm:text-[11px] text-[var(--accent-amber)]">
                      @{n.actor.username}
                    </span>{' '}
                    <span className="font-mono text-[12px] sm:text-[11px] text-[var(--text-muted)]">
                      {notifText(n)}
                    </span>
                  </div>
                  {n.message && n.type !== 'reaction' && (
                    <div className="font-mono text-[11px] sm:text-[10px] text-[var(--text-faint)] truncate mt-0.5">
                      {n.message}
                    </div>
                  )}
                  <div className="font-mono text-[10px] sm:text-[9px] text-[var(--text-faint)] mt-0.5">
                    {timeAgo(n.createdAt)}
                  </div>
                </div>

                {/* Unread indicator */}
                {!n.read && (
                  <span className="w-1.5 h-1.5 bg-[var(--accent-green)] rounded-full shrink-0 mt-2" />
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
