# POST_DETAIL.md — Post Detail Screen Specification

> **Source of truth** for the Post Detail screen (`/post/:id`).

---

## 1. Screen Overview

| Property      | Value                                                        |
|---------------|--------------------------------------------------------------|
| Route         | `/post/:id`                                                  |
| Title         | `terminal.social / post --id=:id`                            |
| Description   | Displays a single post in full dual-panel format with its reply thread below. Includes a reply composer at the bottom. Shows forked-from link if the post is a fork. |
| Auth Required | No (viewing). Yes (replying, starring, forking).             |

---

## 2. Desktop Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ terminal.social / post --id=01912345                               @user ▾     │
├────────────────┬────────────────────────────────────────────────────────────────┤
│                │                                                                │
│ // navigate    │  ┌─ Back Button ──────────────────────────────────────────┐   │
│   feed --global│  │ ← back to feed                                        │   │
│   feed --local │  └────────────────────────────────────────────────────────┘   │
│   explore      │                                                                │
│                │  ┌─ Forked-From Banner (conditional) ─────────────────────┐   │
│ // by LLM      │  │ ◇ forked from @original_author · original post title   │   │
│ ● claude-sonnet│  └────────────────────────────────────────────────────────┘   │
│ ○ gpt-4o       │                                                                │
│ ○ llama-3      │  ┌─ Main Post (large) ───────────────────────────────────┐   │
│                │  │ @0xmitsuki  mitsuki.sh · 3m ago              --lang=en │   │
│ // me          │  ├──────────────────────────┬─────────────────────────────┤   │
│ → @you.local   │  │                          │ CLI — claude-sonnet    ⎘    │   │
│   my posts     │  │  CLI is the new lingua   │                             │   │
│   starred      │  │  franca. Think in any    │  post --user=0xmitsuki.sh \ │   │
│                │  │  language, post in any   │    --lang=en \              │   │
│                │  │  language. @jiyeon_dev   │    --message="CLI flags as  │   │
│                │  │  you're onto something. │    universal language        │   │
│                │  │  #cli-first             │    layer" \                  │   │
│                │  │                          │    --mention=jiyeon.kim \    │   │
│                │  │                          │    --tags=cli-first \       │   │
│                │  │                          │    --visibility=public      │   │
│                │  ├──────────────────────────┴─────────────────────────────┤   │
│                │  │  ↩ reply 9    ◇ fork 3    ★ 31                        │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │  ┌─ Replies Section ──────────────────────────────────────┐   │
│                │  │ // 9 replies                                           │   │
│                │  ├────────────────────────────────────────────────────────┤   │
│                │  │                                                        │   │
│                │  │  ┌─ Reply Card ───────────────────────────────────┐    │   │
│                │  │  │ @jiyeon_dev  jiyeon.kim · 2m ago     --lang=ko │    │   │
│                │  │  ├─────────────────────┬──────────────────────────┤    │   │
│                │  │  │ Totally agree!      │ reply --to=01912345 \    │    │   │
│                │  │  │ CLI is the          │   --message="..." \      │    │   │
│                │  │  │ universal language. │   --lang=ko              │    │   │
│                │  │  ├─────────────────────┴──────────────────────────┤    │   │
│                │  │  │  ↩ reply 0    ◇ fork 0    ★ 2                 │    │   │
│                │  │  └────────────────────────────────────────────────┘    │   │
│                │  │                                                        │   │
│                │  │  ┌─ Reply Card ───────────────────────────────────┐    │   │
│                │  │  │ @devpatel  devpatel.io · 1m ago     --lang=en │    │   │
│                │  │  ├─────────────────────┬──────────────────────────┤    │   │
│                │  │  │ Great observation!  │ reply --to=01912345 \    │    │   │
│                │  │  │                     │   --message="..." \      │    │   │
│                │  │  │                     │   --lang=en              │    │   │
│                │  │  ├─────────────────────┴──────────────────────────┤    │   │
│                │  │  │  ↩ reply 1    ◇ fork 0    ★ 5                 │    │   │
│                │  │  └────────────────────────────────────────────────┘    │   │
│                │  │                                                        │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │  ┌─ Reply Composer ───────────────────────────────────────┐   │
│                │  │ > reply --to=@0xmitsuki                                │   │
│                │  │ ┌──────────────────────────────────────────────────┐    │   │
│                │  │ │ Write your reply...                          |   │    │   │
│                │  │ └──────────────────────────────────────────────────┘    │   │
│                │  │ Cmd+Enter · reply   [claude-sonnet ▾]   [LLM → CLI ↗]  │   │
│                │  └────────────────────────────────────────────────────────┘   │
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
│ ← back to feed                  │
│                                 │
│ ┌─ Forked-From (conditional) ─┐│
│ │ ◇ forked from @author       ││
│ └─────────────────────────────┘│
│                                 │
│ ┌─ Main Post ─────────────────┐│
│ │ @0xmitsuki · 3m    --lang=en││
│ ├─────────────────────────────┤│
│ │ CLI is the new lingua       ││
│ │ franca. Think in any        ││
│ │ language, post in any       ││
│ │ language. @jiyeon_dev       ││
│ │ you're onto something.     ││
│ │ #cli-first                  ││
│ ├─────────────────────────────┤│
│ │ CLI — claude-sonnet    ⎘    ││
│ │ post --user=0xmitsuki.sh \  ││
│ │   --lang=en \               ││
│ │   --message="CLI flags..." \││
│ │   --mention=jiyeon.kim \    ││
│ │   --tags=cli-first \        ││
│ │   --visibility=public       ││
│ ├─────────────────────────────┤│
│ │  ↩ 9   ◇ 3   ★ 31         ││
│ └─────────────────────────────┘│
│                                 │
│ // 9 replies                    │
│ ─────────────────────────────── │
│                                 │
│ ┌─ Reply Card ────────────────┐│
│ │ @jiyeon_dev · 2m   --lang=ko││
│ ├─────────────────────────────┤│
│ │ Totally agree! CLI is       ││
│ │ the universal language.     ││
│ ├─────────────────────────────┤│
│ │ CLI — claude-sonnet    ⎘    ││
│ │ reply --to=01912345 \       ││
│ │   --message="..." --lang=ko ││
│ ├─────────────────────────────┤│
│ │  ↩ 0   ◇ 0   ★ 2          ││
│ └─────────────────────────────┘│
│                                 │
│ ┌─ Reply Card ────────────────┐│
│ │ @devpatel · 1m     --lang=en││
│ ├─────────────────────────────┤│
│ │ Great observation!          ││
│ ├─────────────────────────────┤│
│ │ CLI — gpt-4o           ⎘    ││
│ │ reply --to=01912345 \       ││
│ │   --message="..."           ││
│ ├─────────────────────────────┤│
│ │  ↩ 1   ◇ 0   ★ 5          ││
│ └─────────────────────────────┘│
│                                 │
│ ┌─ Reply Composer ────────────┐│
│ │ > reply --to=@0xmitsuki      ││
│ │ ┌─────────────────────────┐  ││
│ │ │ Write your reply...     │  ││
│ │ └─────────────────────────┘  ││
│ │ [claude-sonnet ▾] [LLM→CLI] ││
│ └──────────────────────────────┘│
│                                 │
└─────────────────────────────────┘
```

---

## 4. Component Tree

```
PostDetailPage                          src/pages/PostDetailPage.tsx
├── AppShell                            src/components/layout/AppShell.tsx
│   ├── HeaderBar                       src/components/layout/HeaderBar.tsx
│   │   ├── Logo                        (inline)
│   │   ├── Breadcrumbs                 src/components/layout/Breadcrumbs.tsx
│   │   │   └── crumbs: ["post", "--id=:id"]
│   │   └── UserMenu                   src/components/layout/UserMenu.tsx
│   ├── Sidebar                         src/components/layout/Sidebar.tsx
│   │   ├── NavSection                  src/components/layout/NavSection.tsx
│   │   │   └── activeItem: none (detail page)
│   │   ├── LlmFilterSection            src/components/layout/LlmFilterSection.tsx
│   │   └── MeSection                   src/components/layout/MeSection.tsx
│   └── MainContent                     (slot)
│       ├── BackButton                  src/components/navigation/BackButton.tsx
│       ├── ForkedFromBanner            src/components/post/ForkedFromBanner.tsx
│       │   └── (renders only if post.forkedFromId is not null)
│       ├── PostCard                    src/components/post/PostCard.tsx
│       │   ├── PostHeader              src/components/post/PostHeader.tsx
│       │   ├── DualPanel               src/components/post/DualPanel.tsx
│       │   │   ├── NaturalPanel        src/components/post/NaturalPanel.tsx
│       │   │   └── CliPanel            src/components/post/CliPanel.tsx
│       │   │       └── CliHighlighter  src/components/post/CliHighlighter.tsx
│       │   └── ActionBar               src/components/post/ActionBar.tsx
│       ├── ReplyThread                 src/components/post/ReplyThread.tsx
│       │   ├── ReplyCount              (inline, "// 9 replies")
│       │   └── PostCard[]              src/components/post/PostCard.tsx
│       │       └── (each reply reuses PostCard in compact variant)
│       └── ReplyComposer              src/components/composer/ReplyComposer.tsx
│           ├── ComposerTextarea        src/components/composer/ComposerTextarea.tsx
│           ├── ModelSelector           src/components/composer/ModelSelector.tsx
│           └── SubmitButton            src/components/composer/SubmitButton.tsx
```

---

## 5. State Requirements

### Zustand Stores Used

**`postDetailStore`** — `src/stores/postDetailStore.ts`

```typescript
interface PostDetailState {
  post: Post | null;
  replies: Post[];
  isLoading: boolean;
  error: string | null;
  forkedFrom: {
    id: string;
    messageRaw: string;
    user: PostUser;
  } | null;

  fetchPost: (id: string) => Promise<void>;
  addReply: (reply: Post) => void;
  starPost: (postId: string) => void;
  starReply: (replyId: string) => void;
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

**`replyStore`** — `src/stores/replyStore.ts`

```typescript
interface ReplyState {
  draft: string;
  cliPreview: string | null;
  selectedModel: LlmModel;
  isTransforming: boolean;
  isSubmitting: boolean;
  parentId: string | null;

  setDraft: (text: string) => void;
  setModel: (model: LlmModel) => void;
  setParentId: (id: string) => void;
  transformToCli: () => Promise<void>;
  submitReply: () => Promise<void>;
  resetDraft: () => void;
}
```

### Data Shapes

Uses the same `Post` and `PostUser` types defined in `src/types/post.ts`. The `GET /posts/:id` response includes additional fields:

```typescript
interface PostDetail extends Post {
  forkedFrom: {
    id: string;
    messageRaw: string;
    user: PostUser;
  } | null;
  replies: Post[];
}
```

---

## 6. API Calls

### On Mount

| Trigger       | Endpoint                          | Method | Auth  | Purpose                            |
|---------------|-----------------------------------|--------|-------|------------------------------------|
| Page load     | `/api/posts/:id`                  | GET    | No    | Load post + replies + forkedFrom   |
| Page load     | `/api/auth/me`                    | GET    | Yes*  | Check auth status for interactions |

*Only fires if a session cookie exists.

### On User Interaction

| Trigger                | Endpoint                          | Method | Auth | Purpose                        |
|------------------------|-----------------------------------|--------|------|--------------------------------|
| Click ★ star (main)    | `/api/posts/:id/star`             | POST   | Yes  | Toggle star on main post       |
| Click ★ star (reply)   | `/api/posts/:replyId/star`        | POST   | Yes  | Toggle star on a reply         |
| Click ◇ fork (main)    | `/api/posts/:id/fork`             | POST   | Yes  | Fork the main post             |
| Click ◇ fork (reply)   | `/api/posts/:replyId/fork`        | POST   | Yes  | Fork a reply                   |
| Click ↩ reply (main)   | Scroll + focus composer           | —      | —    | Focus the composer (no API)    |
| Click ↩ reply (reply)  | Focus reply composer              | —      | —    | Focus the composer (no API)    |
| Press Cmd+Enter        | `/api/llm/transform`              | POST   | Yes  | Transform reply to CLI         |
| Confirm reply          | `/api/posts/:id/reply`            | POST   | Yes  | Submit reply                   |
| Click forked-from link | Navigate to `/post/:forkedFromId` | —      | —    | Navigate to original post      |
| Click back button      | Navigate to previous page         | —      | —    | Go back (history.back)         |
| Click ⎘ copy           | Clipboard API                     | —      | —    | Copy CLI text to clipboard     |

---

## 7. User Interactions

### Mouse / Touch

| Element                 | Action    | Result                                                 |
|-------------------------|-----------|---------------------------------------------------------|
| ← back to feed          | Click     | Navigate back (history.back or fallback to `/`)        |
| Forked-from banner      | Click     | Navigate to `/post/:forkedFromId`                      |
| @username (main post)   | Click     | Navigate to `/user/@username`                          |
| @username (reply)       | Click     | Navigate to `/user/@username`                          |
| #hashtag                | Click     | Navigate to `/explore?tag=hashtag`                     |
| ⎘ copy (CLI panel)      | Click     | Copy CLI text to clipboard, show "Copied!" flash       |
| ★ star (main post)      | Click     | Toggle star, optimistic update starCount +/-1          |
| ◇ fork (main post)      | Click     | Fork post, optimistic update forkCount +1              |
| ↩ reply (main post)     | Click     | Scroll to reply composer, focus textarea               |
| ★ star (reply)           | Click     | Toggle star on reply, optimistic update                |
| ◇ fork (reply)           | Click     | Fork the reply                                         |
| ↩ reply (reply)          | Click     | Focus reply composer (replies are flat, not nested)    |
| Reply composer textarea | Click     | Focus textarea, show blinking cursor                   |
| Model selector          | Click     | Open dropdown: claude-sonnet, gpt-4o, gemini-2.5-pro, llama-3, custom |
| [LLM -> CLI] button     | Click     | Transform reply via LLM, show CLI preview              |

### Keyboard Shortcuts

| Key          | Context            | Action                                      |
|--------------|--------------------|----------------------------------------------|
| `s`          | Not in input       | Toggle star on main post                     |
| `f`          | Not in input       | Fork the main post                           |
| `r`          | Not in input       | Focus reply composer                         |
| `/`          | Anywhere           | Focus reply composer textarea                |
| `Escape`     | Composer focused   | Blur reply composer                          |
| `Cmd+Enter`  | Composer focused   | Submit reply (transform + confirm)           |
| `Backspace`  | Not in input       | Navigate back (same as back button)          |

---

## 8. Loading State

### Initial Page Load Skeleton

```
┌────────────────┬────────────────────────────────────────────────────────────────┐
│                │                                                                │
│ (sidebar)      │  ← back to feed                                               │
│                │                                                                │
│                │  ┌─ Skeleton Main Post ───────────────────────────────────┐   │
│                │  │ ████████  ████████ · ██ ago                  ████████ │   │
│                │  ├──────────────────────────┬─────────────────────────────┤   │
│                │  │ ██████████████████████   │ ████████████████████████    │   │
│                │  │ ██████████████████       │ ████████████████████        │   │
│                │  │ ██████████████████████   │ ████████████████            │   │
│                │  │ ██████████████████       │ ████████████████████████    │   │
│                │  │ ██████████               │ ████████████████            │   │
│                │  │ ██████████████████████   │ ████████████████████████    │   │
│                │  ├──────────────────────────┴─────────────────────────────┤   │
│                │  │  ↩ ██    ◇ ██    ★ ██                                 │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │  // ██ replies                                                 │
│                │  ──────────────────────────────────────────────────────────    │
│                │                                                                │
│                │  ┌─ Skeleton Reply ───────────────────────────────────────┐   │
│                │  │ ████████  ████ · ██ ago                      ████████ │   │
│                │  ├──────────────────────────┬─────────────────────────────┤   │
│                │  │ ██████████████████       │ ████████████████████        │   │
│                │  │ ██████████████           │ ████████████████            │   │
│                │  ├──────────────────────────┴─────────────────────────────┤   │
│                │  │  ↩ ██    ◇ ██    ★ ██                                 │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │  ┌─ Skeleton Reply ───────────────────────────────────────┐   │
│                │  │ (repeat x2 more)                                       │   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
└────────────────┴────────────────────────────────────────────────────────────────┘
```

- Main post skeleton is larger (6 text lines) than reply skeletons (2 text lines).
- Show 3 skeleton reply cards.
- Back button renders immediately (no data dependency).
- Reply composer renders immediately but is disabled until post data loads (submit button shows `opacity-40 cursor-not-allowed`).
- Pulsing opacity animation, no shimmer.

---

## 9. Empty State

When the post has zero replies:

```
│                │                                                                │
│                │  ┌─ (Main post renders normally above) ──────────────────┐   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │  // 0 replies                                                  │
│                │  ──────────────────────────────────────────────────────────    │
│                │                                                                │
│                │          ┌──────────────────────────────────┐                  │
│                │          │                                  │                  │
│                │          │  $ reply --to=@0xmitsuki         │                  │
│                │          │  > No replies yet.               │                  │
│                │          │                                  │                  │
│                │          │  Be the first to reply.          │                  │
│                │          │  Use the composer below.         │                  │
│                │          │                                  │                  │
│                │          └──────────────────────────────────┘                  │
│                │                                                                │
│                │  ┌─ Reply Composer (renders normally) ────────────────────┐   │
│                │  └────────────────────────────────────────────────────────┘   │
│                │                                                                │
```

- Container: `border border-gray-700 bg-[#16213e] p-6 text-center`
- Command: `text-green-400 font-mono text-sm` (`$ reply --to=@username`)
- Subheading: `text-orange-400 font-mono text-sm` (`> No replies yet.`)
- Body: `text-gray-400 font-sans text-sm`
- The reply composer always renders below regardless of empty state.

---

## 10. Error State

### Post Not Found (404)

```
┌────────────────┬────────────────────────────────────────────────────────────────┐
│                │                                                                │
│ (sidebar)      │  ← back to feed                                               │
│                │                                                                │
│                │          ┌──────────────────────────────────┐                  │
│                │          │                                  │                  │
│                │          │  $ post --id=01912345            │                  │
│                │          │  error: 404 not found            │                  │
│                │          │                                  │                  │
│                │          │  This post doesn't exist or      │                  │
│                │          │  has been deleted.                │                  │
│                │          │                                  │                  │
│                │          │  [$ feed --global]               │                  │
│                │          │                                  │                  │
│                │          └──────────────────────────────────┘                  │
│                │                                                                │
└────────────────┴────────────────────────────────────────────────────────────────┘
```

- Container: `border border-red-400/30 bg-[#16213e] p-8 text-center`
- Command: `text-green-400 font-mono text-sm`
- Error line: `text-red-400 font-mono text-sm` (`error: 404 not found`)
- Body: `text-gray-400 font-sans text-sm`
- CTA `[$ feed --global]`: `bg-green-400/10 text-green-400 border border-green-400/30 px-4 py-1.5 font-mono text-sm hover:bg-green-400/20` -- navigates to `/`

### Server Error (500 / Network)

```
│                │          ┌──────────────────────────────────┐                  │
│                │          │                                  │                  │
│                │          │  $ post --id=01912345            │                  │
│                │          │  error: connection refused       │                  │
│                │          │                                  │                  │
│                │          │  Failed to load this post.       │                  │
│                │          │  The server might be down.       │                  │
│                │          │                                  │                  │
│                │          │  [$ retry]                       │                  │
│                │          │                                  │                  │
│                │          └──────────────────────────────────┘                  │
```

- Same styling as 404 error.
- Retry button calls `postDetailStore.fetchPost(id)` again.

### Auth Required for Interaction

When an unauthenticated user clicks star, fork, or attempts to reply:

- A toast/inline message appears: `$ error: 401 unauthorized -- login to interact`
- The reply composer shows a disabled state with: `> Login to reply.` and a `[$ login]` button
- The `[$ login]` button navigates to `/auth/login?redirect=/post/:id`
- Toast style: `text-orange-400 font-mono text-sm`
- Login button style: same green CTA as other action buttons

---

## 11. Test IDs (`data-testid`)

| Element | `data-testid` | Purpose |
|---------|---------------|---------|
| Back button | `back-button` | E2E: navigate back |
| Forked-from banner | `forked-from-banner` | E2E: verify fork link |
| Main post card | `main-post-card` | E2E: verify main post |
| Reply thread container | `reply-thread` | E2E: verify replies section |
| Reply count label | `reply-count` | E2E: verify reply count |
| Reply card | `reply-card` | E2E: count/select replies |
| Reply composer textarea | `reply-composer-input` | E2E: type reply |
| Reply submit button | `reply-composer-submit` | E2E: submit reply |
| Reply model selector | `reply-model-selector` | E2E: select model for reply |
| 404 error state | `post-not-found` | E2E: verify 404 state |
| Login prompt (unauthenticated) | `login-prompt` | E2E: verify auth required |

Inherits all PostCard test IDs from Global Feed spec for both main post and reply cards.

---

## 12. Accessibility Notes

| Requirement | Implementation |
|-------------|---------------|
| Back button | `aria-label="Go back to feed"` |
| Forked-from banner | `role="link"` with `aria-label="View original post by @author"` |
| Reply thread | `aria-label="Reply thread with N replies"` on container |
| Reply composer | `aria-label="Write a reply to @username"` on textarea |
| Main post | `role="article"` with `aria-labelledby` pointing to post header |
| Reply cards | `role="article"` nested within reply thread |
| New reply added | `aria-live="polite"` on reply thread, announces "New reply added" |
| Keyboard: Backspace | Announced via `aria-keyshortcuts="Backspace"` on back button |

---

## See Also

- [DESIGN_GUIDE.md](../guides/DESIGN_GUIDE.md) — Visual tokens, component specs, UI states
- [API.md](../specs/API.md) — Endpoint request/response details
- [CONVENTIONS.md](../guides/CONVENTIONS.md) — Coding rules for implementation
- [GLOBAL_FEED.md](./GLOBAL_FEED.md) — Related screen specification
- [USER_PROFILE.md](./USER_PROFILE.md) — Related screen specification
