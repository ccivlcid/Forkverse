CREATE TABLE IF NOT EXISTS posts (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id),
  message_raw     TEXT NOT NULL,
  message_cli     TEXT NOT NULL,
  lang            TEXT DEFAULT 'en',
  tags            TEXT DEFAULT '[]',
  mentions        TEXT DEFAULT '[]',
  visibility      TEXT DEFAULT 'public',
  llm_model       TEXT NOT NULL,
  parent_id       TEXT REFERENCES posts(id),
  forked_from_id  TEXT REFERENCES posts(id),
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_llm_model ON posts(llm_model);
CREATE INDEX IF NOT EXISTS idx_posts_parent_id ON posts(parent_id);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);
