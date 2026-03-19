# ARCHITECTURE.md — System Architecture

> **Source of truth** for system architecture, data flows, authentication, and error handling.

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

> Full database documentation — schema, ERD, queries, migrations, indexes — is in [`docs/specs/DATABASE.md`](../specs/DATABASE.md).

**Tables**: `users`, `posts`, `follows`, `stars`
**Engine**: SQLite 3 via `better-sqlite3` (synchronous API)
**Migrations**: Sequential `.sql` files in `packages/server/src/db/migrations/`

---

## Query Patterns

### Feed Query (with aggregates)

```sql
SELECT
  p.*,
  u.username, u.domain, u.display_name, u.avatar_url,
  (SELECT COUNT(*) FROM stars WHERE post_id = p.id) AS star_count,
  (SELECT COUNT(*) FROM posts WHERE parent_id = p.id) AS reply_count,
  (SELECT COUNT(*) FROM posts WHERE forked_from_id = p.id) AS fork_count,
  EXISTS(SELECT 1 FROM stars WHERE post_id = p.id AND user_id = ?) AS is_starred
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.visibility = 'public'
  AND p.parent_id IS NULL
  AND p.created_at < ?
ORDER BY p.created_at DESC
LIMIT 20;
```

### Insert with Return

```typescript
const stmt = db.prepare(`
  INSERT INTO posts (id, user_id, message_raw, message_cli, lang, tags, mentions, visibility, llm_model)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const getStmt = db.prepare(`
  SELECT p.*, u.username, u.domain, u.display_name, u.avatar_url
  FROM posts p JOIN users u ON p.user_id = u.id
  WHERE p.id = ?
`);

const createPost = db.transaction((post: CreatePostInput): Post => {
  stmt.run(post.id, post.userId, post.messageRaw, post.messageCli, post.lang,
    JSON.stringify(post.tags), JSON.stringify(post.mentions), post.visibility, post.llmModel);
  return getStmt.get(post.id) as Post;
});
```

### Auth Query

```typescript
const findByUsername = db.prepare('SELECT * FROM users WHERE username = ?');
const insertUser = db.prepare(
  'INSERT INTO users (id, username, password_hash, display_name) VALUES (?, ?, ?, ?)'
);
```

---

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

All providers implement a unified `LlmProvider` interface. Users select a provider AND a model within that provider.

> Provider list and capabilities: see `docs/specs/PRD.md` section 4.4.
> Provider file structure: see `docs/architecture/architecture.json` (llm package).

```typescript
// @clitoris/llm — unified interface

interface LlmProvider {
  name: string;
  transform(input: TransformRequest): Promise<TransformResponse>;
}

interface TransformRequest {
  message: string;
  provider: string;   // 'anthropic' | 'openai' | 'ollama' | 'cursor' | 'cli' | 'api'
  model: string;      // e.g. 'claude-sonnet-4', 'gpt-4o', 'llama3:8b'
  lang: string;
}

// createProvider(provider) → returns the correct LlmProvider implementation
```

### CLI Provider Architecture

```
User input → CliProvider.transform()
               → spawn child process
               → pipe prompt to stdin
               → read stdout as CLI output
               → parse and return TransformResponse

Supported CLI tools:
  $ claude          # Claude Code (Anthropic CLI)
  $ codex           # OpenAI Codex CLI
  $ gemini          # Google Gemini CLI
  $ cursor          # Cursor CLI
  $ opencode        # OpenCode CLI
  $ ollama run      # Ollama local models
  $ any-tool        # Any tool that reads stdin/args and outputs text
```

### Generic API Provider

```
User input → GenericApiProvider.transform()
               → POST {baseUrl}/v1/chat/completions
               → OpenAI-compatible request format
               → Parse response → TransformResponse

Config:
  API_CUSTOM_BASE_URL=https://your-server.com
  API_CUSTOM_API_KEY=sk-...
  API_CUSTOM_MODEL=your-model-name
```

## Security Considerations

- **Authentication**: Session-based (express-session + SQLite storage)
- **Input validation**: zod schemas (once at API boundary)
- **SQL**: Prepared statements only (better-sqlite3 default)
- **XSS**: React auto-escaping + DOMPurify (for CLI rendering)
- **Rate limiting**: express-rate-limit (LLM transformation endpoint)

---

## Authentication Flow

```
1. POST /api/auth/register → Create user → Set session → Redirect to /
2. POST /api/auth/login    → Verify credentials → Set session → Redirect to /
3. GET  /api/auth/me       → Return session user (or 401)
4. POST /api/auth/logout   → Destroy session → Redirect to /login
5. Protected routes        → auth middleware checks session → 401 if missing
```

### Flow Diagram

```
┌──────────┐     POST /auth/register      ┌──────────────┐
│  Client  │ ──────────────────────────▶  │  Express API  │
│ (React)  │     { username, password }    │              │
└──────────┘                               └──────┬───────┘
     ▲                                            │
     │                                            ▼
     │                                     ┌──────────────┐
     │                                     │  Validate    │
     │                                     │  (zod)       │
     │                                     └──────┬───────┘
     │                                            │
     │                                            ▼
     │                                     ┌──────────────┐
     │                                     │  Hash pwd    │
     │                                     │  Insert user │
     │                                     │  (SQLite)    │
     │                                     └──────┬───────┘
     │                                            │
     │                                            ▼
     │                                     ┌──────────────┐
     │    Set-Cookie: session=xxx          │  Create      │
     │ ◀──────────────────────────────────│  Session     │
     │    200 OK { user }                  └──────────────┘
     │
     │         Subsequent requests
     │    ─────────────────────────▶
     │    Cookie: session=xxx
     │                                     ┌──────────────┐
     │                                     │ Auth         │
     │                                     │ Middleware   │
     │                                     │ req.session  │
     │    ◀────────────────────────────── │ → req.user   │
     │    200 OK (or 401 Unauthorized)     └──────────────┘
```

---

## Error Handling Flow

### Client-Side

```
React Error Boundary (page-level)
  └─▶ Catches render errors → displays fallback UI

API Call Error Flow:
  fetch() rejects or non-2xx response
    └─▶ Store action catch block
          └─▶ Zustand store: set error state
                └─▶ Component reads error → shows toast notification
```

### Server-Side

```
Route Handler
  └─▶ try/catch wraps business logic
        │
        ├─▶ Success: res.json({ data })
        │
        └─▶ Error: next(err)
              └─▶ Error Middleware
                    ├─▶ logger.error(err)
                    └─▶ res.status(code).json({
                          error: {
                            code: "NOT_FOUND",
                            message: "Post not found"
                          }
                        })

Unhandled Rejection / Uncaught Exception
  └─▶ Process crash → process manager restarts
```

---

## Request Lifecycle

Step-by-step flow from user action to database and back:

```
┌─────────┐   1. click/submit    ┌──────────────┐
│  User   │ ──────────────────▶ │ Event Handler │
│ Action  │                      │ (React)       │
└─────────┘                      └──────┬────────┘
                                        │
                              2. call store action
                                        │
                                        ▼
                                 ┌──────────────┐
                                 │ Zustand Store │
                                 │ action()      │
                                 └──────┬────────┘
                                        │
                              3. fetch(/api/...)
                                        │
                                        ▼
                                 ┌──────────────┐
                                 │ Express Route │
                                 │ handler       │
                                 └──────┬────────┘
                                        │
                              4. validate with zod
                                        │
                                        ▼
                                 ┌──────────────┐
                                 │ Zod Schema   │
                                 │ .parse()     │
                                 └──────┬────────┘
                                        │
                              5. DB query
                                        │
                                        ▼
                                 ┌──────────────┐
                                 │ SQLite       │
                                 │ (better-     │
                                 │  sqlite3)    │
                                 └──────┬────────┘
                                        │
                              6. JSON response
                                        │
                                        ▼
                                 ┌──────────────┐
                                 │ Store update │
                                 │ set({ ... }) │
                                 └──────┬────────┘
                                        │
                              7. React re-render
                                        │
                                        ▼
                                 ┌──────────────┐
                                 │ UI Updated   │
                                 │ (component)  │
                                 └──────────────┘
```

**Summary:**
1. User action → event handler → store action
2. Store → `fetch()` → Express route
3. Route → `validate(zod)` → DB query → response
4. Store update → React re-render

---

## Environment Configuration

> Full env var reference with descriptions, defaults, and security rules: see `docs/guides/ENV.md`

Quick summary:
- **Server**: PORT, DATABASE_URL, SESSION_SECRET, LOG_LEVEL, CORS_ORIGIN
- **LLM**: ANTHROPIC_API_KEY, OPENAI_API_KEY, OLLAMA_URL
- **Client**: VITE_API_URL (must use `VITE_` prefix for Vite exposure)

Never commit `.env` files. Use `.env.example` as a template.

---

## Development vs Production

| Aspect | Development | Production |
|--------|------------|------------|
| Server | `tsx watch` mode (auto-reload) | `tsx` (or compiled JS) |
| Client | Vite dev server with HMR (`localhost:5173`) | `vite build` → static files served by Express |
| DB | Local SQLite file (`clitoris.db`) | Local SQLite file (same) |
| Logging | `debug` level, pretty-printed output | `info` level, JSON format |
| CORS | `localhost:5173` allowed (Vite dev server) | Same-origin (no CORS needed) |
| Source maps | Enabled (inline) | Disabled (or external) |
| API proxy | Vite proxy → `localhost:3000/api` | Direct (same server) |

---

## Deployment Architecture

### Development

```
┌──────────────────┐     ┌──────────────────┐
│ Vite Dev Server  │     │ Express (tsx)     │
│ localhost:5173   │────▶│ localhost:3000    │
│ (HMR + proxy)   │     │ (auto-reload)     │
└──────────────────┘     └────────┬─────────┘
                                  │
                          ┌───────▼─────────┐
                          │ SQLite (WAL)     │
                          │ clitoris.db      │
                          └─────────────────┘
```

- Vite proxies `/api/*` requests to Express (port 3000)
- `tsx watch` auto-reloads server on file changes
- SQLite file lives in project root (gitignored)

### Production

```
┌──────────────────────────────────────┐
│           Express Server              │
│     (serves static + API)             │
│                                       │
│  ┌───────────────┐  ┌──────────────┐ │
│  │ Static files  │  │ /api routes  │ │
│  │ (Vite build)  │  │              │ │
│  └───────────────┘  └──────┬───────┘ │
│                            │         │
│                    ┌───────▼───────┐ │
│                    │ SQLite (WAL)  │ │
│                    └───────────────┘ │
└──────────────────────────────────────┘
```

- `pnpm build` compiles client to `packages/client/dist/`
- Express serves static files from `dist/` and handles `/api/*` routes
- Single process, single server — no reverse proxy needed for MVP
- SQLite file is the only persistent state

### Build Commands

| Command | Output | Purpose |
|---------|--------|---------|
| `pnpm build:client` | `packages/client/dist/` | Vite production build |
| `pnpm build:server` | — (tsx runs TypeScript directly) | Type-check only |
| `pnpm build` | Both | Full production build |
| `pnpm start` | — | Start production server (serves static + API) |

---

## CORS Configuration

### Development

```typescript
// packages/server/src/app.ts
import cors from 'cors';

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,  // Required for session cookies
}));
```

### Production

No CORS middleware needed — client and API are served from the same origin.

```typescript
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }));
}
```

---

## Session Storage

Sessions are stored in SQLite using `better-sqlite3-session-store`:

```typescript
import session from 'express-session';
import SqliteStore from 'better-sqlite3-session-store';

const SqliteSessionStore = SqliteStore(session);

app.use(session({
  store: new SqliteSessionStore({
    client: db,             // Same better-sqlite3 instance
    expired: {
      clear: true,          // Auto-clear expired sessions
      intervalMs: 900000,   // Check every 15 minutes
    },
  }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
  },
}));
```

| Setting | Value | Reason |
|---------|-------|--------|
| `httpOnly` | `true` | Prevents JavaScript access to session cookie |
| `secure` | `true` (prod) | Cookie only sent over HTTPS in production |
| `sameSite` | `lax` | CSRF protection while allowing normal navigation |
| `maxAge` | 7 days | Session expires after 7 days of inactivity |
| `resave` | `false` | Don't save session if unmodified |
| `saveUninitialized` | `false` | Don't create session until data is stored |

---

## See Also

- [architecture.json](./architecture.json) — Machine-readable system configuration
- [DATABASE.md](../specs/DATABASE.md) — Full database schema and queries
- [API.md](../specs/API.md) — REST API endpoint documentation
- [ENV.md](../guides/ENV.md) — Complete environment variable reference
- [schema-erd.md](./schema-erd.md) — Database entity relationship diagram
