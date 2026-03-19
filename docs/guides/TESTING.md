# TESTING.md — Testing Patterns & Guidelines

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

## 10. Rules

- Every utility function MUST have tests
- Every API route MUST have at least happy-path + error tests
- Components: test rendering and user interactions, NOT implementation details
- Use `data-testid` attributes for E2E selectors (not CSS classes)
- Reset state between tests (Zustand stores, DB tables)
- No `setTimeout` or `sleep` in tests — use `waitFor` or Playwright auto-waiting
- Test file lives next to source file: `post-card.tsx` → `post-card.test.tsx`
- Mock external APIs (LLM providers) — never call real APIs in tests
