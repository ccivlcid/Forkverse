import { Router } from 'express';
import type { Database } from 'better-sqlite3';
import { requireAuth } from '../middleware/auth.js';
import { generateId } from '../lib/id.js';

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  actor_id: string;
  post_id: string | null;
  message: string | null;
  read: number;
  created_at: string;
  actor_username: string;
  actor_display_name: string;
  actor_avatar_url: string | null;
  actor_domain: string | null;
}

function mapNotification(row: NotificationRow) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    actorId: row.actor_id,
    actor: {
      username: row.actor_username,
      displayName: row.actor_display_name,
      avatarUrl: row.actor_avatar_url,
      domain: row.actor_domain,
    },
    postId: row.post_id,
    message: row.message,
    read: row.read === 1,
    createdAt: row.created_at,
  };
}

export function createNotificationRouter(db: Database): Router {
  const router = Router();

  // GET /api/notifications
  router.get('/', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const cursor = req.query.cursor as string | undefined;
    const limit = 30;

    const whereClause = cursor ? `AND n.created_at < ?` : '';
    const params = cursor ? [userId, cursor, limit + 1] : [userId, limit + 1];

    const rows = db.prepare(`
      SELECT
        n.id, n.user_id, n.type, n.actor_id, n.post_id, n.message, n.read, n.created_at,
        u.username AS actor_username, u.display_name AS actor_display_name,
        u.avatar_url AS actor_avatar_url, u.domain AS actor_domain
      FROM notifications n
      JOIN users u ON u.id = n.actor_id
      WHERE n.user_id = ? ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT ?
    `).all(...params) as NotificationRow[];

    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit).map(mapNotification);

    res.json({
      data,
      meta: {
        cursor: data.length > 0 ? data[data.length - 1]!.createdAt : null,
        hasMore,
      },
    });
  });

  // GET /api/notifications/unread-count
  router.get('/unread-count', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const row = db.prepare('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read = 0').get(userId) as { count: number };
    res.json({ data: { count: row.count } });
  });

  // POST /api/notifications/:id/read
  router.post('/:id/read', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ data: { ok: true } });
  });

  // POST /api/notifications/read-all
  router.post('/read-all', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const result = db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0').run(userId);
    res.json({ data: { updated: result.changes } });
  });

  return router;
}

// Helper: create a notification (called from other routes)
export function createNotification(
  db: Database,
  userId: string,
  type: string,
  actorId: string,
  postId: string | null,
  message: string | null,
) {
  // Don't notify yourself
  if (userId === actorId) return;
  db.prepare(
    'INSERT INTO notifications (id, user_id, type, actor_id, post_id, message) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(generateId(), userId, type, actorId, postId, message);
}

// Helper: create an activity event (called from other routes)
export function createActivity(
  db: Database,
  actorId: string,
  eventType: string,
  targetUserId: string | null,
  targetPostId: string | null,
  metadata: Record<string, unknown> = {},
) {
  db.prepare(
    'INSERT INTO activity_feed (id, actor_id, event_type, target_user_id, target_post_id, metadata) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(generateId(), actorId, eventType, targetUserId, targetPostId, JSON.stringify(metadata));
}
