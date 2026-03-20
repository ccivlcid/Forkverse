import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { Post, PostReactions } from '@clitoris/shared';
import LangBadge from './LangBadge.js';
import DualPanel from './DualPanel.js';
import ActionBar from './ActionBar.js';
import RepoCard from './RepoCard.js';
import ReactionBar from './ReactionBar.js';
import QuotedPost from './QuotedPost.js';
import { useUiStore } from '../../stores/uiStore.js';

interface PostCardProps {
  post: Post;
  focused?: boolean;
}

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

const AVATAR_COLORS = [
  '#3dd68c', '#f59e0b', '#60a5fa', '#c084fc', '#f87171', '#34d399', '#fb923c',
];

function avatarColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) & 0xffffff;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

export default function PostCard({ post, focused = false }: PostCardProps) {
  const navigate = useNavigate();
  const { lang: uiLang } = useUiStore();
  const [reactions, setReactions] = useState<PostReactions>(post.reactions ?? { counts: {}, mine: [] });
  useEffect(() => {
    setReactions(post.reactions ?? { counts: {}, mine: [] });
  }, [post.id]);
  const { user } = post;
  const showTranslate = post.lang !== uiLang;
  const color = avatarColor(user.username);

  const handleNavigate = () => navigate(`/post/${post.id}`);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNavigate();
    }
  };

  return (
    <article
      data-testid="post-card"
      data-post-id={post.id}
      role="article"
      tabIndex={0}
      aria-labelledby={`post-header-${post.id}`}
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
      className={`cursor-pointer border-b transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-green)]/40 ${
        focused
          ? 'border-[var(--accent-green)]/20 bg-[var(--accent-green)]/[0.02]'
          : 'border-[var(--border)] hover:bg-[var(--bg-surface)]'
      }`}
    >
      {/* Header */}
      <div
        id={`post-header-${post.id}`}
        className="flex items-center gap-3 px-5 pt-4 pb-3"
      >
        {/* Avatar */}
        <div
          className="w-8 h-8 shrink-0 flex items-center justify-center font-mono text-[13px] font-bold text-[var(--bg-void)]"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        >
          {user.username[0]?.toUpperCase()}
        </div>

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Link
            to={`/@${user.username}`}
            data-testid="post-username"
            className="font-mono text-[13px] font-semibold hover:text-[#f5c264] transition-colors shrink-0"
            style={{ color }}
            onClick={(e) => e.stopPropagation()}
          >
            @{user.username}
          </Link>
          <span className="text-[var(--text-faint)] text-[11px] font-mono">·</span>
          <span className="text-[var(--text-muted)] text-[11px] font-mono shrink-0">{timeAgo(post.createdAt)}</span>

          {post.intent && post.intent !== 'casual' && (
            <span className="text-[var(--text-faint)] text-[10px] font-mono shrink-0 hidden sm:inline">
              --{post.intent}
            </span>
          )}
          {post.emotion && post.emotion !== 'neutral' && (
            <span className="text-[var(--text-faint)] text-[10px] font-mono shrink-0 hidden sm:inline">
              --{post.emotion}
            </span>
          )}
        </div>

        <LangBadge lang={post.lang} />
      </div>

      {/* Dual Panel */}
      <DualPanel
        postId={post.id}
        messageRaw={post.messageRaw}
        messageCli={post.messageCli}
        tags={post.tags}
        postLang={post.lang}
        showTranslate={showTranslate}
        uiLang={uiLang}
      />

      {/* Quoted post */}
      {post.quotedPost && (
        <QuotedPost
          id={post.quotedPost.id}
          messageRaw={post.quotedPost.messageRaw}
          messageCli={post.quotedPost.messageCli}
          user={post.quotedPost.user}
        />
      )}

      {/* Repo attachment */}
      {post.repoAttachment && <RepoCard repo={post.repoAttachment} />}

      {/* Reactions */}
      {(Object.keys(reactions.counts).length > 0 || reactions.mine.length > 0) && (
        <ReactionBar postId={post.id} reactions={reactions} onUpdate={setReactions} />
      )}

      {/* Action Bar */}
      <ActionBar
        postId={post.id}
        replyCount={post.replyCount}
        forkCount={post.forkCount}
        starCount={post.starCount}
        isStarred={post.isStarred}
        reactions={reactions}
        onReactionUpdate={setReactions}
      />
    </article>
  );
}
