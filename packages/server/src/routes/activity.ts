import { Router } from 'express';
import type { Database } from 'better-sqlite3';
import { requireAuth } from '../middleware/auth.js';
import { generateId } from '../lib/id.js';

interface ActivityRow {
  id: string;
  actor_id: string;
  event_type: string;
  target_user_id: string | null;
  target_post_id: string | null;
  metadata: string;
  created_at: string;
  actor_username: string;
  actor_display_name: string;
  actor_avatar_url: string | null;
  actor_domain: string | null;
  target_username: string | null;
  target_display_name: string | null;
  target_avatar_url: string | null;
  target_domain: string | null;
  post_message_raw: string | null;
  post_message_cli: string | null;
}

function mapActivity(row: ActivityRow) {
  return {
    id: row.id,
    actorId: row.actor_id,
    actor: {
      username: row.actor_username,
      displayName: row.actor_display_name,
      avatarUrl: row.actor_avatar_url,
      domain: row.actor_domain,
    },
    eventType: row.event_type,
    targetUserId: row.target_user_id,
    targetUser: row.target_username ? {
      username: row.target_username,
      displayName: row.target_display_name!,
      avatarUrl: row.target_avatar_url,
      domain: row.target_domain,
    } : null,
    targetPostId: row.target_post_id,
    targetPost: row.post_message_raw ? {
      messageRaw: row.post_message_raw,
      messageCli: row.post_message_cli!,
    } : null,
    metadata: JSON.parse(row.metadata || '{}'),
    createdAt: row.created_at,
  };
}

export function createActivityRouter(db: Database): Router {
  const router = Router();

  // GET /api/activity/feed — activity from users you follow + your own
  router.get('/feed', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const cursor = req.query.cursor as string | undefined;
    const limit = 30;

    const whereClause = cursor
      ? `AND a.created_at < ?`
      : '';
    const params = cursor
      ? [userId, userId, cursor, limit + 1]
      : [userId, userId, limit + 1];

    const rows = db.prepare(`
      SELECT
        a.id, a.actor_id, a.event_type, a.target_user_id, a.target_post_id,
        a.metadata, a.created_at,
        u.username AS actor_username, u.display_name AS actor_display_name,
        u.avatar_url AS actor_avatar_url, u.domain AS actor_domain,
        tu.username AS target_username, tu.display_name AS target_display_name,
        tu.avatar_url AS target_avatar_url, tu.domain AS target_domain,
        p.message_raw AS post_message_raw, p.message_cli AS post_message_cli
      FROM activity_feed a
      JOIN users u ON u.id = a.actor_id
      LEFT JOIN users tu ON tu.id = a.target_user_id
      LEFT JOIN posts p ON p.id = a.target_post_id
      WHERE (a.actor_id IN (SELECT following_id FROM follows WHERE follower_id = ?) OR a.actor_id = ?)
        ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ?
    `).all(...params) as ActivityRow[];

    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit).map(mapActivity);

    res.json({
      data,
      meta: {
        cursor: data.length > 0 ? data[data.length - 1]!.createdAt : null,
        hasMore,
      },
    });
  });

  // GET /api/activity/global — all activity (for explore-like view)
  router.get('/global', (req, res) => {
    const cursor = req.query.cursor as string | undefined;
    const limit = 30;

    const whereClause = cursor ? `WHERE a.created_at < ?` : '';
    const params = cursor ? [cursor, limit + 1] : [limit + 1];

    const rows = db.prepare(`
      SELECT
        a.id, a.actor_id, a.event_type, a.target_user_id, a.target_post_id,
        a.metadata, a.created_at,
        u.username AS actor_username, u.display_name AS actor_display_name,
        u.avatar_url AS actor_avatar_url, u.domain AS actor_domain,
        tu.username AS target_username, tu.display_name AS target_display_name,
        tu.avatar_url AS target_avatar_url, tu.domain AS target_domain,
        p.message_raw AS post_message_raw, p.message_cli AS post_message_cli
      FROM activity_feed a
      JOIN users u ON u.id = a.actor_id
      LEFT JOIN users tu ON tu.id = a.target_user_id
      LEFT JOIN posts p ON p.id = a.target_post_id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ?
    `).all(...params) as ActivityRow[];

    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit).map(mapActivity);

    res.json({
      data,
      meta: {
        cursor: data.length > 0 ? data[data.length - 1]!.createdAt : null,
        hasMore,
      },
    });
  });

  // POST /api/activity/sync-github — fetch GitHub events and insert into activity_feed
  router.post('/sync-github', requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = db.prepare(
      'SELECT github_username, github_access_token FROM users WHERE id = ?'
    ).get(userId) as { github_username: string; github_access_token: string | null } | undefined;

    if (!user) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } }); return; }

    const headers: Record<string, string> = { 'User-Agent': 'CLItoris', Accept: 'application/vnd.github+json' };
    if (user.github_access_token) headers.Authorization = `Bearer ${user.github_access_token}`;

    try {
      const ghRes = await fetch(
        `https://api.github.com/users/${user.github_username}/events?per_page=30`,
        { headers },
      );
      if (!ghRes.ok) {
        res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to fetch GitHub events' } });
        return;
      }

      const events = await ghRes.json() as Array<{
        id: string;
        type: string;
        repo: { name: string };
        payload: Record<string, unknown>;
        created_at: string;
      }>;

      let created = 0;
      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO activity_feed (id, actor_id, event_type, metadata, github_event_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const event of events) {
        const mapped = mapGitHubEvent(event);
        if (!mapped) continue;

        const result = insertStmt.run(
          generateId(), userId, mapped.eventType,
          JSON.stringify(mapped.metadata), event.id, event.created_at,
        );
        if (result.changes > 0) created++;
      }

      res.json({ data: { synced: created, total: events.length } });
    } catch {
      res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to sync GitHub events' } });
    }
  });

  return router;
}

function mapGitHubEvent(event: {
  type: string;
  repo: { name: string };
  payload: Record<string, unknown>;
}): { eventType: string; metadata: Record<string, unknown> } | null {
  const repo = event.repo.name;

  switch (event.type) {
    case 'PushEvent': {
      const payload = event.payload as { ref?: string; size?: number; commits?: Array<{ message: string }> };
      const branch = (payload.ref ?? '').replace('refs/heads/', '');
      return {
        eventType: 'github_push',
        metadata: {
          repo, branch,
          commits: payload.size ?? payload.commits?.length ?? 0,
          commitMessages: (payload.commits ?? []).slice(0, 3).map((c) => c.message.split('\n')[0]),
        },
      };
    }
    case 'PullRequestEvent': {
      const payload = event.payload as { action?: string; pull_request?: { number?: number; title?: string; merged?: boolean } };
      if (payload.action === 'closed' && payload.pull_request?.merged) {
        return {
          eventType: 'github_pr_merge',
          metadata: { repo, number: payload.pull_request.number, title: payload.pull_request.title },
        };
      }
      if (payload.action === 'opened') {
        return {
          eventType: 'github_pr_open',
          metadata: { repo, number: payload.pull_request?.number, title: payload.pull_request?.title },
        };
      }
      return null;
    }
    case 'WatchEvent':
      return { eventType: 'github_star', metadata: { repo } };
    case 'ForkEvent': {
      const payload = event.payload as { forkee?: { full_name?: string } };
      return { eventType: 'github_fork', metadata: { repo, fork: payload.forkee?.full_name } };
    }
    case 'ReleaseEvent': {
      const payload = event.payload as { action?: string; release?: { tag_name?: string; name?: string } };
      if (payload.action !== 'published') return null;
      return {
        eventType: 'github_release',
        metadata: { repo, tag: payload.release?.tag_name, name: payload.release?.name },
      };
    }
    case 'CreateEvent': {
      const payload = event.payload as { ref_type?: string };
      if (payload.ref_type !== 'repository') return null;
      return { eventType: 'github_create', metadata: { repo } };
    }
    default:
      return null;
  }
}
