# TESTING PATTERNS — Test Code Examples

> Part of the [Testing Guide](./TESTING.md). Complete test patterns for components, stores, API routes, E2E, and LLM parser.

---

## 1. Component Test Patterns

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

## 2. Zustand Store Test Patterns

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

## 3. API Route Test Patterns

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

## 4. Playwright E2E Patterns

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

## 5. E2E Test Data Seeding

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

## 6. LLM Parser Unit Tests

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

## See Also

- [TESTING.md](./TESTING.md) — Overview, configuration, commands, rules
- [TESTING_SETUP.md](./TESTING_SETUP.md) — Mocks, factories, environment setup
