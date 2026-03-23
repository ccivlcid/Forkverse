# TESTING.md — Testing Patterns & Guidelines

> **Source of truth** for all testing patterns, configurations, and examples.
> Vitest for unit tests. Playwright for E2E. No exceptions.

This guide is split into focused sub-documents for easier navigation:

| Document | Contents |
|----------|----------|
| **TESTING.md** (this file) | Overview, configuration, commands, coverage, naming, CI, rules |
| [TESTING_PATTERNS.md](./TESTING_PATTERNS.md) | Component, store, API route, E2E, and LLM parser test patterns |
| [TESTING_SETUP.md](./TESTING_SETUP.md) | Mock patterns, test data factories, environment setup |

---

## 1. Overview

| Layer | Tool | Location | Naming |
|-------|------|----------|--------|
| Unit (components) | Vitest + React Testing Library | Co-located `*.test.tsx` | `post-card.test.tsx` |
| Unit (stores) | Vitest | Co-located `*.test.ts` | `feed-store.test.ts` |
| Unit (server) | Vitest + Supertest | Co-located `*.test.ts` | `posts.test.ts` |
| Unit (shared/llm) | Vitest | Co-located `*.test.ts` | `transformer.test.ts` |
| E2E | Playwright | `tests/e2e/` | `feed.spec.ts` |

---

## 2. Vitest Configuration

```typescript
// vitest.config.ts (root)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**'],
    },
  },
});
```

### Playwright Configuration

```typescript
// playwright.config.ts (root)
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],
});
```

---

## 3. Test Commands

```bash
pnpm test                    # Run all unit tests
pnpm test -- --watch         # Watch mode
pnpm test -- --coverage      # With coverage report
pnpm test -- --run posts     # Run tests matching "posts"
pnpm test:e2e                # Run Playwright E2E tests
pnpm test:e2e -- --headed    # E2E with visible browser
pnpm test:e2e -- --debug     # E2E debug mode
```

---

## 4. Coverage Thresholds

```typescript
// vitest.config.ts — coverage configuration
export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.test.{ts,tsx}', '**/types/**'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

| Layer | Target | Metric |
|-------|--------|--------|
| `@forkverse/shared` | 95% | Statements |
| `@forkverse/server` (routes) | 85% | Statements |
| `@forkverse/llm` | 80% | Statements |
| `@forkverse/client` (stores) | 85% | Statements |
| `@forkverse/client` (components) | 70% | Statements |

---

## 5. Test Naming Convention

Follow a consistent naming pattern across all test files:

```typescript
// Pattern: describe('{UnitName}') → it('{action} when {condition}')
describe('PostCard', () => {
  it('renders dual-panel layout when post is provided', () => { ... });
  it('shows forked-from link when forkedFromId is set', () => { ... });
  it('calls onStar when star button is clicked', () => { ... });
  it('renders nothing when post is null', () => { ... });
});

// API route tests: describe('{METHOD} {path}') → it('returns {status} {when}')
describe('POST /api/posts', () => {
  it('returns 201 with valid post data', () => { ... });
  it('returns 401 without session', () => { ... });
  it('returns 400 with invalid input', () => { ... });
});

// Store tests: describe('{storeName}') → it('{action} {expected behavior}')
describe('feedStore', () => {
  it('fetchGlobalFeed populates posts and cursor', () => { ... });
  it('fetchNextPage appends posts to existing list', () => { ... });
  it('toggleStar reverts on API error', () => { ... });
});
```

---

## 6. CI Integration

```bash
# CI test commands (used in GitHub Actions)
pnpm test -- --run --reporter=junit --outputFile=test-results.xml
pnpm test -- --run --coverage
pnpm test:e2e -- --reporter=junit --output=e2e-results.xml
```

### CI Pipeline Test Steps

```yaml
# .github/workflows/test.yml (reference)
test:
  steps:
    - pnpm install --frozen-lockfile
    - pnpm lint
    - pnpm test -- --run --coverage
    - pnpm build
    - pnpm test:e2e
```

| Step | Purpose | Blocks Merge |
|------|---------|--------------|
| `pnpm lint` | ESLint check | Yes |
| `pnpm test -- --run` | Unit tests | Yes |
| `pnpm test -- --coverage` | Coverage report | Yes (if below threshold) |
| `pnpm build` | Type-check + build | Yes |
| `pnpm test:e2e` | E2E smoke tests | Yes |

---

## 7. Rules

- Every utility function MUST have tests
- Every API route MUST have at least happy-path + error tests
- Components: test rendering and user interactions, NOT implementation details
- Use `data-testid` attributes for E2E selectors (not CSS classes)
- Reset state between tests (Zustand stores, DB tables)
- No `setTimeout` or `sleep` in tests — use `waitFor` or Playwright auto-waiting
- Test file lives next to source file: `post-card.tsx` → `post-card.test.tsx`
- Mock external APIs (LLM providers) — never call real APIs in tests
- Never test implementation details (internal state, private methods)
- Prefer `userEvent` over `fireEvent` for realistic user interaction simulation
- E2E tests must be independent — no test should depend on another test's state
- Use `data-testid` naming convention: `{component}-{element}` (e.g., `post-card-star-button`)

---

## See Also

- [TESTING_PATTERNS.md](./TESTING_PATTERNS.md) — Complete test code examples
- [TESTING_SETUP.md](./TESTING_SETUP.md) — Mocks, factories, environment setup
- [CONVENTIONS.md](./CONVENTIONS.md) — Coding rules (test file naming, structure)
- [PROMPTS.md](./PROMPTS.md) — Test writing prompt templates (section 10)
- [ENV.md](./ENV.md) — Environment variable mocking patterns
- [API.md](../specs/API.md) — API endpoint specs for integration tests
