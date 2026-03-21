import { Router } from 'express';
import type { Database } from 'better-sqlite3';
import type { Logger } from 'pino';
import { z } from 'zod';
import { generateId } from '../lib/id.js';
import { requireAuth } from '../middleware/auth.js';
import { createProvider } from '@clitoris/llm';
import type { Post, PostIntent, PostEmotion, ReactionEmoji, MediaAttachment } from '@clitoris/shared';
import { REACTION_EMOJIS } from '@clitoris/shared';
import { createNotification, createActivity } from './notifications.js';

function buildCliLine(username: string, messageRaw: string, repoOwner?: string, repoName?: string): string {
  const tags = [...messageRaw.matchAll(/#([a-zA-Z0-9_]+)/g)].map((m) => m[1]).slice(0, 5);
  const repo = repoOwner && repoName ? ` --repo=${repoOwner}/${repoName}` : '';
  const tagStr = tags.length > 0 ? ` --tags=${tags.join(',')}` : '';
  const body = messageRaw.replace(/\n+/g, ' ').slice(0, 200);
  return `post --user=@${username}${repo}${tagStr} ¶ ${body}`;
}

const createPostSchema = z.object({
  messageRaw: z.string().min(1).max(2000),
  lang: z.string().length(2).default('en'),
  tags: z.array(z.string().max(50)).max(10).default([]),
  mentions: z.array(z.string()).max(20).default([]),
  visibility: z.enum(['public', 'private', 'unlisted']).default('public'),
  parentId: z.string().optional(),
  repoOwner: z.string().max(100).optional(),
  repoName: z.string().max(100).optional(),
  quotedPostId: z.string().optional(),
  mediaIds: z.array(z.string()).max(4).default([]),
});

const reactSchema = z.object({
  emoji: z.enum(REACTION_EMOJIS as unknown as [string, ...string[]]),
});

const translateSchema = z.object({
  targetLang: z.string().length(2),
});

interface PostRow {
  id: string;
  user_id: string;
  message_raw: string;
  message_cli: string;
  lang: string;
  tags: string;
  mentions: string;
  visibility: string;
  llm_model: string;
  parent_id: string | null;
  forked_from_id: string | null;
  created_at: string;
  username: string;
  domain: string | null;
  display_name: string;
  avatar_url: string | null;
  star_count: number;
  reply_count: number;
  fork_count: number;
  is_starred: number | null;
  intent: string;
  emotion: string;
  repo_owner: string | null;
  repo_name: string | null;
  repo_stars: number | null;
  repo_forks: number | null;
  repo_language: string | null;
  updated_at: string | null;
  quoted_post_id: string | null;
  qp_id: string | null;
  qp_message_raw: string | null;
  qp_message_cli: string | null;
  qp_username: string | null;
  qp_domain: string | null;
  qp_display_name: string | null;
  qp_avatar_url: string | null;
}

interface LlmKeyRow {
  api_key: string;
  base_url?: string;
}

function mapPost(row: PostRow, _userId: string | undefined, db?: Database): Post {
  // Fetch reaction counts and user's reactions
  let reactions: Post['reactions'] = { counts: {}, mine: [] };
  if (db) {
    const reactionRows = db.prepare(
      'SELECT emoji, COUNT(*) as cnt FROM reactions WHERE post_id = ? GROUP BY emoji'
    ).all(row.id) as Array<{ emoji: string; cnt: number }>;
    const counts: Partial<Record<ReactionEmoji, number>> = {};
    for (const r of reactionRows) counts[r.emoji as ReactionEmoji] = r.cnt;

    let mine: ReactionEmoji[] = [];
    if (_userId) {
      mine = (db.prepare(
        'SELECT emoji FROM reactions WHERE post_id = ? AND user_id = ?'
      ).all(row.id, _userId) as Array<{ emoji: string }>).map(r => r.emoji as ReactionEmoji);
    }
    reactions = { counts, mine };
  }

  return {
    id: row.id,
    userId: row.user_id,
    messageRaw: row.message_raw,
    messageCli: row.message_cli,
    lang: row.lang,
    tags: JSON.parse(row.tags) as string[],
    mentions: JSON.parse(row.mentions) as string[],
    visibility: row.visibility as Post['visibility'],
    llmModel: row.llm_model as Post['llmModel'],
    parentId: row.parent_id,
    forkedFromId: row.forked_from_id,
    createdAt: row.created_at,
    user: {
      username: row.username,
      domain: row.domain,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
    },
    starCount: row.star_count,
    replyCount: row.reply_count,
    forkCount: row.fork_count,
    isStarred: Boolean(row.is_starred),
    repoAttachment: row.repo_owner && row.repo_name ? {
      repoOwner: row.repo_owner,
      repoName: row.repo_name,
      repoStars: row.repo_stars ?? 0,
      repoForks: row.repo_forks ?? 0,
      repoLanguage: row.repo_language ?? null,
    } : null,
    intent: (row.intent as PostIntent) ?? 'casual',
    emotion: (row.emotion as PostEmotion) ?? 'neutral',
    reactions,
    quotedPostId: row.quoted_post_id ?? null,
    quotedPost: (row.qp_id && row.qp_message_raw && row.qp_message_cli && row.qp_username) ? {
      id: row.qp_id,
      messageRaw: row.qp_message_raw,
      messageCli: row.qp_message_cli,
      user: {
        username: row.qp_username,
        domain: row.qp_domain ?? null,
        displayName: row.qp_display_name ?? row.qp_username,
        avatarUrl: row.qp_avatar_url ?? null,
      },
    } : null,
    updatedAt: row.updated_at ?? null,
    media: db ? (db.prepare(
      'SELECT id, filename, mime_type, file_size, width, height FROM media_attachments WHERE post_id = ? ORDER BY created_at ASC'
    ).all(row.id) as Array<{ id: string; filename: string; mime_type: string; file_size: number; width: number | null; height: number | null }>)
      .map((m): MediaAttachment => ({
        id: m.id,
        url: `/uploads/${m.filename}`,
        mimeType: m.mime_type,
        fileSize: m.file_size,
        width: m.width,
        height: m.height,
      })) : [],
  };
}

function starredSubquery(userId: string | undefined): { sql: string; params: unknown[] } {
  return userId
    ? { sql: `, (SELECT 1 FROM stars s2 WHERE s2.user_id = ? AND s2.post_id = p.id) as is_starred`, params: [userId] }
    : { sql: ', 0 as is_starred', params: [] };
}

function countsFragment(): string {
  return `
    (SELECT COUNT(*) FROM stars s WHERE s.post_id = p.id) as star_count,
    (SELECT COUNT(*) FROM posts r WHERE r.parent_id = p.id) as reply_count,
    (SELECT COUNT(*) FROM posts f WHERE f.forked_from_id = p.id) as fork_count`;
}

function repoFragment(): string {
  return `, ra.repo_owner, ra.repo_name, ra.repo_stars, ra.repo_forks, ra.repo_language`;
}

function repoJoin(): string {
  return `LEFT JOIN repo_attachments ra ON ra.post_id = p.id`;
}

function quotedPostFragment(): string {
  return `, p.quoted_post_id,
    qp.id AS qp_id, qp.message_raw AS qp_message_raw, qp.message_cli AS qp_message_cli,
    qu.username AS qp_username, qu.domain AS qp_domain, qu.display_name AS qp_display_name, qu.avatar_url AS qp_avatar_url`;
}

function quotedPostJoin(): string {
  return `LEFT JOIN posts qp ON qp.id = p.quoted_post_id LEFT JOIN users qu ON qu.id = qp.user_id`;
}

function feedQueryNoCursor(userId: string | undefined): { sql: string; params: unknown[] } {
  const starred = starredSubquery(userId);
  return {
    sql: `
    SELECT p.*, u.username, u.domain, u.display_name, u.avatar_url,
      ${countsFragment()}
      ${starred.sql}
      ${repoFragment()}
      ${quotedPostFragment()}
    FROM posts p JOIN users u ON p.user_id = u.id ${repoJoin()} ${quotedPostJoin()}
    WHERE p.visibility = 'public' AND p.parent_id IS NULL
    ORDER BY p.created_at DESC LIMIT ?`,
    params: [...starred.params],
  };
}

function feedQuery(userId: string | undefined): { sql: string; params: unknown[] } {
  const starred = starredSubquery(userId);
  return {
    sql: `
    SELECT p.*, u.username, u.domain, u.display_name, u.avatar_url,
      ${countsFragment()}
      ${starred.sql}
      ${repoFragment()}
      ${quotedPostFragment()}
    FROM posts p JOIN users u ON p.user_id = u.id ${repoJoin()} ${quotedPostJoin()}
    WHERE p.visibility = 'public' AND p.parent_id IS NULL AND p.created_at < ?
    ORDER BY p.created_at DESC LIMIT ?`,
    params: [...starred.params],
  };
}

function singlePostQuery(userId: string | undefined): { sql: string; params: unknown[] } {
  const starred = starredSubquery(userId);
  return {
    sql: `
    SELECT p.*, u.username, u.domain, u.display_name, u.avatar_url,
      ${countsFragment()}
      ${starred.sql}
      ${repoFragment()}
      ${quotedPostFragment()}
    FROM posts p JOIN users u ON p.user_id = u.id ${repoJoin()} ${quotedPostJoin()}
    WHERE p.id = ?`,
    params: [...starred.params],
  };
}

function repliesQuery(userId: string | undefined): { sql: string; params: unknown[] } {
  const starred = starredSubquery(userId);
  return {
    sql: `
    SELECT p.*, u.username, u.domain, u.display_name, u.avatar_url,
      ${countsFragment()}
      ${starred.sql}
      ${repoFragment()}
      ${quotedPostFragment()}
    FROM posts p JOIN users u ON p.user_id = u.id ${repoJoin()} ${quotedPostJoin()}
    WHERE p.parent_id = ?
    ORDER BY p.created_at ASC`,
    params: [...starred.params],
  };
}

function feedByModelQueryNoCursor(userId: string | undefined): { sql: string; params: unknown[] } {
  const starred = starredSubquery(userId);
  return {
    sql: `
    SELECT p.*, u.username, u.domain, u.display_name, u.avatar_url,
      ${countsFragment()}
      ${starred.sql}
      ${repoFragment()}
      ${quotedPostFragment()}
    FROM posts p JOIN users u ON p.user_id = u.id ${repoJoin()} ${quotedPostJoin()}
    WHERE p.visibility = 'public' AND p.parent_id IS NULL AND p.llm_model = ?
    ORDER BY p.created_at DESC LIMIT ?`,
    params: [...starred.params],
  };
}

function feedByModelQuery(userId: string | undefined): { sql: string; params: unknown[] } {
  const starred = starredSubquery(userId);
  return {
    sql: `
    SELECT p.*, u.username, u.domain, u.display_name, u.avatar_url,
      ${countsFragment()}
      ${starred.sql}
      ${repoFragment()}
      ${quotedPostFragment()}
    FROM posts p JOIN users u ON p.user_id = u.id ${repoJoin()} ${quotedPostJoin()}
    WHERE p.visibility = 'public' AND p.parent_id IS NULL AND p.llm_model = ? AND p.created_at < ?
    ORDER BY p.created_at DESC LIMIT ?`,
    params: [...starred.params],
  };
}

function modelToProvider(model: string): string {
  if (model.startsWith('claude')) return 'anthropic';
  if (model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('o3') || model.startsWith('o4')) return 'openai';
  if (model.startsWith('gemini')) return 'gemini';
  if (model.startsWith('llama')) return 'ollama';
  return 'api';
}

export function createPostsRouter(db: Database, logger: Logger): Router {
  const router = Router();

  router.get('/feed/global', (req, res) => {
    const { cursor, limit = '20' } = req.query as Record<string, string>;
    const pageLimit = Math.min(parseInt(limit, 10) || 20, 50);
    const userId = (req as { session?: { userId?: string } }).session?.userId;

    const q = cursor ? feedQuery(userId) : feedQueryNoCursor(userId);
    const posts = cursor
      ? db.prepare(q.sql).all(...q.params, cursor, pageLimit + 1)
      : db.prepare(q.sql).all(...q.params, pageLimit + 1);

    const rows = posts as PostRow[];
    const hasMore = rows.length > pageLimit;
    const data = rows.slice(0, pageLimit).map((r) => mapPost(r, userId, db));
    const nextCursor = hasMore ? data[data.length - 1]?.createdAt : undefined;

    res.json({ data, meta: { cursor: nextCursor, hasMore } });
  });

  router.post('/', requireAuth, async (req, res) => {
    const parsed = createPostSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
      return;
    }

    const { messageRaw, lang, tags, mentions, visibility, parentId, repoOwner, repoName, quotedPostId, mediaIds } = parsed.data;

    if (parentId) {
      const parent = db.prepare('SELECT id, user_id FROM posts WHERE id = ?').get(parentId) as { id: string; user_id: string } | undefined;
      if (!parent) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Parent post not found' } });
        return;
      }
    }

    if (quotedPostId) {
      const quoted = db.prepare('SELECT id FROM posts WHERE id = ?').get(quotedPostId);
      if (!quoted) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Quoted post not found' } });
        return;
      }
    }

    const id = generateId();
    const userId = req.session.userId!;
    const userRow = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as { username: string };
    const messageCli = buildCliLine(userRow.username, messageRaw, repoOwner, repoName);

    db.prepare(`
      INSERT INTO posts (id, user_id, message_raw, message_cli, lang, tags, mentions, visibility, parent_id, intent, emotion, quoted_post_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, messageRaw, messageCli, lang, JSON.stringify(tags), JSON.stringify(mentions), visibility, parentId ?? null, 'casual', 'neutral', quotedPostId ?? null);

    // Notify parent post author on reply
    if (parentId) {
      const parent = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(parentId) as { user_id: string } | undefined;
      if (parent) {
        createNotification(db, parent.user_id, 'reply', userId, id, messageRaw.slice(0, 100));
        createActivity(db, userId, 'reply', parent.user_id, id);
      }
    }

    // Notify mentioned users
    for (const mention of mentions) {
      const mentioned = db.prepare('SELECT id FROM users WHERE username = ?').get(mention) as { id: string } | undefined;
      if (mentioned) {
        createNotification(db, mentioned.id, 'mention', userId, id, messageRaw.slice(0, 100));
      }
    }

    // Notify quoted post author
    if (quotedPostId) {
      const quoted = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(quotedPostId) as { user_id: string } | undefined;
      if (quoted) {
        createNotification(db, quoted.user_id, 'quote', userId, id, messageRaw.slice(0, 100));
      }
    }

    // Link uploaded media to this post
    if (mediaIds.length > 0) {
      const linkStmt = db.prepare('UPDATE media_attachments SET post_id = ? WHERE id = ? AND user_id = ? AND post_id IS NULL');
      for (const mediaId of mediaIds) {
        linkStmt.run(id, mediaId, userId);
      }
    }

    // Fetch and cache repo info from GitHub if provided
    if (repoOwner && repoName) {
      try {
        const ghRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}`, {
          headers: { 'User-Agent': 'CLItoris', Accept: 'application/vnd.github+json' },
        });
        if (ghRes.ok) {
          const ghData = await ghRes.json() as {
            stargazers_count: number; forks_count: number; language: string | null
          };
          db.prepare(`
            INSERT INTO repo_attachments (post_id, repo_owner, repo_name, repo_stars, repo_forks, repo_language)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(post_id) DO UPDATE SET
              repo_stars = excluded.repo_stars, repo_forks = excluded.repo_forks,
              repo_language = excluded.repo_language, cached_at = datetime('now')
          `).run(id, repoOwner, repoName, ghData.stargazers_count, ghData.forks_count, ghData.language);
        } else {
          // GitHub fetch failed — still save the attachment with zero counts
          db.prepare(`
            INSERT OR IGNORE INTO repo_attachments (post_id, repo_owner, repo_name, repo_stars, repo_forks, repo_language)
            VALUES (?, ?, ?, 0, 0, NULL)
          `).run(id, repoOwner, repoName);
        }
      } catch {
        // Network error — save with zero counts so the attachment is still shown
        db.prepare(`
          INSERT OR IGNORE INTO repo_attachments (post_id, repo_owner, repo_name, repo_stars, repo_forks, repo_language)
          VALUES (?, ?, ?, 0, 0, NULL)
        `).run(id, repoOwner, repoName);
      }
    }

    const spq = singlePostQuery(userId);
    const row = db.prepare(spq.sql).get(...spq.params, id) as PostRow;
    res.status(201).json({ data: mapPost(row, userId, db) });
  });

  router.get('/feed/local', (req, res) => {
    const userId = (req as { session?: { userId?: string } }).session?.userId;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Login required' } });
      return;
    }
    const { cursor, limit = '20' } = req.query as Record<string, string>;
    const pageLimit = Math.min(parseInt(limit, 10) || 20, 50);

    const base = `
      SELECT p.*, u.username, u.domain, u.display_name, u.avatar_url,
        ${countsFragment()}
        , (SELECT 1 FROM stars s2 WHERE s2.user_id = ? AND s2.post_id = p.id) as is_starred
        ${repoFragment()}
        ${quotedPostFragment()}
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN follows f ON f.following_id = p.user_id AND f.follower_id = ?
      ${repoJoin()} ${quotedPostJoin()}
      WHERE p.visibility = 'public' AND p.parent_id IS NULL`;

    const posts = cursor
      ? db.prepare(`${base} AND p.created_at < ? ORDER BY p.created_at DESC LIMIT ?`).all(userId, userId, cursor, pageLimit + 1)
      : db.prepare(`${base} ORDER BY p.created_at DESC LIMIT ?`).all(userId, userId, pageLimit + 1);

    const rows = posts as PostRow[];
    const hasMore = rows.length > pageLimit;
    const data = rows.slice(0, pageLimit).map((r) => mapPost(r, userId, db));

    res.json({ data, meta: { cursor: data[data.length - 1]?.createdAt, hasMore } });
  });

  router.get('/trending/tags', (_req, res) => {
    const rows = db.prepare(`
      SELECT t.value as tag, COUNT(*) as count
      FROM posts p, json_each(p.tags) t
      WHERE p.created_at > datetime('now', '-7 days')
      GROUP BY t.value ORDER BY count DESC LIMIT 20
    `).all() as Array<{ tag: string; count: number }>;
    res.json({ data: rows });
  });

  router.get('/trending/repos', (_req, res) => {
    const rows = db.prepare(`
      SELECT ra.repo_owner as owner, ra.repo_name as name,
        COUNT(*) as mention_count,
        MAX(ra.repo_stars) as stars,
        MAX(ra.repo_forks) as forks,
        MAX(ra.repo_language) as language
      FROM repo_attachments ra
      JOIN posts p ON p.id = ra.post_id
      WHERE p.created_at > datetime('now', '-7 days')
        AND p.visibility = 'public'
      GROUP BY ra.repo_owner, ra.repo_name
      ORDER BY mention_count DESC, stars DESC
      LIMIT 10
    `).all() as Array<{
      owner: string; name: string; mention_count: number;
      stars: number; forks: number; language: string | null;
    }>;

    res.json({
      data: rows.map((r) => ({
        owner: r.owner,
        name: r.name,
        mentionCount: r.mention_count,
        topTags: [],
        stars: r.stars ?? 0,
        forks: r.forks ?? 0,
        language: r.language ?? null,
      })),
    });
  });

  router.get('/feed/explore', (req, res) => {
    const { cursor, limit = '20', tag } = req.query as Record<string, string>;
    const userId = (req as { session?: { userId?: string } }).session?.userId;
    const pageLimit = Math.min(parseInt(limit, 10) || 20, 50);

    const tagFilter = tag ? `AND EXISTS (SELECT 1 FROM json_each(p.tags) t WHERE t.value = ?)` : '';
    const starred = starredSubquery(userId);

    const base = `
      SELECT p.*, u.username, u.domain, u.display_name, u.avatar_url,
        ${countsFragment()}
        ${starred.sql}
        ${repoFragment()}
        ${quotedPostFragment()}
      FROM posts p JOIN users u ON p.user_id = u.id ${repoJoin()} ${quotedPostJoin()}
      WHERE p.visibility = 'public' AND p.parent_id IS NULL ${tagFilter}`;

    const baseParams: unknown[] = [...starred.params, ...(tag ? [tag] : [])];

    const posts = cursor
      ? db.prepare(`${base} AND (SELECT COUNT(*) FROM stars s WHERE s.post_id = p.id) < ? ORDER BY (SELECT COUNT(*) FROM stars s WHERE s.post_id = p.id) DESC, p.created_at DESC LIMIT ?`).all(...baseParams, parseInt(cursor, 10), pageLimit + 1)
      : db.prepare(`${base} ORDER BY (SELECT COUNT(*) FROM stars s WHERE s.post_id = p.id) DESC, p.created_at DESC LIMIT ?`).all(...baseParams, pageLimit + 1);

    const rows = posts as PostRow[];
    const hasMore = rows.length > pageLimit;
    const data = rows.slice(0, pageLimit).map((r) => mapPost(r, userId, db));
    const lastStarCount = data.length > 0 ? data[data.length - 1]?.starCount : undefined;

    res.json({ data, meta: { cursor: lastStarCount !== undefined ? String(lastStarCount) : undefined, hasMore } });
  });

  router.get('/by-llm/:model', (req, res) => {
    const { cursor, limit = '20' } = req.query as Record<string, string>;
    const userId = (req as { session?: { userId?: string } }).session?.userId;
    const pageLimit = Math.min(parseInt(limit, 10) || 20, 50);
    const { model } = req.params;

    const q = cursor ? feedByModelQuery(userId) : feedByModelQueryNoCursor(userId);
    const posts = cursor
      ? db.prepare(q.sql).all(...q.params, model, cursor, pageLimit + 1)
      : db.prepare(q.sql).all(...q.params, model, pageLimit + 1);

    const rows = posts as PostRow[];
    const hasMore = rows.length > pageLimit;
    const data = rows.slice(0, pageLimit).map((r) => mapPost(r, userId, db));

    res.json({ data, meta: { cursor: data[data.length - 1]?.createdAt, hasMore } });
  });

  // GET /search — full-text search (MUST be before /:id to avoid route collision)
  router.get('/search', (req, res) => {
    const { q, cursor, limit = '20' } = req.query as Record<string, string>;
    if (!q || q.trim().length === 0) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Search query is required' } });
      return;
    }
    const searchQuery = q.trim().slice(0, 200);

    const userId = (req as { session?: { userId?: string } }).session?.userId;
    const pageLimit = Math.min(parseInt(limit, 10) || 20, 50);

    // Sanitize FTS5 query: escape special characters, wrap terms in double quotes
    const ftsQuery = searchQuery.replace(/["\-*(){}[\]^~:]/g, ' ').trim().split(/\s+/).filter(Boolean).map(t => `"${t}"`).join(' ');

    if (!ftsQuery) {
      res.json({ data: { posts: [], users: [], tags: [] }, meta: { hasMore: false } });
      return;
    }

    const starred = starredSubquery(userId);
    const cursorClause = cursor ? 'AND p.created_at < ?' : '';
    const params: unknown[] = cursor
      ? [...starred.params, ftsQuery, cursor, pageLimit + 1]
      : [...starred.params, ftsQuery, pageLimit + 1];

    let postRows: PostRow[] = [];
    try {
      postRows = db.prepare(`
        SELECT p.*, u.username, u.domain, u.display_name, u.avatar_url,
          ${countsFragment()}
          ${starred.sql}
          ${repoFragment()}
          ${quotedPostFragment()}
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ${repoJoin()} ${quotedPostJoin()}
        WHERE p.rowid IN (SELECT rowid FROM posts_fts WHERE posts_fts MATCH ?)
          ${cursorClause}
        ORDER BY p.created_at DESC
        LIMIT ?
      `).all(...params) as PostRow[];
    } catch {
      // FTS5 query parse error — return empty results
    }

    const hasMore = postRows.length > pageLimit;
    const posts = postRows.slice(0, pageLimit).map(r => mapPost(r, userId, db));

    const likePattern = `%${searchQuery}%`;
    const userRows = db.prepare(`
      SELECT username, display_name, avatar_url, github_username, bio
      FROM users
      WHERE username LIKE ? OR display_name LIKE ? OR github_username LIKE ?
      LIMIT 10
    `).all(likePattern, likePattern, likePattern) as Array<{
      username: string; display_name: string; avatar_url: string | null;
      github_username: string; bio: string | null;
    }>;

    const tagRows = db.prepare(`
      SELECT t.value as tag, COUNT(*) as count
      FROM posts p2, json_each(p2.tags) t
      WHERE t.value LIKE ?
      GROUP BY t.value ORDER BY count DESC LIMIT 10
    `).all(likePattern) as Array<{ tag: string; count: number }>;

    res.json({
      data: {
        posts,
        users: userRows.map(u => ({
          username: u.username,
          displayName: u.display_name,
          avatarUrl: u.avatar_url,
          githubUsername: u.github_username,
          bio: u.bio,
        })),
        tags: tagRows,
      },
      meta: {
        cursor: posts.length > 0 ? posts[posts.length - 1]?.createdAt : undefined,
        hasMore,
      },
    });
  });

  router.get('/:id', (req, res) => {
    const userId = (req as { session?: { userId?: string } }).session?.userId;
    const sq = singlePostQuery(userId);
    const row = db.prepare(sq.sql).get(...sq.params, req.params.id) as PostRow | undefined;
    if (!row) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
      return;
    }

    const rq = repliesQuery(userId);
    const replies = db.prepare(rq.sql).all(...rq.params, req.params.id) as PostRow[];
    res.json({ data: { ...mapPost(row, userId, db), replies: replies.map((r) => mapPost(r, userId, db)) } });
  });

  router.post('/:id/star', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const id = req.params.id as string;

    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(id);
    if (!post) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
      return;
    }

    const existing = db.prepare('SELECT 1 FROM stars WHERE user_id = ? AND post_id = ?').get(userId, id);

    if (existing) {
      db.prepare('DELETE FROM stars WHERE user_id = ? AND post_id = ?').run(userId, id);
    } else {
      db.prepare('INSERT INTO stars (user_id, post_id) VALUES (?, ?)').run(userId, id);
      // Notify post author and create activity
      const postAuthor = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(id) as { user_id: string } | undefined;
      if (postAuthor) {
        createNotification(db, postAuthor.user_id, 'star', userId, id, null);
        createActivity(db, userId, 'star_post', postAuthor.user_id, id);
      }
    }

    const count = (db.prepare('SELECT COUNT(*) as c FROM stars WHERE post_id = ?').get(id) as { c: number }).c;
    res.json({ data: { starred: !existing, starCount: count } });
  });

  router.post('/:id/fork', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const { id } = req.params;

    const original = db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as PostRow | undefined;
    if (!original) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
      return;
    }

    const alreadyForked = db.prepare('SELECT 1 FROM posts WHERE user_id = ? AND forked_from_id = ?').get(userId, id);
    if (alreadyForked) {
      res.status(409).json({ error: { code: 'CONFLICT', message: 'Already forked this post' } });
      return;
    }

    const newId = generateId();
    db.prepare(`
      INSERT INTO posts (id, user_id, message_raw, message_cli, lang, tags, mentions, visibility, llm_model, forked_from_id, intent, emotion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(newId, userId, original.message_raw, original.message_cli, original.lang, original.tags, original.mentions, original.visibility, original.llm_model, id, original.intent ?? 'casual', original.emotion ?? 'neutral');

    // Notify original author and create activity
    createNotification(db, original.user_id, 'fork', userId, newId, null);
    createActivity(db, userId, 'fork_post', original.user_id, newId);

    const fq = singlePostQuery(userId);
    const row = db.prepare(fq.sql).get(...fq.params, newId) as PostRow;
    res.status(201).json({ data: mapPost(row, userId, db) });
  });

  router.post('/:id/translate', async (req, res) => {
    const parsed = translateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
      return;
    }

    const { targetLang } = parsed.data;
    const { id } = req.params;

    // Fetch the post
    const post = db.prepare('SELECT id, message_raw, lang, intent, emotion, llm_model FROM posts WHERE id = ?').get(id) as {
      id: string;
      message_raw: string;
      lang: string;
      intent: string;
      emotion: string;
      llm_model: string;
    } | undefined;

    if (!post) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
      return;
    }

    if (post.lang === targetLang) {
      res.status(400).json({ error: { code: 'SAME_LANG', message: 'Source and target language are the same' } });
      return;
    }

    // Check translation cache
    const cached = db.prepare('SELECT text FROM translations WHERE post_id = ? AND lang = ?').get(id, targetLang) as { text: string } | undefined;
    if (cached) {
      res.json({ data: { translatedText: cached.text, sourceLang: post.lang, targetLang, cached: true } });
      return;
    }

    // Cache miss — need auth to call LLM
    const userId = (req as { session?: { userId?: string } }).session?.userId;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Login required for translation' } });
      return;
    }

    // Look up user's LLM key for the provider
    const providerName = modelToProvider(post.llm_model);
    const keylessProviders = new Set(['ollama']);
    let credentials: { apiKey?: string; baseUrl?: string } = {};

    if (!keylessProviders.has(providerName)) {
      const keyRow = db.prepare('SELECT api_key, base_url FROM user_llm_keys WHERE user_id = ? AND provider = ?').get(userId, providerName) as LlmKeyRow | undefined;

      if (!keyRow) {
        res.status(400).json({
          error: {
            code: 'KEY_NOT_CONFIGURED',
            message: `No API key configured for provider: ${providerName}. Add it in Settings.`,
          },
        });
        return;
      }
      credentials = {
        apiKey: keyRow.api_key,
        ...(keyRow.base_url ? { baseUrl: keyRow.base_url } : {}),
      };
    }

    try {
      const provider = createProvider(providerName, credentials);
      const translatedText = await provider.translate({
        message: post.message_raw,
        sourceLang: post.lang,
        targetLang,
        intent: (post.intent as PostIntent) ?? 'casual',
        emotion: (post.emotion as PostEmotion) ?? 'neutral',
        model: post.llm_model,
      });

      // Cache the translation
      db.prepare(`
        INSERT INTO translations (id, post_id, lang, text)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(post_id, lang) DO UPDATE SET text = excluded.text
      `).run(generateId(), id, targetLang, translatedText);

      res.json({ data: { translatedText, sourceLang: post.lang, targetLang, cached: false } });
    } catch (err) {
      logger.error({ err, postId: id, targetLang }, 'Translation failed');
      res.status(500).json({ error: { code: 'LLM_ERROR', message: 'Translation failed' } });
    }
  });

  // POST /:id/react — toggle a reaction
  router.post('/:id/react', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const id = req.params.id as string;
    const parsed = reactSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
      return;
    }

    const post = db.prepare('SELECT id, user_id FROM posts WHERE id = ?').get(id) as { id: string; user_id: string } | undefined;
    if (!post) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
      return;
    }

    const { emoji } = parsed.data;
    const existing = db.prepare('SELECT 1 FROM reactions WHERE user_id = ? AND post_id = ? AND emoji = ?').get(userId, id, emoji);

    if (existing) {
      db.prepare('DELETE FROM reactions WHERE user_id = ? AND post_id = ? AND emoji = ?').run(userId, id, emoji);
    } else {
      db.prepare('INSERT INTO reactions (user_id, post_id, emoji) VALUES (?, ?, ?)').run(userId, id, emoji);
      createNotification(db, post.user_id, 'reaction', userId, id, emoji);
    }

    // Return updated counts
    const reactionRows = db.prepare(
      'SELECT emoji, COUNT(*) as cnt FROM reactions WHERE post_id = ? GROUP BY emoji'
    ).all(id) as Array<{ emoji: string; cnt: number }>;
    const counts: Partial<Record<ReactionEmoji, number>> = {};
    for (const r of reactionRows) counts[r.emoji as ReactionEmoji] = r.cnt;

    const mine = (db.prepare(
      'SELECT emoji FROM reactions WHERE post_id = ? AND user_id = ?'
    ).all(id, userId) as Array<{ emoji: string }>).map(r => r.emoji as ReactionEmoji);

    res.json({ data: { toggled: !existing, emoji, reactions: { counts, mine } } });
  });

  // ── Edit post ──
  const updatePostSchema = z.object({
    messageRaw: z.string().min(1).max(2000),
    lang: z.string().length(2).default('en'),
    tags: z.array(z.string().max(50)).max(10).default([]),
    mentions: z.array(z.string()).max(20).default([]),
  });

  router.put('/:id', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const parsed = updatePostSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
      return;
    }

    const post = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(req.params.id) as { user_id: string } | undefined;
    if (!post) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
      return;
    }
    if (post.user_id !== userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not the author' } });
      return;
    }

    const { messageRaw, lang, tags, mentions } = parsed.data;
    const userRow2 = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as { username: string };
    const updatedCli = buildCliLine(userRow2.username, messageRaw);
    db.prepare(`
      UPDATE posts SET message_raw = ?, message_cli = ?, lang = ?, tags = ?, mentions = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(messageRaw, updatedCli, lang, JSON.stringify(tags), JSON.stringify(mentions), req.params.id);

    db.prepare('DELETE FROM translations WHERE post_id = ?').run(req.params.id);

    const starred = starredSubquery(userId);
    const row = db.prepare(`
      SELECT p.*, u.username, u.domain, u.display_name, u.avatar_url,
        ${countsFragment()}
        ${starred.sql}
        ${repoFragment()}
        ${quotedPostFragment()}
      FROM posts p JOIN users u ON p.user_id = u.id ${repoJoin()} ${quotedPostJoin()}
      WHERE p.id = ?
    `).get(...starred.params, req.params.id) as PostRow;

    res.json({ data: mapPost(row, userId, db) });
  });

  router.delete('/:id', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const post = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(req.params.id) as { user_id: string } | undefined;

    if (!post) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
      return;
    }
    if (post.user_id !== userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not the author of this post' } });
      return;
    }

    db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
    res.json({ data: { message: 'Post deleted' } });
  });

  return router;
}
