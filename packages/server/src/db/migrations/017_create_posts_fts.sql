CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  message_raw,
  tags,
  content=posts,
  content_rowid=rowid
);

-- Populate FTS from existing posts
INSERT OR IGNORE INTO posts_fts(rowid, message_raw, tags)
  SELECT rowid, message_raw, tags FROM posts;

-- Keep FTS in sync via triggers
CREATE TRIGGER IF NOT EXISTS posts_fts_insert AFTER INSERT ON posts BEGIN
  INSERT INTO posts_fts(rowid, message_raw, tags) VALUES (NEW.rowid, NEW.message_raw, NEW.tags);
END;

CREATE TRIGGER IF NOT EXISTS posts_fts_delete AFTER DELETE ON posts BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, message_raw, tags) VALUES ('delete', OLD.rowid, OLD.message_raw, OLD.tags);
END;

CREATE TRIGGER IF NOT EXISTS posts_fts_update AFTER UPDATE ON posts BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, message_raw, tags) VALUES ('delete', OLD.rowid, OLD.message_raw, OLD.tags);
  INSERT INTO posts_fts(rowid, message_raw, tags) VALUES (NEW.rowid, NEW.message_raw, NEW.tags);
END;
