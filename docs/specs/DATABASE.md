# DATABASE.md — Database Design & Reference

> **Source of truth** for database schema, queries, migrations, and data integrity rules.
> SQLite with `better-sqlite3`. No ORM. Raw SQL only. Prepared statements only.
> This file is the single source of truth for the database schema. No separate SQL file is maintained.

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
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  domain        TEXT,
  display_name  TEXT NOT NULL DEFAULT '',
  bio           TEXT DEFAULT '',
  avatar_url    TEXT,
  github_id            TEXT NOT NULL UNIQUE,
  github_username      TEXT NOT NULL,
  github_avatar_url    TEXT,
  github_profile_url   TEXT,
  github_repos_count   INTEGER DEFAULT 0,
  github_connected_at  TEXT NOT NULL DEFAULT (datetime('now')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX idx_users_username ON users(username);
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | TEXT | NO | — | UUID v7 primary key |
| `username` | TEXT | NO | — | Unique handle (e.g. `jiyeon_dev`) |
| `domain` | TEXT | YES | NULL | Custom domain link |
| `display_name` | TEXT | NO | `''` | Display name |
| `bio` | TEXT | NO | `''` | Profile biography |
| `avatar_url` | TEXT | YES | NULL | Avatar image URL |
| `github_id` | TEXT | NO | — | GitHub user ID (unique, used for OAuth lookup) |
| `github_username` | TEXT | NO | — | GitHub login username |
| `github_avatar_url` | TEXT | YES | NULL | GitHub avatar image URL |
| `github_profile_url` | TEXT | YES | NULL | GitHub profile page URL |
| `github_repos_count` | INTEGER | NO | `0` | Number of public repos on GitHub |
| `github_connected_at` | TEXT | NO | `datetime('now')` | When GitHub account was linked |
| `created_at` | TEXT | NO | `datetime('now')` | Account creation timestamp |
| `github_access_token` | TEXT | YES | NULL | OAuth access token (stored after login, used for GitHub API calls) |
| `github_token_scope` | TEXT | YES | NULL | Granted OAuth scopes (e.g. `read:user user:email notifications repo`) |

`github_access_token` and `github_token_scope` are added via migration `011_add_github_token.sql`:

```sql
-- 011_add_github_token.sql
ALTER TABLE users ADD COLUMN github_access_token TEXT;
ALTER TABLE users ADD COLUMN github_token_scope TEXT;
```

`top_languages` is added via migration `012_add_top_languages.sql`:

```sql
-- 012_add_top_languages.sql
ALTER TABLE users ADD COLUMN top_languages TEXT NOT NULL DEFAULT '[]';
```

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `top_languages` | TEXT | `'[]'` | JSON array of top programming languages computed from public repos (e.g. `["TypeScript","Go","Rust"]`). Populated when `POST /api/users/sync-profile` is called. |

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
| `intent` | TEXT | NO | `'neutral'` | LLM-extracted intent: `casual`, `formal`, `question`, `announcement`, `reaction` |
| `emotion` | TEXT | NO | `'neutral'` | LLM-extracted emotion: `neutral`, `happy`, `surprised`, `frustrated`, `excited`, `sad`, `angry` |

`intent` and `emotion` are added via migration `006_add_intent_emotion_to_posts.sql`:

```sql
-- 006_add_intent_emotion_to_posts.sql
ALTER TABLE posts ADD COLUMN intent TEXT NOT NULL DEFAULT 'neutral';
ALTER TABLE posts ADD COLUMN emotion TEXT NOT NULL DEFAULT 'neutral';
```

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

### 2.5 `user_llm_keys`

Stores user-provided API keys for LLM providers. Keys are entered by users in Settings and never stored in environment variables.

```sql
-- 004_create_llm_keys.sql
CREATE TABLE IF NOT EXISTS user_llm_keys (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider    TEXT NOT NULL,
  api_key     TEXT NOT NULL,
  base_url    TEXT,
  label       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_llm_keys_user_id ON user_llm_keys(user_id);
```

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | TEXT | NO | UUID v7 primary key |
| `user_id` | TEXT | NO | FK → `users.id` — key owner |
| `provider` | TEXT | NO | Provider name: `anthropic`, `openai`, `gemini`, `api` |
| `api_key` | TEXT | NO | User's API key for this provider |
| `base_url` | TEXT | YES | Custom base URL (for `api` provider only) |
| `label` | TEXT | YES | Optional user-assigned label |
| `created_at` | TEXT | NO | When the key was saved |

**Constraint**: One key per user per provider (`UNIQUE(user_id, provider)`). `POST /api/llm/keys` upserts on conflict.

### 2.6 Language columns on `users`

Users have two language preferences stored directly on the `users` table (added in migration `005_add_language_columns.sql`):

```sql
-- 005_add_language_columns.sql
ALTER TABLE users ADD COLUMN ui_lang TEXT NOT NULL DEFAULT 'en';
ALTER TABLE users ADD COLUMN default_post_lang TEXT NOT NULL DEFAULT 'auto';
```

| Column | Values | Default | Description |
|--------|--------|---------|-------------|
| `ui_lang` | `en`, `ko`, `zh`, `ja` | `en` | Interface display language |
| `default_post_lang` | `auto`, `en`, `ko`, `zh`, `ja` | `auto` | Default language for new posts |

When `default_post_lang` is `auto`, the server detects the language from the post content before calling the LLM.

### 2.7 `translations`

Caches tone-aware post translations. Populated lazily when `post.lang ≠ viewer.ui_lang`. Uses the user's own LLM key — no server-side cost.

```sql
-- 007_create_translations.sql
CREATE TABLE IF NOT EXISTS translations (
  id         TEXT PRIMARY KEY,
  post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  lang       TEXT NOT NULL,      -- target language (ISO 639-1)
  text       TEXT NOT NULL,      -- translated content
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(post_id, lang)          -- cache key: one translation per (post, target lang)
);

CREATE INDEX IF NOT EXISTS idx_translations_post_id ON translations(post_id);
```

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | TEXT | NO | UUID v7 primary key |
| `post_id` | TEXT | NO | FK → `posts.id` (cascade delete) |
| `lang` | TEXT | NO | Target language code (e.g. `en`, `ko`, `ja`, `zh`) |
| `text` | TEXT | NO | Translated post content |
| `created_at` | TEXT | NO | When translation was generated |

**Constraint**: `UNIQUE(post_id, lang)` — one cached translation per post per language. On cache hit, the LLM is never called.

**Translation prompt**: `packages/llm/prompts/translate.md` — preserves `intent` and `emotion` metadata from the source post.

### 2.8 `repo_attachments`

Links GitHub repos to posts.

```sql
CREATE TABLE repo_attachments (
  post_id       TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  repo_owner    TEXT NOT NULL,
  repo_name     TEXT NOT NULL,
  repo_stars    INTEGER DEFAULT 0,
  repo_forks    INTEGER DEFAULT 0,
  repo_language TEXT,
  cached_at     TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (post_id)
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| post_id | TEXT | PK, FK→posts | Post that references the repo |
| repo_owner | TEXT | NOT NULL | GitHub repo owner |
| repo_name | TEXT | NOT NULL | GitHub repo name |
| repo_stars | INTEGER | DEFAULT 0 | Cached star count |
| repo_forks | INTEGER | DEFAULT 0 | Cached fork count |
| repo_language | TEXT | nullable | Primary programming language |
| cached_at | TEXT | NOT NULL | When repo data was last fetched |

### 2.9 `analyses`

Stores repo analysis requests and results.

```sql
CREATE TABLE analyses (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repo_owner    TEXT NOT NULL,
  repo_name     TEXT NOT NULL,
  output_type   TEXT NOT NULL CHECK (output_type IN ('report', 'pptx', 'video')),
  llm_model     TEXT NOT NULL,
  lang          TEXT NOT NULL DEFAULT 'en',
  options_json  TEXT DEFAULT '{}',
  result_url    TEXT,
  result_summary TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  duration_ms   INTEGER,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | ULID |
| user_id | TEXT | FK→users | User who requested the analysis |
| repo_owner | TEXT | NOT NULL | GitHub repo owner |
| repo_name | TEXT | NOT NULL | GitHub repo name |
| output_type | TEXT | NOT NULL | `report`, `pptx`, or `video` |
| llm_model | TEXT | NOT NULL | LLM model used for analysis |
| lang | TEXT | NOT NULL | Output language |
| options_json | TEXT | DEFAULT '{}' | JSON string of output-specific options |
| result_url | TEXT | nullable | URL to download result file |
| result_summary | TEXT | nullable | Brief summary of the analysis |
| status | TEXT | NOT NULL | `pending`, `processing`, `completed`, `failed` |
| duration_ms | INTEGER | nullable | Time taken in milliseconds |
| created_at | TEXT | NOT NULL | Creation timestamp |

### 2.10 `github_synced_events`

Tracks GitHub events already imported as posts, preventing duplicate auto-posts on repeated sync calls.

```sql
-- 010_create_github_synced_events.sql
CREATE TABLE IF NOT EXISTS github_synced_events (
  event_id    TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  synced_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_github_synced_events_user ON github_synced_events(user_id);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| event_id | TEXT | PK | GitHub event ID (from GitHub API) |
| user_id | TEXT | FK→users ON DELETE CASCADE | User who owns this event |
| event_type | TEXT | NOT NULL | GitHub event type (e.g. `PushEvent`, `PullRequestEvent`) |
| synced_at | TEXT | NOT NULL | When the event was imported |

**Usage**: Before creating a post from a GitHub event, `POST /api/users/sync-activity` checks `SELECT 1 FROM github_synced_events WHERE event_id = ?`. If found, the event is skipped. After creation, the `event_id` is inserted here.

### 2.11 `webhook_deliveries`

Tracks GitHub webhook delivery IDs for idempotency (prevents processing the same webhook twice).

```sql
-- 013_create_webhook_deliveries.sql
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  delivery_id  TEXT PRIMARY KEY,
  received_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| delivery_id | TEXT | PK | GitHub webhook delivery UUID (`X-GitHub-Delivery` header) |
| received_at | TEXT | NOT NULL | When the webhook was received |

### 2.12 `activity_feed`

Stores platform-wide activity events (follows, stars, forks, replies, GitHub events).

```sql
-- 014_create_activity_feed.sql
CREATE TABLE IF NOT EXISTS activity_feed (
  id              TEXT PRIMARY KEY,
  actor_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,
  target_user_id  TEXT REFERENCES users(id) ON DELETE SET NULL,
  target_post_id  TEXT REFERENCES posts(id) ON DELETE SET NULL,
  metadata        TEXT DEFAULT '{}',
  github_event_id TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_actor ON activity_feed(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_feed_github_event ON activity_feed(github_event_id) WHERE github_event_id IS NOT NULL;
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | UUID v7 |
| actor_id | TEXT | FK→users ON DELETE CASCADE | User who performed the action |
| event_type | TEXT | NOT NULL | `follow`, `star_post`, `fork_post`, `reply`, `github_push`, `github_pr_merge`, etc. |
| target_user_id | TEXT | FK→users (nullable) | User being acted upon |
| target_post_id | TEXT | FK→posts (nullable) | Post being acted upon |
| metadata | TEXT | DEFAULT '{}' | JSON metadata for the event |
| github_event_id | TEXT | UNIQUE (where not null) | GitHub event ID for dedup |
| created_at | TEXT | NOT NULL | When the activity occurred |

### 2.13 `notifications`

Stores user notifications for social interactions.

```sql
-- 015_create_notifications.sql
CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  actor_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id    TEXT REFERENCES posts(id) ON DELETE SET NULL,
  message    TEXT,
  read       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_actor ON notifications(actor_id);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | UUID v7 |
| user_id | TEXT | FK→users ON DELETE CASCADE | User receiving the notification |
| type | TEXT | NOT NULL | `reply`, `mention`, `quote`, `star`, `fork`, `follow`, `reaction` |
| actor_id | TEXT | FK→users ON DELETE CASCADE | User who triggered the notification |
| post_id | TEXT | FK→posts (nullable) | Related post |
| message | TEXT | nullable | Notification preview text |
| read | INTEGER | NOT NULL, DEFAULT 0 | 0=unread, 1=read |
| created_at | TEXT | NOT NULL | When the notification was created |

### 2.14 `reactions`

Stores emoji reactions on posts. Each user can add multiple different emoji reactions per post.

```sql
-- 016_create_reactions.sql
CREATE TABLE IF NOT EXISTS reactions (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, post_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions(post_id);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | TEXT | PK, FK→users | User who reacted |
| post_id | TEXT | PK, FK→posts | Post being reacted to |
| emoji | TEXT | PK, NOT NULL | Reaction emoji from REACTION_EMOJIS: `lgtm`, `ship_it`, `fire`, `bug`, `thinking`, `rocket`, `eyes`, `heart` |
| created_at | TEXT | NOT NULL | When reaction was added |

### 2.15 `posts_fts` (Full-Text Search)

FTS5 virtual table for full-text search on posts. Auto-synced via triggers.

```sql
-- 017_create_posts_fts.sql
CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  message_raw,
  tags,
  content='posts',
  content_rowid='rowid'
);

-- Auto-sync triggers on INSERT/UPDATE/DELETE
```

### 2.16 `quoted_post_id` on `posts`

Added via migrations 018 and 019 to support quote posts.

```sql
-- 018_add_quoted_post_id.sql
ALTER TABLE posts ADD COLUMN quoted_post_id TEXT REFERENCES posts(id) ON DELETE SET NULL;

-- 019_add_quoted_post_index.sql
CREATE INDEX IF NOT EXISTS idx_posts_quoted_post_id ON posts(quoted_post_id);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| quoted_post_id | TEXT | FK→posts ON DELETE SET NULL | ID of quoted post (for quote-posts) |

---

## 3. Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────┐       ┌──────────┐
│      users       │       │    posts     │       │  stars   │
├──────────────────┤       ├──────────────┤       ├──────────┤
│ id (PK)          │◄──┐   │ id (PK)      │◄──┐   │ user_id  │──→ users.id
│ username         │   │   │ user_id (FK) │──→│   │ post_id  │──→ posts.id
│ domain           │   │   │ message_raw  │   │   │ created_at│
│ display_name     │   │   │ message_cli  │   │   └──────────┘
│ bio              │   │   │ lang         │   │
│ avatar_url       │   │   │ tags (JSON)  │   │   ┌──────────┐
│ github_id (UQ)   │   │   │ mentions(JSON│   │   │ follows  │
│ github_username  │   │   │ visibility   │   │   ├──────────┤
│ github_avatar_url│   │   │ llm_model    │   │   │follower_ │──→ users.id
│ github_profile_  │   │   │ parent_id(FK)│───┘   │following_│──→ users.id
│ github_repos_cnt │   │   │ forked_from_ │───┘   │ created_ │
│ github_connected │   │   │ created_at   │       └──────────┘
│ created_at       │   │   └──────────────┘
└──────────────────┘   │          │
        │              └──────────┘
        │                user_id FK
        │
        │         ┌─────────────────┐
        │         │ repo_attachments│
        │         ├─────────────────┤
        │         │ post_id (PK,FK) │──→ posts.id
        │         │ repo_owner      │    Post 1──0..1 RepoAttachment
        │         │ repo_name       │
        │         │ repo_stars      │
        │         │ repo_forks      │
        │         │ repo_language   │
        │         │ cached_at       │
        │         └─────────────────┘
        │
        │         ┌─────────────────┐
        └────────→│    analyses     │
     user_id FK   ├─────────────────┤
                  │ id (PK)         │    User 1──* Analysis
                  │ user_id (FK)    │──→ users.id
                  │ repo_owner      │
                  │ repo_name       │
                  │ output_type     │
                  │ llm_model       │
                  │ lang            │
                  │ options_json    │
                  │ result_url      │
                  │ result_summary  │
                  │ status          │
                  │ duration_ms     │
                  │ created_at      │
                  └─────────────────┘
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
| `users` | `idx_users_github_id` | `github_id` | GitHub OAuth lookup |
| `repo_attachments` | `idx_repo_attachments_repo` | `repo_owner, repo_name` | Repo lookup across posts |
| `analyses` | `idx_analyses_user_id` | `user_id` | User's analysis history |
| `analyses` | `idx_analyses_status` | `status` | Filter by processing status |
| `analyses` | `idx_analyses_repo` | `repo_owner, repo_name` | Repo analysis lookup |
| `activity_feed` | `idx_activity_feed_actor` | `actor_id, created_at DESC` | User's activity history |
| `activity_feed` | `idx_activity_feed_created` | `created_at DESC` | Global activity feed |
| `activity_feed` | `idx_activity_feed_github_event` | `github_event_id` (UNIQUE, partial) | GitHub event dedup |
| `notifications` | `idx_notifications_user` | `user_id, read, created_at DESC` | User's notifications |
| `notifications` | `idx_notifications_actor` | `actor_id` | Notifications by actor |
| `reactions` | `idx_reactions_post` | `post_id` | Reactions per post |
| `posts` | `idx_posts_quoted_post_id` | `quoted_post_id` | Quote post lookup |

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

### Get User by GitHub ID

```sql
SELECT * FROM users WHERE github_id = ?;
```

### Attach Repo to Post

```sql
INSERT INTO repo_attachments (post_id, repo_owner, repo_name, repo_stars, repo_forks, repo_language)
VALUES (?, ?, ?, ?, ?, ?);
```

### Create Analysis

```sql
INSERT INTO analyses (id, user_id, repo_owner, repo_name, output_type, llm_model, lang, options_json, status)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending');
```

### List User Analyses

```sql
SELECT * FROM analyses
WHERE user_id = ?
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
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
  username      TEXT NOT NULL UNIQUE,
  domain        TEXT,
  display_name  TEXT NOT NULL DEFAULT '',
  bio           TEXT DEFAULT '',
  avatar_url    TEXT,
  github_id            TEXT NOT NULL UNIQUE,
  github_username      TEXT NOT NULL,
  github_avatar_url    TEXT,
  github_profile_url   TEXT,
  github_repos_count   INTEGER DEFAULT 0,
  github_connected_at  TEXT NOT NULL DEFAULT (datetime('now')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
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

```sql
-- 004_add_github_fields.sql
-- Remove password_hash and add GitHub OAuth fields to users table.
-- NOTE: SQLite does not support DROP COLUMN before 3.35.0;
-- this migration recreates the table to remove password_hash.

CREATE TABLE IF NOT EXISTS users_new (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  domain        TEXT,
  display_name  TEXT NOT NULL DEFAULT '',
  bio           TEXT DEFAULT '',
  avatar_url    TEXT,
  github_id            TEXT NOT NULL UNIQUE,
  github_username      TEXT NOT NULL,
  github_avatar_url    TEXT,
  github_profile_url   TEXT,
  github_repos_count   INTEGER DEFAULT 0,
  github_connected_at  TEXT NOT NULL DEFAULT (datetime('now')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO users_new (id, username, domain, display_name, bio, avatar_url, created_at)
  SELECT id, username, domain, COALESCE(display_name, ''), COALESCE(bio, ''), avatar_url, created_at
  FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
```

```sql
-- 005_create_repo_attachments.sql
CREATE TABLE IF NOT EXISTS repo_attachments (
  post_id       TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  repo_owner    TEXT NOT NULL,
  repo_name     TEXT NOT NULL,
  repo_stars    INTEGER DEFAULT 0,
  repo_forks    INTEGER DEFAULT 0,
  repo_language TEXT,
  cached_at     TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (post_id)
);

CREATE INDEX IF NOT EXISTS idx_repo_attachments_repo ON repo_attachments(repo_owner, repo_name);
```

```sql
-- 006_create_analyses.sql
CREATE TABLE IF NOT EXISTS analyses (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repo_owner    TEXT NOT NULL,
  repo_name     TEXT NOT NULL,
  output_type   TEXT NOT NULL CHECK (output_type IN ('report', 'pptx', 'video')),
  llm_model     TEXT NOT NULL,
  lang          TEXT NOT NULL DEFAULT 'en',
  options_json  TEXT DEFAULT '{}',
  result_url    TEXT,
  result_summary TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  duration_ms   INTEGER,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_analyses_repo ON analyses(repo_owner, repo_name);
```

```sql
-- 007_create_translations.sql
-- (see section 2.7 above for full content)
```

```sql
-- 008_add_intent_emotion_to_posts.sql
-- (see section 2.2 intent/emotion columns above for full content)
```

```sql
-- 009_add_llm_keys_table.sql
-- (see section 2.5 user_llm_keys above for full content)
```

```sql
-- 010_create_github_synced_events.sql
CREATE TABLE IF NOT EXISTS github_synced_events (
  event_id    TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  synced_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_github_synced_events_user ON github_synced_events(user_id);
```

```sql
-- 011_add_github_token.sql
ALTER TABLE users ADD COLUMN github_access_token TEXT;
ALTER TABLE users ADD COLUMN github_token_scope TEXT;
```

```sql
-- 012_add_top_languages.sql
ALTER TABLE users ADD COLUMN top_languages TEXT NOT NULL DEFAULT '[]';
```

```sql
-- 013_create_webhook_deliveries.sql
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  delivery_id  TEXT PRIMARY KEY,
  received_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

```sql
-- 014_create_activity_feed.sql
-- (see section 2.12 above for full content)
```

```sql
-- 015_create_notifications.sql
-- (see section 2.13 above for full content)
```

```sql
-- 016_create_reactions.sql
-- (see section 2.14 above for full content)
```

```sql
-- 017_create_posts_fts.sql
-- (see section 2.15 above for full content)
```

```sql
-- 018_add_quoted_post_id.sql
ALTER TABLE posts ADD COLUMN quoted_post_id TEXT REFERENCES posts(id) ON DELETE SET NULL;
```

```sql
-- 019_add_quoted_post_index.sql
CREATE INDEX IF NOT EXISTS idx_posts_quoted_post_id ON posts(quoted_post_id);
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
| GitHub OAuth login | `users` | High | `idx_users_github_id` |
| Post repo attachment | `repo_attachments` | Medium | PK (`post_id`) |
| Repo lookup | `repo_attachments` | Low | `idx_repo_attachments_repo` |
| Create analysis | `analyses` | Medium | `idx_analyses_user_id` |
| List user analyses | `analyses` | Medium | `idx_analyses_user_id` |
| Filter analyses by status | `analyses` | Low | `idx_analyses_status` |
| Check GitHub event dedup | `github_synced_events` | Medium | PK (`event_id`) |
| List user's synced events | `github_synced_events` | Low | `idx_github_synced_events_user` |
| Webhook dedup check | `webhook_deliveries` | Medium | PK (`delivery_id`) |
| User's activity feed | `activity_feed` + `follows` | High | `idx_activity_feed_actor`, `idx_activity_feed_created` |
| Global activity feed | `activity_feed` | Medium | `idx_activity_feed_created` |
| User notifications | `notifications` + `users` | High | `idx_notifications_user` |
| Unread notification count | `notifications` | Very high | `idx_notifications_user` |
| Post reactions | `reactions` | High | `idx_reactions_post` |
| Full-text search | `posts_fts` | Medium | FTS5 index |
| Quote post lookup | `posts` | Medium | `idx_posts_quoted_post_id` |

---

## 8. Data Integrity Rules

- All foreign keys enforced: `PRAGMA foreign_keys = ON;` (set on every connection)
- `user_id` on posts must reference a valid user
- `parent_id` and `forked_from_id` must reference valid posts or be NULL
- `visibility` constrained to: `public`, `private`, `unlisted`
- `llm_model` is a free-form string (any LLM model identifier, e.g. `claude-sonnet-4-20250514`, `gpt-4o`, `gemini-2.5-pro`)
- `output_type` in analyses constrained to: `report`, `pptx`, `video`
- `status` in analyses constrained to: `pending`, `processing`, `completed`, `failed`
- `github_id` on users must be unique (GitHub OAuth identity)
- Self-follow prevented at application level
- Self-star prevented at application level
- Duplicate follow/star prevented by composite primary keys

### Cascade Delete Rules

| Action | Cascade Behavior |
|--------|-----------------|
| Delete user | Delete all user's posts, stars, follows, analyses (application-level cascade in transaction) |
| Delete post | Delete all stars on the post, delete repo_attachment, set `parent_id = NULL` on child replies (orphan replies remain visible) |
| Delete forked post | Original post unaffected; forked_from_id references become dangling (application handles gracefully) |

```sql
-- Application-level cascade for user deletion (in a transaction)
DELETE FROM analyses WHERE user_id = ?;
DELETE FROM stars WHERE user_id = ?;
DELETE FROM follows WHERE follower_id = ? OR following_id = ?;
DELETE FROM repo_attachments WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?);
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
