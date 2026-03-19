# ENV.md — Environment Variables Reference

> **Source of truth** for all environment variable configuration across packages.
> Never commit `.env` files. Only `.env.example` is tracked in git.

---

## 1. Complete Variable List

### Server (`@clitoris/server`)

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `PORT` | number | `3000` | No | Express server port |
| `NODE_ENV` | string | `development` | No | `development` or `production` |
| `DATABASE_URL` | string | `clitoris.db` | No | SQLite database file path |
| `SESSION_SECRET` | string | — | **Yes** | Express session secret (min 32 chars) |
| `LOG_LEVEL` | string | `info` | No | Pino log level: `debug`, `info`, `warn`, `error` |
| `CORS_ORIGIN` | string | `http://localhost:5173` | No | Allowed CORS origin |

### LLM (`@clitoris/llm`)

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `ANTHROPIC_API_KEY` | string | — | **Yes*** | Anthropic API key for Claude |
| `OPENAI_API_KEY` | string | — | No | OpenAI API key for GPT-4o |
| `OLLAMA_URL` | string | `http://localhost:11434` | No | Ollama server URL for Llama |

*Required for default LLM provider (claude-sonnet).

### Client (`@clitoris/client`)

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `VITE_API_URL` | string | `/api` | No | API base URL (Vite prefix required) |

> Note: Client env vars MUST start with `VITE_` to be exposed by Vite.

---

## 2. `.env.example`

```bash
# Server
PORT=3000
NODE_ENV=development
DATABASE_URL=clitoris.db
SESSION_SECRET=replace-with-random-string-at-least-32-chars
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:5173

# LLM API Keys
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
OPENAI_API_KEY=sk-your-openai-key-here
OLLAMA_URL=http://localhost:11434

# Client (prefix with VITE_)
VITE_API_URL=/api
```

---

## 3. Per-Package Usage

### Server reads env vars at startup

```typescript
// packages/server/src/config.ts
const CONFIG = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'clitoris.db',
  sessionSecret: process.env.SESSION_SECRET,
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
} as const;

// Validate required vars at startup
if (!CONFIG.sessionSecret) {
  throw new Error('SESSION_SECRET is required');
}
```

### LLM reads API keys on provider init

```typescript
// packages/llm/src/providers/anthropic.ts
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is required for Claude provider');
}
```

### Client uses Vite env

```typescript
// packages/client/src/utils/api.ts
const API_URL = import.meta.env.VITE_API_URL || '/api';
```

---

## 4. Local Development Setup

```bash
# 1. Copy example env file
cp .env.example .env

# 2. Generate a session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. Add your Anthropic API key (get from console.anthropic.com)
# Edit .env and set ANTHROPIC_API_KEY=sk-ant-...

# 4. Start development
pnpm dev
```

---

## 5. Security Rules

- **Never** commit `.env` files (must be in `.gitignore`)
- **Never** log API keys or session secrets
- **Never** expose server env vars to the client (only `VITE_` prefixed vars are safe)
- **Always** validate required env vars at startup (fail fast)
- **Always** use `.env.example` with placeholder values for documentation
- **Rotate** `SESSION_SECRET` if compromised
- **Rotate** API keys periodically

---

## See Also

- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) — How env vars flow through the system
- [TESTING.md](./TESTING.md) — Test environment setup
- [CONVENTIONS.md](./CONVENTIONS.md) — Never expose server env vars to client
