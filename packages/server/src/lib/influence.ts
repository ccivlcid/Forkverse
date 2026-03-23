import type { Database } from 'better-sqlite3';
import { INFLUENCE_TIERS } from '@forkverse/shared';

interface ScoreComponents {
  ghRepos: number;
  ghStars: number;
  ghFollowers: number;
  cliPosts: number;
  cliFollowers: number;
  cliStars: number;
  cliForks: number;
}

interface ScoreResult {
  score: number;
  tier: number;
  tierLabel: string;
  components: ScoreComponents;
}

function log2score(value: number, weight: number): number {
  return Math.log2(1 + value) * weight;
}

export function calculateScore(
  ghReposCount: number,
  ghTotalStars: number,
  ghFollowersCount: number,
  cliPostCount: number,
  cliFollowerCount: number,
  cliStarsReceived: number,
  cliForksReceived: number,
): ScoreResult {
  const components: ScoreComponents = {
    ghRepos: Math.round(log2score(ghReposCount, 2) * 100) / 100,
    ghStars: Math.round(log2score(ghTotalStars, 3) * 100) / 100,
    ghFollowers: Math.round(log2score(ghFollowersCount, 3) * 100) / 100,
    cliPosts: Math.round(log2score(cliPostCount, 3) * 100) / 100,
    cliFollowers: Math.round(log2score(cliFollowerCount, 4) * 100) / 100,
    cliStars: Math.round(log2score(cliStarsReceived, 3) * 100) / 100,
    cliForks: Math.round(log2score(cliForksReceived, 2) * 100) / 100,
  };

  const score = Math.round(
    (components.ghRepos + components.ghStars + components.ghFollowers +
     components.cliPosts + components.cliFollowers + components.cliStars + components.cliForks) * 100
  ) / 100;

  let tier = 1;
  let tierLabel = 'guest';
  for (const t of INFLUENCE_TIERS) {
    if (score >= t.min) {
      tier = t.tier;
      tierLabel = t.label;
    }
  }

  return { score, tier, tierLabel, components };
}

export function recalculateForUser(db: Database, userId: string): ScoreResult {
  const user = db.prepare('SELECT github_repos_count FROM users WHERE id = ?').get(userId) as
    | { github_repos_count: number } | undefined;

  const existing = db.prepare('SELECT gh_total_stars, gh_followers FROM influence_scores WHERE user_id = ?').get(userId) as
    | { gh_total_stars: number; gh_followers: number } | undefined;

  const postCount = (db.prepare('SELECT COUNT(*) as c FROM posts WHERE user_id = ? AND parent_id IS NULL').get(userId) as { c: number }).c;
  const followerCount = (db.prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').get(userId) as { c: number }).c;
  const starsReceived = (db.prepare(
    'SELECT COUNT(*) as c FROM stars WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)'
  ).get(userId) as { c: number }).c;
  const forksReceived = (db.prepare(
    'SELECT COUNT(*) as c FROM posts WHERE forked_from_id IN (SELECT id FROM posts WHERE user_id = ?)'
  ).get(userId) as { c: number }).c;

  const result = calculateScore(
    user?.github_repos_count ?? 0,
    existing?.gh_total_stars ?? 0,
    existing?.gh_followers ?? 0,
    postCount,
    followerCount,
    starsReceived,
    forksReceived,
  );

  db.prepare(`
    INSERT INTO influence_scores (
      user_id, score, tier, tier_label,
      gh_repos_score, gh_stars_score, gh_followers_score,
      cli_posts_score, cli_followers_score, cli_stars_score, cli_forks_score,
      gh_total_stars, gh_followers, calculated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      score = excluded.score,
      tier = excluded.tier,
      tier_label = excluded.tier_label,
      gh_repos_score = excluded.gh_repos_score,
      gh_stars_score = excluded.gh_stars_score,
      gh_followers_score = excluded.gh_followers_score,
      cli_posts_score = excluded.cli_posts_score,
      cli_followers_score = excluded.cli_followers_score,
      cli_stars_score = excluded.cli_stars_score,
      cli_forks_score = excluded.cli_forks_score,
      gh_total_stars = excluded.gh_total_stars,
      gh_followers = excluded.gh_followers,
      calculated_at = excluded.calculated_at
  `).run(
    userId, result.score, result.tier, result.tierLabel,
    result.components.ghRepos, result.components.ghStars, result.components.ghFollowers,
    result.components.cliPosts, result.components.cliFollowers, result.components.cliStars, result.components.cliForks,
    existing?.gh_total_stars ?? 0, existing?.gh_followers ?? 0,
  );

  return result;
}

export function updateGithubStats(db: Database, userId: string, ghTotalStars: number, ghFollowers: number): void {
  const exists = db.prepare('SELECT 1 FROM influence_scores WHERE user_id = ?').get(userId);
  if (exists) {
    db.prepare('UPDATE influence_scores SET gh_total_stars = ?, gh_followers = ? WHERE user_id = ?')
      .run(ghTotalStars, ghFollowers, userId);
  } else {
    db.prepare('INSERT INTO influence_scores (user_id, gh_total_stars, gh_followers) VALUES (?, ?, ?)')
      .run(userId, ghTotalStars, ghFollowers);
  }
}
