CREATE TABLE IF NOT EXISTS activity_feed (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  target_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  target_post_id TEXT REFERENCES posts(id) ON DELETE SET NULL,
  metadata TEXT NOT NULL DEFAULT '{}',
  github_event_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_actor ON activity_feed(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_feed(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_github_event ON activity_feed(github_event_id) WHERE github_event_id IS NOT NULL;
