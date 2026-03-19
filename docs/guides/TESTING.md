# TESTING.md — Testing Patterns & Guidelines

> **Source of truth** for all testing patterns, configurations, and examples.
> Vitest for unit tests. Playwright for E2E. No exceptions.

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

## 3. Component Test Patterns

### Basic Component Test

```typescript
// packages/client/src/components/feed/post-card.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { PostCard } from './post-card';
import type { Post } from '@clitoris/shared';

const mockPost: Post = {
  id: '01912345-aaaa-7bbb-cccc-dddddddddddd',
  userId: '01912345-6789-7abc-def0-123456789abc',
  messageRaw: 'CLI is the new lingua franca.',
  messageCli: 'post --user=0xmitsuki.sh --lang=en --message="CLI is the new lingua franca."',
  lang: 'en',
  tags: ['cli-first'],
  mentions: [],
  visibility: 'public',
  llmModel: 'claude-sonnet',
  parentId: null,
  forkedFromId: null,
  createdAt: '2026-03-19T12:30:00Z',
  user: { username: '0xmitsuki', domain: 'mitsuki.sh', displayName: 'Mitsuki', avatarUrl: null },
  starCount: 31,
  replyCount: 9,
  forkCount: 3,
  isStarred: false,
};

describe('PostCard', () => {
  it('renders natural language and CLI panels', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('CLI is the new lingua franca.')).toBeInTheDocument();
    expect(screen.getByText(/post --user=0xmitsuki.sh/)).toBeInTheDocument();
  });

  it('displays username and domain', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('@0xmitsuki')).toBeInTheDocument();
    expect(screen.getByText('mitsuki.sh')).toBeInTheDocument();
  });

  it('shows star count', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('31')).toBeInTheDocument();
  });

  it('calls onStar when star button is clicked', async () => {
    const handleStar = vi.fn();
    render(<PostCard post={mockPost} onStar={handleStar} />);

    await userEvent.click(screen.getByRole('button', { name: /star/i }));
    expect(handleStar).toHaveBeenCalledWith(mockPost.id);
  });
});
```

### Testing Conditional Rendering

```typescript
it('shows forked-from link when post is a fork', () => {
  const forkedPost = { ...mockPost, forkedFromId: 'original-post-id' };
  render(<PostCard post={forkedPost} />);

  expect(screen.getByText(/forked from/i)).toBeInTheDocument();
});

it('renders nothing when post is null', () => {
  const { container } = render(<PostCard post={null} />);
  expect(container.firstChild).toBeNull();
});
```

---

## 4. Zustand Store Test Patterns

```typescript
// packages/client/src/stores/feed-store.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFeedStore } from './feed-store';

// Reset store between tests
beforeEach(() => {
  useFeedStore.setState({
    posts: [],
    cursor: null,
    isLoading: false,
  });
});

describe('feedStore', () => {
  it('starts with empty state', () => {
    const state = useFeedStore.getState();

    expect(state.posts).toEqual([]);
    expect(state.cursor).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('fetches global feed and updates posts', async () => {
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: [mockPost],
        meta: { cursor: '2026-03-19T12:29:00Z', hasMore: true },
      }),
    });

    await useFeedStore.getState().fetchGlobalFeed();

    const state = useFeedStore.getState();
    expect(state.posts).toHaveLength(1);
    expect(state.cursor).toBe('2026-03-19T12:29:00Z');
    expect(state.isLoading).toBe(false);
  });

  it('appends posts on subsequent fetches', async () => {
    useFeedStore.setState({ posts: [mockPost] });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: [anotherPost],
        meta: { cursor: '2026-03-19T12:00:00Z', hasMore: false },
      }),
    });

    await useFeedStore.getState().fetchGlobalFeed();
    expect(useFeedStore.getState().posts).toHaveLength(2);
  });
});
```

---

## 5. API Route Test Patterns

```typescript
// packages/server/src/routes/posts.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { db } from '../db';

beforeAll(() => {
  // Run migrations, seed test data
  db.exec('DELETE FROM posts');
  db.exec('DELETE FROM users');
  db.prepare('INSERT INTO users (id, username) VALUES (?, ?)').run('user-1', 'testuser');
});

afterAll(() => {
  db.exec('DELETE FROM posts');
  db.exec('DELETE FROM users');
});

describe('GET /api/posts/feed/global', () => {
  it('returns empty feed', async () => {
    const res = await request(app).get('/api/posts/feed/global');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.hasMore).toBe(false);
  });

  it('returns posts with pagination', async () => {
    // Insert test posts
    for (let i = 0; i < 25; i++) {
      db.prepare(
        'INSERT INTO posts (id, user_id, message_raw, message_cli, llm_model) VALUES (?, ?, ?, ?, ?)'
      ).run(`post-${i}`, 'user-1', `Post ${i}`, `post --message="Post ${i}"`, 'claude-sonnet');
    }

    const res = await request(app).get('/api/posts/feed/global?limit=20');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(20);
    expect(res.body.meta.hasMore).toBe(true);
    expect(res.body.meta.cursor).toBeDefined();
  });

  it('respects cursor pagination', async () => {
    const first = await request(app).get('/api/posts/feed/global?limit=20');
    const cursor = first.body.meta.cursor;

    const second = await request(app).get(`/api/posts/feed/global?cursor=${cursor}&limit=20`);

    expect(second.status).toBe(200);
    expect(second.body.data).toHaveLength(5);
    expect(second.body.meta.hasMore).toBe(false);
  });
});

describe('POST /api/posts', () => {
  it('returns 401 without session', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ messageRaw: 'test', messageCli: 'test', lang: 'en', tags: [], mentions: [], visibility: 'public', llmModel: 'claude-sonnet' });

    expect(res.status).toBe(401);
  });

  it('returns 400 with invalid input', async () => {
    const agent = request.agent(app);
    // Login first...

    const res = await agent
      .post('/api/posts')
      .send({ messageRaw: '', lang: 'invalid' }); // missing fields

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
```

---

## 6. Playwright E2E Patterns

```typescript
// tests/e2e/feed.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Global Feed', () => {
  test('loads and displays posts', async ({ page }) => {
    await page.goto('/');

    // Wait for feed to load
    await expect(page.locator('[data-testid="post-card"]').first()).toBeVisible();

    // Check dual-panel exists
    await expect(page.locator('[data-testid="natural-panel"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="cli-panel"]').first()).toBeVisible();
  });

  test('navigates posts with j/k keys', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="post-card"]');

    await page.keyboard.press('j');
    const firstPost = page.locator('[data-testid="post-card"]').first();
    await expect(firstPost).toHaveClass(/focused|ring/);
  });

  test('opens composer with / key', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('/');
    await expect(page.locator('[data-testid="composer-input"]')).toBeFocused();
  });

  test('infinite scroll loads more posts', async ({ page }) => {
    await page.goto('/');
    const initialCount = await page.locator('[data-testid="post-card"]').count();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const newCount = await page.locator('[data-testid="post-card"]').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });
});

test.describe('Authentication', () => {
  test('login flow', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-submit"]');

    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="composer-bar"]')).toBeVisible();
  });
});
```

### Authenticated E2E Test Pattern

```typescript
// tests/e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('register → login → create post → logout', async ({ page }) => {
    // Register
    await page.goto('/register');
    await page.fill('[data-testid="username-input"]', 'e2euser');
    await page.fill('[data-testid="password-input"]', 'testpass123');
    await page.fill('[data-testid="displayname-input"]', 'E2E User');
    await page.click('[data-testid="register-submit"]');
    await expect(page).toHaveURL('/');

    // Create post
    await page.fill('[data-testid="composer-input"]', 'Hello from E2E test');
    await page.click('[data-testid="composer-submit"]');
    await expect(page.locator('[data-testid="post-card"]').first()).toContainText('Hello from E2E test');

    // Star the post
    await page.click('[data-testid="star-button"]');
    await expect(page.locator('[data-testid="star-button"]')).toHaveClass(/active/);

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL('/login');
  });

  test('redirects to login for protected actions', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="composer-input"]');
    await expect(page).toHaveURL(/\/login/);
  });
});
```

### E2E Helper: Login Utility

```typescript
// tests/e2e/helpers.ts
import { Page } from '@playwright/test';

async function loginAs(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.fill('[data-testid="username-input"]', username);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-submit"]');
  await page.waitForURL('/');
}
```

### E2E Test for Post Interactions

```typescript
// tests/e2e/post-interactions.spec.ts
test.describe('Post Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'testuser', 'testpass123');
  });

  test('star and unstar a post', async ({ page }) => {
    await page.goto('/');
    const starButton = page.locator('[data-testid="star-button"]').first();
    const starCount = page.locator('[data-testid="star-count"]').first();

    const initialCount = await starCount.textContent();
    await starButton.click();
    await expect(starCount).toHaveText(String(Number(initialCount) + 1));

    await starButton.click();
    await expect(starCount).toHaveText(initialCount!);
  });

  test('fork a post', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="fork-button"]');
    await expect(page.locator('.toast-success')).toContainText('Forked');
  });
});
```

---

## E2E Test Data Seeding

```typescript
// tests/e2e/setup.ts
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

function seedTestData(): void {
  const db = new Database('clitoris-test.db');
  // Run migrations
  // Insert test user
  db.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)').run(randomUUID(), 'testuser', '$2b$10$hashedpassword');
  // Insert test posts
  for (let i = 0; i < 5; i++) {
    db.prepare('INSERT INTO posts (id, user_id, message_raw, message_cli, llm_model) VALUES (?, ?, ?, ?, ?)').run(randomUUID(), userId, `Test post ${i}`, `post --message="Test ${i}"`, 'claude-sonnet');
  }
  db.close();
}
```

---

## 6b. LLM Parser Unit Tests

The parser is a critical path with multiple edge cases. Every parsing scenario must have explicit tests.

```typescript
// packages/llm/src/parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseCliCommand, ParseError } from './parser';

describe('parseCliCommand', () => {
  // Case 1: Clean command (ideal LLM output)
  it('returns command as-is when output is just the command', () => {
    const input = 'terminal.social post --user test --lang en --message "Hello" --tags greeting';
    expect(parseCliCommand(input)).toBe(input);
  });

  // Case 2: Command with trailing whitespace/newlines
  it('trims whitespace from clean command', () => {
    const input = '  terminal.social post --user test --message "Hi"  \n';
    expect(parseCliCommand(input)).toBe('terminal.social post --user test --message "Hi"');
  });

  // Case 3: Command wrapped in markdown code fences
  it('extracts command from markdown code fences', () => {
    const input = '```\nterminal.social post --user test --message "Hello"\n```';
    expect(parseCliCommand(input)).toBe('terminal.social post --user test --message "Hello"');
  });

  it('extracts command from code fences with language tag', () => {
    const input = '```bash\nterminal.social post --user test --message "Hello"\n```';
    expect(parseCliCommand(input)).toBe('terminal.social post --user test --message "Hello"');
  });

  // Case 4: Command buried in explanation text
  it('finds command among explanation text', () => {
    const input = 'Here is the command:\nterminal.social post --user test --message "Hello"\nHope this helps!';
    expect(parseCliCommand(input)).toBe('terminal.social post --user test --message "Hello"');
  });

  // Case 5: No valid command — throws ParseError
  it('throws ParseError when no valid command found', () => {
    expect(() => parseCliCommand('I cannot generate that command')).toThrow(ParseError);
  });

  it('throws ParseError for empty string', () => {
    expect(() => parseCliCommand('')).toThrow(ParseError);
  });

  // Case 6: Multi-line output — only first command line extracted
  it('extracts only the first line of a multi-line command', () => {
    const input = 'terminal.social post --user test --message "Line 1"\nterminal.social post --user test --message "Line 2"';
    expect(parseCliCommand(input)).toBe('terminal.social post --user test --message "Line 1"');
  });

  // Case 7: Full flags
  it('parses command with all flags', () => {
    const input = 'terminal.social post --user jiyeon_dev --lang ko --message "안녕하세요" --tags korean,greeting --visibility public --mention @alice';
    expect(parseCliCommand(input)).toBe(input);
  });

  // Case 8: ParseError contains raw output for debugging
  it('ParseError contains the raw output', () => {
    try {
      parseCliCommand('garbage output');
    } catch (e) {
      expect(e).toBeInstanceOf(ParseError);
      expect((e as ParseError).rawOutput).toBe('garbage output');
    }
  });
});
```

---

## 7. Mock Patterns

### Mocking Database

```typescript
// Use in-memory SQLite for tests
import Database from 'better-sqlite3';

function createTestDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  // Run migrations against in-memory DB
  runMigrations(db);
  return db;
}
```

### Mocking LLM Providers

```typescript
import type { LlmProvider, TransformRequest, TransformResponse } from '@clitoris/llm';

const mockProvider: LlmProvider = {
  async transform(input: TransformRequest): Promise<TransformResponse> {
    return {
      messageCli: `post --user=test --message="${input.message}" --lang=${input.lang}`,
      model: input.model,
      tokensUsed: 42,
    };
  },
};
```

### Mocking fetch (Client Tests)

```typescript
import { vi } from 'vitest';

function mockFetch(data: unknown, status = 200): void {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  });
}

// Usage
mockFetch({ data: [mockPost], meta: { cursor: null, hasMore: false } });
```

---

## 8. Test Data Factories

```typescript
// tests/factories.ts
import type { Post, User } from '@clitoris/shared';

let counter = 0;

function createUser(overrides?: Partial<User>): User {
  counter++;
  return {
    id: `user-${counter}`,
    username: `testuser${counter}`,
    domain: null,
    displayName: `Test User ${counter}`,
    bio: null,
    avatarUrl: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function createPost(overrides?: Partial<Post>): Post {
  counter++;
  return {
    id: `post-${counter}`,
    userId: `user-1`,
    messageRaw: `Test post ${counter}`,
    messageCli: `post --message="Test post ${counter}"`,
    lang: 'en',
    tags: [],
    mentions: [],
    visibility: 'public',
    llmModel: 'claude-sonnet',
    parentId: null,
    forkedFromId: null,
    createdAt: new Date().toISOString(),
    user: { username: 'testuser', domain: null, displayName: 'Test', avatarUrl: null },
    starCount: 0,
    replyCount: 0,
    forkCount: 0,
    isStarred: false,
    ...overrides,
  };
}
```

---

## 9. Test Commands

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

## 10. Coverage Thresholds

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
| `@clitoris/shared` | 95% | Statements |
| `@clitoris/server` (routes) | 85% | Statements |
| `@clitoris/llm` | 80% | Statements |
| `@clitoris/client` (stores) | 85% | Statements |
| `@clitoris/client` (components) | 70% | Statements |

---

## 11. Test Naming Convention

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

## 12. Test Environment Setup

### Database (Server Tests)

```typescript
// tests/setup/db.ts — shared test database setup
import Database from 'better-sqlite3';

let testDb: Database.Database;

export function getTestDb(): Database.Database {
  if (!testDb) {
    testDb = new Database(':memory:');
    testDb.pragma('journal_mode = WAL');
    testDb.pragma('foreign_keys = ON');
    runMigrations(testDb);
  }
  return testDb;
}

export function resetTestDb(): void {
  const db = getTestDb();
  db.exec('DELETE FROM stars');
  db.exec('DELETE FROM follows');
  db.exec('DELETE FROM posts');
  db.exec('DELETE FROM users');
}
```

### React Components (Client Tests)

```typescript
// tests/setup/render.tsx — custom render with providers
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ReactElement } from 'react';

function AllProviders({ children }: { children: React.ReactNode }): JSX.Element {
  return <BrowserRouter>{children}</BrowserRouter>;
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>): ReturnType<typeof render> {
  return render(ui, { wrapper: AllProviders, ...options });
}

export { customRender as render };
```

### Vitest Global Setup

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom/vitest';

// Reset all mocks between tests
afterEach(() => {
  vi.restoreAllMocks();
});
```

---

## 13. CI Integration

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

## 14. Rules

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

- [CONVENTIONS.md](./CONVENTIONS.md) — Coding rules (test file naming, structure)
- [PROMPTS.md](./PROMPTS.md) — Test writing prompt templates (section 10)
- [ENV.md](./ENV.md) — Environment variable mocking patterns
- [API.md](../specs/API.md) — API endpoint specs for integration tests
