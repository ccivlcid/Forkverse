import { Router } from 'express';
import type { Database } from 'better-sqlite3';
import { requireAuth } from '../middleware/auth.js';

interface UserTokenRow {
  github_username: string;
  github_access_token: string | null;
  github_token_scope: string | null;
}

function ghHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'User-Agent': 'Forkverse',
    Accept: 'application/vnd.github+json',
  };
}

export function createGithubRouter(db: Database): Router {
  const router = Router();

  function getToken(userId: string): UserTokenRow | null {
    return db.prepare('SELECT github_username, github_access_token, github_token_scope FROM users WHERE id = ?').get(userId) as UserTokenRow | null;
  }

  // ── GET /api/github/stars ────────────────────────────────────────────
  // Repos the authenticated user has starred on GitHub (public API, token optional)
  router.get('/stars', requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = getToken(userId);
    if (!user) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } }); return; }

    const headers: Record<string, string> = { 'User-Agent': 'Forkverse', Accept: 'application/vnd.github.v3.star+json' };
    if (user.github_access_token) headers.Authorization = `Bearer ${user.github_access_token}`;

    try {
      const ghRes = await fetch(
        `https://api.github.com/users/${user.github_username}/starred?per_page=30&sort=created`,
        { headers },
      );
      if (!ghRes.ok) { res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to fetch stars' } }); return; }

      const raw = await ghRes.json() as Array<{
        starred_at: string;
        repo: {
          full_name: string; name: string; description: string | null;
          stargazers_count: number; forks_count: number; language: string | null;
          html_url: string; topics: string[]; pushed_at: string;
          owner: { login: string; avatar_url: string };
        };
      }>;

      const data = raw.map((item) => ({
        starredAt: item.starred_at,
        repo: {
          fullName: item.repo.full_name,
          name: item.repo.name,
          owner: item.repo.owner.login,
          ownerAvatar: item.repo.owner.avatar_url,
          description: item.repo.description,
          stars: item.repo.stargazers_count,
          forks: item.repo.forks_count,
          language: item.repo.language,
          url: item.repo.html_url,
          topics: item.repo.topics.slice(0, 4),
          pushedAt: item.repo.pushed_at,
        },
      }));

      res.json({ data });
    } catch {
      res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to fetch stars' } });
    }
  });

  // ── GET /api/github/notifications ────────────────────────────────────
  router.get('/notifications', requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = getToken(userId);
    if (!user?.github_access_token) {
      res.status(403).json({ error: { code: 'NO_TOKEN', message: 'GitHub token not available. Please re-login.' } });
      return;
    }
    if (!user.github_token_scope?.includes('notifications')) {
      res.status(403).json({ error: { code: 'INSUFFICIENT_SCOPE', message: 'notifications scope required. Please re-login.' } });
      return;
    }

    try {
      const ghRes = await fetch(
        'https://api.github.com/notifications?per_page=30&all=false',
        { headers: ghHeaders(user.github_access_token) },
      );
      if (!ghRes.ok) { res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to fetch notifications' } }); return; }

      const raw = await ghRes.json() as Array<{
        id: string;
        reason: string;
        unread: boolean;
        updated_at: string;
        subject: { title: string; url: string | null; type: string };
        repository: { full_name: string; html_url: string };
      }>;

      const data = raw.map((n) => {
        // Convert API URL (api.github.com/repos/o/r/issues/123) to web URL
        let url = n.repository.html_url;
        if (n.subject.url) {
          const match = n.subject.url.match(/\/repos\/([^/]+\/[^/]+)\/(issues|pulls)\/(\d+)/);
          if (match) {
            url = `https://github.com/${match[1]}/${match[2] === 'pulls' ? 'pull' : 'issues'}/${match[3]}`;
          }
        }
        return {
          id: n.id,
          reason: n.reason,
          unread: n.unread,
          updatedAt: n.updated_at,
          title: n.subject.title,
          type: n.subject.type,
          repoFullName: n.repository.full_name,
          repoUrl: n.repository.html_url,
          url,
        };
      });

      res.json({ data });
    } catch {
      res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to fetch notifications' } });
    }
  });

  // ── GET /api/github/issues ───────────────────────────────────────────
  // Issues AND PRs assigned to / created by the user (requires repo scope)
  router.get('/issues', requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = getToken(userId);
    if (!user?.github_access_token) {
      res.status(403).json({ error: { code: 'NO_TOKEN', message: 'GitHub token not available. Please re-login.' } });
      return;
    }
    if (!user.github_token_scope?.includes('repo')) {
      res.status(403).json({ error: { code: 'INSUFFICIENT_SCOPE', message: 'repo scope required. Please re-login.' } });
      return;
    }

    const filter = (req.query.filter as string) ?? 'assigned'; // assigned | created | mentioned

    try {
      // Issues
      const issuesRes = await fetch(
        `https://api.github.com/issues?filter=${filter}&state=open&per_page=20&sort=updated`,
        { headers: ghHeaders(user.github_access_token) },
      );
      // PRs (search API)
      const prsRes = await fetch(
        `https://api.github.com/search/issues?q=is:pr+is:open+${filter === 'assigned' ? 'assignee' : 'author'}:${user.github_username}&per_page=10&sort=updated`,
        { headers: ghHeaders(user.github_access_token) },
      );

      if (!issuesRes.ok) { res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to fetch issues' } }); return; }

      const rawIssues = await issuesRes.json() as Array<{
        id: number; number: number; title: string; state: string;
        html_url: string; body: string | null; created_at: string; updated_at: string;
        labels: Array<{ name: string; color: string }>;
        repository_url: string;
        pull_request?: object;
        user: { login: string };
      }>;

      const rawPrs = prsRes.ok
        ? ((await prsRes.json()) as { items: typeof rawIssues }).items
        : [];

      const mapItem = (item: typeof rawIssues[0], isPr: boolean) => ({
        id: item.id,
        number: item.number,
        title: item.title,
        state: item.state,
        type: isPr ? 'pr' : 'issue',
        url: item.html_url,
        repoFullName: item.repository_url.replace('https://api.github.com/repos/', ''),
        labels: item.labels.map((l) => ({ name: l.name, color: l.color })),
        author: item.user.login,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      });

      const issues = rawIssues
        .filter((i) => !i.pull_request) // exclude PRs from /issues endpoint
        .map((i) => mapItem(i, false));

      const prs = rawPrs.map((p) => mapItem(p, true));

      // Merge and sort by updatedAt
      const combined = [...issues, ...prs].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

      res.json({ data: combined });
    } catch {
      res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to fetch issues' } });
    }
  });

  // ── POST /api/github/notifications/:id/mark-read ─────────────────────
  router.post('/notifications/:id/mark-read', requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = getToken(userId);
    if (!user?.github_access_token) { res.status(403).json({ error: { code: 'NO_TOKEN', message: 'No token' } }); return; }

    try {
      await fetch(`https://api.github.com/notifications/threads/${req.params.id}`, {
        method: 'PATCH',
        headers: ghHeaders(user.github_access_token),
      });
      res.json({ data: { ok: true } });
    } catch {
      res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to mark read' } });
    }
  });

  // ── GET /api/github/contributions/:username ──────────────────────────
  // GitHub contribution data (GraphQL) — last year
  router.get('/contributions/:username', async (req, res) => {
    const { username } = req.params;

    // Look up access_token by github_username (use if available, otherwise public unauthenticated)
    const userRow = db.prepare(
      'SELECT github_access_token FROM users WHERE github_username = ? COLLATE NOCASE'
    ).get(username) as { github_access_token: string | null } | undefined;

    const token = userRow?.github_access_token ?? process.env['GITHUB_TOKEN'] ?? null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Forkverse',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const query = `
      query($login: String!) {
        user(login: $login) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                  color
                }
              }
            }
          }
        }
      }
    `;

    try {
      const ghRes = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables: { login: username } }),
      });

      if (!ghRes.ok) {
        res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'GraphQL request failed' } });
        return;
      }

      const json = await ghRes.json() as {
        data?: {
          user?: {
            contributionsCollection: {
              contributionCalendar: {
                totalContributions: number;
                weeks: Array<{
                  contributionDays: Array<{ date: string; contributionCount: number; color: string }>;
                }>;
              };
            };
          };
        };
        errors?: unknown[];
      };

      if (json.errors || !json.data?.user) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'GitHub user not found or GraphQL error' } });
        return;
      }

      const cal = json.data.user.contributionsCollection.contributionCalendar;
      res.json({
        data: {
          total: cal.totalContributions,
          weeks: cal.weeks,
        },
      });
    } catch {
      res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to fetch contributions' } });
    }
  });

  // ── GET /api/github/reviews ──────────────────────────────────────────
  // PRs requesting my review
  router.get('/reviews', requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = getToken(userId);
    if (!user?.github_access_token) {
      res.status(403).json({ error: { code: 'NO_TOKEN', message: 'GitHub token required. Please re-login.' } });
      return;
    }

    try {
      const searchRes = await fetch(
        `https://api.github.com/search/issues?q=is:pr+is:open+review-requested:${user.github_username}&per_page=30&sort=updated`,
        { headers: ghHeaders(user.github_access_token) },
      );
      if (!searchRes.ok) {
        res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to fetch review requests' } });
        return;
      }

      const raw = await searchRes.json() as {
        total_count: number;
        items: Array<{
          id: number;
          number: number;
          title: string;
          html_url: string;
          updated_at: string;
          created_at: string;
          draft: boolean;
          user: { login: string; avatar_url: string };
          repository_url: string;
          labels: Array<{ name: string; color: string }>;
          requested_reviewers?: Array<{ login: string }>;
        }>;
      };

      const data = raw.items.map((item) => ({
        id: item.id,
        number: item.number,
        title: item.title,
        url: item.html_url,
        author: item.user.login,
        authorAvatar: item.user.avatar_url,
        repoFullName: item.repository_url.replace('https://api.github.com/repos/', ''),
        labels: item.labels.map((l) => ({ name: l.name, color: l.color })),
        isDraft: item.draft,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      res.json({ data, meta: { total: raw.total_count } });
    } catch {
      res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to fetch review requests' } });
    }
  });

  // ── GET /api/github/search/repositories ─────────────────────────────
  // Proxy to GitHub search API (no auth required for public repos)
  router.get('/search/repositories', async (req, res) => {
    const q = (req.query.q as string) ?? '';
    const sort = (req.query.sort as string) ?? 'stars';
    const order = (req.query.order as string) ?? 'desc';
    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.per_page as string) || 20, 30);

    if (!q.trim()) {
      res.json({ data: [], meta: { total: 0, page, perPage } });
      return;
    }

    // Use user token if authenticated, otherwise public API
    const headers: Record<string, string> = {
      'User-Agent': 'Forkverse',
      Accept: 'application/vnd.github+json',
    };
    if (req.session.userId) {
      const user = getToken(req.session.userId);
      if (user?.github_access_token) headers.Authorization = `Bearer ${user.github_access_token}`;
    }

    try {
      const ghRes = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=${sort}&order=${order}&page=${page}&per_page=${perPage}`,
        { headers },
      );
      if (!ghRes.ok) {
        res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'GitHub search failed' } });
        return;
      }

      const raw = await ghRes.json() as {
        total_count: number;
        items: Array<{
          full_name: string; name: string; description: string | null;
          stargazers_count: number; forks_count: number; language: string | null;
          html_url: string; topics: string[]; pushed_at: string; updated_at: string;
          open_issues_count: number; license: { spdx_id: string } | null;
          owner: { login: string; avatar_url: string };
        }>;
      };

      const data = raw.items.map((r) => ({
        fullName: r.full_name,
        name: r.name,
        owner: r.owner.login,
        ownerAvatar: r.owner.avatar_url,
        description: r.description,
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language,
        url: r.html_url,
        topics: r.topics.slice(0, 5),
        pushedAt: r.pushed_at,
        updatedAt: r.updated_at,
        openIssues: r.open_issues_count,
        license: r.license?.spdx_id ?? null,
      }));

      res.json({ data, meta: { total: raw.total_count, page, perPage } });
    } catch {
      res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'GitHub search failed' } });
    }
  });

  // ── GET /api/github/search/users ──────────────────────────────────
  router.get('/search/users', async (req, res) => {
    const q = (req.query.q as string) ?? '';
    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.per_page as string) || 20, 30);

    if (!q.trim()) {
      res.json({ data: [], meta: { total: 0, page, perPage } });
      return;
    }

    const headers: Record<string, string> = {
      'User-Agent': 'Forkverse',
      Accept: 'application/vnd.github+json',
    };
    if (req.session.userId) {
      const user = getToken(req.session.userId);
      if (user?.github_access_token) headers.Authorization = `Bearer ${user.github_access_token}`;
    }

    try {
      const ghRes = await fetch(
        `https://api.github.com/search/users?q=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}`,
        { headers },
      );
      if (!ghRes.ok) {
        res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'GitHub user search failed' } });
        return;
      }

      const raw = await ghRes.json() as {
        total_count: number;
        items: Array<{
          login: string; avatar_url: string; html_url: string;
          type: string; score: number;
        }>;
      };

      const data = raw.items.map((u) => ({
        username: u.login,
        avatarUrl: u.avatar_url,
        url: u.html_url,
        type: u.type,
      }));

      res.json({ data, meta: { total: raw.total_count, page, perPage } });
    } catch {
      res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'GitHub user search failed' } });
    }
  });

  // ── GET /api/github/trending ──────────────────────────────────────
  // GitHub trending repos (scrapes the trending endpoint)
  router.get('/trending', async (req, res) => {
    const language = (req.query.language as string) ?? '';
    const since = (req.query.since as string) ?? 'daily'; // daily, weekly, monthly

    const headers: Record<string, string> = {
      'User-Agent': 'Forkverse',
      Accept: 'application/vnd.github+json',
    };
    if (req.session.userId) {
      const user = getToken(req.session.userId);
      if (user?.github_access_token) headers.Authorization = `Bearer ${user.github_access_token}`;
    }

    try {
      // Use GitHub search API to approximate trending
      const dateRange = since === 'monthly' ? 30 : since === 'weekly' ? 7 : 1;
      const date = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const langQuery = language ? `+language:${encodeURIComponent(language)}` : '';
      const ghRes = await fetch(
        `https://api.github.com/search/repositories?q=created:>${date}${langQuery}&sort=stars&order=desc&per_page=25`,
        { headers },
      );
      if (!ghRes.ok) {
        res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to fetch trending' } });
        return;
      }

      const raw = await ghRes.json() as {
        total_count: number;
        items: Array<{
          full_name: string; name: string; description: string | null;
          stargazers_count: number; forks_count: number; language: string | null;
          html_url: string; topics: string[]; pushed_at: string; updated_at: string;
          owner: { login: string; avatar_url: string };
        }>;
      };

      const data = raw.items.map((r) => ({
        fullName: r.full_name,
        name: r.name,
        owner: r.owner.login,
        ownerAvatar: r.owner.avatar_url,
        description: r.description,
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language,
        url: r.html_url,
        topics: r.topics.slice(0, 5),
        pushedAt: r.pushed_at,
      }));

      res.json({ data, meta: { total: raw.total_count } });
    } catch {
      res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to fetch trending' } });
    }
  });

  // ── GET /api/github/followers ────────────────────────────────────────
  // GitHub followers with Forkverse enrollment status
  router.get('/followers', requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = getToken(userId);
    if (!user) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } }); return; }

    const headers: Record<string, string> = { 'User-Agent': 'Forkverse', Accept: 'application/vnd.github+json' };
    if (user.github_access_token) headers.Authorization = `Bearer ${user.github_access_token}`;

    try {
      const ghRes = await fetch('https://api.github.com/user/followers?per_page=100', { headers });
      if (!ghRes.ok) {
        res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to fetch GitHub followers' } });
        return;
      }

      const ghUsers = await ghRes.json() as Array<{ login: string; avatar_url: string; html_url: string }>;

      const data = ghUsers.map((gu) => {
        const forkverseUser = db.prepare(
          'SELECT username FROM users WHERE github_username = ? COLLATE NOCASE'
        ).get(gu.login) as { username: string } | undefined;

        const iFollow = forkverseUser
          ? Boolean(db.prepare(
              'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = (SELECT id FROM users WHERE username = ?)'
            ).get(userId, forkverseUser.username))
          : false;

        return {
          githubUsername: gu.login,
          avatarUrl: gu.avatar_url,
          profileUrl: gu.html_url,
          forkverseUsername: forkverseUser?.username ?? null,
          iFollow,
        };
      });

      res.json({ data });
    } catch {
      res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to fetch GitHub followers' } });
    }
  });

  // ── GET /api/github/following ─────────────────────────────────────────
  // GitHub following list with Forkverse enrollment status
  router.get('/following', requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = getToken(userId);
    if (!user) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } }); return; }

    const headers: Record<string, string> = { 'User-Agent': 'Forkverse', Accept: 'application/vnd.github+json' };
    if (user.github_access_token) headers.Authorization = `Bearer ${user.github_access_token}`;

    try {
      const ghRes = await fetch('https://api.github.com/user/following?per_page=100', { headers });
      if (!ghRes.ok) {
        res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to fetch GitHub following list' } });
        return;
      }

      const ghUsers = await ghRes.json() as Array<{
        login: string;
        avatar_url: string;
        html_url: string;
      }>;

      // Check Forkverse enrollment + follow status for each GitHub user
      const data = ghUsers.map((gu) => {
        const forkverseUser = db.prepare(
          'SELECT username FROM users WHERE github_username = ? COLLATE NOCASE'
        ).get(gu.login) as { username: string } | undefined;

        const isFollowing = forkverseUser
          ? Boolean(db.prepare(
              'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = (SELECT id FROM users WHERE username = ?)'
            ).get(userId, forkverseUser.username))
          : false;

        return {
          githubUsername: gu.login,
          avatarUrl: gu.avatar_url,
          profileUrl: gu.html_url,
          forkverseUsername: forkverseUser?.username ?? null,
          isFollowing,
        };
      });

      res.json({ data });
    } catch {
      res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to fetch GitHub following list' } });
    }
  });

  // ── POST /api/github/sync-follows ────────────────────────────────────
  // Auto-follow Forkverse users from GitHub following list
  router.post('/sync-follows', requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = getToken(userId);
    if (!user) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } }); return; }

    const headers: Record<string, string> = { 'User-Agent': 'Forkverse', Accept: 'application/vnd.github+json' };
    if (user.github_access_token) headers.Authorization = `Bearer ${user.github_access_token}`;

    try {
      const ghRes = await fetch('https://api.github.com/user/following?per_page=100', { headers });
      if (!ghRes.ok) {
        res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to fetch GitHub following list' } });
        return;
      }

      const ghUsers = await ghRes.json() as Array<{ login: string }>;

      let followed = 0;
      let alreadyFollowing = 0;

      for (const gu of ghUsers) {
        const target = db.prepare(
          'SELECT id FROM users WHERE github_username = ? COLLATE NOCASE AND id != ?'
        ).get(gu.login, userId) as { id: string } | undefined;

        if (!target) continue;

        const existing = db.prepare(
          'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?'
        ).get(userId, target.id);

        if (existing) {
          alreadyFollowing++;
        } else {
          db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(userId, target.id);
          followed++;
        }
      }

      res.json({ data: { followed, alreadyFollowing, total: ghUsers.length } });
    } catch {
      res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to sync follows' } });
    }
  });

  return router;
}
