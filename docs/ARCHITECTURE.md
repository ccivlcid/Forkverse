# ARCHITECTURE.md — System Architecture

## Overall Structure

```
┌─────────────────────────────────────────────────────────┐
│                     User Browser                         │
│                  React 19 + Vite (SPA)                   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   Express API Server                     │
│              (tsx — TypeScript direct execution)          │
│                                                         │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐              │
│  │ Routes  │  │Middleware │  │ LLM Module│              │
│  │ /posts  │  │  auth     │  │ Anthropic  │              │
│  │ /users  │  │  logger   │  │ OpenAI     │              │
│  │ /llm    │  │  errors   │  │ Ollama     │              │
│  └────┬────┘  └──────────┘  └─────┬─────┘              │
│       │                           │                     │
│       ▼                           ▼                     │
│  ┌─────────┐              ┌─────────────┐              │
│  │ SQLite  │              │ LLM APIs    │              │
│  │ (local) │              │ (external)  │              │
│  └─────────┘              └─────────────┘              │
└─────────────────────────────────────────────────────────┘
```

## Data Flows

### Post Creation Flow

```
1. User writes natural language input + selects LLM model
2. Presses [Cmd+Enter]
3. Client → POST /api/llm/transform { message, model, lang }
4. Server → Calls LLM API (natural language → CLI transformation)
5. Receives LLM response → Generates CLI format
6. Displays CLI preview on client
7. User confirms → POST /api/posts { messageRaw, messageCli, ... }
8. Saved to DB → Displayed in feed as dual-format
```

### Feed Loading Flow

```
1. Client → GET /api/posts/feed/global?cursor=X&limit=20
2. Server → SQLite query (cursor-based pagination)
3. JSON response → Zustand store update
4. React rendering (dual-panel cards)
```

## DB Schema

```sql
-- 001_create_users.sql
CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  username    TEXT UNIQUE NOT NULL,
  domain      TEXT,
  display_name TEXT,
  bio         TEXT,
  avatar_url  TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

-- 002_create_posts.sql
CREATE TABLE posts (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id),
  message_raw   TEXT NOT NULL,
  message_cli   TEXT NOT NULL,
  lang          TEXT DEFAULT 'en',
  tags          TEXT DEFAULT '[]',    -- JSON array
  mentions      TEXT DEFAULT '[]',    -- JSON array
  visibility    TEXT DEFAULT 'public',
  llm_model     TEXT NOT NULL,
  parent_id     TEXT REFERENCES posts(id),    -- reply
  forked_from_id TEXT REFERENCES posts(id),   -- fork
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_llm_model ON posts(llm_model);

-- 003_create_social.sql
CREATE TABLE follows (
  follower_id  TEXT NOT NULL REFERENCES users(id),
  following_id TEXT NOT NULL REFERENCES users(id),
  created_at   TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE stars (
  user_id    TEXT NOT NULL REFERENCES users(id),
  post_id    TEXT NOT NULL REFERENCES posts(id),
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, post_id)
);
```

## Frontend State Management

```typescript
// Zustand store structure

feedStore: {
  posts: Post[]
  cursor: string | null
  isLoading: boolean
  fetchGlobalFeed()
  fetchLocalFeed()
  fetchByLlm(model)
}

authStore: {
  user: User | null
  login(credentials)
  logout()
}

postStore: {
  draft: string
  cliPreview: string | null
  selectedModel: LlmModel
  transformToCli()
  submitPost()
}
```

## LLM Integration Architecture

```typescript
// @clitoris/llm package — provider pattern

interface LlmProvider {
  transform(input: TransformRequest): Promise<TransformResponse>;
}

// Each provider implements the same interface
// anthropic.ts → Anthropic SDK
// openai.ts    → OpenAI SDK
// ollama.ts    → Ollama REST API

// transformer.ts — prompt construction
// "Transform the following natural language message into a terminal.social CLI command"
// System prompt + examples included (few-shot)
```

## Security Considerations

- **Authentication**: Session-based (express-session + SQLite storage)
- **Input validation**: zod schemas (once at API boundary)
- **SQL**: Prepared statements only (better-sqlite3 default)
- **XSS**: React auto-escaping + DOMPurify (for CLI rendering)
- **Rate limiting**: express-rate-limit (LLM transformation endpoint)
