# DESIGN GUIDE — CLItoris Visual System

> **Source of truth** for all visual design, colors, typography, component specs, and UI states.
> Every pixel must feel like a terminal. If it looks like a generic web app, it's wrong.

---

## 1. Design Philosophy

- **Terminal-first**: The entire UI mimics a CLI environment — dark backgrounds, monospace fonts, green glowing text
- **Dual-format**: Every post shows natural language (left) and CLI command (right) side by side
- **Minimal chrome**: No rounded cards, no gradients, no shadows. Borders are thin. Content is king
- **Information density**: Show more, decorate less. Inspired by `htop`, not Instagram

---

## 2. Color System

### Base Palette

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--bg-primary` | `#1a1a2e` | `bg-[#1a1a2e]` | Main background |
| `--bg-secondary` | `#16213e` | `bg-[#16213e]` | Sidebar, cards |
| `--bg-surface` | `#0f3460` | `bg-[#0f3460]` | Elevated surfaces, modals |
| `--bg-input` | `#0d1117` | `bg-[#0d1117]` | Input fields, code blocks |
| `--bg-hover` | `#1e293b` | `bg-[#1e293b]` | Hover state for interactive elements |

### Text Colors

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--text-primary` | `#e2e8f0` | `text-gray-200` | Body text, natural language |
| `--text-secondary` | `#94a3b8` | `text-gray-400` | Timestamps, metadata |
| `--text-muted` | `#64748b` | `text-gray-500` | Placeholder, disabled |
| `--text-inverse` | `#0f172a` | `text-gray-900` | Text on bright backgrounds |

### Semantic Colors

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--cli-keyword` | `#4ade80` | `text-green-400` | CLI commands, flags (`post`, `--user`) |
| `--cli-string` | `#fbbf24` | `text-amber-400` | CLI string values, usernames |
| `--cli-flag` | `#38bdf8` | `text-sky-400` | CLI flag names (`--lang`, `--tags`) |
| `--hashtag` | `#22d3ee` | `text-cyan-400` | Hashtags (`#vibe-coding`) |
| `--mention` | `#60a5fa` | `text-blue-400` | Mentions (`@username`) |
| `--lang-tag` | `#a78bfa` | `text-purple-400` | Language badges (`--lang=ko`) |
| `--prompt` | `#fb923c` | `text-orange-400` | Prompt symbol (`$`, `>`) |
| `--error` | `#f87171` | `text-red-400` | Error messages |
| `--success` | `#34d399` | `text-emerald-400` | Success indicators |
| `--star` | `#facc15` | `text-yellow-400` | Star/favorite active |

### Border Colors

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--border-default` | `#334155` | `border-gray-700` | Card borders, dividers |
| `--border-hover` | `#475569` | `border-gray-600` | Hover state borders |
| `--border-active` | `#4ade80` | `border-green-400` | Active/focused borders |

---

## 3. Typography

### Font Stack

```css
/* CLI / code — primary font */
--font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;

/* Natural language text */
--font-sans: 'Inter', 'system-ui', '-apple-system', sans-serif;
```

### Type Scale

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `display` | 24px / `text-2xl` | 700 | 1.2 | Page titles |
| `heading` | 18px / `text-lg` | 600 | 1.3 | Section headers |
| `body` | 14px / `text-sm` | 400 | 1.6 | Natural language posts |
| `code` | 13px / `text-[13px]` | 400 | 1.5 | CLI commands |
| `caption` | 12px / `text-xs` | 400 | 1.4 | Timestamps, counters |
| `badge` | 11px / `text-[11px]` | 500 | 1.0 | Tags, labels |

### Rules

- CLI panel: always `font-mono`
- Natural language panel: `font-sans` for readability
- Sidebar navigation: `font-mono`
- Never use font sizes below 11px
- Never use font weight above 700

---

## 4. Layout System

### Page Structure

```
┌──────────────────────────────────────────────────────────────┐
│ Header Bar (h-10)                                            │
│ terminal.social / breadcrumb path                            │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                 │
│ Sidebar    │  Main Content Area                              │
│ (w-56)     │  (flex-1)                                       │
│            │                                                 │
│ fixed      │  ┌─ Composer Bar ─────────────────────────┐     │
│ left       │  │ Input + LLM selector + Submit          │     │
│            │  └────────────────────────────────────────┘     │
│            │                                                 │
│            │  ┌─ Post Card ────────────────────────────┐     │
│            │  │ ┌─ Natural ──┐  ┌─ CLI ──────────────┐ │     │
│            │  │ │            │  │                     │ │     │
│            │  │ └────────────┘  └─────────────────────┘ │     │
│            │  │ actions: reply · fork · star             │     │
│            │  └────────────────────────────────────────┘     │
│            │                                                 │
│            │  ┌─ Post Card ────────────────────────────┐     │
│            │  │ ...                                     │     │
│            │  └────────────────────────────────────────┘     │
│            │                                                 │
└────────────┴─────────────────────────────────────────────────┘
```

### Grid & Spacing

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--spacing-xs` | 4px | `p-1`, `gap-1` | Inline spacing |
| `--spacing-sm` | 8px | `p-2`, `gap-2` | Between small elements |
| `--spacing-md` | 16px | `p-4`, `gap-4` | Card padding, section gaps |
| `--spacing-lg` | 24px | `p-6`, `gap-6` | Between cards |
| `--spacing-xl` | 32px | `p-8`, `gap-8` | Page margins |

### Breakpoints

| Name | Width | Behavior |
|------|-------|----------|
| `mobile` | < 640px | Sidebar hidden, dual panel stacks vertically |
| `tablet` | 640–1024px | Sidebar collapsible, dual panel side by side |
| `desktop` | > 1024px | Full layout |

---

## 5. Component Specifications

### 5.1 Post Card (Dual Format)

```
┌─────────────────────────────────────────────────────────────┐
│ @username  domain.dev · 3m ago                    --lang=en │
├────────────────────────────┬────────────────────────────────┤
│                            │ CLI — open source        copy  │
│  Natural language text     │                                │
│  here. Multiple lines      │  post --user=name \           │
│  supported.                │    --lang=en \                 │
│                            │    --message="text" \          │
│  #hashtag #another         │    --tags=hashtag,another \    │
│                            │    --visibility=public         │
│                            │                                │
├────────────────────────────┴────────────────────────────────┤
│  ↩ reply 5    ◇ fork 3    ★ star 42                        │
└─────────────────────────────────────────────────────────────┘
```

**Specifications:**

| Property | Value |
|----------|-------|
| Border | `border border-gray-700 rounded-none` |
| Background | `bg-[#16213e]` |
| Padding | `p-0` (inner panels handle padding) |
| Natural panel bg | `bg-[#16213e]` |
| CLI panel bg | `bg-[#0d1117]` |
| Panel split | `grid grid-cols-2` (desktop), `grid grid-cols-1` (mobile) |
| Username | `text-amber-400 font-mono font-semibold` |
| Timestamp | `text-gray-500 text-xs` |
| Lang badge | `text-purple-400 text-[11px] border border-purple-400/30 px-1.5 py-0.5` |
| Hashtags | `text-cyan-400` |

**JSX Implementation Reference:**

```tsx
<article className="border border-gray-700 rounded-none overflow-hidden">
  {/* Header */}
  <div className="flex items-center justify-between px-4 py-2">
    <div className="flex items-center gap-2">
      <span className="text-amber-400 font-mono font-semibold">@{username}</span>
      {domain && <span className="text-gray-500 text-xs">{domain}</span>}
      <span className="text-gray-500 text-xs">· {timeAgo}</span>
    </div>
    <span className="text-purple-400 text-[11px] border border-purple-400/30 px-1.5 py-0.5">
      --lang={lang}
    </span>
  </div>

  {/* Dual Panel */}
  <div className="grid grid-cols-1 sm:grid-cols-2">
    <div className="bg-[#16213e] p-4 text-gray-200 font-sans text-sm">{messageRaw}</div>
    <div className="bg-[#0d1117] p-4 text-green-400 font-mono text-[13px]">
      <pre className="whitespace-pre-wrap">{messageCli}</pre>
    </div>
  </div>

  {/* Action Bar */}
  <div className="border-t border-gray-700 px-4 py-2 flex gap-6 text-gray-500 text-xs font-mono">
    <button className="hover:text-green-400">↩ reply {replyCount}</button>
    <button className="hover:text-blue-400">◇ fork {forkCount}</button>
    <button className="hover:text-yellow-400">{isStarred ? '★' : '☆'} {starCount}</button>
  </div>
</article>
```
| Action bar | `border-t border-gray-700 px-4 py-2 text-gray-500 text-xs` |
| Action hover | `hover:text-green-400` (reply), `hover:text-blue-400` (fork), `hover:text-yellow-400` (star) |
| Copy button | `text-gray-600 hover:text-gray-300 text-xs` |

### 5.2 Sidebar Navigation

```
┌────────────────┐
│ // navigate    │  ← section label (text-gray-600, text-xs)
│ $ feed --global│  ← active item (text-green-400, bg-[#0f3460])
│   feed --local │  ← inactive item (text-gray-400)
│   following    │
│   explore      │
│                │
│ // by LLM      │
│ ● claude-sonnet│  ← dot indicator (green = active)
│ ○ gpt-4o       │  ← dot indicator (gray = inactive)
│ ○ llama-3      │
│ ○ cursor       │
│ ○ cli          │
│ ○ api          │
│ ○ custom       │
│                │
│ // me          │
│ → @you.local   │
│   my posts     │
│   my posts --raw│
│   starred      │
└────────────────┘
```

**Specifications:**

| Property | Value |
|----------|-------|
| Width | `w-56` fixed |
| Background | `bg-[#1a1a2e]` |
| Border right | `border-r border-gray-700` |
| Section label | `text-gray-600 text-xs font-mono uppercase tracking-wider` |
| Section prefix | `//` in `text-gray-700` |
| Active item | `text-green-400 bg-[#0f3460] pl-3 border-l-2 border-green-400` |
| Inactive item | `text-gray-400 hover:text-gray-200 pl-3` |
| Prompt symbol | `$` in `text-orange-400` (active), `text-gray-600` (inactive) |
| Item padding | `py-1.5 px-3` |
| Section gap | `mt-6` |

### 5.3 Composer Bar

```
┌─────────────────────────────────────────────────────────────┐
│ > Write in any language. LLM translates to CLI.             │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Type your post here...                              │   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Cmd+Enter · save as CLI    [claude-sonnet ▾]   [LLM → CLI ↗]│
└─────────────────────────────────────────────────────────────┘
```

**Specifications:**

| Property | Value |
|----------|-------|
| Background | `bg-[#16213e]` |
| Border | `border border-gray-700` |
| Textarea bg | `bg-[#0d1117]` |
| Textarea text | `text-gray-200 font-sans text-sm` |
| Placeholder | `text-gray-600` |
| Hint text | `text-gray-500 text-xs font-mono` |
| Model selector | `bg-[#0d1117] border border-gray-700 text-gray-300 text-xs px-3 py-1.5` |
| Submit button | `bg-green-400/10 text-green-400 border border-green-400/30 px-4 py-1.5 font-mono text-sm hover:bg-green-400/20` |

### 5.4 Header Bar

```
┌─────────────────────────────────────────────────────────────┐
│ terminal.social / feed · CLI · LLM posts   ·  all posts    │
└─────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Height | `h-10` |
| Background | `bg-[#1a1a2e]` |
| Border bottom | `border-b border-gray-700` |
| Logo | `text-gray-200 font-mono font-bold` |
| Breadcrumb separator | `/` in `text-gray-600` |
| Breadcrumb item | `text-gray-400 hover:text-gray-200 text-sm font-mono` |

### 5.5 Action Counters

```
↩ reply 5    ◇ fork 3    ★ star 42
```

| Property | Default | Hover | Active |
|----------|---------|-------|--------|
| Reply | `text-gray-500` | `text-green-400` | `text-green-400` |
| Fork | `text-gray-500` | `text-blue-400` | `text-blue-400` |
| Star | `text-gray-500` | `text-yellow-400` | `text-yellow-400` |
| Font | `text-xs font-mono` | — | — |
| Spacing | `gap-6` between actions | — | — |
| Icon | Unicode characters only (no icon library) | — | — |

### 5.6 Language Badge

```
--lang=ko    --lang=en    --lang=hi
```

| Property | Value |
|----------|-------|
| Font | `text-[11px] font-mono` |
| Color | `text-purple-400` |
| Border | `border border-purple-400/30 rounded-sm` |
| Padding | `px-1.5 py-0.5` |
| Position | Top-right corner of post card |

### 5.7 CLI Syntax Highlighting

Inside the CLI panel, apply these colors to different token types:

| Token | Example | Color |
|-------|---------|-------|
| Command | `post`, `star`, `fork` | `text-green-400 font-bold` |
| Flag name | `--user`, `--lang`, `--tags` | `text-sky-400` |
| Flag value (string) | `"hello world"` | `text-amber-400` |
| Flag value (enum) | `public`, `true` | `text-purple-400` |
| Operator | `=`, `\` | `text-gray-500` |
| Comment | `#` | `text-gray-600 italic` |
| Line continuation | `\` | `text-gray-600` |

---

## 6. Interaction States

### Buttons & Interactive Elements

| State | Style |
|-------|-------|
| Default | `border border-gray-700 text-gray-400` |
| Hover | `border-gray-500 text-gray-200 bg-[#1e293b]` |
| Active/Pressed | `border-green-400 text-green-400` |
| Focused | `ring-1 ring-green-400/50 outline-none` |
| Disabled | `opacity-40 cursor-not-allowed` |

### Transitions

```
All interactive elements: transition-colors duration-150
No transform animations (scale, rotate, translate)
No bouncing, sliding, or fade-in effects
Opacity transitions allowed for loading states only
```

---

## 7. Iconography

**No icon libraries** (Lucide, Heroicons, FontAwesome — all banned).

Use Unicode characters only:

| Action | Symbol | Code |
|--------|--------|------|
| Reply | `↩` | `\u21A9` |
| Fork | `◇` | `\u25C7` |
| Star (empty) | `☆` | `\u2606` |
| Star (filled) | `★` | `\u2605` |
| Prompt | `$` | literal |
| Arrow right | `→` | `\u2192` |
| Bullet (active) | `●` | `\u25CF` |
| Bullet (inactive) | `○` | `\u25CB` |
| Section prefix | `//` | literal |
| Copy | `⎘` | `\u2398` |
| Close | `×` | `\u00D7` |
| Menu | `≡` | `\u2261` |
| Expand | `▸` | `\u25B8` |
| Collapse | `▾` | `\u25BE` |

---

## 8. Responsive Rules

### Mobile (< 640px)

- Sidebar: hidden, accessible via hamburger menu (`≡`)
- Dual panel: stacks vertically (natural language on top, CLI below)
- Composer: full width, model selector below textarea
- Header: logo only, breadcrumbs hidden
- Post actions: icon-only (no count text)

### Tablet (640–1024px)

- Sidebar: collapsible (icon-only mode, `w-14`)
- Dual panel: side by side
- Composer: full width

### Desktop (> 1024px)

- Full layout as specified

---

## 9. Animation Rules

> Less is more. This is a terminal, not a magazine.

### Allowed

- `transition-colors duration-150` on hover states
- `opacity` transition for loading/skeleton states
- Cursor blink animation on the composer (terminal cursor feel)

### Banned

- `transform` animations (scale, rotate, translateX/Y)
- `slide-in`, `fade-in`, `bounce`, `spring` effects
- Page transition animations
- Scroll-triggered animations
- Parallax
- Confetti / particle effects
- Skeleton shimmer (use simple opacity pulse)

### Cursor Blink (Composer Only)

```css
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
/* Apply to composer cursor indicator only */
.cursor-blink {
  animation: blink 1s step-end infinite;
}
```

---

## 10. Dark Mode

There is **no light mode**. Dark theme is the only theme.

Do not implement:
- Theme toggle
- `prefers-color-scheme` media query
- Light mode variants
- `dark:` Tailwind prefix (unnecessary since always dark)

---

## 11. Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move between interactive elements |
| `Enter` | Activate buttons, submit forms |
| `Escape` | Close modals, cancel actions |
| `j` / `k` | Navigate between posts (vim-style) |
| `s` | Star current post |
| `r` | Reply to current post |
| `f` | Fork current post |
| `/` | Focus composer |
| `Cmd+Enter` | Submit post |

### Requirements

- All interactive elements must have `focus-visible` ring
- All images must have `alt` text
- All buttons must have `aria-label` if icon-only
- Color is never the only indicator (always pair with text/icon)
- Minimum contrast ratio: 4.5:1 (WCAG AA)
- Tab order must follow visual layout

---

## 12. Loading States

### Skeleton Post Card

When loading posts, display skeleton placeholders with a pulsing opacity animation. Never use shimmer/sweep effects — use simple opacity pulse only.

**Tailwind classes:** `animate-pulse bg-gray-700/50 rounded`

```
┌─────────────────────────────────────────────────────────────┐
│ ██████████  ████████ · ██████                    ████████   │
├────────────────────────────────┬────────────────────────────┤
│                                │                            │
│  ████████████████████████      │  ██████████████████████    │
│  ██████████████████            │  ████████████████          │
│  ████████████████████████      │  ██████████████████████    │
│  ██████████████                │  ████████████              │
│                                │                            │
├────────────────────────────────┴────────────────────────────┤
│  ██████    ██████    ██████                                 │
└─────────────────────────────────────────────────────────────┘
```

Each `██` block is a `<div>` with `animate-pulse bg-gray-700/50 rounded` applied.

### Feed Loading

- Display **3 skeleton cards** stacked vertically with `gap-6` spacing
- Each card uses the skeleton post card wireframe above
- Cards should have the same dimensions as real post cards

### Single Post Loading

- Display a **full-width skeleton card** matching the single post view layout
- Include skeleton placeholders for the action bar and any reply section below

---

## 13. Empty States

All empty states use terminal-style messaging with monospace font and muted colors.

### 13.1 Empty Global Feed

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│           $ cat /feed/global                                │
│           No posts yet. Be the first to post.               │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Prompt: `text-orange-400 font-mono`
- Command: `text-green-400 font-mono`
- Message: `text-gray-400 font-mono text-sm`
- Container: `flex items-center justify-center min-h-[200px]`

### 13.2 Empty Local Feed

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│           $ cat /feed/local                                 │
│           You're not following anyone yet.                   │
│           Explore the global feed to find people.            │
│                                                             │
│           ┌──────────────────────────┐                      │
│           │  → Explore Global Feed   │                      │
│           └──────────────────────────┘                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Message: `text-gray-400 font-mono text-sm`
- CTA button: `bg-green-400/10 text-green-400 border border-green-400/30 px-4 py-2 font-mono text-sm hover:bg-green-400/20`
- Copy line 1: "You're not following anyone yet."
- Copy line 2: "Explore the global feed to find people."

### 13.3 Empty User Profile

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│           $ ls /user/username/posts                         │
│           This user hasn't posted yet.                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Message: `text-gray-400 font-mono text-sm`
- Container: `flex items-center justify-center min-h-[150px]`

### 13.4 Empty Starred

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│           $ cat /starred                                    │
│           No starred posts yet.                              │
│           Star posts to save them here.                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Star icon: `text-yellow-400` (use `☆` symbol)
- Message: `text-gray-400 font-mono text-sm`
- Container: `flex items-center justify-center min-h-[200px]`

### 13.5 No Search Results

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│           $ grep "query" /feed                              │
│           No posts found.                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Message: `text-gray-400 font-mono text-sm`
- Container: `flex items-center justify-center min-h-[150px]`

---

## 14. Error States

### 14.1 404 Page

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     $ cat /post/unknown                                     │
│     Error: Post not found (404)                              │
│                                                             │
│     The requested resource does not exist.                   │
│     $ cd /feed/global                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Style: terminal-style output with monospace font
- Prompt `$`: `text-orange-400`
- Command: `text-green-400 font-mono`
- Error line: `text-red-400 font-mono font-bold`
- Suggestion: `text-gray-400 font-mono text-sm`
- Container: `flex flex-col items-center justify-center min-h-screen bg-[#1a1a2e]`

### 14.2 500 Page

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     $ curl terminal.social                                  │
│     Error: Internal server error (500)                       │
│     Try again later.                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Same terminal styling as 404
- Error line: `text-red-400 font-mono font-bold`
- Retry message: `text-gray-400 font-mono text-sm`

### 14.3 Network Error Toast

- Border: `border-l-4 border-red-400`
- Text: `text-red-400`
- Background: `bg-[#16213e]`
- Example message: "Network error. Check your connection."

### 14.4 API Error Toast

- Border: `border-l-4 border-amber-400`
- Text: `text-amber-400`
- Background: `bg-[#16213e]`
- Example message: "Failed to load posts. Please try again."

---

## 15. Modals & Dialogs

### Confirmation Dialog

Used for destructive or significant actions (delete post, unfollow user).

```
┌─────────────── bg-black/60 overlay ───────────────────────┐
│                                                            │
│       ┌──────────────────────────────────────┐             │
│       │  Delete this post?                   │             │
│       │                                      │             │
│       │  Are you sure? [y/N]                 │             │
│       │  This action cannot be undone.        │             │
│       │                                      │             │
│       │          [Cancel]   [Delete]          │             │
│       └──────────────────────────────────────┘             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Specifications:**

| Property | Value |
|----------|-------|
| Overlay | `fixed inset-0 bg-black/60 z-50` |
| Dialog box | `bg-[#16213e] border border-gray-700` |
| Width | `max-w-md w-full` |
| Padding | `p-6` |
| Title | `text-lg font-mono text-gray-200` |
| Body text | `text-sm text-gray-400 font-mono` |
| Terminal prompt | `text-gray-400 font-mono` — "Are you sure? [y/N]" |
| Cancel button | `text-gray-400 hover:text-gray-200 px-4 py-2 font-mono text-sm` (ghost style) |
| Confirm (destructive) | `bg-red-400/10 text-red-400 border border-red-400/30 px-4 py-2 font-mono text-sm hover:bg-red-400/20` |
| Confirm (positive) | `bg-green-400/10 text-green-400 border border-green-400/30 px-4 py-2 font-mono text-sm hover:bg-green-400/20` |
| Centering | `flex items-center justify-center` |

---

## 16. Toast Notifications

Position: **bottom-right**, fixed (`fixed bottom-4 right-4 z-50`).

### Variants

#### Success Toast
```
┌────────────────────────────────┐
│ ▌ Post published successfully. │
└────────────────────────────────┘
```
- `border-l-4 border-emerald-400 bg-[#16213e] text-gray-200 font-mono text-sm px-4 py-3`

#### Error Toast
```
┌────────────────────────────────┐
│ ▌ Failed to publish post.      │
└────────────────────────────────┘
```
- `border-l-4 border-red-400 bg-[#16213e] text-gray-200 font-mono text-sm px-4 py-3`

#### Info Toast
```
┌────────────────────────────────┐
│ ▌ Post copied to clipboard.    │
└────────────────────────────────┘
```
- `border-l-4 border-sky-400 bg-[#16213e] text-gray-200 font-mono text-sm px-4 py-3`

### Behavior

| Property | Value |
|----------|-------|
| Auto-dismiss | 3 seconds |
| Animation | `transition-opacity duration-300` |
| Stacking | Multiple toasts stack upward with `gap-2` |
| Max visible | 3 toasts at a time |
| Dismiss | Click to dismiss, or auto-dismiss after timeout |

---

## 17. Form Elements (Terminal Style)

All form elements follow terminal aesthetics with monospace font and dark backgrounds.

### Text Input

```
┌─────────────────────────────────────────────┐
│ $ username                                  │
└─────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Background | `bg-[#0d1117]` |
| Border | `border border-gray-700` |
| Text | `text-gray-200 font-mono text-sm` |
| Prompt prefix | `$` in `text-orange-400 font-mono` (displayed as a label before the input) |
| Padding | `px-3 py-2` |
| Placeholder | `text-gray-600` |

### Textarea

```
┌─────────────────────────────────────────────┐
│ $ Write your message...                     │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

- Same styling as text input
- `min-h-[100px]` minimum height
- `resize-y` for vertical resizing only

### Select / Dropdown

```
┌─────────────────────────────────────────────┐
│ $ claude-sonnet                           ▾ │
└─────────────────────────────────────────────┘
```

- Same base styling as text input
- Dropdown indicator: `▾` in `text-gray-500`
- `appearance-none` to remove native styling
- Options dropdown: `bg-[#0d1117] border border-gray-700`

### Focus State (All Form Elements)

| Property | Value |
|----------|-------|
| Border | `border-green-400` |
| Ring | `ring-1 ring-green-400/50` |
| Outline | `outline-none` |

### Error State (All Form Elements)

| Property | Value |
|----------|-------|
| Border | `border-red-400` |
| Text | `text-red-400` |
| Error message | `text-red-400 text-xs font-mono mt-1` displayed below the input |
| Example | "$ Error: Username is required" |

---

## 17.5 Z-Index System

All z-index values are pre-defined to avoid conflicts. Never use arbitrary z-index values.

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--z-base` | 0 | `z-0` | Default layer (content) |
| `--z-dropdown` | 10 | `z-10` | Dropdowns, model selector |
| `--z-sticky` | 20 | `z-20` | Sticky header bar |
| `--z-sidebar` | 30 | `z-30` | Mobile sidebar overlay |
| `--z-modal` | 40 | `z-40` | Modal overlay + dialog |
| `--z-toast` | 50 | `z-50` | Toast notifications (always on top) |

### Rules

- Never use `z-[999]` or arbitrary z-index values
- Modals always render in a portal (`createPortal`) to avoid stacking context issues
- Toast notifications stack above everything

---

## 17.6 Scrollbar Styling

Custom scrollbar to maintain terminal aesthetic. Apply to the main content area and any scrollable containers.

```css
/* Scrollbar — dark terminal style */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #334155; /* gray-700 */
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #475569; /* gray-600 */
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: #334155 transparent;
}
```

### Rules

- Scrollbar track is transparent (blends with background)
- Scrollbar thumb uses `--border-default` color (`#334155`)
- Scrollbar width is 6px (thin, terminal feel)
- Apply to `body` and `.overflow-y-auto` containers

---

## 17.7 Focus Management

Rules for managing keyboard focus across the application.

| Scenario | Behavior |
|----------|----------|
| Page navigation | Focus moves to the main content area heading |
| Modal opens | Focus moves to the first focusable element inside the modal |
| Modal closes | Focus returns to the element that triggered the modal |
| Toast appears | Focus does NOT move (toasts are non-intrusive) |
| Sidebar toggle (mobile) | Focus moves to the first nav item when opened; returns when closed |
| Post submission | Focus returns to the composer textarea |
| Reply submission | Focus returns to the reply composer textarea |

### Focus Trap (Modals)

Modals must trap focus within the dialog:
- `Tab` cycles through focusable elements inside the modal
- `Shift+Tab` cycles backwards
- `Escape` closes the modal and returns focus
- Focus trap implemented via `useEffect` with `keydown` listener

### Skip Navigation Link

```html
<!-- First element in the DOM, hidden until focused -->
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-[#1a1a2e] focus:text-green-400 focus:p-2 focus:font-mono">
  Skip to content
</a>
```

---

## 18. Do / Don't Quick Reference

| Do | Don't |
|----|-------|
| Use monospace font for CLI elements | Use decorative fonts |
| Use thin 1px borders | Use thick borders or shadows |
| Use Unicode symbols for icons | Import icon libraries |
| Stack panels vertically on mobile | Hide CLI panel on mobile |
| Use `transition-colors` only | Add bounce/slide animations |
| Keep surfaces flat | Add gradients or glassmorphism |
| Use terminal green as accent | Use rainbow colors |
| Show information densely | Add excessive whitespace |
| Use `rounded-none` or `rounded-sm` | Use `rounded-lg` or `rounded-full` |
| Keep backgrounds under 3 shades | Use many background variations |

---

## See Also

- [CONVENTIONS.md](./CONVENTIONS.md) — Tailwind-only rule, naming conventions
- [Screen specs](../screens/) — Page-by-page wireframes using these design tokens
- [PROMPTS.md](./PROMPTS.md) — Component creation prompt templates
