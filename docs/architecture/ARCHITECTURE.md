# ARCHITECTURE.md — System Architecture

> **Source of truth** for system architecture, data flows, authentication, and error handling.
> Updated: 2026-03-21 — B-plan analysis pipeline and future Worker architecture added.

## Overall Structure

### Current (MVP)

```
┌─────────────────────────────────────────────────────────┐
│              User Browser / PWA / Capacitor App          │
│                  React 19 + Vite (SPA)                   │
│         Home (Analyze CTA) → Analyze → Results → Feed   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST + SSE (analysis progress)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   Express API Server                     │
│              (tsx — TypeScript direct execution)          │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐             │
│  │ Routes   │  │Middleware │  │ LLM Module│             │
│  │ /analyze │  │  auth     │  │ Anthropic  │             │
│  │ /posts   │  │  logger   │  │ OpenAI     │             │
│  │ /users   │  │  errors   │  │ Gemini     │             │
│  │ /llm     │  │           │  │ Ollama     │             │
│  └────┬─────┘  └──────────┘  └─────┬─────┘             │
│       │                             │                    │
│       ▼                             ▼                    │
│  ┌─────────┐              ┌─────────────┐               │
│  │ SQLite  │              │ LLM APIs    │               │
│  │ (local) │              │ (external)  │               │
│  └─────────┘              └─────────────┘               │
└─────────────────────────────────────────────────────────┘
```

### Future (Phase B5 — Production)

```
┌──────────────────────────────────────────────────────────────────┐
│                  Client (Web + PWA + Capacitor App)               │
└──────────────┬──────────────────────────────────┬────────────────┘
               │ REST API                          │ SSE (progress)
               ▼                                   │
┌──────────────────────────┐                       │
│       API Server         │                       │
│  Auth, CRUD, Feed, Users │                       │
│  Create analysis_job     │───▶ Job Queue (Redis) │
│  Serve results           │         │             │
└──────────────────────────┘         │             │
                                     ▼             │
                              ┌──────────────┐     │
                              │   Worker(s)  │─────┘
                              │  Clone, Scan │
                              │  LLM call    │
                              │  Generate    │
                              └──────┬───────┘
                                     │
                              ┌──────▼───────┐
                              │  Postgres    │
                              │  + Redis     │
                              │  + Object    │
                              │    Storage   │
                              └──────────────┘
```

## B-plan: Analysis Pipeline

> The analysis pipeline is the core of the B-plan (Repo Analysis Platform).

### Current: Analysis Flow (MVP — synchronous)

```
1. User enters repo URL + selects output type + model
2. Client → POST /api/analyze { repoOwner, repoName, outputType, llmModel, lang }
3. Server creates analysis record (status: pending)
4. Server starts analysis synchronously:
   a. Fetch repo metadata via GitHub API
   b. Clone repo (shallow, depth=1)
   c. Scan file structure, detect languages
   d. Call LLM with repo context → structured analysis
   e. Generate output (report markdown / PPTX / video HTML)
   f. Save result, update status → completed
5. Client polls GET /api/analyze/:id every 1.5s for status
6. On completion: display result with sections
7. User can download, share to feed, or copy link
```

### Future: Analysis Flow (Phase B5 — Worker-based)

```
┌─────────────┐     POST /api/analyze     ┌──────────────┐
│   Client    │ ──────────────────────────▶│  API Server  │
│   (React)   │                            │              │
└─────────────┘                            └──────┬───────┘
      ▲                                           │
      │ SSE /api/analyze/:id/progress             │ Create analysis_job
      │                                           │ Enqueue to Job Queue
      │                                           ▼
      │                                    ┌──────────────┐
      │                                    │  Job Queue   │
      │                                    │  (BullMQ/    │
      │                                    │   Redis)     │
      │                                    └──────┬───────┘
      │                                           │
      │                                           ▼
      │                                    ┌──────────────┐
      │         status updates via SSE     │   Worker     │
      │  ◀──────────────────────────────── │              │
      │                                    │  1. Clone    │
      │                                    │  2. Scan     │
      │                                    │  3. LLM call │
      │                                    │  4. Generate │
      │                                    │  5. Save     │
      │                                    └──────┬───────┘
      │                                           │
      │                                    ┌──────▼───────┐
      │                                    │ SQLite/PG    │
      │                                    │ + Object     │
      │                                    │   Storage    │
      │                                    └──────────────┘
```

**Why Worker separation matters:**
- Analysis takes 10-60s; should not block API for fast CRUD requests
- Worker can retry failed jobs independently
- Multiple workers can process jobs in parallel
- Status updates streamed via SSE without tying up API threads

### Analysis Job State Machine

```
pending → processing → completed
                    ↘ failed → (retry) → processing
                                       → permanently_failed (after 3 retries)
```

---

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

**Tables**: `users`, `posts`, `follows`, `stars`, `user_llm_keys`, `translations`, `repo_attachments`, `analyses`, `github_synced_events`, `webhook_deliveries`, `activity_feed`, `notifications`, `reactions`, `posts_fts` (FTS5)
**Engine**: SQLite 3 via `better-sqlite3` (synchronous API)
**Migrations**: Sequential `.sql` files in `packages/server/src/db/migrations/`

---

## Query Patterns

> Full SQL queries, indexes, and access patterns: see `docs/specs/DATABASE.md` (sections 5-7).

---

## Frontend State Management

```typescript
// Zustand store structure (9 stores)

authStore: {
  user, isAuthenticated, isLoading, error, connectionStatus
  → checkSession(), initiateGitHubOAuth(), logout(), updateProfile()
}

feedStore: {
  posts, cursor, hasMore, isLoading, activeFilter, focusedPostId
  → fetchFeed(), fetchNextPage(), setFilter(), starPost(), focusPost(), focusNext(), focusPrev()
}

postStore: {
  draft, cliPreview, selectedModel, attachedRepo, transformedTags/intent/emotion
  → setDraft(), selectModel(), attachRepo(), transformToCli(), submitPost()
}

postDetailStore: {
  post, replies, forkedFrom, draft, cliPreview, selectedModel
  → fetchPost(), addReply(), starPost(), transformReply(), submitReply()
}

uiStore: {
  lang → setLang(), t()   // i18n translation, persisted to localStorage
}

toastStore: {
  toasts[] → addToast(), removeToast(), toast(), toastError(), toastSuccess()
}

notificationStore: {
  notifications[], unreadCount, cursor, hasMore
  → fetchNotifications(), fetchNextPage(), fetchUnreadCount(), markRead(), markAllRead()
}

searchStore: {
  query, results, isLoading → setQuery(), search(), clear()   // 300ms debounce
}

activityStore: {
  events[], cursor, hasMore, feedType
  → fetchActivity(type), fetchNextPage(), syncGithub()
}

analyzeStore: {
  repoInput, outputType, selectedModel, lang, options
  status, progress[], elapsedMs, currentAnalysis, error
  recentAnalyses[], historyCursor, hasMoreHistory
  → startAnalysis(), cancelAnalysis(), fetchHistory(), downloadResult(), postResult()
}

homeStore: {
  repoInput, outputType, popularAnalyses, recentShared
  → fetchPopular(), fetchRecent(), goToAnalyze()
}
```

## LLM Integration Architecture

All providers implement a unified `LlmProvider` interface. Users select a provider AND a model within that provider.

> Provider list and capabilities: see `docs/specs/PRD.md` section 4.4.
> Provider file structure: see `docs/architecture/architecture.json` (llm package).

```typescript
// @forkverse/llm — unified interface

interface LlmProvider {
  name: string;
  transform(input: TransformRequest): Promise<TransformResponse>;
}

interface TransformRequest {
  message: string;
  provider: string;   // 'anthropic' | 'openai' | 'gemini' | 'ollama' | 'api'
  model: string;      // e.g. 'claude-sonnet-4', 'gpt-4o', 'gemini-2.5-pro', 'llama3:8b'
  lang: string;
}

// createProvider(provider) → returns the correct LlmProvider implementation
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

## Caching Strategy

| Layer | Cache | TTL | Invalidation |
|-------|-------|-----|-------------|
| **Browser** | `Cache-Control: no-cache` for API; `max-age=31536000` for static assets | — / 1 year | Vite content-hashed filenames |
| **Server (in-memory)** | LLM provider detection results | Until server restart | Manual restart |
| **Server (in-memory)** | Rate limit counters | 1 minute window | Auto-expire |
| **SQLite WAL** | Page cache (`cache_size = -20000`) | Until eviction | Automatic (LRU) |

No Redis or external cache for MVP. SQLite WAL mode + 20MB page cache is sufficient. If query latency exceeds 50ms (p95), consider denormalizing star_count/reply_count/fork_count into the `posts` table.

---

## Security Considerations

- **Authentication**: Session-based (express-session + SQLite storage, 7-day expiry)
- **Input validation**: zod schemas (once at API boundary)
- **SQL**: Prepared statements only (better-sqlite3 default)
- **XSS**: React auto-escaping + DOMPurify (for CLI rendering)
- **CSRF**: SameSite=Lax cookies + httpOnly flag
- **Rate limiting**: express-rate-limit per endpoint — see `docs/specs/API.md` section 6 for exact values
- **Auth**: GitHub OAuth 2.0 with PKCE, state parameter for CSRF protection
- **Credential storage**: API keys in env vars only, never in DB or client bundle
- **Content Security Policy**: `script-src 'self'` in production

---

## Authentication Flow

```
1. GET  /api/auth/github          → Redirect to GitHub OAuth consent
2. GET  /api/auth/github/callback → Exchange code, create/find user, set session
3. POST /api/auth/setup           → Complete profile (new users only)
4. GET  /api/auth/me              → Return session user (or 401)
5. POST /api/auth/logout          → Destroy session → Redirect to /login
6. Protected routes               → auth middleware checks session → 401 if missing
```

### Flow Diagram

```
┌──────────┐     GET /auth/github         ┌──────────────┐
│  Client  │ ──────────────────────────▶  │  Express API  │
│ (React)  │                              │              │
└──────────┘                              └──────┬───────┘
     ▲                                           │
     │                                           ▼
     │                                    ┌──────────────┐
     │                                    │  Redirect to │
     │                                    │  github.com  │
     │                                    │  /oauth      │
     │                                    └──────┬───────┘
     │                                           │
     │         User authorizes on GitHub          │
     │                                           ▼
     │                                    ┌──────────────┐
     │        GET /auth/github/callback   │  Exchange    │
     │  ◀──────────────────────────────   │  code for    │
     │         with code + state          │  access token│
     │                                    └──────┬───────┘
     │                                           │
     │                                           ▼
     │                                    ┌──────────────┐
     │                                    │  Fetch GitHub │
     │                                    │  user profile │
     │                                    └──────┬───────┘
     │                                           │
     │                                    ┌──────┴───────┐
     │                                    │ User exists?  │
     │                                    └──┬────────┬──┘
     │                                  Yes  │        │  No
     │                                       ▼        ▼
     │                                ┌─────────┐ ┌─────────┐
     │       Set session cookie       │ Find    │ │ Create  │
     │  ◀──────────────────────────── │ user    │ │ partial │
     │       Redirect to /            │         │ │ user    │
     │       (or /setup for new)      └─────────┘ └─────────┘
     │                                       │        │
     │                                       ▼        ▼
     │                                   Redirect  Redirect
     │                                   to /      to /setup
     ▼
┌──────────┐
│  Global  │
│  Feed    │
│  or      │
│  Setup   │
└──────────┘
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

> Full env var reference: see `docs/guides/ENV.md`.
> Ollama detection: see `docs/llm/LLM_DETECTION.md` section 3.

---

## Development vs Production

| Aspect | Development | Production |
|--------|------------|------------|
| Server | `tsx watch` mode (auto-reload) | `tsx` (or compiled JS) |
| Client | Vite dev server with HMR (`localhost:7878`, strict port) | `vite build` → static files served by Express |
| DB | Local SQLite file (`forkverse.db`) | Local SQLite file (same) |
| Logging | `debug` level, pretty-printed output | `info` level, JSON format |
| CORS | `localhost:7878` allowed (Vite dev server) | Same-origin (no CORS needed) |
| Source maps | Enabled (inline) | Disabled (or external) |
| API proxy | Vite proxy → `localhost:3771/api` | Direct (same server) |

---

## Deployment Architecture

### Development

```
┌──────────────────┐     ┌──────────────────┐
│ Vite Dev Server  │     │ Express (tsx)     │
│ localhost:7878   │────▶│ localhost:3771    │
│ (HMR + proxy)   │     │ (auto-reload)     │
└──────────────────┘     └────────┬─────────┘
                                  │
                          ┌───────▼─────────┐
                          │ SQLite (WAL)     │
                          │ forkverse.db      │
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
  origin: process.env.CORS_ORIGIN || 'http://localhost:7878',
  credentials: true,  // Required for session cookies
}));
```

### Production

No CORS middleware needed — client and API are served from the same origin.

```typescript
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:7878',
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
- [PRD.md](../specs/PRD.md) — B-plan product requirements
- [MOBILE.md](../specs/MOBILE.md) — Mobile/PWA/Capacitor strategy
- [Forkverse_최종통합본_Part2](../specs/Forkverse_최종통합본_Part2_아키텍처_UIUX_로드맵.md) — Detailed architecture roadmap
