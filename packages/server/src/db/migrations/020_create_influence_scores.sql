CREATE TABLE IF NOT EXISTS influence_scores (
  user_id             TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  score               REAL NOT NULL DEFAULT 0,
  tier                INTEGER NOT NULL DEFAULT 1,
  tier_label          TEXT NOT NULL DEFAULT 'guest',
  gh_repos_score      REAL NOT NULL DEFAULT 0,
  gh_stars_score      REAL NOT NULL DEFAULT 0,
  gh_followers_score  REAL NOT NULL DEFAULT 0,
  cli_posts_score     REAL NOT NULL DEFAULT 0,
  cli_followers_score REAL NOT NULL DEFAULT 0,
  cli_stars_score     REAL NOT NULL DEFAULT 0,
  cli_forks_score     REAL NOT NULL DEFAULT 0,
  gh_total_stars      INTEGER NOT NULL DEFAULT 0,
  gh_followers        INTEGER NOT NULL DEFAULT 0,
  calculated_at       TEXT NOT NULL DEFAULT (datetime('now')),
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_influence_scores_score ON influence_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_influence_scores_tier ON influence_scores(tier DESC, score DESC);
