import { useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.js';
import { useMessageStore } from '../stores/messageStore.js';
import { useAuthStore } from '../stores/authStore.js';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function MessagesPage() {
  const { username: paramUsername } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const {
    conversations, messages, activeUsername, isLoading, isSending, draft,
    fetchInbox, fetchConversation, sendMessage, setDraft,
  } = useMessageStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchInbox();
  }, [isAuthenticated]);

  useEffect(() => {
    if (paramUsername) fetchConversation(paramUsername);
  }, [paramUsername]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!activeUsername) return;
    sendMessage(activeUsername);
  };

  return (
    <AppShell>
      <div className="flex h-full">

        {/* Inbox — left */}
        <div className="w-64 border-r border-[var(--border)]/30 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-[var(--border)]/20">
            <span className="font-mono text-xs text-[var(--text-faint)]">$ msg --inbox</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading && conversations.length === 0 && (
              <div className="p-4 font-mono text-xs text-[var(--text-faint)] animate-pulse">loading...</div>
            )}
            {!isLoading && conversations.length === 0 && (
              <div className="p-4 text-center font-mono text-xs text-[var(--text-faint)]">no conversations</div>
            )}
            {conversations.map((conv) => {
              const isActive = activeUsername === conv.otherUser.username;
              return (
                <Link
                  key={conv.otherUser.username}
                  to={`/messages/${conv.otherUser.username}`}
                  className={`block px-4 py-3 transition-colors border-b border-[var(--border)]/10 ${
                    isActive ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[var(--accent-amber)]">@{conv.otherUser.username}</span>
                    <span className="font-mono text-[10px] text-[var(--text-faint)]">{timeAgo(conv.lastMessageAt)}</span>
                  </div>
                  <p className="font-mono text-[11px] text-[var(--text-muted)] truncate mt-0.5">{conv.lastMessage}</p>
                  {conv.unreadCount > 0 && (
                    <span className="inline-block mt-1 font-mono text-[9px] text-[var(--accent-green)] bg-[var(--accent-green)]/10 px-1.5 py-0.5">
                      {conv.unreadCount} new
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Conversation — right */}
        <div className="flex-1 flex flex-col">
          {activeUsername ? (
            <>
              {/* Header */}
              <div className="px-5 py-3 border-b border-[var(--border)]/20 flex items-center gap-2">
                <span className="font-mono text-xs text-[var(--text-faint)]">$ msg</span>
                <Link
                  to={`/@${activeUsername}`}
                  className="font-mono text-xs text-[var(--accent-amber)] hover:text-amber-300"
                >
                  @{activeUsername}
                </Link>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {isLoading && messages.length === 0 && (
                  <div className="font-mono text-xs text-[var(--text-faint)] animate-pulse">loading...</div>
                )}
                {messages.map((msg) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-3 py-2 font-mono text-xs ${
                        isMine
                          ? 'bg-[var(--accent-green)]/[0.08] text-[var(--text)] border border-[var(--accent-green)]/15'
                          : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)]/30'
                      }`}>
                        {!isMine && (
                          <span className="text-[var(--accent-amber)] text-[10px] block mb-1">@{msg.sender.username}</span>
                        )}
                        <p className="leading-relaxed">{msg.message}</p>
                        <span className="text-[var(--text-faint)] text-[9px] block mt-1 text-right">{timeAgo(msg.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="px-5 py-3 border-t border-[var(--border)]/20">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[var(--text-faint)] shrink-0">
                    $ msg @{activeUsername}
                  </span>
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="type a message..."
                    disabled={isSending}
                    className="flex-1 bg-transparent text-[var(--text)] font-mono text-xs outline-none placeholder:text-[var(--text-faint)]/40 disabled:opacity-40"
                  />
                  <button
                    onClick={handleSend}
                    disabled={isSending || !draft.trim()}
                    className="font-mono text-[10px] text-[var(--accent-green)] hover:text-green-300 disabled:opacity-30 transition-colors"
                  >
                    send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="font-mono text-xs text-[var(--text-faint)]">select a conversation</p>
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
