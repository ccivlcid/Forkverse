import { Router } from 'express';
import type { Database } from 'better-sqlite3';
import type { Logger } from 'pino';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { generateId } from '../lib/id.js';

interface GithubWebhookPayload {
  ref?: string;
  commits?: unknown[];
  pull_request?: {
    merged?: boolean;
    number?: number;
    title?: string;
  };
  action?: string;
  release?: { tag_name?: string; name?: string };
  ref_type?: string;
  repository: { full_name: string };
  sender: { login: string };
}

function buildPostFromWebhook(
  event: string,
  payload: GithubWebhookPayload,
): { messageRaw: string; messageCli: string; intent: string; emotion: string; tags: string[] } | null {
  const repo = payload.repository.full_name;
  const repoShort = repo.split('/')[1] ?? repo;

  switch (event) {
    case 'push': {
      const branch = (payload.ref ?? 'refs/heads/main').replace('refs/heads/', '');
      if (branch !== 'main' && branch !== 'master') return null;
      const count = payload.commits?.length ?? 1;
      return {
        messageRaw: `Pushed ${count} commit${count !== 1 ? 's' : ''} to ${repo} (${branch})`,
        messageCli: `git push --repo=${repo} --branch=${branch} --commits=${count}`,
        intent: 'announcement', emotion: 'neutral',
        tags: ['github', 'git'],
      };
    }
    case 'pull_request': {
      if (payload.action !== 'closed' || !payload.pull_request?.merged) return null;
      const pr = payload.pull_request;
      const title = (pr.title ?? '').slice(0, 80);
      return {
        messageRaw: `Merged PR #${pr.number}: ${title} in ${repo}`,
        messageCli: `gh pr merge ${pr.number} --repo=${repo} --squash  # ${title}`,
        intent: 'announcement', emotion: 'happy',
        tags: ['github', 'pr', 'merge'],
      };
    }
    case 'release': {
      if (payload.action !== 'published') return null;
      const tag = payload.release?.tag_name ?? 'v0.0.0';
      const name = (payload.release?.name ?? tag).slice(0, 80);
      return {
        messageRaw: `Released ${tag}: ${name} for ${repo}`,
        messageCli: `gh release create ${tag} --repo=${repo} --title="${name}"`,
        intent: 'announcement', emotion: 'excited',
        tags: ['github', 'release', 'oss'],
      };
    }
    case 'create': {
      if (payload.ref_type !== 'repository') return null;
      return {
        messageRaw: `Created new repository ${repo}`,
        messageCli: `gh repo create ${repoShort} --public`,
        intent: 'announcement', emotion: 'excited',
        tags: ['github', 'oss', 'new-project'],
      };
    }
    default:
      return null;
  }
}

export function createWebhookRouter(db: Database, logger: Logger): Router {
  const router = Router();

  // Ensure webhook_deliveries table exists (migration 013)
  db.exec(`CREATE TABLE IF NOT EXISTS webhook_deliveries (
    delivery_id TEXT PRIMARY KEY,
    received_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // POST /api/webhook/github
  // GitHub repo settings > Webhooks > Payload URL: https://your-domain/api/webhook/github
  // Content type: application/json
  // Secret: GITHUB_WEBHOOK_SECRET env var
  router.post('/github', async (req, res) => {
    const event = req.headers['x-github-event'] as string;
    const signature = req.headers['x-hub-signature-256'] as string;
    const deliveryId = req.headers['x-github-delivery'] as string;

    if (!event || !deliveryId) {
      res.status(400).json({ error: 'Missing GitHub event headers' });
      return;
    }

    // Duplicate delivery protection
    const existing = db.prepare('SELECT 1 FROM webhook_deliveries WHERE delivery_id = ?').get(deliveryId);
    if (existing) {
      res.json({ ok: true, duplicate: true });
      return;
    }

    // Signature verification
    const webhookSecret = process.env['GITHUB_WEBHOOK_SECRET'];
    if (webhookSecret && signature) {
      const body = JSON.stringify(req.body);
      const expected = 'sha256=' + createHmac('sha256', webhookSecret).update(body).digest('hex');
      try {
        if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
          res.status(401).json({ error: 'Invalid signature' });
          return;
        }
      } catch {
        res.status(401).json({ error: 'Signature verification failed' });
        return;
      }
    }

    // Record delivery to prevent re-processing
    db.prepare('INSERT OR IGNORE INTO webhook_deliveries (delivery_id) VALUES (?)').run(deliveryId);

    const payload = req.body as GithubWebhookPayload;
    const senderLogin = payload.sender.login;

    // Map sender to CLItoris user
    const clitorisUser = db.prepare(
      'SELECT id FROM users WHERE github_username = ? COLLATE NOCASE'
    ).get(senderLogin) as { id: string } | undefined;

    if (!clitorisUser) {
      res.json({ ok: true, skipped: true });
      return;
    }

    const post = buildPostFromWebhook(event, payload);
    if (!post) {
      res.json({ ok: true, skipped: true });
      return;
    }

    const postId = generateId();
    try {
      db.prepare(`
        INSERT INTO posts (id, user_id, message_raw, message_cli, lang, tags, mentions, visibility, llm_model, intent, emotion)
        VALUES (?, ?, ?, ?, 'en', ?, '[]', 'public', 'custom', ?, ?)
      `).run(postId, clitorisUser.id, post.messageRaw, post.messageCli, JSON.stringify(post.tags), post.intent, post.emotion);

      logger.info({ postId, event, sender: senderLogin }, 'Webhook post created');
      res.json({ ok: true, postId });
    } catch (err) {
      logger.error({ err, event, sender: senderLogin }, 'Failed to create webhook post');
      res.status(500).json({ error: 'Failed to create post' });
    }
  });

  return router;
}
