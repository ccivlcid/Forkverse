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
