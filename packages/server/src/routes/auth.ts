import { Router } from 'express';
import type { Database } from 'better-sqlite3';
import type { Logger } from 'pino';
import { z } from 'zod';
import { generateId } from '../lib/id.js';
import { requireAuth } from '../middleware/auth.js';
import type { GitHubProfile } from '@clitoris/shared';

interface GithubTokenResponse {
  access_token?: string;
  error?: string;
}

interface GithubUserResponse {
  id: number;
  login: string;
  avatar_url: string;
  name: string | null;
  bio: string | null;
  html_url: string;
  public_repos: number;
}

const setupSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/),
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(300).optional(),
});

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  domain: z.string().max(100).nullable().optional(),
  bio: z.string().max(300).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

interface UserRow {
  id: string;
  username: string;
  domain: string | null;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  github_id: string;
  github_username: string;
  github_avatar_url: string | null;
  github_profile_url: string | null;
  github_repos_count: number;
  github_connected_at: string;
  created_at: string;
}

function mapUser(row: UserRow) {
  return {
    id: row.id,
    username: row.username,
    domain: row.domain,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    githubId: row.github_id,
    githubUsername: row.github_username,
    githubAvatarUrl: row.github_avatar_url,
    githubProfileUrl: row.github_profile_url,
    githubReposCount: row.github_repos_count,
    githubConnectedAt: row.github_connected_at,
    createdAt: row.created_at,
  };
}

export function createAuthRouter(db: Database, logger: Logger): Router {
  // Read after loadEnv + dotenv (avoid ES module import order capturing empty env)
  const githubClientId = process.env.GITHUB_CLIENT_ID ?? '';
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET ?? '';
  const githubRedirectUri =
    process.env.GITHUB_REDIRECT_URI ?? 'http://localhost:3771/api/auth/github/callback';
  const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:7878';

  const router = Router();

  router.get('/github', (req, res) => {
    if (!githubClientId.trim()) {
      logger.warn('GITHUB_CLIENT_ID is missing; GitHub login will fail');
      res.redirect(`${clientUrl}/login?error=config`);
      return;
    }
    const state = generateId();
    req.session.oauthState = state;
    const params = new URLSearchParams({
      client_id: githubClientId,
      redirect_uri: githubRedirectUri,
      scope: 'read:user user:email notifications repo',
      state,
    });
    res.redirect(`https://github.com/login/oauth/authorize?${params}`);
  });

  router.get('/github/callback', async (req, res) => {
    const { code, error: oauthError, state } = req.query as Record<string, string>;

    if (oauthError) {
      res.redirect(`${clientUrl}/login?error=denied`);
      return;
    }
    if (!code) {
      res.redirect(`${clientUrl}/login?error=no_code`);
      return;
    }

    // CSRF protection: verify state matches session
    const expectedState = req.session.oauthState;
    delete req.session.oauthState;
    if (!expectedState || expectedState !== state) {
      res.redirect(`${clientUrl}/login?error=state_mismatch`);
      return;
    }

    try {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ client_id: githubClientId, client_secret: githubClientSecret, code }),
      });
      const tokenData = (await tokenRes.json()) as GithubTokenResponse;

      if (!tokenData.access_token) {
        res.redirect(`${clientUrl}/login?error=token_failed`);
        return;
      }

      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'CLItoris' },
      });
      const githubUser = (await userRes.json()) as GithubUserResponse;

      const profile: GitHubProfile = {
        githubId: String(githubUser.id),
        githubUsername: githubUser.login,
        avatarUrl: githubUser.avatar_url,
        displayName: githubUser.name ?? githubUser.login,
        bio: githubUser.bio,
        publicRepos: githubUser.public_repos,
      };

      const existingUser = db
        .prepare('SELECT id FROM users WHERE github_id = ?')
        .get(profile.githubId) as { id: string } | undefined;

      const TOKEN_SCOPE = 'read:user user:email notifications repo';

      if (existingUser) {
        db.prepare(`
          UPDATE users SET
            github_avatar_url = ?,
            github_profile_url = ?,
            github_repos_count = ?,
            github_access_token = ?,
            github_token_scope = ?,
            github_connected_at = datetime('now')
          WHERE id = ?
        `).run(profile.avatarUrl, `https://github.com/${profile.githubUsername}`, profile.publicRepos, tokenData.access_token, TOKEN_SCOPE, existingUser.id);

        req.session.userId = existingUser.id;
        res.redirect(clientUrl);
      } else {
        req.session.pendingGithubProfile = { ...profile, accessToken: tokenData.access_token };
        res.redirect(`${clientUrl}/setup`);
      }
    } catch (err) {
      logger.error({ err }, 'GitHub OAuth callback failed');
      res.redirect(`${clientUrl}/login?error=server_error`);
    }
  });

  router.post('/setup', async (req, res) => {
    const profile = req.session.pendingGithubProfile;
    if (!profile) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'No pending GitHub profile' } });
      return;
    }

    const parsed = setupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
      return;
    }

    const { username, displayName, bio } = parsed.data;

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      res.status(409).json({ error: { code: 'CONFLICT', message: 'Username already taken' } });
      return;
    }

    const userId = generateId();
    db.prepare(`
      INSERT INTO users (
        id, username, display_name, bio, avatar_url,
        github_id, github_username, github_avatar_url, github_profile_url, github_repos_count,
        github_access_token, github_token_scope
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      username,
      displayName ?? profile.displayName,
      bio ?? profile.bio ?? '',
      profile.avatarUrl,
      profile.githubId,
      profile.githubUsername,
      profile.avatarUrl,
      `https://github.com/${profile.githubUsername}`,
      profile.publicRepos,
      profile.accessToken ?? null,
      profile.accessToken ? 'read:user user:email notifications repo' : null,
    );

    req.session.userId = userId;
    delete req.session.pendingGithubProfile;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    res.status(201).json({ data: mapUser(user as UserRow) });
  });

  // GET /me/pending — pending GitHub profile in session (before setup completes)
  router.get('/me/pending', (req, res) => {
    if (req.session.userId) {
      res.json({ data: { alreadySetup: true } });
      return;
    }
    const pending = req.session.pendingGithubProfile;
    if (!pending) {
      res.status(401).json({ error: { code: 'NO_PENDING_SESSION', message: 'No pending GitHub session' } });
      return;
    }
    res.json({
      data: {
        alreadySetup: false,
        githubUsername: pending.githubUsername,
        displayName: pending.displayName,
        bio: pending.bio,
        avatarUrl: pending.avatarUrl,
        publicRepos: pending.publicRepos,
      },
    });
  });

  router.get('/me', requireAuth, (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId) as UserRow | undefined;
    if (!user) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }
    res.json({ data: mapUser(user) });
  });

  router.put('/me', requireAuth, (req, res) => {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
      return;
    }

    const { displayName, domain, bio, avatarUrl } = parsed.data;
    db.prepare(`
      UPDATE users SET
        display_name = COALESCE(?, display_name),
        domain = COALESCE(?, domain),
        bio = COALESCE(?, bio),
        avatar_url = COALESCE(?, avatar_url)
      WHERE id = ?
    `).run(displayName ?? null, domain ?? null, bio ?? null, avatarUrl ?? null, req.session.userId);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId) as UserRow;
    res.json({ data: mapUser(user) });
  });

  router.delete('/me', requireAuth, (req, res) => {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.session.userId);
    req.session.destroy(() => {
      res.json({ data: { message: 'Account deleted' } });
    });
  });

  router.post('/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ data: { message: 'Logged out' } });
    });
  });

  return router;
}
