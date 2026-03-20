import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { Post, PostReactions } from '@clitoris/shared';
import DualPanel from './DualPanel.js';
import ActionBar from './ActionBar.js';
import RepoCard from './RepoCard.js';
import ReactionBar from './ReactionBar.js';
import QuotedPost from './QuotedPost.js';
import { useUiStore } from '../../stores/uiStore.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useFeedStore } from '../../stores/feedStore.js';
import { api } from '../../api/client.js';
import { toastError, toastSuccess } from '../../stores/toastStore.js';
import type { ApiResponse } from '@clitoris/shared';

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
  const { user: authUser } = useAuthStore();
  const { updatePost } = useFeedStore();
  const isAuthor = authUser?.id === post.userId;
  const [reactions, setReactions] = useState<PostReactions>(post.reactions ?? { counts: {}, mine: [] });
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(post.messageRaw);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setReactions(post.reactions ?? { counts: {}, mine: [] });
  }, [post.id]);
  const { user } = post;
  const showTranslate = post.lang !== uiLang;
  const color = avatarColor(user.username);

  const handleEditSave = async () => {
    if (!editDraft.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const tRes = await api.post<ApiResponse<{ messageCli: string; lang: string; tags: string[]; intent: string; emotion: string }>>(
        '/llm/transform', { message: editDraft, model: post.llmModel, lang: post.lang }
      );
      const res = await api.put<ApiResponse<Post>>(`/posts/${post.id}`, {
        messageRaw: editDraft, messageCli: tRes.data.messageCli, lang: tRes.data.lang,
        tags: tRes.data.tags, mentions: post.mentions, llmModel: post.llmModel,
        intent: tRes.data.intent, emotion: tRes.data.emotion,
      });
      updatePost(post.id, res.data);
      setIsEditing(false);
      toastSuccess('Post updated');
    } catch {
      toastError('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNavigate = () => { if (!isEditing) navigate(`/post/${post.id}`); };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNavigate(); }
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
      className={`cursor-pointer outline-none transition-all duration-200 border-b ${
        focused
          ? 'border-[var(--accent-green)]/10 bg-[var(--accent-green)]/[0.02]'
          : 'border-[var(--border)]/15 hover:bg-white/[0.01]'
      }`}
    >
      {/* Header — author identity, minimal metadata */}
      <div id={`post-header-${post.id}`} className="flex items-center gap-3 px-5 pt-5 pb-0">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-mono text-[11px] font-semibold"
          style={{ backgroundColor: color + '12', color, border: `1px solid ${color}20` }}
          aria-hidden="true"
        >
          {user.username[0]?.toUpperCase()}
        </div>

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Link
            to={`/@${user.username}`}
            data-testid="post-username"
            className="font-mono text-[13px] font-medium hover:opacity-70 transition-opacity shrink-0"
            style={{ color }}
            onClick={(e) => e.stopPropagation()}
          >
            @{user.username}
          </Link>
          <span className="text-[var(--text-faint)]/40 text-[11px] font-mono shrink-0">
            {timeAgo(post.createdAt)}
            {post.updatedAt && <span className="ml-1 text-[var(--text-faint)]/30">(edited)</span>}
          </span>

          {post.lang && (
            <span className="text-[var(--accent-purple)]/30 text-[10px] font-mono shrink-0 ml-auto">
              {post.lang}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="px-5 py-3 space-y-2" onClick={(e) => e.stopPropagation()}>
          <textarea
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            className="w-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text)] text-[14px] leading-[1.7] font-sans p-3 resize-none outline-none focus:border-[var(--accent-green)]/30"
            rows={4}
            disabled={isSaving}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setIsEditing(false); setEditDraft(post.messageRaw); }}
              className="font-mono text-[11px] text-[var(--text-faint)] hover:text-[var(--text-muted)] px-3 py-1"
              disabled={isSaving}
            >
              cancel
            </button>
            <button
              onClick={handleEditSave}
              disabled={isSaving || !editDraft.trim()}
              className="font-mono text-[11px] text-[var(--accent-green)] border border-[var(--accent-green)]/20 bg-[var(--accent-green)]/[0.06] px-3 py-1 hover:bg-[var(--accent-green)]/[0.12] disabled:opacity-40"
            >
              {isSaving ? 'saving...' : 'save'}
            </button>
          </div>
        </div>
      ) : (
        <DualPanel
          postId={post.id}
          messageRaw={post.messageRaw}
          messageCli={post.messageCli}
          tags={post.tags}
          postLang={post.lang}
          showTranslate={showTranslate}
          uiLang={uiLang}
        />
      )}

      {/* Quoted post */}
      {post.quotedPost && (
        <QuotedPost
          id={post.quotedPost.id}
          messageRaw={post.quotedPost.messageRaw}
          messageCli={post.quotedPost.messageCli}
          user={post.quotedPost.user}
        />
      )}

      {/* Repo */}
      {post.repoAttachment && <RepoCard repo={post.repoAttachment} />}

      {/* Reactions — only when they exist */}
      {(Object.keys(reactions.counts).length > 0 || reactions.mine.length > 0) && (
        <ReactionBar postId={post.id} reactions={reactions} onUpdate={setReactions} />
      )}

      {/* Actions — recede until needed */}
      <ActionBar
        postId={post.id}
        replyCount={post.replyCount}
        forkCount={post.forkCount}
        starCount={post.starCount}
        isStarred={post.isStarred}
        reactions={reactions}
        onReactionUpdate={setReactions}
        isAuthor={isAuthor}
        onEdit={() => setIsEditing(true)}
      />
    </article>
  );
}
