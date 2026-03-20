import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNotificationStore } from '../../stores/notificationStore.js';
import type { Notification } from '@clitoris/shared';

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

  const handleClick = (n: Notification) => {
    if (!n.read) markRead(n.id);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="font-mono text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors relative"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        [bell]
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-2 bg-[var(--color-error)] text-[var(--bg-void)] font-mono text-[9px] font-bold min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-7 w-80 bg-[var(--bg-surface)] border border-[var(--border)] z-50 shadow-xl shadow-black/60 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
              <span className="font-mono text-[10px] text-[var(--text-faint)] uppercase tracking-wider">notifications</span>
              {notifications.some(n => !n.read) && (
                <button
                  onClick={markAllRead}
                  className="font-mono text-[10px] text-[var(--text-muted)] hover:text-[var(--accent-green)] transition-colors"
                >
                  mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 && (
              <div className="px-3 py-6 text-center font-mono text-[11px] text-[var(--text-muted)]">
                No notifications
              </div>
            )}

            {notifications.slice(0, 20).map((n) => (
              <Link
                key={n.id}
                to={n.postId ? `/post/${n.postId}` : `/@${n.actor.username}`}
                onClick={() => handleClick(n)}
                className={`flex gap-2 px-3 py-2 border-b border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-colors ${
                  !n.read ? 'bg-[var(--accent-green)]/[0.03]' : ''
                }`}
              >
                <span className={`font-mono text-[11px] w-4 text-center shrink-0 ${!n.read ? 'text-[var(--accent-green)]' : 'text-[var(--text-faint)]'}`}>
                  {NOTIF_ICONS[n.type] ?? '·'}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-[11px] text-[var(--accent-amber)]">@{n.actor.username}</span>{' '}
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">{notifText(n)}</span>
                  {n.message && n.type !== 'reaction' && (
                    <div className="font-mono text-[10px] text-[var(--text-faint)] truncate mt-0.5">{n.message}</div>
                  )}
                  <div className="font-mono text-[9px] text-[var(--text-faint)] mt-0.5">{timeAgo(n.createdAt)}</div>
                </div>
                {!n.read && (
                  <span className="w-1.5 h-1.5 bg-[var(--accent-green)] shrink-0 mt-1.5" />
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
