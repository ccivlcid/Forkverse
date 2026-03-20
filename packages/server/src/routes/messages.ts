import { Router } from 'express';
import type { Database } from 'better-sqlite3';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { generateId } from '../lib/id.js';
import { createNotification } from './notifications.js';

const sendSchema = z.object({
  receiverUsername: z.string().min(1),
  message: z.string().min(1).max(2000),
});

interface DmRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  read: number;
  created_at: string;
  s_username: string;
  s_display_name: string;
  s_avatar_url: string | null;
  s_domain: string | null;
}

interface ConversationRow {
  other_id: string;
  other_username: string;
  other_display_name: string;
  other_avatar_url: string | null;
  other_domain: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export function createMessagesRouter(db: Database): Router {
  const router = Router();

  // GET /api/messages — inbox (conversation list)
  router.get('/', requireAuth, (req, res) => {
    const userId = req.session.userId!;

    const rows = db.prepare(`
      SELECT
        CASE WHEN dm.sender_id = ? THEN dm.receiver_id ELSE dm.sender_id END AS other_id,
        u.username AS other_username,
        u.display_name AS other_display_name,
        u.avatar_url AS other_avatar_url,
        u.domain AS other_domain,
        dm.message AS last_message,
        dm.created_at AS last_message_at,
        (SELECT COUNT(*) FROM direct_messages d2
         WHERE d2.sender_id = CASE WHEN dm.sender_id = ? THEN dm.receiver_id ELSE dm.sender_id END
           AND d2.receiver_id = ? AND d2.read = 0) AS unread_count
      FROM direct_messages dm
      JOIN users u ON u.id = CASE WHEN dm.sender_id = ? THEN dm.receiver_id ELSE dm.sender_id END
      WHERE dm.id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (
            PARTITION BY
              CASE WHEN sender_id < receiver_id THEN sender_id ELSE receiver_id END,
              CASE WHEN sender_id < receiver_id THEN receiver_id ELSE sender_id END
            ORDER BY created_at DESC
          ) AS rn
          FROM direct_messages
          WHERE sender_id = ? OR receiver_id = ?
        ) WHERE rn = 1
      )
      ORDER BY dm.created_at DESC
    `).all(userId, userId, userId, userId, userId, userId) as ConversationRow[];

    const data = rows.map((r) => ({
      otherUser: {
        username: r.other_username,
        displayName: r.other_display_name,
        avatarUrl: r.other_avatar_url,
        domain: r.other_domain,
      },
      lastMessage: r.last_message,
      lastMessageAt: r.last_message_at,
      unreadCount: r.unread_count,
    }));

    res.json({ data });
  });

  // GET /api/messages/:username — conversation with user
  router.get('/:username', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const other = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username) as { id: string } | undefined;
    if (!other) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    // Mark messages from other as read
    db.prepare('UPDATE direct_messages SET read = 1 WHERE sender_id = ? AND receiver_id = ?').run(other.id, userId);

    const rows = db.prepare(`
      SELECT dm.*, u.username AS s_username, u.display_name AS s_display_name,
             u.avatar_url AS s_avatar_url, u.domain AS s_domain
      FROM direct_messages dm
      JOIN users u ON u.id = dm.sender_id
      WHERE (dm.sender_id = ? AND dm.receiver_id = ?)
         OR (dm.sender_id = ? AND dm.receiver_id = ?)
      ORDER BY dm.created_at ASC
    `).all(userId, other.id, other.id, userId) as DmRow[];

    const data = rows.map((r) => ({
      id: r.id,
      senderId: r.sender_id,
      receiverId: r.receiver_id,
      message: r.message,
      read: Boolean(r.read),
      createdAt: r.created_at,
      sender: {
        username: r.s_username,
        displayName: r.s_display_name,
        avatarUrl: r.s_avatar_url,
        domain: r.s_domain,
      },
    }));

    res.json({ data });
  });

  // POST /api/messages — send message
  router.post('/', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const parsed = sendSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
      return;
    }

    const receiver = db.prepare('SELECT id FROM users WHERE username = ?').get(parsed.data.receiverUsername) as { id: string } | undefined;
    if (!receiver) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }
    if (receiver.id === userId) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Cannot message yourself' } });
      return;
    }

    const id = generateId();
    db.prepare(
      'INSERT INTO direct_messages (id, sender_id, receiver_id, message) VALUES (?, ?, ?, ?)'
    ).run(id, userId, receiver.id, parsed.data.message);

    // Notify receiver
    createNotification(db, receiver.id, 'mention', userId, null, parsed.data.message.slice(0, 100));

    const sender = db.prepare('SELECT username, display_name, avatar_url, domain FROM users WHERE id = ?').get(userId) as {
      username: string; display_name: string; avatar_url: string | null; domain: string | null;
    };

    res.status(201).json({
      data: {
        id,
        senderId: userId,
        receiverId: receiver.id,
        message: parsed.data.message,
        read: false,
        createdAt: new Date().toISOString(),
        sender: {
          username: sender.username,
          displayName: sender.display_name,
          avatarUrl: sender.avatar_url,
          domain: sender.domain,
        },
      },
    });
  });

  return router;
}
