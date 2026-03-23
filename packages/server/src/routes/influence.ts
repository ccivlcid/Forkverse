import { Router } from 'express';
import type { Database } from 'better-sqlite3';
import { requireAuth } from '../middleware/auth.js';
import { recalculateForUser, updateGithubStats } from '../lib/influence.js';

interface ScoreRow {
  user_id: string;
  score: number;
  tier: number;
  tier_label: string;
  gh_repos_score: number;
  gh_stars_score: number;
  gh_followers_score: number;
  cli_posts_score: number;
  cli_followers_score: number;
  cli_stars_score: number;
  cli_forks_score: number;
  gh_total_stars: number;
  gh_followers: number;
  calculated_at: string;
}

interface LeaderboardRow extends ScoreRow {
  username: string;
  display_name: string;
  avatar_url: string | null;
  github_username: string;
}

function mapScore(row: ScoreRow, stale = false) {
  return {
    userId: row.user_id,
    score: row.score,
    tier: row.tier,
    tierLabel: row.tier_label,
    breakdown: {
      ghRepos: row.gh_repos_score,
      ghStars: row.gh_stars_score,
      ghFollowers: row.gh_followers_score,
      cliPosts: row.cli_posts_score,
      cliFollowers: row.cli_followers_score,
      cliStars: row.cli_stars_score,
      cliForks: row.cli_forks_score,
    },
    ghTotalStars: row.gh_total_stars,
    ghFollowers: row.gh_followers,
    calculatedAt: row.calculated_at,
    ...(stale ? { stale: true } : {}),
  };
}

export function createInfluenceRouter(db: Database): Router {
  const router = Router();

  // POST /api/influence/calculate — recalculate current user's score
  router.post('/calculate', requireAuth, async (req, res) => {
    const userId = req.session.userId!;

    // Fetch GitHub stats if user has a token
    const user = db.prepare(
      'SELECT github_username, github_access_token, github_repos_count FROM users WHERE id = ?'
    ).get(userId) as { github_username: string; github_access_token: string | null; github_repos_count: number } | undefined;

    if (!user) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    try {
      // Fetch followers count from GitHub API
      const headers: Record<string, string> = { 'User-Agent': 'Forkverse/1.0', Accept: 'application/vnd.github+json' };
      if (user.github_access_token) headers['Authorization'] = `Bearer ${user.github_access_token}`;

      const profileRes = await fetch(`https://api.github.com/users/${user.github_username}`, { headers });
      let ghFollowers = 0;
      if (profileRes.ok) {
        const profile = await profileRes.json() as { followers: number };
        ghFollowers = profile.followers;
      }

      // Fetch repos to sum stars
      const reposRes = await fetch(
        `https://api.github.com/users/${user.github_username}/repos?per_page=100&sort=pushed`,
        { headers },
      );
      let ghTotalStars = 0;
      if (reposRes.ok) {
        const repos = await reposRes.json() as Array<{ stargazers_count: number }>;
        ghTotalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
      }

      // Update GitHub stats in influence table
      updateGithubStats(db, userId, ghTotalStars, ghFollowers);
    } catch {
      // Continue with existing cached stats on API failure
    }

    recalculateForUser(db, userId);
    const row = db.prepare('SELECT * FROM influence_scores WHERE user_id = ?').get(userId) as ScoreRow;

    res.json({ data: mapScore(row) });
  });

  // GET /api/influence/leaderboard — public leaderboard
  router.get('/leaderboard', (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor ? Number(req.query.cursor) : null;

    let rows: LeaderboardRow[];
    if (cursor != null) {
      rows = db.prepare(`
        SELECT s.*, u.username, u.display_name, u.avatar_url, u.github_username
        FROM influence_scores s
        JOIN users u ON s.user_id = u.id
        WHERE s.score < ?
        ORDER BY s.score DESC
        LIMIT ?
      `).all(cursor, limit + 1) as LeaderboardRow[];
    } else {
      rows = db.prepare(`
        SELECT s.*, u.username, u.display_name, u.avatar_url, u.github_username
        FROM influence_scores s
        JOIN users u ON s.user_id = u.id
        ORDER BY s.score DESC
        LIMIT ?
      `).all(limit + 1) as LeaderboardRow[];
    }

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = data.length > 0 ? data[data.length - 1]!.score : null;

    // Calculate rank offset
    const baseRank = cursor != null
      ? (db.prepare('SELECT COUNT(*) as c FROM influence_scores WHERE score >= ?').get(cursor) as { c: number }).c + 1
      : 1;

    const entries = data.map((row, i) => ({
      rank: baseRank + i,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      githubUsername: row.github_username,
      score: row.score,
      tier: row.tier,
      tierLabel: row.tier_label,
    }));

    res.json({ data: entries, meta: { cursor: nextCursor, hasMore } });
  });

  // GET /api/influence/@:username — get user's influence score
  router.get('/@:username', (req, res) => {
    const { username } = req.params;
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as { id: string } | undefined;
    if (!user) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    const row = db.prepare('SELECT * FROM influence_scores WHERE user_id = ?').get(user.id) as ScoreRow | undefined;
    if (!row) {
      res.json({ data: null });
      return;
    }

    // Check staleness (24 hours)
    const calculatedAt = new Date(row.calculated_at + 'Z');
    const stale = Date.now() - calculatedAt.getTime() > 24 * 60 * 60 * 1000;

    res.json({ data: mapScore(row, stale) });
  });

  return router;
}
