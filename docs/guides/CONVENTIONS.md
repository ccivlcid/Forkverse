# CONVENTIONS.md — Strict Coding Rules

> **Source of truth** for all coding patterns, naming conventions, and prohibitions.
> **Every rule in this document is MANDATORY. Any violation results in immediate code rejection.**
> AI MUST reference this document before generating any code.

---

## 1. Language & Runtime (Absolute Rules)

- **TypeScript strict mode only** — Creating `.js` files is strictly forbidden
- `tsconfig.json` must have `"strict": true`; disabling individual strict options is forbidden
- **tsx** for direct server execution (minimize build steps)
- Node.js 20+ / ES2022 target
- CommonJS (`require`) forbidden → ESM (`import/export`) only

---

## 2. Naming Rules (No Exceptions)

| Target | Convention | Correct | Wrong |
|--------|-----------|---------|-------|
| File names | `kebab-case` | `post-card.tsx` | `PostCard.tsx`, `postCard.tsx` |
| React components | `PascalCase` | `PostCard` | `postCard`, `post_card` |
| Functions / variables | `camelCase` | `createPost` | `create_post`, `CreatePost` |
| Types / interfaces | `PascalCase` | `CreatePostRequest` | `createPostRequest` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_POST_LENGTH` | `maxPostLength` |
| Environment variables | `UPPER_SNAKE_CASE` | `DATABASE_URL` | `databaseUrl` |
| DB tables | `snake_case` plural | `user_posts` | `UserPosts`, `userPost` |
| DB columns | `snake_case` | `created_at` | `createdAt` |
| API paths | `kebab-case` | `/api/by-llm` | `/api/byLlm` |
| CSS classes | Tailwind utilities only | `className="flex gap-2"` | `className="my-card"` |
| Event handlers | `handle` + verb | `handleClick` | `onClick` (props use `on` prefix) |
| Boolean variables | `is/has/can/should` | `isLoading` | `loading` |
| Array variables | plural | `posts` | `postList`, `postArray` |

---

## 3. TypeScript Type Rules (Strict)

### Absolutely Forbidden

```typescript
// ❌ Strictly forbidden — even one occurrence triggers rejection
let x: any;                          // any forbidden
let y: object;                       // object forbidden
let z: Function;                     // Function forbidden
// @ts-ignore                        // ts-ignore forbidden
// @ts-nocheck                       // ts-nocheck forbidden
// eslint-disable                    // eslint-disable forbidden
x!.property;                         // non-null assertion forbidden
(x as SomeType);                     // type assertion minimized (except as const)
```

### Required Rules

```typescript
// ✅ Prefer interface (type only for unions/intersections/mapped types)
interface Post {
  id: string;
  userId: string;
  messageRaw: string;
  messageCli: string;
  lang: string;
  tags: string[];
  visibility: 'public' | 'private' | 'unlisted';
  llmModel: LlmModel;
  createdAt: string;
}

// ✅ Use type only in these cases
type LlmModel = 'claude-sonnet' | 'gpt-4o' | 'gemini-2.5-pro' | 'llama-3' | 'cursor' | 'cli' | 'api' | 'custom';
type PostWithUser = Post & { user: User };

// ✅ API request/response types MUST be defined in shared package
interface ApiResponse<T> {
  data: T;
  error?: string;
}

// ✅ Explicit return types required (never rely on inference)
function createPost(input: CreatePostInput): Post { ... }
async function fetchFeed(cursor?: string): Promise<ApiResponse<Post[]>> { ... }

// ✅ enum forbidden → use const object + as const
const VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  UNLISTED: 'unlisted',
} as const;
type Visibility = typeof VISIBILITY[keyof typeof VISIBILITY];
```

---

## 4. React Component Rules (Strict)

### Component Structure (This Order is Mandatory)

```typescript
// 1. Imports (external → internal → types)
import { useState } from 'react';
import { usePostStore } from '../stores/post-store';
import type { Post } from '@clitoris/shared';

// 2. Props interface (directly above component)
interface PostCardProps {
  post: Post;
  onStar?: (id: string) => void;
}

// 3. Component (named export only, default export strictly forbidden)
export function PostCard({ post, onStar }: PostCardProps): JSX.Element {
  // 4. Hooks (top-level only, never call inside conditionals)
  const [isExpanded, setIsExpanded] = useState(false);

  // 5. Event handlers
  function handleStarClick(): void {
    onStar?.(post.id);
  }

  // 6. Early returns (loading, error, empty states)
  if (!post) return null;

  // 7. JSX return
  return (
    <article className="border border-gray-700 rounded p-4 bg-[#1a1a2e]">
      {/* ... */}
    </article>
  );
}
```

### Absolutely Forbidden

```typescript
// ❌ default export forbidden
export default function PostCard() { ... }

// ❌ React.FC forbidden
const PostCard: React.FC<Props> = () => { ... }

// ❌ Class components forbidden
class PostCard extends React.Component { ... }

// ❌ Inline styles forbidden
<div style={{ color: 'green' }}>

// ❌ Component implementation in index.tsx forbidden (re-export only)

// ❌ Data fetching in useEffect forbidden → use dedicated hooks or TanStack Query
useEffect(() => { fetch('/api/posts')... }, []);

// ❌ Prop drilling beyond 3 levels forbidden → use Zustand store
```

### Required Rules

```typescript
// ✅ useState for UI-only local state (toggles, input values, modal open)
const [isOpen, setIsOpen] = useState(false);

// ✅ Server state goes in Zustand stores
const posts = usePostStore((s) => s.posts);

// ✅ Event handlers use handle prefix
function handleSubmit(e: React.FormEvent): void { ... }

// ✅ Conditional rendering uses ternary or && (no nesting)
{isLoading ? <Spinner /> : <PostList posts={posts} />}

// ✅ key must be unique ID (index forbidden)
{posts.map((post) => <PostCard key={post.id} post={post} />)}

// ✅ One component per file
```

---

## 5. Server Rules (Strict)

### Route Structure

```typescript
// ✅ Route files export a single router
import { Router } from 'express';
import type { ApiResponse, Post } from '@clitoris/shared';

export const postsRouter = Router();

// ✅ Keep handlers simple — no business logic separation (no over-engineering)
postsRouter.get('/feed/global', async (req, res, next) => {
  try {
    const cursor = req.query.cursor as string | undefined;
    const posts = db.prepare('SELECT * FROM posts WHERE ...').all(cursor);
    const response: ApiResponse<Post[]> = { data: posts };
    res.json(response);
  } catch (err) {
    next(err);  // ✅ Delegate to error middleware
  }
});
```

### Absolutely Forbidden

```typescript
// ❌ console.log forbidden → use pino logger
console.log('request received');    // strictly forbidden
logger.info('request received');    // ✅ correct

// ❌ Service layer / repository pattern forbidden (over-engineering)
class PostService { ... }          // forbidden
class PostRepository { ... }       // forbidden

// ❌ Decorators forbidden
@Controller('/posts')              // forbidden

// ❌ Class-based controllers forbidden
class PostController { ... }       // forbidden

// ❌ Nested try-catch forbidden
try { try { ... } catch {} } catch {} // forbidden
```

### Input Validation

```typescript
// ✅ Validate with zod at API boundary, once only
import { z } from 'zod';

const createPostSchema = z.object({
  message: z.string().min(1).max(2000),
  lang: z.string().length(2),
  tags: z.array(z.string()).max(10),
  visibility: z.enum(['public', 'private', 'unlisted']),
  llmModel: z.enum(['claude-sonnet', 'gpt-4o', 'gemini-2.5-pro', 'llama-3', 'cursor', 'cli', 'api', 'custom']),
});

// ✅ Validate via middleware
function validate(schema: z.ZodSchema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.message });
    }
    req.body = result.data;
    next();
  };
}
```

---

## 6. DB Rules (Strict)

```typescript
// ✅ Use better-sqlite3 synchronous API only (no async wrappers)
const db = new Database('clitoris.db');

// ✅ Use prepared statements only (SQL injection prevention)
const stmt = db.prepare('SELECT * FROM posts WHERE id = ?');
const post = stmt.get(postId);

// ❌ String interpolation strictly forbidden
db.exec(`SELECT * FROM posts WHERE id = '${postId}'`);  // strictly forbidden

// ✅ Migrations managed by sequential numbering
// 001_create_users.sql
// 002_create_posts.sql
// 003_create_social.sql
// No skipping numbers, no modifying existing files (append new files only)

// ✅ Transactions must use transaction()
const insertMany = db.transaction((posts) => {
  for (const post of posts) {
    insertStmt.run(post);
  }
});

// ❌ ORM usage strictly forbidden
// Prisma, TypeORM, Drizzle, Knex — all forbidden → raw SQL only
```

---

## 7. Import Rules (Strict)

```typescript
// Must follow this order (blank line between groups)

// 1. Node.js built-in modules
import path from 'node:path';
import { readFileSync } from 'node:fs';

// 2. External libraries
import { Router } from 'express';
import { z } from 'zod';

// 3. Monorepo internal packages
import type { Post, User } from '@clitoris/shared';
import { transformToCli } from '@clitoris/llm';

// 4. Project internal modules (relative paths)
import { usePostStore } from '../stores/post-store';
import { PostCard } from '../components/post/post-card';

// ✅ Type-only imports required (when importing types only)
import type { Post } from '@clitoris/shared';       // ✅
import { Post } from '@clitoris/shared';             // ❌ (when only used as type)

// ❌ Wildcard imports forbidden
import * as utils from '../utils';                   // forbidden

// ❌ Relative paths beyond 2 levels forbidden
import { something } from '../../../utils/helper';   // forbidden → use package alias
```

---

## 8. Style Rules (Strict)

### Tailwind CSS Only

```typescript
// ✅ Tailwind utility classes only
<div className="flex items-center gap-2 p-4 bg-[#1a1a2e] text-gray-200 font-mono">

// ❌ Custom CSS files forbidden (except globals.css theme variables)
// ❌ CSS Modules forbidden (.module.css)
// ❌ CSS-in-JS forbidden (styled-components, emotion, vanilla-extract)
// ❌ Sass/Less forbidden
// ❌ Inline styles forbidden (style={{ }})
```

### Design Tokens & Fonts

> Full color system, typography, and spacing: see `docs/guides/DESIGN_GUIDE.md` (sections 2-3).

Quick reference for code reviews:
- Backgrounds: `bg-[#1a1a2e]` (primary), `bg-[#16213e]` (secondary), `bg-[#0f3460]` (surface)
- CLI keywords: `text-green-400`, Usernames: `text-amber-400`, Hashtags: `text-cyan-400`
- Fonts: `font-mono` (CLI/code), `font-sans` (natural language)

---

## 9. Error Handling Rules

```typescript
// ✅ Server: single error middleware handles all errors
app.use((err: Error, req, res, next) => {
  logger.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ✅ Client: use error boundaries
// No per-component try-catch

// ❌ Empty catch blocks strictly forbidden
try { ... } catch (e) {}           // forbidden
try { ... } catch (e) { /* */ }    // forbidden

// ❌ Swallowing errors forbidden
catch (e) { return null; }         // forbidden (never hide errors)

// ✅ Catch blocks must log or re-throw
catch (err) {
  logger.error({ err }, 'Failed to create post');
  throw err;
}
```

---

## 9.5. Edge Case Patterns

### Handling null/undefined safely
```typescript
// ✅ Use optional chaining + nullish coalescing
const username = post?.user?.username ?? 'unknown';
const tags = post?.tags ?? [];
const count = response?.data?.length ?? 0;

// ❌ Never use non-null assertion
const username = post!.user!.username;  // forbidden
```

### Async error boundary in stores
```typescript
// ✅ Pattern for async actions in Zustand stores
async function fetchData(): Promise<void> {
  set({ isLoading: true, error: null });
  try {
    const res = await fetch('/api/data');
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error.message ?? 'Request failed');
    }
    const { data } = await res.json();
    set({ data, isLoading: false });
  } catch (err) {
    set({ error: (err as Error).message, isLoading: false });
  }
}
```

### Conditional rendering edge cases
```typescript
// ✅ Handle zero correctly (0 is falsy!)
{starCount > 0 && <span>{starCount}</span>}    // ✅ correct
{starCount && <span>{starCount}</span>}         // ❌ renders nothing when 0

// ✅ Handle empty arrays
{posts.length > 0 ? <FeedList posts={posts} /> : <EmptyState />}
```

---

## 10. File Structure Rules

```
✅ One component/module per file (no exceptions)
✅ Files exceeding 150 lines must be split
✅ index.ts is for re-exports only (no logic implementation)
✅ Test files: {filename}.test.ts (same directory)
✅ Type files: {domain}.ts (under shared/types/)

❌ Generic files like utils.ts forbidden → use specific names
   utils.ts        → date-formatter.ts, id-generator.ts
❌ helpers.ts forbidden
❌ misc.ts forbidden
❌ common.ts forbidden (constants is allowed)
```

---

## 11. Prohibition Checklist

> **Violating even ONE item below results in full code rejection.**

| # | Prohibited | Alternative |
|---|-----------|-------------|
| 1 | `any` type | `unknown` + type guards |
| 2 | `console.log/warn/error` | pino logger |
| 3 | `default export` | named export |
| 4 | `class` components | function components |
| 5 | `enum` | `as const` objects |
| 6 | `React.FC` / `React.FunctionComponent` | plain function + Props type |
| 7 | CSS-in-JS | Tailwind CSS |
| 8 | Inline styles (`style={}`) | Tailwind CSS |
| 9 | ORM (Prisma, TypeORM, etc.) | raw SQL (better-sqlite3) |
| 10 | `require()` | `import` |
| 11 | `.js` files | `.ts` / `.tsx` |
| 12 | `@ts-ignore` / `@ts-nocheck` | fix the types |
| 13 | `eslint-disable` | follow the rules |
| 14 | `!` (non-null assertion) | optional chaining `?.` + type guards |
| 15 | String SQL interpolation | prepared statements |
| 16 | Committing `.env` | commit `.env.example` only |
| 17 | Logic in `index.ts` | implement in separate file, re-export |
| 18 | Data fetching in `useEffect` | dedicated hooks / TanStack Query |
| 19 | `* as` wildcard imports | named imports |
| 20 | Empty `catch` blocks | log or re-throw |
| 21 | Service/repository pattern | write directly in route handlers |
| 22 | Relative imports beyond 2 levels | package aliases |
| 23 | `var` declarations | `const` (`let` when mutation needed) |
| 24 | Magic numbers / magic strings | extract to constants |
| 25 | Commenting out code | delete it (git remembers) |

---

## 12. Commit Messages (Required Format)

```
<type>: <description (50 chars max)>

Types:
  feat:     New feature
  fix:      Bug fix
  docs:     Documentation
  style:    Code formatting (no functional change)
  refactor: Refactoring
  test:     Tests
  chore:    Build/config

❌ Forbidden:
  - Commit messages without type prefix
  - Subject lines exceeding 50 characters
  - Vague messages like "fix bugs", "update code"
  - WIP commits (commit only when work is complete)
```

---

## 13. Automatic Code Rejection Criteria

AI-generated code is **immediately rejected** if any of the following apply:

1. TypeScript strict mode errors exist
2. `any` type used even once
3. `console.log` used even once
4. `default export` used
5. Custom CSS file created
6. ORM code present
7. File exceeds 150 lines
8. Function missing explicit return type
9. `.js` file created
10. Utility function without tests

---

## See Also

- [DESIGN_GUIDE.md](./DESIGN_GUIDE.md) — Visual design tokens and component specs
- [TESTING.md](./TESTING.md) — Testing patterns and examples
- [PROMPTS.md](./PROMPTS.md) — Vibe coding prompt templates
