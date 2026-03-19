# LOCAL_FEED.md — Local Feed Screen Specification

> **Source of truth** for the Local Feed screen (`/feed/local`).

---

## 1. Screen Overview

| Property      | Value                                                        |
|---------------|--------------------------------------------------------------|
| Route         | `/feed/local`                                                |
| Title         | `terminal.social / feed --local`                             |
| Description   | Shows posts only from users the authenticated user follows. Same layout as global feed but with a filtered dataset. Redirects to login if unauthenticated. |
| Auth Required | Yes                                                          |

---

## 2. Desktop Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ terminal.social / feed --local                                     @user ▾     │
├────────────────┬────────────────────────────────────────────────────────────────┤
│                │                                                                │
│ // navigate    │  ┌─ Composer Bar ──────────────────────────────────────────┐   │
│   feed --global│  │ > Write in any language. LLM translates to CLI.         │   │
│ $ feed --local │  │ ┌──────────────────────────────────────────────────┐    │   │
│   explore      │  │ │ Type your post here...                      |    │    │   │
│                │  │ └──────────────────────────────────────────────────┘    │   │
│ // by LLM      │  │ Cmd+Enter · save as CLI   [claude-sonnet ▾] [LLM→CLI ↗]│   │
│ ● claude-sonnet│  └────────────────────────────────────────────────────────┘   │
│ ○ gpt-4o       │                                                                │
│ ○ llama-3      │  ┌─ Post Card ────────────────────────────────────────────┐   │
│                │  │ @jiyeon_dev  jiyeon.kim · 5m ago              --lang=ko │   │
│ // me          │  ├──────────────────────────┬─────────────────────────────┤   │
│ → @you.local   │  │                          │ CLI — claude-sonnet    ⎘    │   │
│   my posts     │  │  Natural language text   │                             │   │
│   starred      │  │  from a followed user.   │  post --user=jiyeon.kim \   │   │
│                │  │  #dev-life               │    --lang=ko \              │   │
│                │  │                          │    --message="..." \        │   │
│                │  │                          │    --tags=dev-life          │   │
│                │  ├──────────────────────────┴─────────────────────────────┤   │
│                │  │  ↩ reply 4    ◇ fork 1    ★ 12                        │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │  ┌─ Post Card ────────────────────────────────────────────┐   │
│                │  │ @devpatel  devpatel.io · 20m ago             --lang=en │   │
│                │  ├──────────────────────────┬─────────────────────────────┤   │
│                │  │                          │ CLI — llama-3          ⎘    │   │
│                │  │  Another post from       │  post --user=devpatel.io \  │   │
│                │  │  someone you follow.     │    --lang=en \              │   │
│                │  │                          │    --message="..."          │   │
│                │  ├──────────────────────────┴─────────────────────────────┤   │
│                │  │  ↩ reply 0    ◇ fork 2    ★ 5                         │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │  ┌─────────────────────────────────────────────────────┐      │
│                │  │            Loading more posts...                     │      │
│                │  └─────────────────────────────────────────────────────┘      │
│                │                                                                │
└────────────────┴────────────────────────────────────────────────────────────────┘
```

---

## 3. Mobile Wireframe

```
┌─────────────────────────────────┐
│ ≡  terminal.social      @user ▾│
├─────────────────────────────────┤
│                                 │
│ ┌─ Composer Bar ──────────────┐│
│ │ > Write in any language...   ││
│ │ ┌─────────────────────────┐  ││
│ │ │ Type your post here...  │  ││
│ │ └─────────────────────────┘  ││
│ │ [claude-sonnet ▾] [LLM→CLI] ││
│ └──────────────────────────────┘│
│                                 │
│ ┌─ Post Card ─────────────────┐│
│ │ @jiyeon_dev · 5m   --lang=ko││
│ ├─────────────────────────────┤│
│ │ Natural language text       ││
│ │ from a followed user.       ││
│ │ #dev-life                   ││
│ ├─────────────────────────────┤│
│ │ CLI — claude-sonnet    ⎘    ││
│ │ post --user=jiyeon.kim \    ││
│ │   --lang=ko \               ││
│ │   --message="..." \         ││
│ │   --tags=dev-life           ││
│ ├─────────────────────────────┤│
│ │  ↩ 4   ◇ 1   ★ 12         ││
│ └─────────────────────────────┘│
│                                 │
│ ┌─ Post Card ─────────────────┐│
│ │ @devpatel · 20m    --lang=en││
│ ├─────────────────────────────┤│
│ │ Another post from           ││
│ │ someone you follow.         ││
│ ├─────────────────────────────┤│
│ │ CLI — llama-3          ⎘    ││
│ │ post --user=devpatel.io \   ││
│ │   --lang=en ...             ││
│ ├─────────────────────────────┤│
│ │  ↩ 0   ◇ 2   ★ 5          ││
│ └─────────────────────────────┘│
│                                 │
│       Loading more posts...     │
│                                 │
└─────────────────────────────────┘
```

---

## 4. Component Tree

```
LocalFeedPage                           src/pages/LocalFeedPage.tsx
├── AuthGuard                           src/components/auth/AuthGuard.tsx
│   └── (redirects to /auth/login if not authenticated)
├── AppShell                            src/components/layout/AppShell.tsx
│   ├── HeaderBar                       src/components/layout/HeaderBar.tsx
│   │   ├── Logo                        (inline)
│   │   ├── Breadcrumbs                 src/components/layout/Breadcrumbs.tsx
│   │   │   └── crumbs: ["feed", "--local"]
│   │   └── UserMenu                   src/components/layout/UserMenu.tsx
│   ├── Sidebar                         src/components/layout/Sidebar.tsx
│   │   ├── NavSection                  src/components/layout/NavSection.tsx
│   │   │   └── activeItem: "feed --local"
│   │   ├── LlmFilterSection            src/components/layout/LlmFilterSection.tsx
│   │   └── MeSection                   src/components/layout/MeSection.tsx
│   └── MainContent                     (slot)
│       ├── ComposerBar                 src/components/composer/ComposerBar.tsx
│       │   ├── ComposerTextarea        src/components/composer/ComposerTextarea.tsx
│       │   ├── ModelSelector           src/components/composer/ModelSelector.tsx
│       │   └── SubmitButton            src/components/composer/SubmitButton.tsx
│       └── FeedList                    src/components/feed/FeedList.tsx
│           ├── PostCard                src/components/post/PostCard.tsx
│           │   ├── PostHeader          src/components/post/PostHeader.tsx
│           │   ├── DualPanel           src/components/post/DualPanel.tsx
│           │   │   ├── NaturalPanel    src/components/post/NaturalPanel.tsx
│           │   │   └── CliPanel        src/components/post/CliPanel.tsx
│           │   └── ActionBar           src/components/post/ActionBar.tsx
│           └── InfiniteScrollTrigger   src/components/feed/InfiniteScrollTrigger.tsx
```

Note: This page reuses the exact same components as GlobalFeedPage. The only differences are:
- Wrapped in `AuthGuard`
- Sidebar highlights `feed --local` as active
- Breadcrumbs show `feed --local`
- Data source uses `fetchLocalFeed()` instead of `fetchGlobalFeed()`

---

## 5. State Requirements

### Zustand Stores Used

**`feedStore`** — `src/stores/feedStore.ts`

```typescript
interface FeedState {
  posts: Post[];
  cursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  activeFilter: LlmModel | 'all';
  feedType: 'global' | 'local';

  fetchLocalFeed: () => Promise<void>;
  fetchNextPage: () => Promise<void>;
  setFilter: (model: LlmModel | 'all') => void;
  starPost: (postId: string) => void;
  prependPost: (post: Post) => void;
  reset: () => void;
}
```

**`authStore`** — `src/stores/authStore.ts`

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;

  login: (credentials: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}
```

**`postStore`** — `src/stores/postStore.ts`

```typescript
interface PostState {
  draft: string;
  cliPreview: string | null;
  selectedModel: LlmModel;
  isTransforming: boolean;
  isSubmitting: boolean;

  setDraft: (text: string) => void;
  setModel: (model: LlmModel) => void;
  transformToCli: () => Promise<void>;
  submitPost: () => Promise<void>;
  resetDraft: () => void;
}
```

### Data Shapes

Same as Global Feed. Uses the same `Post`, `PostUser`, and `LlmModel` types defined in `src/types/post.ts`.

---

## 6. API Calls

### On Mount

| Trigger       | Endpoint                          | Method | Auth | Purpose                            |
|---------------|-----------------------------------|--------|------|------------------------------------|
| Page load     | `/api/auth/me`                    | GET    | Yes  | Verify authentication (AuthGuard)  |
| Page load     | `/api/posts/feed/local`           | GET    | Yes  | Load initial 20 posts from follows |

### On User Interaction

| Trigger               | Endpoint                              | Method | Auth | Purpose                       |
|-----------------------|---------------------------------------|--------|------|-------------------------------|
| Scroll to bottom      | `/api/posts/feed/local?cursor=X`      | GET    | Yes  | Load next page                |
| Click LLM filter tab  | `/api/posts/feed/local?llmModel=X`    | GET    | Yes  | Filter local feed by LLM      |
| Press Cmd+Enter       | `/api/llm/transform`                  | POST   | Yes  | Transform draft to CLI         |
| Confirm post          | `/api/posts`                          | POST   | Yes  | Create new post               |
| Click ★ star          | `/api/posts/:id/star`                 | POST   | Yes  | Toggle star on post            |
| Click ◇ fork          | `/api/posts/:id/fork`                 | POST   | Yes  | Fork post to own timeline      |
| Click ↩ reply         | Navigate to `/post/:id`               | —      | —    | Navigate to post detail        |

---

## 7. User Interactions

### Mouse / Touch

| Element              | Action    | Result                                                  |
|----------------------|-----------|---------------------------------------------------------|
| Post card            | Click     | Navigate to `/post/:id`                                 |
| ↩ reply count        | Click     | Navigate to `/post/:id` with composer focused           |
| ◇ fork count         | Click     | POST fork, optimistic update forkCount +1               |
| ★ star count         | Click     | POST toggle star, optimistic update starCount +/-1      |
| @username            | Click     | Navigate to `/user/@username`                           |
| #hashtag             | Click     | Navigate to `/explore?tag=hashtag`                      |
| ⎘ copy (CLI panel)   | Click     | Copy CLI text to clipboard, show "Copied!" flash        |
| LLM filter (sidebar) | Click     | Filter local feed by model, reset cursor, refetch       |
| Nav items (sidebar)  | Click     | Navigate to corresponding route                         |
| Composer textarea    | Click     | Focus textarea, show blinking cursor                    |
| Model selector       | Click     | Open dropdown: claude-sonnet, gpt-4o, llama-3, custom   |
| [LLM -> CLI] button  | Click     | Transform draft via LLM, show CLI preview               |
| User menu            | Click     | Open dropdown: profile, settings, logout                |

### Keyboard Shortcuts

Same as Global Feed:

| Key          | Context           | Action                                       |
|--------------|-------------------|----------------------------------------------|
| `j`          | Feed (not in input) | Move focus to next post                     |
| `k`          | Feed (not in input) | Move focus to previous post                 |
| `s`          | Post focused       | Toggle star on focused post                  |
| `r`          | Post focused       | Navigate to post detail with reply focus      |
| `f`          | Post focused       | Fork focused post                            |
| `o` / `Enter`| Post focused       | Open post detail                             |
| `/`          | Anywhere           | Focus composer textarea                      |
| `Escape`     | Composer focused   | Blur composer, return focus to feed           |
| `Cmd+Enter`  | Composer focused   | Submit post (transform + confirm)             |

---

## 8. Loading State

### Initial Page Load Skeleton

Same skeleton structure as Global Feed. 5 skeleton post cards with pulsing opacity animation.

```
┌────────────────┬────────────────────────────────────────────────────────────────┐
│                │                                                                │
│ // navigate    │  ┌─ Composer Bar (renders immediately) ───────────────────┐   │
│ ████████████   │  │ > Write in any language. LLM translates to CLI.        │   │
│ ████████████   │  └────────────────────────────────────────────────────────┘   │
│ ████████████   │                                                                │
│                │  ┌─ Skeleton Card ────────────────────────────────────────┐   │
│                │  │ ████████  ████ · ██ ago                      ████████ │   │
│                │  ├──────────────────────────┬─────────────────────────────┤   │
│                │  │ ██████████████████████   │ ████████████████████████    │   │
│                │  │ ██████████████████       │ ████████████████████        │   │
│                │  │ ██████████████████████   │ ████████████████            │   │
│                │  ├──────────────────────────┴─────────────────────────────┤   │
│                │  │  ↩ ██    ◇ ██    ★ ██                                 │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │  ┌─ Skeleton Card ────────────────────────────────────────┐   │
│                │  │ (repeat x4 more)                                       │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
└────────────────┴────────────────────────────────────────────────────────────────┘
```

### Infinite Scroll Loading

```
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  $ loading --feed=local --cursor=<timestamp> ...            │  │
│  └─────────────────────────────────────────────────────────────┘  │
```

- Same pulsing `...` animation as global feed.

---

## 9. Empty State

When the user is not following anyone, or followed users have no posts:

```
┌────────────────┬────────────────────────────────────────────────────────────────┐
│                │                                                                │
│ (sidebar)      │  ┌─ Composer Bar ─────────────────────────────────────────┐   │
│                │  │ (renders normally)                                      │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │          ┌──────────────────────────────────┐                  │
│                │          │                                  │                  │
│                │          │  $ feed --local                  │                  │
│                │          │  > 0 posts found.                │                  │
│                │          │                                  │                  │
│                │          │  You're not following anyone     │                  │
│                │          │  yet. Explore the global feed    │                  │
│                │          │  to find people.                 │                  │
│                │          │                                  │                  │
│                │          │  $ follow --help                 │                  │
│                │          │  Visit a user's profile and      │                  │
│                │          │  click follow, or explore the    │                  │
│                │          │  global feed.                    │                  │
│                │          │                                  │                  │
│                │          │  [$ explore --global]            │                  │
│                │          │                                  │                  │
│                │          └──────────────────────────────────┘                  │
│                │                                                                │
└────────────────┴────────────────────────────────────────────────────────────────┘
```

- Container: `border border-gray-700 bg-[#16213e] p-8 text-center`
- Heading line: `text-green-400 font-mono text-sm` (`$ feed --local`)
- Subheading: `text-orange-400 font-mono text-sm` (`> 0 posts found.`)
- Body text: `text-gray-400 font-sans text-sm`
- Help command: `text-green-400 font-mono text-sm` (`$ follow --help`)
- Help body: `text-gray-500 font-sans text-sm`
- CTA button `[$ explore --global]`: `bg-green-400/10 text-green-400 border border-green-400/30 px-4 py-1.5 font-mono text-sm hover:bg-green-400/20`
- Clicking the CTA navigates to `/` (global feed).

---

## 10. Error State

### API Failure (Feed Load)

```
┌────────────────┬────────────────────────────────────────────────────────────────┐
│                │                                                                │
│ (sidebar)      │  ┌─ Composer Bar ─────────────────────────────────────────┐   │
│                │  │ (renders normally)                                      │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │          ┌──────────────────────────────────┐                  │
│                │          │                                  │                  │
│                │          │  $ feed --local                  │                  │
│                │          │  error: connection refused       │                  │
│                │          │                                  │                  │
│                │          │  Failed to load your local feed. │                  │
│                │          │  The server might be down or     │                  │
│                │          │  your connection is interrupted. │                  │
│                │          │                                  │                  │
│                │          │  [$ retry]                       │                  │
│                │          │                                  │                  │
│                │          └──────────────────────────────────┘                  │
│                │                                                                │
└────────────────┴────────────────────────────────────────────────────────────────┘
```

- Container: `border border-red-400/30 bg-[#16213e] p-8 text-center`
- Command line: `text-green-400 font-mono text-sm`
- Error line: `text-red-400 font-mono text-sm`
- Body: `text-gray-400 font-sans text-sm`
- Retry button: same green CTA style as empty state
- Clicking `[$ retry]` calls `feedStore.fetchLocalFeed()` again.

### Auth Failure (401)

If the session expires mid-use and a 401 is returned:

- `AuthGuard` intercepts the 401 response.
- The user is redirected to `/auth/login` with a `?redirect=/feed/local` query parameter.
- After successful login, the user is redirected back to `/feed/local`.

### Inline Error (Infinite Scroll)


If an error occurs during pagination, the error appears inline below the last loaded post:

```
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  $ feed --local --cursor=<timestamp>                        │  │
│  │  error: request timeout                                     │  │
│  │                                         [$ retry]           │  │
│  └─────────────────────────────────────────────────────────────┘  │
```

---

## 11. Test IDs (`data-testid`)

Inherits all test IDs from Global Feed (same components reused). Additional:

| Element | `data-testid` | Purpose |
|---------|---------------|---------|
| Auth redirect trigger | `auth-guard` | E2E: verify auth redirect |
| Empty state "explore" CTA | `local-feed-explore-cta` | E2E: navigate to global feed |
| Inline scroll error | `scroll-error` | E2E: verify pagination error |
| Inline retry button | `scroll-retry` | E2E: retry pagination |

---

## 12. Accessibility Notes

Inherits all accessibility requirements from Global Feed. Additional:

| Requirement | Implementation |
|-------------|---------------|
| Auth redirect | Screen reader announces "Redirecting to login" via `aria-live="assertive"` |
| Empty state CTA | `role="link"` with `aria-label="Explore global feed"` |
| Feed type | `aria-label="Local feed - posts from people you follow"` on feed container |

---

## See Also

- [DESIGN_GUIDE.md](../guides/DESIGN_GUIDE.md) — Visual tokens, component specs, UI states
- [API.md](../specs/API.md) — Endpoint request/response details
- [CONVENTIONS.md](../guides/CONVENTIONS.md) — Coding rules for implementation
- [GLOBAL_FEED.md](./GLOBAL_FEED.md) — Related screen specification
- [USER_PROFILE.md](./USER_PROFILE.md) — Related screen specification
