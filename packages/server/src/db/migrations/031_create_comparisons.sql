-- Phase B6: Comparison analyses (side-by-side repo comparison)
CREATE TABLE IF NOT EXISTS comparisons (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repo_a_owner TEXT NOT NULL,
  repo_a_name TEXT NOT NULL,
  repo_b_owner TEXT NOT NULL,
  repo_b_name TEXT NOT NULL,
  llm_model TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'en',
  result_json TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  duration_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comparisons_user ON comparisons(user_id);
