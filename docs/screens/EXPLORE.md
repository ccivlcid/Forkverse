# EXPLORE.md — Explore Screen Specification

> **Source of truth** for the Explore screen (`/explore`).

---

## 1. Screen Overview

| Property      | Value                                                        |
|---------------|--------------------------------------------------------------|
| Route         | `/explore`                                                   |
| Title         | `terminal.social / explore`                                  |
| Description   | Discovery page showing trending posts sorted by star count (not chronological). Features a trending tag cloud, "by LLM" filter tabs, and optional tag query filtering. Posts are ranked by popularity. |
| Auth Required | No (viewing). Yes (starring, forking, replying).             |

---

## 2. Desktop Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ terminal.social / explore                                          @user ▾     │
├────────────────┬────────────────────────────────────────────────────────────────┤
│                │                                                                │
│ // navigate    │  ┌─ LLM Filter Tabs ─────────────────────────────────────┐   │
│   feed --global│  │ [all] [claude-sonnet] [gpt-4o] [gemini] [llama-3]              │   │
│   feed --local │  └────────────────────────────────────────────────────────┘   │
│ $ explore      │                                                                │
│                │  ┌─ Trending Tags ───────────────────────────────────────┐   │
│ // by LLM      │  │ // trending tags                                      │   │
│ ● claude-sonnet│  │                                                        │   │
│ ○ gpt-4o       │  │ #cli-first  #vibe-coding  #thoughts  #agent           │   │
│ ○ llama-3      │  │ #llm-native  #open-source  #dev-life  #terminal       │   │
│                │  │ #polyglot  #fork-culture                               │   │
│ // me          │  │                                                        │   │
│ → @you.local   │  └────────────────────────────────────────────────────────┘   │
│   my posts     │                                                                │
│   starred      │  ┌─ Active Tag Filter (conditional) ─────────────────────┐   │
│                │  │ $ explore --tag=cli-first                   [× clear]  │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │  ┌─ Post Card (sorted by ★ count) ───────────────────────┐   │
│                │  │ @arjun_proc  arjun.io · 2h ago               --lang=hi │   │
│                │  ├──────────────────────────┬─────────────────────────────┤   │
│                │  │                          │ CLI — claude-sonnet    ⎘    │   │
│                │  │  Described my agent      │                             │   │
│                │  │  pipeline in Hindi.      │  post --user=arjun.io \     │   │
│                │  │  LLM scaffolded the CLI  │    --lang=hi \              │   │
│                │  │  perfectly. #agent        │    --message="Hindi prompt  │   │
│                │  │  #llm-native             │    pipeline..." \           │   │
│                │  │                          │    --tags=agent,llm-native  │   │
│                │  ├──────────────────────────┴─────────────────────────────┤   │
│                │  │  ↩ reply 5    ◇ fork 22    ★ 88                       │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │  ┌─ Post Card ────────────────────────────────────────────┐   │
│                │  │ @0xmitsuki  mitsuki.sh · 4h ago              --lang=en │   │
│                │  ├──────────────────────────┬─────────────────────────────┤   │
│                │  │                          │ CLI — gpt-4o          ⎘     │   │
│                │  │  CLI is the new lingua   │  post --user=0xmitsuki.sh \ │   │
│                │  │  franca. Think in any    │    --lang=en \              │   │
│                │  │  language, post in any   │    --message="CLI flags..." │   │
│                │  │  language. #cli-first    │    --tags=cli-first         │   │
│                │  ├──────────────────────────┴─────────────────────────────┤   │
│                │  │  ↩ reply 9    ◇ fork 3    ★ 31                        │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │  ┌─ Post Card ────────────────────────────────────────────┐   │
│                │  │ @jiyeon_dev  jiyeon.kim · 6h ago              --lang=ko │   │
│                │  ├──────────────────────────┬─────────────────────────────┤   │
│                │  │                          │ CLI — llama-3         ⎘     │   │
│                │  │  Natural language text   │  post --user=jiyeon.kim \   │   │
│                │  │  about vibe coding...    │    --lang=ko \              │   │
│                │  │  #vibe-coding            │    --message="..." \        │   │
│                │  │                          │    --tags=vibe-coding       │   │
│                │  ├──────────────────────────┴─────────────────────────────┤   │
│                │  │  ↩ reply 14    ◇ fork 7    ★ 24                       │   │
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
│ ┌─ LLM Filter Tabs ──────────┐│
│ │ [all] [claude] [gpt] [gemini] [llama]││
│ └─────────────────────────────┘│
│                                 │
│ ┌─ Trending Tags ─────────────┐│
│ │ // trending tags             ││
│ │ #cli-first  #vibe-coding    ││
│ │ #agent  #llm-native         ││
│ │ #open-source  #thoughts     ││
│ └─────────────────────────────┘│
│                                 │
│ ┌─ Tag Filter (conditional) ─┐│
│ │ --tag=cli-first       [×]   ││
│ └─────────────────────────────┘│
│                                 │
│ ┌─ Post Card ─────────────────┐│
│ │ @arjun_proc · 2h   --lang=hi││
│ ├─────────────────────────────┤│
│ │ Described my agent          ││
│ │ pipeline in Hindi.          ││
│ │ LLM scaffolded the CLI     ││
│ │ perfectly.                  ││
│ │ #agent #llm-native          ││
│ ├─────────────────────────────┤│
│ │ CLI — claude-sonnet    ⎘    ││
│ │ post --user=arjun.io \      ││
│ │   --lang=hi \               ││
│ │   --message="Hindi prompt   ││
│ │   pipeline..." \            ││
│ │   --tags=agent,llm-native   ││
│ ├─────────────────────────────┤│
│ │  ↩ 5   ◇ 22   ★ 88        ││
│ └─────────────────────────────┘│
│                                 │
│ ┌─ Post Card ─────────────────┐│
│ │ @0xmitsuki · 4h    --lang=en││
│ ├─────────────────────────────┤│
│ │ CLI is the new lingua       ││
│ │ franca...                   ││
│ │ #cli-first                  ││
│ ├─────────────────────────────┤│
│ │ CLI — gpt-4o           ⎘    ││
│ │ post --user=0xmitsuki.sh \  ││
│ │   --lang=en ...             ││
│ ├─────────────────────────────┤│
│ │  ↩ 9   ◇ 3   ★ 31         ││
│ └─────────────────────────────┘│
│                                 │
│       Loading more posts...     │
│                                 │
└─────────────────────────────────┘
```

---

## 4. Component Tree

```
ExplorePage                             src/pages/ExplorePage.tsx
├── AppShell                            src/components/layout/AppShell.tsx
│   ├── HeaderBar                       src/components/layout/HeaderBar.tsx
│   │   ├── Logo                        (inline)
│   │   ├── Breadcrumbs                 src/components/layout/Breadcrumbs.tsx
│   │   │   └── crumbs: ["explore"]
│   │   └── UserMenu                   src/components/layout/UserMenu.tsx
│   ├── Sidebar                         src/components/layout/Sidebar.tsx
│   │   ├── NavSection                  src/components/layout/NavSection.tsx
│   │   │   └── activeItem: "explore"
│   │   ├── LlmFilterSection            src/components/layout/LlmFilterSection.tsx
│   │   └── MeSection                   src/components/layout/MeSection.tsx
│   └── MainContent                     (slot)
│       ├── LlmFilterTabs              src/components/explore/LlmFilterTabs.tsx
│       │   └── TabButton[]            (inline: all, claude-sonnet, gpt-4o, gemini-2.5-pro, llama-3)
│       ├── TrendingTags               src/components/explore/TrendingTags.tsx
│       │   └── TagBadge[]             src/components/explore/TagBadge.tsx
│       ├── ActiveTagFilter            src/components/explore/ActiveTagFilter.tsx
│       │   └── (renders only when ?tag= query param is present)
│       └── FeedList                    src/components/feed/FeedList.tsx
│           ├── PostCard                src/components/post/PostCard.tsx
│           │   ├── PostHeader          src/components/post/PostHeader.tsx
│           │   ├── DualPanel           src/components/post/DualPanel.tsx
│           │   │   ├── NaturalPanel    src/components/post/NaturalPanel.tsx
│           │   │   └── CliPanel        src/components/post/CliPanel.tsx
│           │   │       └── CliHighlighter  src/components/post/CliHighlighter.tsx
│           │   └── ActionBar           src/components/post/ActionBar.tsx
│           └── InfiniteScrollTrigger   src/components/feed/InfiniteScrollTrigger.tsx
```

---

## 5. State Requirements

### Zustand Stores Used

**`exploreStore`** — `src/stores/exploreStore.ts`

```typescript
interface ExploreState {
  posts: Post[];
  cursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;

  // Filters
  activeModel: LlmModel | 'all';
  activeTag: string | null;
  trendingTags: string[];
  trendingTagsLoading: boolean;

  // Actions
  fetchTrending: () => Promise<void>;
  fetchNextPage: () => Promise<void>;
  fetchTrendingTags: () => Promise<void>;
  setModel: (model: LlmModel | 'all') => void;
  setTag: (tag: string | null) => void;
  starPost: (postId: string) => void;
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

### Data Shapes

Uses the same `Post`, `PostUser`, and `LlmModel` types defined in `src/types/post.ts`.

Trending tags response:

```typescript
interface TrendingTagsResponse {
  data: {
    tag: string;
    count: number;
  }[];
}
```

---

## 6. API Calls

### On Mount

| Trigger       | Endpoint                                            | Method | Auth  | Purpose                           |
|---------------|-----------------------------------------------------|--------|-------|-----------------------------------|
| Page load     | `/api/posts/feed/global?sort=stars&limit=20`        | GET    | No    | Load trending posts (by star count) |
| Page load     | `/api/auth/me`                                      | GET    | Yes*  | Check auth status for interactions |
| Page load     | `/api/posts/trending-tags`                          | GET    | No    | Load trending tag cloud           |

*Only fires if a session cookie exists.

If the URL contains `?tag=X`, on mount the endpoint becomes:
`/api/posts/feed/global?sort=stars&tag=X&limit=20`

### On User Interaction

| Trigger                | Endpoint                                         | Method | Auth | Purpose                           |
|------------------------|--------------------------------------------------|--------|------|-----------------------------------|
| Click LLM filter tab  | `/api/posts/by-llm/:model?sort=stars`            | GET    | No   | Filter trending posts by LLM      |
| Click "all" tab        | `/api/posts/feed/global?sort=stars`               | GET    | No   | Reset to all models                |
| Click tag badge        | `/api/posts/feed/global?sort=stars&tag=X`         | GET    | No   | Filter by tag                     |
| Click [x clear] tag   | `/api/posts/feed/global?sort=stars`               | GET    | No   | Remove tag filter                  |
| Scroll to bottom      | Same endpoint with `&cursor=X`                    | GET    | No   | Load next page                    |
| Click ★ star          | `/api/posts/:id/star`                             | POST   | Yes  | Toggle star on post               |
| Click ◇ fork          | `/api/posts/:id/fork`                             | POST   | Yes  | Fork post to own timeline         |
| Click ↩ reply         | Navigate to `/post/:id`                           | —      | —    | Navigate to post detail           |

---

## 7. User Interactions

### Mouse / Touch

| Element                 | Action    | Result                                                  |
|-------------------------|-----------|----------------------------------------------------------|
| LLM filter tab (all)   | Click     | Show all trending posts, reset model filter              |
| LLM filter tab (model) | Click     | Filter trending posts by selected LLM model              |
| Tag badge (cloud)      | Click     | Apply tag filter, update URL to `/explore?tag=X`, refetch |
| [x clear] tag filter   | Click     | Remove tag filter, update URL to `/explore`, refetch     |
| Post card              | Click     | Navigate to `/post/:id`                                  |
| ↩ reply count          | Click     | Navigate to `/post/:id` with reply composer focused      |
| ◇ fork count           | Click     | POST fork, optimistic update forkCount +1                |
| ★ star count           | Click     | POST toggle star, optimistic update starCount +/-1       |
| @username              | Click     | Navigate to `/user/@username`                            |
| #hashtag (in post)     | Click     | Apply tag filter (same as clicking tag badge)            |
| ⎘ copy (CLI panel)     | Click     | Copy CLI text to clipboard, show "Copied!" flash        |
| Nav items (sidebar)    | Click     | Navigate to corresponding route                         |

### Keyboard Shortcuts

| Key          | Context            | Action                                       |
|--------------|--------------------|----------------------------------------------|
| `j`          | Not in input       | Move focus to next post                      |
| `k`          | Not in input       | Move focus to previous post                  |
| `s`          | Post focused       | Toggle star on focused post                  |
| `r`          | Post focused       | Navigate to post detail with reply focus     |
| `f`          | Post focused       | Fork focused post                            |
| `o` / `Enter`| Post focused      | Open post detail                              |
| `Escape`     | Tag filter active  | Clear active tag filter                       |

---

## 8. Loading State

### Initial Page Load Skeleton

```
┌────────────────┬────────────────────────────────────────────────────────────────┐
│                │                                                                │
│ (sidebar)      │  ┌─ LLM Filter Tabs (render immediately) ───────────────┐   │
│                │  │ [all] [claude-sonnet] [gpt-4o] [gemini] [llama-3]              │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │  ┌─ Trending Tags Skeleton ──────────────────────────────┐   │
│                │  │ // trending tags                                      │   │
│                │  │                                                        │   │
│                │  │ ████████  ████████████  ████████  ██████               │   │
│                │  │ ██████████  ████████████  ████████                     │   │
│                │  │                                                        │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │  ┌─ Skeleton Card ────────────────────────────────────────┐   │
│                │  │ ████████  ████████ · ██ ago                  ████████ │   │
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

- LLM filter tabs render immediately (no data dependency). All tabs are clickable from the start.
- Trending tags section shows 2 rows of skeleton tag badges, pulsing with opacity animation.
- Show 5 skeleton post cards.
- Pulsing opacity animation, no shimmer.

### Infinite Scroll Loading

```
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  $ explore --sort=stars --cursor=<timestamp> ...            │  │
│  └─────────────────────────────────────────────────────────────┘  │
```

- Same pulsing `...` style as other feed screens.

### Filter Change Loading

When switching LLM tabs or tag filters, the existing posts fade to `opacity-50` while new data loads. Posts are replaced (not appended) once the response arrives.

---

## 9. Empty State

### No Trending Posts (fresh instance)

```
┌────────────────┬────────────────────────────────────────────────────────────────┐
│                │                                                                │
│ (sidebar)      │  ┌─ LLM Filter Tabs ────────────────────────────────────┐   │
│                │  │ [all] [claude-sonnet] [gpt-4o] [gemini] [llama-3]              │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │  ┌─ Trending Tags ──────────────────────────────────────┐   │
│                │  │ // trending tags                                      │   │
│                │  │ No tags trending yet.                                 │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │          ┌──────────────────────────────────┐                  │
│                │          │                                  │                  │
│                │          │  $ explore --trending            │                  │
│                │          │  > 0 posts found.                │                  │
│                │          │                                  │                  │
│                │          │  No trending posts yet.          │                  │
│                │          │  Be the first to post and get    │                  │
│                │          │  starred.                        │                  │
│                │          │                                  │                  │
│                │          │  [$ feed --global]               │                  │
│                │          │                                  │                  │
│                │          └──────────────────────────────────┘                  │
│                │                                                                │
└────────────────┴────────────────────────────────────────────────────────────────┘
```

### No Posts for Selected Filter

When a filter (LLM model or tag) returns zero results:

```
│                │          ┌──────────────────────────────────┐                  │
│                │          │                                  │                  │
│                │          │  $ explore --model=llama-3       │                  │
│                │          │  > 0 posts found.                │                  │
│                │          │                                  │                  │
│                │          │  No posts found for this filter. │                  │
│                │          │  Try a different model or clear  │                  │
│                │          │  your filters.                   │                  │
│                │          │                                  │                  │
│                │          │  [$ clear filters]               │                  │
│                │          │                                  │                  │
│                │          └──────────────────────────────────┘                  │
```

- Container: `border border-gray-700 bg-[#16213e] p-8 text-center`
- Command line: `text-green-400 font-mono text-sm`
- Subheading: `text-orange-400 font-mono text-sm`
- Body: `text-gray-400 font-sans text-sm`
- CTA button: `bg-green-400/10 text-green-400 border border-green-400/30 px-4 py-1.5 font-mono text-sm hover:bg-green-400/20`
- `[$ clear filters]` resets both model and tag filters, refetches with no filters.

---

## 10. Error State

### API Failure (Trending Feed)

```
┌────────────────┬────────────────────────────────────────────────────────────────┐
│                │                                                                │
│ (sidebar)      │  ┌─ LLM Filter Tabs ────────────────────────────────────┐   │
│                │  │ [all] [claude-sonnet] [gpt-4o] [gemini] [llama-3]              │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │          ┌──────────────────────────────────┐                  │
│                │          │                                  │                  │
│                │          │  $ explore --trending            │                  │
│                │          │  error: connection refused       │                  │
│                │          │                                  │                  │
│                │          │  Failed to load trending posts.  │                  │
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
- Clicking `[$ retry]` calls `exploreStore.fetchTrending()` again.

### Trending Tags Load Failure

If the trending tags endpoint fails but the posts load successfully:

- The trending tags section shows: `// trending tags -- error loading tags` in `text-red-400/60 font-mono text-xs`
- Posts still render normally below.
- No separate retry for tags; they will reload on next page visit.

### Inline Error (Infinite Scroll)

If pagination fails while scrolling:

```
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  $ explore --sort=stars --cursor=<timestamp>                │  │
│  │  error: request timeout                                     │  │
│  │                                         [$ retry]           │  │
│  └─────────────────────────────────────────────────────────────┘  │
```

- Existing posts remain visible.
- Retry button retries only the failed pagination request.

---

## 11. Test IDs (`data-testid`)

| Element | `data-testid` | Purpose |
|---------|---------------|---------|
| LLM filter tab (all) | `llm-tab-all` | E2E: reset model filter |
| LLM filter tab (model) | `llm-tab-{model}` | E2E: filter by model (e.g., `llm-tab-claude-sonnet`) |
| Trending tag badge | `tag-badge` | E2E: click tag filter |
| Active tag filter bar | `active-tag-filter` | E2E: verify active tag |
| Clear tag button | `clear-tag-button` | E2E: clear tag filter |
| Clear filters CTA | `clear-filters-cta` | E2E: reset all filters |
| Trending tags container | `trending-tags` | E2E: verify tag cloud |
| Explore empty state | `explore-empty` | E2E: verify empty state |
| Explore error state | `explore-error` | E2E: verify error state |

Inherits all PostCard test IDs from Global Feed spec.

---

## 12. Accessibility Notes

| Requirement | Implementation |
|-------------|---------------|
| LLM filter tabs | `role="tablist"` with `role="tab"` per tab, `aria-selected="true/false"` |
| Active tag filter | `aria-label="Filtering by tag: cli-first"` with close button `aria-label="Remove tag filter"` |
| Trending tags | `role="list"` with `role="listitem"` per tag badge |
| Sort order | `aria-label="Posts sorted by popularity"` on feed container |
| Filter change | `aria-live="polite"` announces "Showing posts filtered by claude-sonnet" |

---

## See Also

- [DESIGN_GUIDE.md](../guides/DESIGN_GUIDE.md) — Visual tokens, component specs, UI states
- [API.md](../specs/API.md) — Endpoint request/response details
- [CONVENTIONS.md](../guides/CONVENTIONS.md) — Coding rules for implementation
- [GLOBAL_FEED.md](./GLOBAL_FEED.md) — Related screen specification
- [POST_DETAIL.md](./POST_DETAIL.md) — Related screen specification
