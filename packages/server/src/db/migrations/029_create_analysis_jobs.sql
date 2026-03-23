-- Phase B5: Job queue for analysis processing
CREATE TABLE IF NOT EXISTS analysis_jobs (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, active, completed, failed, dead
  retries INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  error TEXT,
  started_at TEXT,
  completed_at TEXT,
  next_retry_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_analysis ON analysis_jobs(analysis_id);

-- Performance indexes for existing tables
CREATE INDEX IF NOT EXISTS idx_analyses_status_created ON analyses(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);
