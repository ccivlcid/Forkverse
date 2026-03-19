# TROUBLESHOOTING — Common Issues & Solutions

> Quick reference for resolving common development issues.
> If your problem isn't listed here, check the relevant guide or open an issue.

---

## 1. Installation & Setup

### `pnpm install` fails

| Symptom | Cause | Solution |
|---------|-------|----------|
| `ERR_PNPM_NO_MATCHING_VERSION` | Wrong Node.js version | Use Node.js 20+ (`node -v` to check) |
| `ERR_PNPM_LOCKFILE_MISSING` | No lockfile | Run `pnpm install` (not `npm install`) |
| `EACCES: permission denied` | File permission issue | Do NOT use `sudo`. Fix ownership: `chown -R $(whoami) .` |
| `better-sqlite3` build fails | Missing build tools | Install: `sudo apt install build-essential python3` (Linux) or `xcode-select --install` (macOS) |
| `ERESOLVE` / peer dependency errors | Wrong package manager | Always use `pnpm`, never `npm` or `yarn` |

### `.env` not loaded

```bash
# Verify .env exists in project root
ls -la .env

# If missing, create from example
cp .env.example .env

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Checklist:**
- `.env` is in the project root (same level as `package.json`)
- `SESSION_SECRET` is set (min 32 chars)
- `ANTHROPIC_API_KEY` is set (starts with `sk-ant-`)
- No quotes around values: `KEY=value` not `KEY="value"`

---

## 2. Server Issues

### Server won't start

| Symptom | Cause | Solution |
|---------|-------|----------|
| `Error: SESSION_SECRET is required` | Missing env var | Set `SESSION_SECRET` in `.env` |
| `EADDRINUSE: port 3000` | Port already in use | Kill process: `lsof -ti:3000 \| xargs kill` or change `PORT` in `.env` |
| `Cannot find module '@clitoris/shared'` | Missing build | Run `pnpm build` first, or use `pnpm dev` (auto-builds) |
| `SQLITE_CANTOPEN` | Invalid DB path | Check `DATABASE_URL` in `.env`. Default `clitoris.db` creates in project root |

### Database issues

```bash
# Reset database (delete and let migrations re-create)
rm clitoris.db
pnpm dev:server
# Migrations auto-run on server start

# Check if DB file exists and has correct permissions
ls -la clitoris.db

# Manually inspect DB
sqlite3 clitoris.db ".tables"
sqlite3 clitoris.db ".schema users"
```

| Symptom | Cause | Solution |
|---------|-------|----------|
| `SQLITE_BUSY` | Concurrent writes | This is normal with WAL mode; retry logic handles it |
| `FOREIGN KEY constraint failed` | Invalid reference | Check that referenced user/post exists before insert |
| Migration errors | Schema mismatch | Delete `clitoris.db` and restart server |

---

## 3. Client Issues

### Vite dev server issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| Blank page on `localhost:5173` | JS error | Open browser DevTools (F12) → Console tab |
| `VITE_API_URL` not working | Wrong prefix | Client env vars MUST start with `VITE_` |
| CORS errors in console | Backend not running | Start server first: `pnpm dev:server` |
| `Failed to fetch` in network tab | API server down | Check server is running on `localhost:3000` |
| Hot reload not working | File watcher limit | Linux: `echo fs.inotify.max_user_watches=524288 \| sudo tee -a /etc/sysctl.conf && sudo sysctl -p` |

### Tailwind styles not applying

```bash
# Verify Tailwind is processing
# Check for typos in class names
# Ensure content paths are correct in tailwind.config.ts

# Force rebuild
pnpm dev:client
```

| Symptom | Cause | Solution |
|---------|-------|----------|
| Custom colors not working | Missing config | Check `tailwind.config.ts` extends theme colors (see `docs/setup/CONFIGS.md`) |
| Classes applied but invisible | Wrong text/bg color | Verify contrast — dark bg needs light text |
| `@apply` not working | PostCSS issue | Only use `@apply` in `.css` files, not inline |

---

## 4. LLM Integration Issues

### API key errors

| Symptom | Cause | Solution |
|---------|-------|----------|
| `401 Unauthorized` from Anthropic | Invalid/expired key | Verify key at [console.anthropic.com](https://console.anthropic.com) |
| `ANTHROPIC_API_KEY is required` | Missing env var | Add to `.env` file |
| `429 Too Many Requests` | Rate limited | Wait and retry; check usage limits |
| LLM returns garbage | Wrong model name | Use exact model IDs: `claude-sonnet-4-20250514` |

### Ollama (local LLM) issues

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running
ollama serve

# Pull a model
ollama pull llama3

# Test the model
ollama run llama3 "test"
```

| Symptom | Cause | Solution |
|---------|-------|----------|
| `ECONNREFUSED localhost:11434` | Ollama not running | Start: `ollama serve` |
| Model not found | Not pulled | Pull first: `ollama pull <model>` |
| Slow responses | Model too large | Use smaller model or increase RAM |

---

## 5. Testing Issues

### Vitest issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| `Cannot find module` in tests | Missing build | Run `pnpm build` before testing |
| `ReferenceError: document is not defined` | Wrong environment | Add `// @vitest-environment jsdom` at top of test file |
| Tests pass locally, fail in CI | State leaking | Reset state in `beforeEach`/`afterEach` |
| Coverage below threshold | Not enough tests | Check coverage report: `pnpm test -- --coverage` |

```bash
# Run single test file
pnpm test -- --run packages/client/src/components/feed/post-card.test.tsx

# Run tests matching pattern
pnpm test -- --run -t "PostCard"

# Debug test
pnpm test -- --run --reporter=verbose packages/server/src/routes/posts.test.ts
```

### Playwright E2E issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| `Timeout waiting for server` | Dev server not starting | Run `pnpm dev` manually first |
| `Element not found` | Wrong selector | Verify `data-testid` matches component |
| Tests flaky (pass/fail randomly) | Race conditions | Use Playwright auto-waiting, avoid `waitForTimeout` |
| Browser not installed | First run | Run `pnpm exec playwright install` |

```bash
# Install browsers
pnpm exec playwright install

# Run with visible browser
pnpm test:e2e -- --headed

# Debug mode (step through)
pnpm test:e2e -- --debug

# Run single test file
pnpm test:e2e -- tests/e2e/feed.spec.ts
```

---

## 6. Build Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| TypeScript errors | Type mismatch | Fix the type error (don't use `any`) |
| `Cannot find module '@clitoris/shared'` | Build order | Build shared first: `pnpm --filter @clitoris/shared build` |
| `Out of memory` during build | Large bundle | Increase memory: `NODE_OPTIONS=--max-old-space-size=4096 pnpm build` |
| ESLint errors blocking build | Lint violations | Fix lint: `pnpm lint --fix` |

```bash
# Build in correct order
pnpm --filter @clitoris/shared build
pnpm --filter @clitoris/llm build
pnpm --filter @clitoris/server build
pnpm --filter @clitoris/client build

# Or build all (respects workspace dependency order)
pnpm build
```

---

## 7. Git Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| Pre-commit hook fails | Lint/format errors | Run `pnpm lint --fix && pnpm format` |
| Merge conflicts in `pnpm-lock.yaml` | Concurrent installs | Delete lockfile, run `pnpm install`, commit |
| Large diff in lockfile | Dependency update | Expected — review and commit |
| `.env` accidentally committed | Missing gitignore | Add to `.gitignore`, remove from tracking: `git rm --cached .env` |

---

## 8. Performance Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| Slow feed loading | No pagination | Ensure cursor-based pagination is implemented |
| Memory leak in client | Store not cleaned | Reset Zustand store on unmount |
| Slow LLM responses | Network/model | Use faster model or cache responses |
| Slow DB queries | Missing indexes | Verify indexes exist (see `docs/specs/DATABASE.md` section 4) |

---

## Quick Diagnostic Commands

```bash
# Check Node.js version (need 20+)
node -v

# Check pnpm version
pnpm -v

# Check if ports are in use
lsof -i :3000    # server
lsof -i :5173    # client

# Check env vars are loaded
node -e "require('dotenv').config(); console.log(Object.keys(process.env).filter(k => k.startsWith('ANTHROPIC') || k === 'SESSION_SECRET'))"

# Check DB exists
ls -la clitoris.db

# Full clean restart
rm -rf node_modules packages/*/node_modules packages/*/dist clitoris.db
pnpm install
pnpm build
pnpm dev
```

---

## See Also

- [ENV.md](./ENV.md) — Environment variables reference
- [CONFIGS.md](../setup/CONFIGS.md) — Config files for bootstrapping
- [TESTING.md](./TESTING.md) — Test commands and configuration
- [CONVENTIONS.md](./CONVENTIONS.md) — Coding rules to avoid common issues
