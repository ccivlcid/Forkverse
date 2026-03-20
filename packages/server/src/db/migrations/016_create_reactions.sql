CREATE TABLE IF NOT EXISTS reactions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, post_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions(post_id);
