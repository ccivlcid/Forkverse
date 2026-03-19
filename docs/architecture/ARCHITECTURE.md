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

> Full database documentation — schema, ERD, queries, migrations, indexes — is in [`docs/specs/DATABASE.md`](../specs/DATABASE.md).

**Tables**: `users`, `posts`, `follows`, `stars`
**Engine**: SQLite 3 via `better-sqlite3` (synchronous API)
**Migrations**: Sequential `.sql` files in `packages/server/src/db/migrations/`

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
