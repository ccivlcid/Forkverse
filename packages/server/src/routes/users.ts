import { Router } from 'express';
import type { Database } from 'better-sqlite3';
import { generateId } from '../lib/id.js';
import { requireAuth } from '../middleware/auth.js';
import { createNotification, createActivity } from './notifications.js';
import { updateGithubStats, recalculateForUser } from '../lib/influence.js';

interface UserProfileRow {
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
  follower_count: number;
  following_count: number;
  post_count: number;
  is_following: number | null;
}

interface PostRow {
  id: string; user_id: string; message_raw: string; message_cli: string;
  lang: string; tags: string; mentions: string; visibility: string;
  llm_model: string; parent_id: string | null; forked_from_id: string | null;
  created_at: string; username: string; domain: string | null;
  display_name: string; avatar_url: string | null;
  star_count: number; reply_count: number; fork_count: number; is_starred: number | null;
  intent?: string; emotion?: string;
  repo_owner?: string | null; repo_name?: string | null;
  repo_stars?: number | null; repo_forks?: number | null; repo_language?: string | null;
}

function mapUserProfile(row: UserProfileRow & { top_languages?: string }) {
  return {
    id: row.id, username: row.username, domain: row.domain,
    displayName: row.display_name, bio: row.bio, avatarUrl: row.avatar_url,
    githubId: row.github_id, githubUsername: row.github_username,
    githubAvatarUrl: row.github_avatar_url, githubProfileUrl: row.github_profile_url,
    githubReposCount: row.github_repos_count, githubConnectedAt: row.github_connected_at,
    createdAt: row.created_at,
    followerCount: row.follower_count, followingCount: row.following_count,
    postCount: row.post_count, isFollowing: Boolean(row.is_following),
    topLanguages: JSON.parse(row.top_languages ?? '[]') as string[],
  };
}

function mapPostBasic(row: PostRow) {
  return {
    id: row.id, userId: row.user_id, messageRaw: row.message_raw, messageCli: row.message_cli,
    lang: row.lang, tags: JSON.parse(row.tags) as string[], mentions: JSON.parse(row.mentions) as string[],
    visibility: row.visibility, llmModel: row.llm_model, parentId: row.parent_id,
    forkedFromId: row.forked_from_id, createdAt: row.created_at,
    user: { username: row.username, domain: row.domain, displayName: row.display_name, avatarUrl: row.avatar_url },
    starCount: row.star_count, replyCount: row.reply_count, forkCount: row.fork_count,
    isStarred: Boolean(row.is_starred),
    intent: (row.intent ?? 'casual') as 'casual',
    emotion: (row.emotion ?? 'neutral') as 'neutral',
    repoAttachment: row.repo_owner && row.repo_name ? {
      repoOwner: row.repo_owner,
      repoName: row.repo_name,
      repoStars: row.repo_stars ?? 0,
      repoForks: row.repo_forks ?? 0,
      repoLanguage: row.repo_language ?? null,
    } : null,
  };
}

export function createUsersRouter(db: Database): Router {
  const router = Router();

  router.get('/@:username', (req, res) => {
    const userId = (req as { session?: { userId?: string } }).session?.userId;
    const { username } = req.params;

    const followingSql = userId
      ? `, (SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following`
      : ', 0 as is_following';
    const followingParams: unknown[] = userId ? [userId, username] : [username];

    const user = db.prepare(`
      SELECT u.*,
        u.github_followers as follower_count,
        u.github_following as following_count,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as post_count
        ${followingSql}
      FROM users u WHERE u.username = ?
    `).get(...followingParams) as UserProfileRow | undefined;

    if (!user) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    res.json({ data: mapUserProfile(user) });
  });

  router.get('/@:username/posts', (req, res) => {
    const { username } = req.params;
    const { cursor, limit = '20' } = req.query as Record<string, string>;
    const pageLimit = Math.min(parseInt(limit, 10) || 20, 50);
    const userId = (req as { session?: { userId?: string } }).session?.userId;

    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as { id: string } | undefined;
    if (!user) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    const starredSql = userId
      ? `, (SELECT 1 FROM stars s2 WHERE s2.user_id = ? AND s2.post_id = p.id) as is_starred`
      : ', 0 as is_starred';

    const sql = `
      SELECT p.*, u.username, u.domain, u.display_name, u.avatar_url,
        (SELECT COUNT(*) FROM stars s WHERE s.post_id = p.id) as star_count,
        (SELECT COUNT(*) FROM posts r WHERE r.parent_id = p.id) as reply_count,
        (SELECT COUNT(*) FROM posts f WHERE f.forked_from_id = p.id) as fork_count
        ${starredSql}
        , ra.repo_owner, ra.repo_name, ra.repo_stars, ra.repo_forks, ra.repo_language
      FROM posts p JOIN users u ON p.user_id = u.id
      LEFT JOIN repo_attachments ra ON ra.post_id = p.id
      WHERE p.user_id = ? ${cursor ? 'AND p.created_at < ?' : ''}
      ORDER BY p.created_at DESC LIMIT ?
    `;

    const baseParams: unknown[] = userId ? [userId] : [];
    const rows = cursor
      ? db.prepare(sql).all(...baseParams, user.id, cursor, pageLimit + 1)
      : db.prepare(sql).all(...baseParams, user.id, pageLimit + 1);

    const data = (rows as PostRow[]).slice(0, pageLimit).map(mapPostBasic);
    const hasMore = rows.length > pageLimit;

    res.json({ data, meta: { cursor: data[data.length - 1]?.createdAt, hasMore } });
  });

  router.get('/@:username/starred', (req, res) => {
    const { username } = req.params;
    const { cursor, limit = '20' } = req.query as Record<string, string>;
    const pageLimit = Math.min(parseInt(limit, 10) || 20, 50);
    const sessionUserId = (req as { session?: { userId?: string } }).session?.userId;

    const targetUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as { id: string } | undefined;
    if (!targetUser) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    const isStarredSql = sessionUserId
      ? `, (SELECT 1 FROM stars s2 WHERE s2.user_id = ? AND s2.post_id = p.id) as is_starred`
      : ', 0 as is_starred';

    const sql = `
      SELECT p.*, u.username, u.domain, u.display_name, u.avatar_url,
        (SELECT COUNT(*) FROM stars s WHERE s.post_id = p.id) as star_count,
        (SELECT COUNT(*) FROM posts r WHERE r.parent_id = p.id) as reply_count,
        (SELECT COUNT(*) FROM posts f WHERE f.forked_from_id = p.id) as fork_count
        ${isStarredSql}
        , ra.repo_owner, ra.repo_name, ra.repo_stars, ra.repo_forks, ra.repo_language
      FROM stars st
      JOIN posts p ON st.post_id = p.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN repo_attachments ra ON ra.post_id = p.id
      WHERE st.user_id = ? ${cursor ? 'AND st.created_at < ?' : ''}
      ORDER BY st.created_at DESC LIMIT ?
    `;

    const starredParams: unknown[] = sessionUserId ? [sessionUserId] : [];
    const rows = cursor
      ? db.prepare(sql).all(...starredParams, targetUser.id, cursor, pageLimit + 1)
      : db.prepare(sql).all(...starredParams, targetUser.id, pageLimit + 1);

    const data = (rows as PostRow[]).slice(0, pageLimit).map(mapPostBasic);
    const hasMore = rows.length > pageLimit;

    res.json({ data, meta: { cursor: data[data.length - 1]?.createdAt, hasMore } });
  });

  router.get('/@:username/repos', async (req, res) => {
    const { username } = req.params;

    const user = db.prepare('SELECT github_username FROM users WHERE username = ?').get(username) as
      { github_username: string } | undefined;

    if (!user) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    try {
      const ghRes = await fetch(
        `https://api.github.com/users/${user.github_username}/repos?sort=stars&per_page=20&type=owner`,
        { headers: { 'User-Agent': 'Forkverse', Accept: 'application/vnd.github+json' } },
      );

      if (!ghRes.ok) {
        res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to fetch GitHub repos' } });
        return;
      }

      const ghRepos = await ghRes.json() as Array<{
        name: string; description: string | null; stargazers_count: number;
        forks_count: number; language: string | null; html_url: string;
        updated_at: string; fork: boolean;
      }>;

      const data = ghRepos
        .filter((r) => !r.fork)
        .slice(0, 12)
        .map((r) => ({
          name: r.name,
          description: r.description,
          stars: r.stargazers_count,
          forks: r.forks_count,
          language: r.language,
          url: r.html_url,
          updatedAt: r.updated_at,
        }));

      res.json({ data });
    } catch {
      res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to fetch GitHub repos' } });
    }
  });

  router.post('/@:username/follow', (req, res) => {
    const sessionUserId = (req as { session?: { userId?: string } }).session?.userId;
    if (!sessionUserId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Login required' } });
      return;
    }

    const target = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username) as { id: string } | undefined;
    if (!target) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }
    if (target.id === sessionUserId) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Cannot follow yourself' } });
      return;
    }

    const result = db.transaction(() => {
      const existing = db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(sessionUserId, target.id);

      if (existing) {
        db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(sessionUserId, target.id);
      } else {
        db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(sessionUserId, target.id);
        createNotification(db, target.id, 'follow', sessionUserId, null, null);
        createActivity(db, sessionUserId, 'follow', target.id, null);
      }

      const count = (db.prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').get(target.id) as { c: number }).c;
      return { following: !existing, followerCount: count };
    })();

    res.json({ data: result });
  });

  // ── Suggested users ──────────────────────────────────────────────────
  router.get('/suggested', requireAuth, (req, res) => {
    const sessionUserId = req.session.userId!;

    // Suggest users who share languages or are followed by people you follow,
    // excluding users you already follow and yourself
    const rows = db.prepare(`
      SELECT u.username, u.display_name, u.avatar_url, u.github_username,
        u.top_languages, u.bio,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM follows f1
            JOIN follows f2 ON f2.follower_id = f1.following_id AND f2.following_id = u.id
            WHERE f1.follower_id = ?
          ) THEN 'mutual_connection'
          ELSE 'similar_interests'
        END as reason
      FROM users u
      WHERE u.id != ?
        AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)
      ORDER BY
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) DESC
      LIMIT 10
    `).all(sessionUserId, sessionUserId, sessionUserId) as Array<{
      username: string; display_name: string; avatar_url: string | null;
      github_username: string; top_languages: string | null; bio: string | null;
      reason: string;
    }>;

    const data = rows.map(r => ({
      username: r.username,
      displayName: r.display_name,
      avatarUrl: r.avatar_url,
      githubUsername: r.github_username,
      reason: r.reason === 'mutual_connection' ? 'Followed by people you follow' : 'Popular in the community',
      topLanguages: JSON.parse(r.top_languages ?? '[]') as string[],
    }));

    res.json({ data });
  });

  // ── Sync GitHub profile ────────────────────────────────────────────────
  router.post('/sync-profile', requireAuth, async (req, res) => {
    const sessionUserId = req.session.userId!;
    const user = db.prepare('SELECT github_username FROM users WHERE id = ?').get(sessionUserId) as { github_username: string } | undefined;
    if (!user) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } }); return; }

    try {
      const ghRes = await fetch(`https://api.github.com/users/${user.github_username}`, {
        headers: { 'User-Agent': 'Forkverse', Accept: 'application/vnd.github+json' },
      });
      if (!ghRes.ok) { res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to fetch GitHub profile' } }); return; }

      const ghUser = await ghRes.json() as {
        name: string | null; bio: string | null; avatar_url: string;
        public_repos: number; html_url: string;
        followers: number; following: number;
      };

      // Compute top languages and star totals from repos
      const reposRes = await fetch(
        `https://api.github.com/users/${user.github_username}/repos?sort=pushed&per_page=100&type=owner`,
        { headers: { 'User-Agent': 'Forkverse', Accept: 'application/vnd.github+json' } },
      );
      let topLanguages: string[] = [];
      let ghTotalStars = 0;
      if (reposRes.ok) {
        const repos = await reposRes.json() as Array<{ language: string | null; fork: boolean; stargazers_count: number }>;
        const counts: Record<string, number> = {};
        for (const r of repos) {
          if (!r.fork && r.language) counts[r.language] = (counts[r.language] ?? 0) + 1;
          ghTotalStars += r.stargazers_count;
        }
        topLanguages = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([lang]) => lang);
      }

      db.prepare(`
        UPDATE users SET
          github_avatar_url = ?,
          github_profile_url = ?,
          github_repos_count = ?,
          github_followers = ?,
          github_following = ?,
          top_languages = ?,
          display_name = COALESCE(NULLIF(?, ''), display_name)
        WHERE id = ?
      `).run(ghUser.avatar_url, ghUser.html_url, ghUser.public_repos, ghUser.followers ?? 0, ghUser.following ?? 0, JSON.stringify(topLanguages), ghUser.name, sessionUserId);

      // Update influence score with GitHub stats
      const ghFollowers = (ghUser as unknown as { followers?: number }).followers ?? 0;
      updateGithubStats(db, sessionUserId, ghTotalStars, ghFollowers);
      recalculateForUser(db, sessionUserId);

      res.json({ data: { synced: true, reposCount: ghUser.public_repos, topLanguages } });
    } catch {
      res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to sync GitHub profile' } });
    }
  });

  // ── GitHub activity → auto-posts ───────────────────────────────────────
  interface GithubEvent {
    id: string;
    type: string;
    repo: { name: string };
    payload: Record<string, unknown>;
    created_at: string;
  }

  function buildPostFromEvent(event: GithubEvent): { messageRaw: string; messageCli: string; intent: string; emotion: string; tags: string[] } | null {
    const repo = event.repo.name;
    const repoShort = repo.split('/')[1] ?? repo;

    switch (event.type) {
      case 'PushEvent': {
        const p = event.payload as { ref?: string; commits?: unknown[] };
        const branch = (p.ref ?? 'refs/heads/main').replace('refs/heads/', '');
        if (branch !== 'main' && branch !== 'master') return null;
        const count = p.commits?.length ?? 1;
        return {
          messageRaw: `Pushed ${count} commit${count !== 1 ? 's' : ''} to ${repo} (${branch})`,
          messageCli: `git push --repo=${repo} --branch=${branch} --commits=${count}`,
          intent: 'announcement', emotion: 'neutral',
          tags: ['github', 'git'],
        };
      }
      case 'PullRequestEvent': {
        const p = event.payload as { action?: string; pull_request?: { merged?: boolean; number?: number; title?: string } };
        if (p.action !== 'closed' || !p.pull_request?.merged) return null;
        const pr = p.pull_request;
        const title = (pr.title ?? '').slice(0, 80);
        return {
          messageRaw: `Merged PR #${pr.number}: ${title} in ${repo}`,
          messageCli: `gh pr merge ${pr.number} --repo=${repo} --squash  # ${title}`,
          intent: 'announcement', emotion: 'happy',
          tags: ['github', 'pr', 'merge'],
        };
      }
      case 'ReleaseEvent': {
        const p = event.payload as { action?: string; release?: { tag_name?: string; name?: string } };
        if (p.action !== 'published') return null;
        const tag = p.release?.tag_name ?? 'v0.0.0';
        const name = (p.release?.name ?? tag).slice(0, 80);
        return {
          messageRaw: `Released ${tag}: ${name} for ${repo}`,
          messageCli: `gh release create ${tag} --repo=${repo} --title="${name}"`,
          intent: 'announcement', emotion: 'excited',
          tags: ['github', 'release', 'oss'],
        };
      }
      case 'CreateEvent': {
        const p = event.payload as { ref_type?: string };
        if (p.ref_type !== 'repository') return null;
        return {
          messageRaw: `Created new repository ${repo}`,
          messageCli: `gh repo create ${repoShort} --public`,
          intent: 'announcement', emotion: 'excited',
          tags: ['github', 'oss', 'new-project'],
        };
      }
      case 'WatchEvent':
        return {
          messageRaw: `Starred ${repo}`,
          messageCli: `gh repo star ${repo}`,
          intent: 'reaction', emotion: 'happy',
          tags: ['github', 'oss'],
        };
      case 'ForkEvent':
        return {
          messageRaw: `Forked ${repo}`,
          messageCli: `gh repo fork ${repo}`,
          intent: 'casual', emotion: 'neutral',
          tags: ['github', 'fork'],
        };
      default:
        return null;
    }
  }

  router.post('/sync-activity', requireAuth, async (req, res) => {
    const sessionUserId = req.session.userId!;
    const user = db.prepare('SELECT github_username FROM users WHERE id = ?').get(sessionUserId) as { github_username: string } | undefined;
    if (!user) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } }); return; }

    try {
      const ghRes = await fetch(
        `https://api.github.com/users/${user.github_username}/events?per_page=30`,
        { headers: { 'User-Agent': 'Forkverse', Accept: 'application/vnd.github+json' } },
      );
      if (!ghRes.ok) { res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to fetch GitHub events' } }); return; }

      const events = await ghRes.json() as GithubEvent[];
      let created = 0;

      for (const event of events) {
        const alreadySynced = db.prepare('SELECT 1 FROM github_synced_events WHERE event_id = ?').get(event.id);
        if (alreadySynced) continue;

        const post = buildPostFromEvent(event);
        db.prepare('INSERT OR IGNORE INTO github_synced_events (event_id, user_id, event_type) VALUES (?, ?, ?)').run(event.id, sessionUserId, event.type);

        if (!post) continue;

        const postId = generateId();
        db.prepare(`
          INSERT INTO posts (id, user_id, message_raw, message_cli, lang, tags, mentions, visibility, llm_model, intent, emotion, created_at)
          VALUES (?, ?, ?, ?, 'en', ?, '[]', 'public', 'custom', ?, ?, ?)
        `).run(postId, sessionUserId, post.messageRaw, post.messageCli, JSON.stringify(post.tags), post.intent, post.emotion, event.created_at);

        created++;
      }

      res.json({ data: { created, total: events.length } });
    } catch {
      res.status(502).json({ error: { code: 'GITHUB_ERROR', message: 'Failed to sync GitHub activity' } });
    }
  });

  return router;
}
