# TESTING SETUP — Mocks, Factories & Environment

> Part of the [Testing Guide](./TESTING.md). Covers mock patterns, test data factories, and environment setup.

---

## 1. Mock Patterns

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

## 2. Test Data Factories

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

## 3. Test Environment Setup

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

---

## See Also

- [TESTING.md](./TESTING.md) — Overview, configuration, commands, rules
- [TESTING_PATTERNS.md](./TESTING_PATTERNS.md) — Complete test code examples
