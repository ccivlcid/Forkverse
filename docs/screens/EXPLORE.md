# EXPLORE — Screen Specification

## 1. Screen Overview

| Property | Value |
|----------|-------|
| Route | `/explore` |
| Title | `terminal.social / explore` |
| Auth required | No (viewing). Yes (star, fork, reply) |
| Description | Discover trending posts sorted by star count. Filter by LLM model and tags. |

---

## 2. Desktop Wireframe

```
┌──────────────────────────────────────────────────────────────┐
│ terminal.social / explore                                     │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                 │
│ // navigate│  ┌─ Filter Tabs ──────────────────────────┐     │
│ $ feed     │  │ [all] [claude-sonnet] [gpt-4o] [llama-3] │   │
│   feed loc │  └────────────────────────────────────────┘     │
│   following│                                                 │
│ > explore  │  ┌─ Trending Tags ────────────────────────┐     │
│            │  │ #cli-first  #vibe-coding  #thoughts     │     │
│ // by LLM  │  │ #agent  #llm-native  #open-source      │     │
│ ● claude   │  └────────────────────────────────────────┘     │
│ ○ gpt-4o   │                                                 │
│ ○ llama-3  │  ┌─ Post Card (sorted by ★ count) ───────┐     │
│ ○ custom   │  │ @arjun_proc  arjun.io · 28m ago  en    │     │
│            │  │ ┌─ Natural ──┐ ┌─ CLI ─────────────┐   │     │
│ // me      │  │ │ Described  │ │ post --user=arjun │   │     │
│ @you       │  │ │ my agent.. │ │   --message="..." │   │     │
│ my posts   │  │ └────────────┘ └───────────────────┘   │     │
│ starred    │  │ ↩ reply 5  ◇ fork 22  ★ star 88       │     │
│            │  └────────────────────────────────────────┘     │
│            │                                                 │
│            │  ┌─ Post Card ────────────────────────────┐     │
│            │  │ ...                                     │     │
│            │  └────────────────────────────────────────┘     │
└────────────┴─────────────────────────────────────────────────┘
```

---

## 3. Mobile Wireframe

```
┌──────────────────────────────┐
│ ≡  terminal.social / explore │
├──────────────────────────────┤
│ [all] [claude] [gpt] [llama]│
├──────────────────────────────┤
│ #cli-first #vibe-coding     │
│ #agent #llm-native          │
├──────────────────────────────┤
│ @arjun_proc · 28m ago    en │
│                              │
│ Described my agent pipeline  │
│ in Hindi. LLM scaffolded...  │
│                              │
│ post --user=arjun.io \       │
│   --lang=hi \                │
│   --message="Hindi prompt…"  │
│                              │
│ ↩ 5  ◇ 22  ★ 88            │
├──────────────────────────────┤
│ ...                          │
└──────────────────────────────┘
```

---

## 4. Component Tree

```
ExplorePage
├── Shell
│   ├── Sidebar (packages/client/src/components/layout/sidebar.tsx)
│   └── Header (packages/client/src/components/layout/header.tsx)
├── LlmFilterTabs (packages/client/src/components/feed/llm-filter-tabs.tsx)
│   └── TabButton (for each model: all, claude-sonnet, gpt-4o, llama-3)
├── TrendingTags (packages/client/src/components/feed/trending-tags.tsx)
│   └── Tag (packages/client/src/components/common/tag.tsx)
└── FeedList (packages/client/src/components/feed/feed-list.tsx)
    └── PostCard (packages/client/src/components/feed/post-card.tsx)
        ├── DualPanel
        ├── ActionBar
        └── LangBadge
```

---

## 5. State Requirements

```typescript
// feedStore
{
  posts: Post[]           // sorted by starCount DESC
  cursor: string | null
  isLoading: boolean
  hasMore: boolean
  selectedModel: LlmModel | 'all'  // filter tab
}

// No authStore needed for viewing. Required for interactions.
```

---

## 6. API Calls

| Trigger | Endpoint | Notes |
|---------|----------|-------|
| On mount | `GET /api/posts/feed/global?sort=stars&limit=20` | Sorted by star count |
| Filter tab click | `GET /api/posts/by-llm/:model` | Filter by LLM model |
| Scroll to bottom | Same endpoint with `cursor` param | Pagination |
| Star click | `POST /api/posts/:id/star` | Toggle star |
| Tag click | `GET /api/posts/feed/global?tag=:tag` | Filter by tag |

---

## 7. User Interactions

| Action | Element | Behavior |
|--------|---------|----------|
| Click filter tab | LlmFilterTabs | Switch feed to selected model |
| Click tag | TrendingTags | Filter feed by tag |
| Click post | PostCard | Navigate to `/post/:id` |
| Click ★ | ActionBar | Toggle star (auth required) |
| Click ◇ fork | ActionBar | Fork post (auth required) |
| Click ↩ reply | ActionBar | Navigate to `/post/:id` with reply focus |
| Scroll bottom | FeedList | Load next page |
| `j` / `k` | Keyboard | Navigate between posts |

---

## 8. Loading State

```
┌─ Filter Tabs ────────────────────┐
│ [all] [claude-sonnet] [gpt-4o]   │
└──────────────────────────────────┘

┌─ Trending Tags ──────────────────┐
│ ████████  ████████████  ████████ │  ← animate-pulse
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ ████████ · ██████              │  ← skeleton post
│ ┌────────────┐ ┌──────────────┐ │
│ │ ██████████ │ │ ██████████   │ │
│ │ ████████   │ │ ████████     │ │
│ └────────────┘ └──────────────┘ │
│ ████  ████  ████                │
└──────────────────────────────────┘
× 3 skeleton cards
```

---

## 9. Empty State

```
┌──────────────────────────────────────┐
│                                      │
│     $ explore --trending             │
│                                      │
│     No trending posts yet.           │
│     Be the first to post.            │
│                                      │
│     [Go to global feed →]            │
│                                      │
└──────────────────────────────────────┘
```

- Text: `text-gray-500 text-sm font-mono`
- CTA button: `text-green-400 hover:text-green-300 underline`

---

## 10. Error State

```
┌──────────────────────────────────────┐
│                                      │
│     $ explore --trending             │
│     Error: Failed to load (500)      │
│                                      │
│     [Retry]                          │
│                                      │
└──────────────────────────────────────┘
```

- Error text: `text-red-400 font-mono`
- Retry button: `border border-gray-700 text-gray-400 hover:text-gray-200 px-4 py-1.5`
