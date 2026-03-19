# DATABASE.md — Database Design & Reference

> **Source of truth** for database schema, queries, migrations, and data integrity rules.
> SQLite with `better-sqlite3`. No ORM. Raw SQL only. Prepared statements only.

---

## 1. Overview

| Property | Value |
|----------|-------|
| Engine | SQLite 3 |
| Driver | `better-sqlite3` (synchronous API) |
| File | `clitoris.db` (project root, gitignored) |
| Migrations | Sequential `.sql` files under `packages/server/src/db/migrations/` |
| ID strategy | UUID v7 (text, sortable by creation time) |
| Timestamps | ISO 8601 text via `datetime('now')` |
| JSON columns | Stored as `TEXT`, parsed in application code |

---

## 1.5 Connection Initialization

Every database connection must set these PRAGMAs before any query:

```typescript
import Database from 'better-sqlite3';

function createConnection(dbPath: string): Database.Database {
  const db = new Database(dbPath);

  // Required PRAGMAs — set on every connection
  db.pragma('journal_mode = WAL');         // Write-Ahead Logging for concurrent reads
  db.pragma('foreign_keys = ON');          // Enforce foreign key constraints
  db.pragma('busy_timeout = 5000');        // Wait 5s on lock before throwing
  db.pragma('synchronous = NORMAL');       // Balance between safety and speed
  db.pragma('cache_size = -20000');        // 20MB cache (negative = KB)
  db.pragma('temp_store = MEMORY');        // Store temp tables in memory

  return db;
}
```

| PRAGMA | Value | Purpose |
|--------|-------|---------|
| `journal_mode` | `WAL` | Enables concurrent reads during writes |
| `foreign_keys` | `ON` | Enforces FK constraints (OFF by default in SQLite) |
| `busy_timeout` | `5000` | Waits 5s for locks instead of immediate SQLITE_BUSY |
| `synchronous` | `NORMAL` | Adequate durability with WAL mode |
| `cache_size` | `-20000` | 20MB page cache for faster repeated queries |
| `temp_store` | `MEMORY` | Temp tables in memory for speed |

---

## 2. Schema

### 2.1 `users`

Stores registered user accounts.

```sql
-- 001_create_users.sql
CREATE TABLE users (
  id            TEXT PRIMARY KEY,          -- UUID v7
  username      TEXT UNIQUE NOT NULL,      -- @handle (unique)
  password_hash TEXT NOT NULL,             -- bcrypt hashed password
  domain        TEXT,                      -- custom domain (e.g. "jiyeon.kim")
  display_name  TEXT,                      -- display name
  bio           TEXT,                      -- profile bio
  avatar_url    TEXT,                      -- avatar image URL
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX idx_users_username ON users(username);
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | TEXT | NO | — | UUID v7 primary key |
| `username` | TEXT | NO | — | Unique handle (e.g. `jiyeon_dev`) |
| `password_hash` | TEXT | NO | — | Bcrypt hashed password (never exposed via API) |
| `domain` | TEXT | YES | NULL | Custom domain link |
| `display_name` | TEXT | YES | NULL | Display name |
| `bio` | TEXT | YES | NULL | Profile biography |
| `avatar_url` | TEXT | YES | NULL | Avatar image URL |
| `created_at` | TEXT | NO | `datetime('now')` | Account creation timestamp |

### 2.2 `posts`

Stores all posts in dual-format (natural language + CLI).

```sql
-- 002_create_posts.sql
CREATE TABLE posts (
  id              TEXT PRIMARY KEY,          -- UUID v7
  user_id         TEXT NOT NULL REFERENCES users(id),
  message_raw     TEXT NOT NULL,             -- natural language original
  message_cli     TEXT NOT NULL,             -- CLI-transformed output
  lang            TEXT DEFAULT 'en',         -- ISO 639-1 language code
  tags            TEXT DEFAULT '[]',         -- JSON array of strings
  mentions        TEXT DEFAULT '[]',         -- JSON array of usernames
  visibility      TEXT DEFAULT 'public',     -- public | private | unlisted
  llm_model       TEXT NOT NULL,             -- model used for transformation
  parent_id       TEXT REFERENCES posts(id), -- reply parent (NULL if root post)
  forked_from_id  TEXT REFERENCES posts(id), -- original post (NULL if original)
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_llm_model ON posts(llm_model);
CREATE INDEX idx_posts_parent_id ON posts(parent_id);
CREATE INDEX idx_posts_visibility ON posts(visibility);
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | TEXT | NO | — | UUID v7 primary key |
| `user_id` | TEXT | NO | — | FK → `users.id` |
| `message_raw` | TEXT | NO | — | Natural language content |
| `message_cli` | TEXT | NO | — | CLI command representation |
| `lang` | TEXT | NO | `'en'` | ISO 639-1 language code |
| `tags` | TEXT | NO | `'[]'` | JSON array of hashtag strings |
| `mentions` | TEXT | NO | `'[]'` | JSON array of mentioned usernames |
| `visibility` | TEXT | NO | `'public'` | `public`, `private`, or `unlisted` |
| `llm_model` | TEXT | NO | — | LLM model used (`claude-sonnet`, `gpt-4o`, etc.) |
| `parent_id` | TEXT | YES | NULL | FK → `posts.id` (reply chain) |
| `forked_from_id` | TEXT | YES | NULL | FK → `posts.id` (fork source) |
| `created_at` | TEXT | NO | `datetime('now')` | Post creation timestamp |

### 2.3 `follows`

Stores user follow relationships.

```sql
-- 003_create_social.sql
CREATE TABLE follows (
  follower_id   TEXT NOT NULL REFERENCES users(id),
  following_id  TEXT NOT NULL REFERENCES users(id),
  created_at    TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX idx_follows_following ON follows(following_id);
```

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `follower_id` | TEXT | NO | FK → `users.id` (who follows) |
| `following_id` | TEXT | NO | FK → `users.id` (who is followed) |
| `created_at` | TEXT | NO | Timestamp of follow action |

### 2.4 `stars`

Stores post star (like/bookmark) records.

```sql
-- (part of 003_create_social.sql)
CREATE TABLE stars (
  user_id     TEXT NOT NULL REFERENCES users(id),
  post_id     TEXT NOT NULL REFERENCES posts(id),
  created_at  TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX idx_stars_post_id ON stars(post_id);
```

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `user_id` | TEXT | NO | FK → `users.id` |
| `post_id` | TEXT | NO | FK → `posts.id` |
| `created_at` | TEXT | NO | Timestamp of star action |

---

## 3. Entity Relationship Diagram

```
┌──────────┐       ┌──────────────┐       ┌──────────┐
│  users   │       │    posts     │       │  stars   │
├──────────┤       ├──────────────┤       ├──────────┤
│ id (PK)  │◄──┐   │ id (PK)      │◄──┐   │ user_id  │──→ users.id
│ username │   │   │ user_id (FK) │──→│   │ post_id  │──→ posts.id
│ domain   │   │   │ message_raw  │   │   │ created_at│
│ display_ │   │   │ message_cli  │   │   └──────────┘
│ bio      │   │   │ lang         │   │
│ avatar_  │   │   │ tags (JSON)  │   │   ┌──────────┐
│ created_ │   │   │ mentions(JSON│   │   │ follows  │
└──────────┘   │   │ visibility   │   │   ├──────────┤
               │   │ llm_model    │   │   │follower_ │──→ users.id
               │   │ parent_id(FK)│───┘   │following_│──→ users.id
               │   │ forked_from_ │───┘   │ created_ │
               │   │ created_at   │       └──────────┘
               │   └──────────────┘
               │          │
               └──────────┘
                 user_id FK
```

---

## 4. Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| `users` | `idx_users_username` | `username` UNIQUE | Fast username lookup |
| `posts` | `idx_posts_user_id` | `user_id` | User's posts query |
| `posts` | `idx_posts_created_at` | `created_at DESC` | Feed chronological sort |
| `posts` | `idx_posts_llm_model` | `llm_model` | "by LLM" filter |
| `posts` | `idx_posts_parent_id` | `parent_id` | Reply thread lookup |
| `posts` | `idx_posts_visibility` | `visibility` | Public feed filter |
| `follows` | `idx_follows_following` | `following_id` | Follower count / lookup |
| `stars` | `idx_stars_post_id` | `post_id` | Star count per post |

---

## 5. Common Queries

### Global Feed

```sql
SELECT p.*, u.username, u.domain, u.display_name, u.avatar_url,
       (SELECT COUNT(*) FROM stars WHERE post_id = p.id) AS star_count,
       (SELECT COUNT(*) FROM posts WHERE parent_id = p.id) AS reply_count,
       (SELECT COUNT(*) FROM posts WHERE forked_from_id = p.id) AS fork_count
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.visibility = 'public'
  AND p.parent_id IS NULL
  AND p.created_at < ?   -- cursor
ORDER BY p.created_at DESC
LIMIT 20;
```

### Local Feed (Following)

```sql
SELECT p.*, u.username, u.domain, u.display_name, u.avatar_url
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.user_id IN (
  SELECT following_id FROM follows WHERE follower_id = ?
)
  AND p.visibility = 'public'
  AND p.parent_id IS NULL
  AND p.created_at < ?
ORDER BY p.created_at DESC
LIMIT 20;
```

### Filter by LLM Model

```sql
SELECT p.*, u.username, u.domain
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.llm_model = ?
  AND p.visibility = 'public'
  AND p.parent_id IS NULL
ORDER BY p.created_at DESC
LIMIT 20;
```

### Reply Thread

```sql
SELECT p.*, u.username, u.display_name, u.avatar_url
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.parent_id = ?
ORDER BY p.created_at ASC;
```

### Toggle Star

```sql
-- Check if already starred
SELECT 1 FROM stars WHERE user_id = ? AND post_id = ?;

-- Star (insert)
INSERT INTO stars (user_id, post_id) VALUES (?, ?);

-- Unstar (delete)
DELETE FROM stars WHERE user_id = ? AND post_id = ?;
```

### Fork Post

```sql
INSERT INTO posts (id, user_id, message_raw, message_cli, lang, tags, mentions,
                   visibility, llm_model, forked_from_id)
SELECT ?, ?, message_raw, message_cli, lang, tags, mentions,
       'public', llm_model, id
FROM posts WHERE id = ?;
```

---

## 6. Migration Rules

| Rule | Description |
|------|-------------|
| Sequential numbering | `001_`, `002_`, `003_` — no gaps |
| Append-only | Never modify an existing migration file |
| One concern per file | Each migration handles one logical change |
| Naming format | `{number}_{description}.sql` (kebab-case description) |
| Location | `packages/server/src/db/migrations/` |
| Idempotent | Use `IF NOT EXISTS` where applicable |
| Down migrations | Not used — roll forward only |

### Migration Runner Pattern

```typescript
import Database from 'better-sqlite3';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const applied = db
    .prepare('SELECT name FROM migrations')
    .all()
    .map((row) => row.name);

  const pending = files.filter((f) => !applied.includes(f));

  const applyMigration = db.transaction((filename: string) => {
    const sql = readFileSync(path.join(migrationsDir, filename), 'utf-8');
    db.exec(sql);
    db.prepare('INSERT INTO migrations (name) VALUES (?)').run(filename);
  });

  for (const file of pending) {
    applyMigration(file);
  }
}
```

### Migration File Examples

The following are the actual migration files used to bootstrap the database. Each file is idempotent (`IF NOT EXISTS`) and handles one logical concern.

```sql
-- 001_create_users.sql
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  domain        TEXT,
  display_name  TEXT,
  bio           TEXT,
  avatar_url    TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
```

```sql
-- 002_create_posts.sql
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
```

```sql
-- 003_create_social.sql
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
```

---

## 7. Access Patterns

| Pattern | Table(s) | Frequency | Index Used |
|---------|----------|-----------|------------|
| Load global feed | `posts` + `users` | Very high | `idx_posts_created_at`, `idx_posts_visibility` |
| Load local feed | `posts` + `users` + `follows` | High | `idx_posts_user_id`, `idx_follows_following` |
| Single post + replies | `posts` + `users` | Medium | `idx_posts_parent_id` |
| User profile + posts | `users` + `posts` | Medium | `idx_users_username`, `idx_posts_user_id` |
| Star/unstar | `stars` | High | PK (`user_id`, `post_id`) |
| Follow/unfollow | `follows` | Low | PK (`follower_id`, `following_id`) |
| Filter by LLM | `posts` + `users` | Medium | `idx_posts_llm_model` |
| Star count | `stars` | Very high | `idx_stars_post_id` |

---

## 8. Data Integrity Rules

- All foreign keys enforced: `PRAGMA foreign_keys = ON;` (set on every connection)
- `user_id` on posts must reference a valid user
- `parent_id` and `forked_from_id` must reference valid posts or be NULL
- `visibility` constrained to: `public`, `private`, `unlisted`
- `llm_model` constrained to: `claude-sonnet`, `gpt-4o`, `gemini-2.5-pro`, `llama-3`, `cursor`, `cli`, `api`, `custom`
- Self-follow prevented at application level
- Self-star prevented at application level
- Duplicate follow/star prevented by composite primary keys

### Cascade Delete Rules

| Action | Cascade Behavior |
|--------|-----------------|
| Delete user | Delete all user's posts, stars, follows (application-level cascade in transaction) |
| Delete post | Delete all stars on the post, set `parent_id = NULL` on child replies (orphan replies remain visible) |
| Delete forked post | Original post unaffected; forked_from_id references become dangling (application handles gracefully) |

```sql
-- Application-level cascade for user deletion (in a transaction)
DELETE FROM stars WHERE user_id = ?;
DELETE FROM follows WHERE follower_id = ? OR following_id = ?;
DELETE FROM stars WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?);
DELETE FROM posts WHERE user_id = ?;
DELETE FROM users WHERE id = ?;
```

### Reply Threading Rules

| Rule | Value |
|------|-------|
| Max reply depth | **1 level** (flat replies only — no nested threads) |
| Reply to a reply | Creates a new top-level reply to the **original parent** post, not the reply |
| Reply ordering | Chronological ascending (`ORDER BY created_at ASC`) |
| Reply pagination | All replies loaded at once (no pagination) — max 100 replies per post |

---

## 9. Performance Notes

- SQLite is single-writer — adequate for MVP traffic
- Cursor-based pagination (not OFFSET) for consistent feed loading
- Aggregate counts (star_count, reply_count, fork_count) computed via subqueries for now; consider denormalization if slow
- WAL mode enabled for concurrent reads: `PRAGMA journal_mode = WAL;`
- JSON columns (`tags`, `mentions`) parsed in TypeScript, not queried via `json_each()` unless needed for search

---

## 10. Cursor Format

The cursor value used for pagination is the `created_at` ISO 8601 timestamp of the last item in the current page.

### Format

```
cursor = posts[posts.length - 1].created_at
// Example: "2026-03-19T12:29:00Z"
```

### Rules

| Rule | Description |
|------|-------------|
| First request | Omit `cursor` parameter — returns latest items |
| Subsequent requests | Pass `cursor` as the `created_at` of the last item received |
| `hasMore` flag | `true` if the query returned `limit + 1` rows (fetch `limit + 1`, return `limit`) |
| Tie-breaking | If two posts share the same `created_at`, `id` (UUID v7) is used as a secondary sort |
| Direction | Always descending (`ORDER BY created_at DESC`) — newer items first |

### Implementation

```sql
-- Page 1: no cursor
SELECT ... FROM posts
WHERE visibility = 'public' AND parent_id IS NULL
ORDER BY created_at DESC
LIMIT 21;  -- fetch limit+1 to determine hasMore

-- Page 2: with cursor
SELECT ... FROM posts
WHERE visibility = 'public' AND parent_id IS NULL
  AND created_at < ?  -- cursor value
ORDER BY created_at DESC
LIMIT 21;
```

```typescript
// Server-side cursor logic
const limit = Math.min(Number(req.query.limit) || 20, 50);
const rows = stmt.all(cursor, limit + 1);
const hasMore = rows.length > limit;
const data = hasMore ? rows.slice(0, limit) : rows;
const nextCursor = data.length > 0 ? data[data.length - 1].created_at : null;

res.json({
  data,
  meta: { cursor: nextCursor, hasMore },
});
```

---

## See Also

- [schema-erd.md](../architecture/schema-erd.md) — Visual ERD diagram (Mermaid)
- [API.md](./API.md) — How API endpoints map to database queries
- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) — System data flows
