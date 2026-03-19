CREATE TABLE IF NOT EXISTS follows (
  follower_id   TEXT NOT NULL REFERENCES users(id),
  following_id  TEXT NOT NULL REFERENCES users(id),
  created_at    TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

CREATE TABLE IF NOT EXISTS stars (
  user_id     TEXT NOT NULL REFERENCES users(id),
  post_id     TEXT NOT NULL REFERENCES posts(id),
  created_at  TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_stars_post_id ON stars(post_id);
