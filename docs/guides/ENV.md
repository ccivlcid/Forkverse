# ENV.md — Environment Variables Reference

> **Source of truth** for all environment variable configuration across packages.
> Never commit `.env` files. Only `.env.example` is tracked in git.

---

## 1. Complete Variable List

### Server (`@forkverse/server`)

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `PORT` | number | `3771` | No | Express server port |
| `NODE_ENV` | string | `development` | No | `development` or `production` |
| `DATABASE_URL` | string | `forkverse.db` | No | SQLite database file path |
| `SESSION_SECRET` | string | — | **Yes** | Express session secret (min 32 chars) |
| `LOG_LEVEL` | string | `info` | No | Pino log level: `debug`, `info`, `warn`, `error` |
| `CORS_ORIGIN` | string | `http://localhost:7878` | No | Allowed CORS origin |
| `GITHUB_WEBHOOK_SECRET` | string | — | No | HMAC-SHA256 secret for verifying GitHub webhook payloads (`X-Hub-Signature-256`). Required when using the `POST /api/webhook/github` endpoint. Must match the secret configured in GitHub repository webhook settings. |
| `GITHUB_TOKEN` | string | — | No | Server-side fallback GitHub personal access token. Used by `GET /api/github/contributions/:username` when the requesting user is unauthenticated. Without this, unauthenticated contribution graph requests will fail. |
| `ENCRYPTION_KEY` | string (64 hex chars) | — | **Prod** | AES-256-GCM key for encrypting user API keys at rest. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Without this, keys are stored as plaintext (acceptable in dev). |
| `ANDROID_CERT_FINGERPRINT` | string | — | No | SHA256 fingerprint of Android signing keystore. Used in `/.well-known/assetlinks.json` for Android App Links deep link verification. |
| `APPLE_TEAM_ID` | string | — | No | Apple Developer Team ID. Used in `/.well-known/apple-app-site-association` for iOS Universal Links deep link verification. |

> **LLM API keys are not environment variables.** Each user enters their own API keys in Settings (`/settings`). Keys are stored per-user in the `user_llm_keys` database table. See [LLM_DETECTION.md](../llm/LLM_DETECTION.md) for the key management flow.
>
> Locally running runtimes (Ollama on `localhost:11434`) are auto-detected and require no key.

### Client (`@forkverse/client`)

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `VITE_API_URL` | string | `/api` | No | API base URL (Vite prefix required) |

> Note: Client env vars MUST start with `VITE_` to be exposed by Vite.

---

## 2. `.env.example`

```bash
# Server
PORT=3771
NODE_ENV=development
DATABASE_URL=forkverse.db
SESSION_SECRET=replace-with-random-string-at-least-32-chars
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:7878

# GitHub OAuth (required for login)
GITHUB_CLIENT_ID=your-github-app-client-id
GITHUB_CLIENT_SECRET=your-github-app-client-secret
GITHUB_REDIRECT_URI=http://localhost:3771/api/auth/github/callback
CLIENT_URL=http://localhost:7878

# LLM API keys are NOT set here.
# Users enter their own keys in Settings (/settings → LLM Keys).
# Keys are stored in the user_llm_keys database table.

# Optional: GitHub webhook signature verification secret
# Required when using POST /api/webhook/github
# Must match the "Secret" field in GitHub repository → Settings → Webhooks
# GITHUB_WEBHOOK_SECRET=your-webhook-secret

# Optional: GitHub fallback token for unauthenticated contribution graph requests
# Required for GET /api/github/contributions/:username without user auth
# GITHUB_TOKEN=ghp_...

# Encryption key for API keys at rest (AES-256-GCM)
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# REQUIRED in production. Without it, API keys stored as plaintext.
ENCRYPTION_KEY=generate-64-char-hex-string-for-aes256-key-encryption

# Native app deep links (set after signing keys are generated)
# ANDROID_CERT_FINGERPRINT=AA:BB:CC:...
# APPLE_TEAM_ID=XXXXXXXXXX

# Client (prefix with VITE_ — exposed to browser)
VITE_API_URL=/api
```

---

## 3. Per-Package Usage

### Server reads env vars at startup

```typescript
// packages/server/src/config.ts
const CONFIG = {
  port: Number(process.env.PORT) || 3771,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'forkverse.db',
  sessionSecret: process.env.SESSION_SECRET,
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:7878',
} as const;

// Validate required vars at startup
if (!CONFIG.sessionSecret) {
  throw new Error('SESSION_SECRET is required');
}
```

### LLM keys are user-managed, not env vars

API keys are stored in the `user_llm_keys` table and looked up per-request using the authenticated user's ID. The server fetches the key before calling `createProvider()`:

```typescript
// packages/server/src/routes/llm.ts
const row = db
  .prepare('SELECT api_key FROM user_llm_keys WHERE user_id = ? AND provider = ?')
  .get(userId, providerName);

if (!row) {
  return res.status(400).json({ error: { code: 'KEY_NOT_CONFIGURED', ... } });
}

const provider = createProvider(providerName, { apiKey: row.api_key });
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

# 3. Start development (no LLM key needed in .env — users add keys in Settings)
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
- **Set** `ENCRYPTION_KEY` in production — without it, user LLM API keys are stored as plaintext in SQLite
- **Backup** `ENCRYPTION_KEY` securely — losing it means stored API keys become unreadable

---

## See Also

- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) — How env vars flow through the system
- [TESTING.md](../testing/TESTING.md) — Test environment setup
- [CONVENTIONS.md](./CONVENTIONS.md) — Never expose server env vars to client
