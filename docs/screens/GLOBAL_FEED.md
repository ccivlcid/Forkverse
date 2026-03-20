# GLOBAL_FEED.md — Global Feed Screen Specification

> **Source of truth** for the Global Feed screen (`/`).

---

## 1. Screen Overview

| Property      | Value                                                        |
|---------------|--------------------------------------------------------------|
| Route         | `/`                                                          |
| Title         | `terminal.social / feed --global`                            |
| Description   | Default landing page. Shows all public posts in reverse chronological order with dual-format display (natural language + CLI). Supports infinite scroll, keyboard navigation, and inline composition. |
| Auth Required | No (viewing). Yes (composing, starring, replying, forking).  |

---

## 2. Desktop Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ terminal.social / 자연어 + CLI · LLM 공유 · all posts open source  @user ▾    │
├────────────────┬────────────────────────────────────────────────────────────────┤
│                │                                                                │
│ // navigate    │  › feed --global --dual-format --translate=auto               │
│ $ feed --global│                                                                │
│ $ feed --local │                                                                │
│ $ following    │  (Composer is a modal — opened via [+ post] button in header │
│ $ explore      │   or "/" hotkey. Not embedded in feed.)                       │
│                │                                                                │
│ // by LLM      │  ┌─ Post Card ────────────────────────────────────────────┐   │
│                │  │ @0xmitsuki  mitsuki.sh · 3m ago              --lang=en │   │
│ // me          │  ├──────────────────────────┬─────────────────────────────┤   │
│ ~ @you.local   │  │ ⓘ 자연어                 │ ⊡ CLI — open source   copy │   │
│ $ my posts --raw│  │                          │                             │   │
│ $ starred      │  │  CLI is the new lingua   │  post --user=0xmitsuki.sh ¶ │   │
│                │  │  franca. Think in any    │    --lang=en ¶              │   │
│                │  │  language, post in any   │    --message="CLI flags..." ¶│   │
│                │  │  language. @jiyeon_dev   │    --tags=cli-first ¶       │   │
│                │  │  you're onto something.  │    --visibility=public      │   │
│                │  │  #cli-first              │                             │   │
│                │  ├──────────────────────────┴─────────────────────────────┤   │
│                │  │  ↵ reply 9    ○ fork 3    ★ 31                        │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │  ┌─ Post Card ────────────────────────────────────────────┐   │
│                │  │ @jiyeon_dev  jiyeon.kim · 12m ago             --lang=ko│   │
│                │  ├──────────────────────────┬─────────────────────────────┤   │
│                │  │ ⓘ 자연어                 │ ⊡ CLI — open source   copy │   │
│                │  │  Natural language text   │  post --user=jiyeon.kim ¶   │   │
│                │  │  here...                 │    --lang=ko ¶              │   │
│                │  │                          │    --message="..."          │   │
│                │  ├──────────────────────────┴─────────────────────────────┤   │
│                │  │  ↵ reply 2    ○ fork 0    ★ 8                         │   │
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
│ │ @0xmitsuki · 3m    --lang=en││
│ ├─────────────────────────────┤│
│ │ CLI is the new lingua       ││
│ │ franca. Think in any        ││
│ │ language...                 ││
│ │ #cli-first                  ││
│ ├─────────────────────────────┤│
│ │ CLI — claude-sonnet    ⎘    ││
│ │ post --user=0xmitsuki.sh \  ││
│ │   --lang=en \               ││
│ │   --message="CLI flags..."  ││
│ ├─────────────────────────────┤│
│ │  ↩ 9   ◇ 3   ★ 31         ││
│ └─────────────────────────────┘│
│                                 │
│ ┌─ Post Card ─────────────────┐│
│ │ @jiyeon_dev · 12m  --lang=ko││
│ ├─────────────────────────────┤│
│ │ Natural language text...    ││
│ ├─────────────────────────────┤│
│ │ CLI — gpt-4o           ⎘    ││
│ │ post --user=jiyeon.kim \    ││
│ │   --lang=ko ...             ││
│ ├─────────────────────────────┤│
│ │  ↩ 2   ◇ 0   ★ 8          ││
│ └─────────────────────────────┘│
│                                 │
│       Loading more posts...     │
│                                 │
└─────────────────────────────────┘
```

---

## 4. Component Tree

```
GlobalFeedPage                          src/pages/GlobalFeedPage.tsx
├── AppShell                            src/components/layout/AppShell.tsx
│   ├── HeaderBar                       src/components/layout/HeaderBar.tsx
│   │   ├── Logo                        (inline)
│   │   ├── Breadcrumbs                 src/components/layout/Breadcrumbs.tsx
│   │   └── UserMenu                   src/components/layout/UserMenu.tsx
│   ├── Sidebar                         src/components/layout/Sidebar.tsx
│   │   ├── NavSection                  src/components/layout/NavSection.tsx
│   │   ├── LlmFilterSection            src/components/layout/LlmFilterSection.tsx
│   │   └── MeSection                   src/components/layout/MeSection.tsx
│   └── MainContent                     (slot)
│       └── FeedList                    src/components/feed/FeedList.tsx
│           ├── PostCard                src/components/post/PostCard.tsx
│           │   ├── PostHeader          src/components/post/PostHeader.tsx
│           │   │   ├── Username        (inline, text-amber-400)
│           │   │   ├── Domain          (inline, text-gray-500)
│           │   │   ├── Timestamp       (inline, text-gray-500)
│           │   │   └── LangBadge       src/components/post/LangBadge.tsx
│           │   ├── DualPanel           src/components/post/DualPanel.tsx
│           │   │   ├── NaturalPanel    src/components/post/NaturalPanel.tsx
│           │   │   └── CliPanel        src/components/post/CliPanel.tsx
│           │   │       └── CliHighlighter  src/components/post/CliHighlighter.tsx
│           │   └── ActionBar           src/components/post/ActionBar.tsx
│           │       ├── ReplyAction     (inline)
│           │       ├── ForkAction      (inline)
│           │       └── StarAction      (inline)
│           └── InfiniteScrollTrigger   src/components/feed/InfiniteScrollTrigger.tsx
```

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

  fetchGlobalFeed: () => Promise<void>;
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
  attachedRepo: { owner: string; name: string } | null;

  // Add to actions
  attachRepo: (owner: string, name: string) => void;
  removeRepo: () => void;

  setDraft: (text: string) => void;
  setModel: (model: LlmModel) => void;
  transformToCli: () => Promise<void>;
  submitPost: () => Promise<void>;
  resetDraft: () => void;
}
```

### Data Shapes

```typescript
interface Post {
  id: string;
  userId: string;
  messageRaw: string;
  messageCli: string;
  lang: string;
  tags: string[];
  mentions: string[];
  visibility: 'public' | 'private' | 'unlisted';
  llmModel: LlmModel;
  parentId: string | null;
  forkedFromId: string | null;
  repoAttachment: {
    owner: string;
    name: string;
    stars: number;
    forks: number;
    language: string;
  } | null;
  createdAt: string;
  user: PostUser;
  starCount: number;
  replyCount: number;
  forkCount: number;
  isStarred: boolean;
}

interface PostUser {
  username: string;
  domain: string | null;
  displayName: string;
  avatarUrl: string | null;
}

type LlmModel = 'claude-sonnet' | 'gpt-4o' | 'gemini-2.5-pro' | 'llama-3' | 'custom';
```

---

## 6. API Calls

### On Mount

| Trigger       | Endpoint                          | Method | Auth  | Purpose                       |
|---------------|-----------------------------------|--------|-------|-------------------------------|
| Page load     | `/api/posts/feed/global`          | GET    | No    | Load initial 20 posts         |
| Page load     | `/api/auth/me`                    | GET    | Yes*  | Check if user is logged in    |

*Only fires if a session cookie exists.

### On User Interaction

| Trigger               | Endpoint                          | Method | Auth | Purpose                       |
|-----------------------|-----------------------------------|--------|------|-------------------------------|
| Scroll to bottom      | `/api/posts/feed/global?cursor=X` | GET    | No   | Load next page (infinite scroll) |
| Click LLM filter tab  | `/api/posts/by-llm/:model`        | GET    | No   | Filter posts by LLM model     |
| Click [LLM → CLI ↗]   | `/api/llm/transform`              | POST   | Yes  | Transform draft to CLI (preview) |
| Press Cmd+Enter       | `/api/posts`                      | POST   | Yes  | Submit post after transform   |
| Click ★ star          | `/api/posts/:id/star`             | POST   | Yes  | Toggle star on post            |
| Click ○ fork          | `/api/posts/:id/fork`             | POST   | Yes  | Fork post to own timeline      |
| Click ↵ reply         | Navigate to `/post/:id`           | —      | —    | Navigate to post detail        |

---

## 7. User Interactions

### Mouse / Touch

| Element              | Action    | Result                                                  |
|----------------------|-----------|---------------------------------------------------------|
| Post card            | Click     | Navigate to `/post/:id`                                 |
| ↵ reply count        | Click     | Navigate to `/post/:id` with composer focused           |
| ○ fork count         | Click     | POST fork, optimistic update forkCount +1               |
| ★ star count         | Click     | POST toggle star, optimistic update starCount +/-1      |
| @username            | Click     | Navigate to `/user/@username`                           |
| #hashtag             | Click     | Navigate to `/explore?tag=hashtag`                      |
| copy (CLI panel)     | Click     | Copy CLI text to clipboard, show "Copied!" flash        |
| LLM filter (sidebar) | Click     | Filter feed by model, reset cursor, fetch new data      |
| + connect LLM        | Click     | Navigate to `/settings?tab=cli`                         |
| Nav items (sidebar)  | Click     | Navigate to corresponding route                         |
| Composer textarea    | Click     | Focus textarea, show blinking cursor                    |
| Model selector       | Click     | Open dropdown: claude-sonnet, gpt-4o, gemini-2.5-pro, llama-3, custom   |
| [LLM → CLI ↗] button | Click     | Transform draft via LLM, show CLI preview (does not submit) |
| User menu            | Click     | Open dropdown: profile, settings, logout                |
| [📎 repo] button       | Click     | Open repo picker dropdown (search user's GitHub repos)  |
| Repo picker item       | Click     | Attach repo to post draft; show preview below textarea  |
| Repo preview [× remove]| Click     | Remove attached repo from draft                         |

### Keyboard Shortcuts

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
| `Cmd+Enter`  | Composer focused   | Submit post (after transform is complete)     |

---

## 8. Loading State

### Initial Page Load Skeleton

```
┌────────────────┬────────────────────────────────────────────────────────────────┐
│                │                                                                │
│ // navigate    │  ┌─ Composer Bar ──────────────────────────────────────────┐   │
│ ████████████   │  │ › 하고 싶은 말을 그냥 쓰세요...  (italic, dim)           │   │
│ ████████████   │  │                                                          │   │
│ ████████████   │  │ Cmd+Enter · 자연어 + CLI 를 포스트로 저장               │   │
│                │  │                      [claude-sonnet ▾]   [LLM → CLI ↗]  │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │  ┌─ Skeleton Card ────────────────────────────────────────┐   │
│                │  │ ████████  ████ · ██ ago                      ████████ │   │
│                │  ├──────────────────────────┬─────────────────────────────┤   │
│                │  │ ██████████████████████   │ ████████████████████████    │   │
│                │  │ ██████████████████       │ ████████████████████        │   │
│                │  │ ██████████████████████   │ ████████████████            │   │
│                │  │ ██████████               │ ████████████████████████    │   │
│                │  ├──────────────────────────┴─────────────────────────────┤   │
│                │  │  ↵ ██    ○ ██    ★ ██                                 │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │  ┌─ Skeleton Card ────────────────────────────────────────┐   │
│                │  │ ████████  ████ · ██ ago                      ████████ │   │
│                │  ├──────────────────────────┬─────────────────────────────┤   │
│                │  │ ██████████████████████   │ ████████████████████████    │   │
│                │  │ ██████████████████       │ ████████████████████        │   │
│                │  │ ██████████████████████   │ ████████████████            │   │
│                │  ├──────────────────────────┴─────────────────────────────┤   │
│                │  │  ↵ ██    ○ ██    ★ ██                                 │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
└────────────────┴────────────────────────────────────────────────────────────────┘
```

- Skeleton cards use `bg-[#16213e]` with pulsing `opacity` animation (no shimmer).
- Show 5 skeleton cards on initial load.
- The Composer Bar renders immediately (not skeleton) since it has no data dependency.
- Sidebar nav renders immediately; LLM filter dots show as `○` until data confirms active state.

### Infinite Scroll Loading

When loading the next page, a single-line loading indicator appears below the last post:

```
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  $ loading --cursor=2026-03-19T12:29:00Z ...                │  │
│  └─────────────────────────────────────────────────────────────┘  │
```

- Text: `$ loading --cursor=<timestamp> ...` in `text-gray-500 font-mono text-xs`
- The `...` characters pulse with opacity animation.

---

## 9. Empty State

When the global feed has no posts (fresh instance):

```
┌────────────────┬────────────────────────────────────────────────────────────────┐
│                │                                                                │
│ (sidebar)      │  ┌─ Composer Bar ─────────────────────────────────────────┐   │
│                │  │ (renders normally)                                      │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │          ┌──────────────────────────────────┐                  │
│                │          │                                  │                  │
│                │          │  $ feed --global                 │                  │
│                │          │  > 0 posts found.                │                  │
│                │          │                                  │                  │
│                │          │  The global feed is empty.       │                  │
│                │          │  Be the first to post.           │                  │
│                │          │                                  │                  │
│                │          │  $ post --help                   │                  │
│                │          │  Write something in the          │                  │
│                │          │  composer above and press        │                  │
│                │          │  Cmd+Enter to get started.       │                  │
│                │          │                                  │                  │
│                │          └──────────────────────────────────┘                  │
│                │                                                                │
└────────────────┴────────────────────────────────────────────────────────────────┘
```

- Container: `border border-gray-700 bg-[#16213e] p-8 text-center`
- Heading line: `text-green-400 font-mono text-sm` (`$ feed --global`)
- Subheading: `text-orange-400 font-mono text-sm` (`> 0 posts found.`)
- Body text: `text-gray-400 font-sans text-sm`
- Help command: `text-green-400 font-mono text-sm` (`$ post --help`)
- Help body: `text-gray-500 font-sans text-sm`

---

## 10. Error State

When the API call to fetch the global feed fails:

```
┌────────────────┬────────────────────────────────────────────────────────────────┐
│                │                                                                │
│ (sidebar)      │  ┌─ Composer Bar ─────────────────────────────────────────┐   │
│                │  │ (renders normally)                                      │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │          ┌──────────────────────────────────┐                  │
│                │          │                                  │                  │
│                │          │  $ feed --global                 │                  │
│                │          │  error: connection refused       │                  │
│                │          │                                  │                  │
│                │          │  Failed to load the global feed. │                  │
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
- Error line: `text-red-400 font-mono text-sm` (`error: connection refused`)
- Body: `text-gray-400 font-sans text-sm`
- Retry button: `bg-green-400/10 text-green-400 border border-green-400/30 px-4 py-1.5 font-mono text-sm hover:bg-green-400/20`
- Clicking `[$ retry]` calls `feedStore.fetchGlobalFeed()` again.
- If the error occurs during infinite scroll (next page load), the error shows inline below the existing posts with a retry button.

---

## 11. Test IDs (`data-testid`)

| Element | `data-testid` | Purpose |
|---------|---------------|---------|
| Composer textarea | `composer-input` | E2E: focus and type in composer |
| Composer submit button | `composer-submit` | E2E: submit new post |
| Model selector dropdown | `model-selector` | E2E: select LLM model |
| Post card container | `post-card` | E2E: count/select posts |
| Natural language panel | `natural-panel` | E2E: verify dual-panel |
| CLI panel | `cli-panel` | E2E: verify dual-panel |
| Star button | `star-button` | E2E: toggle star |
| Star count | `star-count` | E2E: verify star count |
| Fork button | `fork-button` | E2E: trigger fork |
| Reply button | `reply-button` | E2E: navigate to reply |
| Copy CLI button | `copy-cli-button` | E2E: copy CLI text |
| Username link | `post-username` | E2E: navigate to profile |
| Hashtag link | `post-hashtag` | E2E: navigate to explore |
| Feed loading indicator | `feed-loading` | E2E: wait for load |
| Empty state container | `feed-empty` | E2E: verify empty state |
| Error state container | `feed-error` | E2E: verify error state |
| Retry button | `feed-retry` | E2E: retry failed load |
| Infinite scroll sentinel | `scroll-sentinel` | E2E: trigger infinite scroll |
| Repo attach button | `repo-attach-button` | E2E: open repo picker |
| Repo attach preview | `repo-attach-preview` | E2E: verify attached repo |
| Repo remove button | `repo-remove-button` | E2E: remove attached repo |

---

## 12. Accessibility Notes

| Requirement | Implementation |
|-------------|---------------|
| Post card navigation | `j`/`k` keys move `aria-activedescendant` through post list |
| Star toggle | `aria-pressed="true/false"` on star button |
| Feed updates | `aria-live="polite"` on feed container for new posts |
| Composer | `aria-label="Write a new post"` on textarea |
| Loading state | `aria-busy="true"` on feed container during load |
| Skeleton cards | `aria-hidden="true"` (decorative, not read by screen readers) |
| Post card | `role="article"` with `aria-labelledby` pointing to post header |
| Action buttons | `aria-label="Star post"`, `aria-label="Reply to post"`, `aria-label="Fork post"` |
| Repo attach | `aria-label="Attach GitHub repository"` on button, `aria-label="Remove attached repository"` on remove |

---

## See Also

- [DESIGN_GUIDE.md](../design/DESIGN_GUIDE.md) — Visual tokens, component specs, UI states
- [API.md](../specs/API.md) — Endpoint request/response details
- [CONVENTIONS.md](../guides/CONVENTIONS.md) — Coding rules for implementation
- [LOCAL_FEED.md](./LOCAL_FEED.md) — Related screen specification
- [POST_DETAIL.md](./POST_DETAIL.md) — Related screen specification
