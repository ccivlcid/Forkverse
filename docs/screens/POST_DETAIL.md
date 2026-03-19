# POST DETAIL — Screen Specification

## 1. Screen Overview

| Property | Value |
|----------|-------|
| Route | `/post/:id` |
| Title | `terminal.social / post` |
| Auth required | No (viewing). Yes (reply, star, fork) |
| Description | Single post with full dual-panel display and threaded replies below. |

---

## 2. Desktop Wireframe

```
┌──────────────────────────────────────────────────────────────┐
│ terminal.social / post / 01912345...                          │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                 │
│ // navigate│  ┌─ Back ─────────────────────────────────┐     │
│ $ feed     │  │ ← Back to feed                          │     │
│   feed loc │  └────────────────────────────────────────┘     │
│   following│                                                 │
│   explore  │  ┌─ Forked From (if fork) ────────────────┐     │
│            │  │ ◇ Forked from @original_user            │     │
│ // by LLM  │  └────────────────────────────────────────┘     │
│ ● claude   │                                                 │
│ ○ gpt-4o   │  ┌─ Main Post (full width) ──────────────┐     │
│ ○ llama-3  │  │ @jiyeon_dev  jiyeon.kim · 3m ago   ko  │     │
│ ○ custom   │  │ ┌─ Natural ──────────────────────────┐ │     │
│            │  │ │                                     │ │     │
│ // me      │  │ │  바이브코딩하다가 느낀건데,         │ │     │
│ @you       │  │ │  우리가 AI한테 맞춰가는 거          │ │     │
│ my posts   │  │ │  아닐까요?                          │ │     │
│ starred    │  │ │  #vibe-coding #thoughts             │ │     │
│            │  │ │                                     │ │     │
│            │  │ └─────────────────────────────────────┘ │     │
│            │  │ ┌─ CLI — open source ────────── copy ┐ │     │
│            │  │ │                                     │ │     │
│            │  │ │  post --user=jiyeon.kim \           │ │     │
│            │  │ │    --lang=ko \                      │ │     │
│            │  │ │    --message="observing AI          │ │     │
│            │  │ │    language convergence..." \       │ │     │
│            │  │ │    --tags=vibe-coding,thoughts \    │ │     │
│            │  │ │    --visibility=public              │ │     │
│            │  │ │                                     │ │     │
│            │  │ └─────────────────────────────────────┘ │     │
│            │  │                                         │     │
│            │  │ ↩ reply 14  ◇ fork 7  ★ star 42       │     │
│            │  └────────────────────────────────────────┘     │
│            │                                                 │
│            │  ┌─ Replies (14) ─────────────────────────┐     │
│            │  │                                         │     │
│            │  │ ┌─ Reply ──────────────────────────┐   │     │
│            │  │ │ @0xmitsuki · 11m ago         en  │   │     │
│            │  │ │ ┌─ Natural ─┐ ┌─ CLI ─────────┐ │   │     │
│            │  │ │ │ CLI is the│ │ reply --to=... │ │   │     │
│            │  │ │ │ new lingua│ │   --message=.. │ │   │     │
│            │  │ │ └───────────┘ └───────────────┘ │   │     │
│            │  │ │ ↩ 9  ◇ 3  ★ 31                 │   │     │
│            │  │ └──────────────────────────────────┘   │     │
│            │  │                                         │     │
│            │  │ ┌─ Reply ──────────────────────────┐   │     │
│            │  │ │ ...                               │   │     │
│            │  │ └──────────────────────────────────┘   │     │
│            │  └────────────────────────────────────────┘     │
│            │                                                 │
│            │  ┌─ Reply Composer ───────────────────────┐     │
│            │  │ > Write your reply...                   │     │
│            │  │ [claude-sonnet ▾]        [LLM → CLI ↗] │     │
│            │  └────────────────────────────────────────┘     │
│            │                                                 │
└────────────┴─────────────────────────────────────────────────┘
```

---

## 3. Mobile Wireframe

```
┌──────────────────────────────┐
│ ← Back   terminal.social    │
├──────────────────────────────┤
│ @jiyeon_dev · 3m ago     ko │
│                              │
│ 바이브코딩하다가 느낀건데,   │
│ 우리가 AI한테 맞춰가는 거    │
│ 아닐까요?                    │
│ #vibe-coding #thoughts       │
│ ─────────────────────────── │
│ CLI — open source      copy  │
│ post --user=jiyeon.kim \     │
│   --lang=ko \                │
│   --message="observing..."   │
│ ─────────────────────────── │
│ ↩ 14  ◇ 7  ★ 42            │
├──────────────────────────────┤
│ Replies (14)                 │
├──────────────────────────────┤
│ @0xmitsuki · 11m ago     en │
│ CLI is the new lingua...     │
│ reply --to=... --message=..  │
│ ↩ 9  ◇ 3  ★ 31             │
├──────────────────────────────┤
│ > Write your reply...        │
│ [claude-sonnet ▾] [Submit]   │
└──────────────────────────────┘
```

---

## 4. Component Tree

```
PostDetailPage (packages/client/src/pages/post-detail.tsx)
├── Shell
│   ├── Sidebar
│   └── Header (breadcrumb: terminal.social / post / {id})
├── BackButton (← Back to feed)
├── ForkedFromBanner (if post.forkedFromId exists)
│   └── Link to original post
├── PostCard (full-width, larger variant)
│   ├── DualPanel (stacked on mobile — natural on top, CLI below)
│   ├── ActionBar (reply, fork, star)
│   └── LangBadge
├── ReplySection
│   ├── ReplyCount heading ("Replies (14)")
│   └── PostCard[] (compact variant for each reply)
│       ├── DualPanel
│       └── ActionBar
└── ReplyComposer (packages/client/src/components/post/reply-composer.tsx)
    ├── TextArea (reply input)
    ├── ModelSelect
    └── SubmitButton
```

---

## 5. State Requirements

```typescript
// postStore
{
  currentPost: PostDetail | null   // includes replies[]
  isLoading: boolean
  error: string | null
}

// postStore (composer)
{
  replyDraft: string
  replyCliPreview: string | null
  selectedModel: LlmModel
}

// authStore (for interaction permissions)
{
  user: User | null
}
```

---

## 6. API Calls

| Trigger | Endpoint | Notes |
|---------|----------|-------|
| On mount | `GET /api/posts/:id` | Returns post + replies |
| Star click | `POST /api/posts/:id/star` | Toggle star |
| Fork click | `POST /api/posts/:id/fork` | Fork to own timeline |
| Reply submit (step 1) | `POST /api/llm/transform` | Transform reply to CLI |
| Reply submit (step 2) | `POST /api/posts/:id/reply` | Create reply |
| Copy CLI | None (clipboard API) | Copy CLI text |
| Back button | Client-side navigation | `router.back()` |

---

## 7. User Interactions

| Action | Element | Behavior |
|--------|---------|----------|
| Click ← Back | BackButton | Navigate to previous page |
| Click ★ | ActionBar | Toggle star, update count |
| Click ◇ fork | ActionBar | Fork post, show success toast |
| Click ↩ reply | ActionBar | Scroll to reply composer, focus input |
| Click forked-from link | ForkedFromBanner | Navigate to original post |
| Click @username | PostCard header | Navigate to `/@:username` |
| Click #hashtag | PostCard body | Navigate to explore with tag filter |
| Click copy | CLI panel | Copy CLI text to clipboard, show "Copied!" toast |
| Cmd+Enter | ReplyComposer | Submit reply |
| `s` | Keyboard | Star current post |
| `r` | Keyboard | Focus reply composer |
| `f` | Keyboard | Fork current post |
| `Escape` | Keyboard | Blur reply composer |

---

## 8. Loading State

```
┌─ Back ───────────────────────────┐
│ ← Back to feed                    │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ ████████████ · ██████       ██  │  ← skeleton header
│ ┌────────────────────────────┐   │
│ │ ████████████████████████   │   │  ← skeleton natural panel
│ │ ██████████████████         │   │
│ │ ████████████               │   │
│ └────────────────────────────┘   │
│ ┌────────────────────────────┐   │
│ │ ████████████████████████   │   │  ← skeleton CLI panel
│ │ ██████████████████         │   │
│ └────────────────────────────┘   │
│ ████  ████  ████                 │
└──────────────────────────────────┘

Replies loading...
┌──────────────────────────────────┐
│ ████████ · ██████                │  × 3 skeleton replies
│ ████████████████████             │
└──────────────────────────────────┘
```

---

## 9. Empty State (No Replies)

```
┌─ Replies (0) ────────────────────┐
│                                  │
│     No replies yet.              │
│     Be the first to reply.      │
│                                  │
└──────────────────────────────────┘

┌─ Reply Composer ─────────────────┐
│ > Write your reply...            │
│ [claude-sonnet ▾]    [Submit]    │
└──────────────────────────────────┘
```

---

## 10. Error State

### Post Not Found (404)
```
┌──────────────────────────────────┐
│                                  │
│   $ cat /post/unknown            │
│   Error: Post not found (404)    │
│                                  │
│   [← Back to feed]              │
│                                  │
└──────────────────────────────────┘
```

### Failed to Load
```
┌──────────────────────────────────┐
│                                  │
│   $ cat /post/:id                │
│   Error: Failed to load (500)    │
│                                  │
│   [Retry]                        │
│                                  │
└──────────────────────────────────┘
```
