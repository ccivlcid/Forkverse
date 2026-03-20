# DESIGN COMPONENTS — Component Specifications

> Part of the [Design Guide](./DESIGN_GUIDE.md). Detailed specifications for all reusable UI components.

---

## 1. Post Card (Dual Format)

```
@jiyeon_dev  jiyeon.kim · 3m ago                               --lang=ko
┌─────────────────────────┬──────────────────────────────────────┐
│ ⓘ 자연어                │ ⊡ CLI — open source            copy │
│                         │                                      │
│ 바이브코딩하다가...      │ post --user=jiyeon.kim --lang=ko ¶  │
│ #vibe-coding #thoughts  │   --message="observing AI-lang..." ¶│
│                         │   --tags=vibe-coding,thoughts ¶      │
│                         │   --visibility=public                │
└─────────────────────────┴──────────────────────────────────────┘
  ↵ reply 14   ○ fork 7   ★ star 42
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
| Lang badge | `text-purple-400 text-[11px] border border-purple-400/30 px-1.5 py-0.5` (right side of header row) |
| Natural panel label | `ⓘ 자연어` — info icon + localized label, `text-gray-600 text-xs font-mono` |
| CLI panel label | `⊡ CLI — open source` — terminal block icon, hyphen separator, `text-gray-600 text-xs font-mono` |
| Hashtags | `text-cyan-400` (inline in post text) |
| CLI line continuation | `¶` (pilcrow character), `text-gray-600` |
| Translated text | `text-gray-400 text-sm italic border-l-2 border-purple-400/30 pl-2 mt-2` |
| Translated-from badge | `text-purple-400/50 text-[10px] font-mono` (`--translated-from=ko`) |

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
    <div className="bg-[#16213e] p-4 text-gray-200 font-sans text-sm">
      <div className="text-gray-600 text-xs font-mono mb-2">ⓘ 자연어</div>
      {messageRaw}
    </div>
    <div className="bg-[#0d1117] p-4 text-green-400 font-mono text-[13px]">
      <div className="flex items-center justify-between text-gray-600 text-xs font-mono mb-2">
        <span>⊡ CLI — open source</span>
        <button className="hover:text-gray-300">copy</button>
      </div>
      <pre className="whitespace-pre-wrap">{messageCli}</pre>
    </div>
  </div>

  {/* Action Bar */}
  <div className="border-t border-gray-700 px-4 py-2 flex gap-6 text-gray-500 text-xs font-mono">
    <button className="hover:text-green-400">↵ reply {replyCount}</button>
    <button className="hover:text-blue-400">○ fork {forkCount}</button>
    <button className="hover:text-yellow-400">{isStarred ? '★' : '☆'} {starCount}</button>
  </div>
</article>
```

| Property | Value |
|----------|-------|
| Action bar | `border-t border-gray-700 px-4 py-2 text-gray-500 text-xs` |
| Action hover | `hover:text-green-400` (reply), `hover:text-blue-400` (fork), `hover:text-yellow-400` (star) |
| Reply icon | `↵` (not `↩`) |
| Fork icon | `○` (not `◇`) |
| Copy button | `text-gray-600 hover:text-gray-300 text-xs` (inside CLI panel header, not action bar) |

---

## 2. Sidebar Navigation

```
┌────────────────┐
│ // navigate    │  ← section label (text-gray-600, text-xs)
│ $ feed --global│  ← active item (text-green-400, bg-[#0f3460])
│ $ feed --local │  ← inactive item (text-gray-400)
│ $ following    │
│ $ explore      │
│                │
│ // my LLM      │  ← section name
│ ● claude-sonnet│  ← dot indicator (green = active)
│ ○ gpt-4o       │  ← dot indicator (gray = inactive)
│ ○ llama-3      │
│ + connect LLM  │  ← links to /settings?tab=cli
│                │
│ // me          │
│ ~ @you.local   │  ← tilde prefix
│ $ my posts --raw│  ← $ prefix, --raw flag
│ $ starred      │  ← $ prefix
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
| LLM section name | `// my LLM` (not `// by LLM`) |
| LLM connect button | `+ connect LLM` at bottom of LLM section; links to `/settings?tab=cli`; `text-gray-500 hover:text-green-400 text-xs font-mono` |
| Me section username | `~` tilde prefix (not `→` arrow); `text-amber-400 font-mono` |
| Me section nav items | `$` prefix with flag suffixes where applicable (e.g., `$ my posts --raw`, `$ starred`) |
| Item padding | `py-1.5 px-3` |
| Section gap | `mt-6` |

---

## 3. Composer Modal

Opened via `[+ post]` button in HeaderBar or `/` hotkey. Full-screen centered modal with backdrop.

```
┌─────────────────────────────────────────────────────────────┐
│ $ new post                                          [esc]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Write your thoughts...                                     │
│  (textarea, 5 rows, auto-focus)                             │
│                                                             │
│  [CLI preview area — shown after transform]                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [repo] [lang ▾]              model badge   [preview] [post] │
└─────────────────────────────────────────────────────────────┘
```

**Specifications:**

| Property | Value |
|----------|-------|
| Backdrop | `bg-black/60`, click to close |
| Modal | `bg-[var(--bg-surface)]`, `max-w-[600px]`, `border border-[var(--border)]` |
| Textarea | transparent bg, `text-[15px] leading-[1.7]`, sans-serif font |
| Footer | border-top, left: attachment buttons, right: actions |
| Submit | `Ctrl+Enter` keyboard shortcut |
| Close | `Escape` key or backdrop click |

---

## 4. Header Bar

```
┌─────────────────────────────────────────────────────────────┐
│ terminal.social / 자연어 + CLI · LLM 공유 · all posts open source │
└─────────────────────────────────────────────────────────────┘
```

The subtitle area shows page-specific context tags separated by `·`. Example shown is for the global feed.

| Property | Value |
|----------|-------|
| Height | `h-10` |
| Background | `bg-[#1a1a2e]` |
| Border bottom | `border-b border-gray-700` |
| Logo | `text-gray-200 font-mono font-bold` |
| Breadcrumb separator | `/` in `text-gray-600` |
| Subtitle tags | `text-gray-400 text-sm font-mono` separated by `·` in `text-gray-600` |
| Breadcrumb item | `text-gray-400 hover:text-gray-200 text-sm font-mono` |

---

## 5. Action Counters

```
↵ reply 5    ○ fork 3    ★ star 42
```

| Property | Default | Hover | Active |
|----------|---------|-------|--------|
| Reply (`↵`) | `text-gray-500` | `text-green-400` | `text-green-400` |
| Fork (`○`) | `text-gray-500` | `text-blue-400` | `text-blue-400` |
| Star (`★`) | `text-gray-500` | `text-yellow-400` | `text-yellow-400` |
| Font | `text-xs font-mono` | — | — |
| Spacing | `gap-6` between actions | — | — |
| Icon | Unicode characters only (no icon library) | — | — |

---

## 6. Language Badge

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

---

## 7. CLI Syntax Highlighting

Inside the CLI panel, apply these colors to different token types:

| Token | Example | Color |
|-------|---------|-------|
| Command | `post`, `star`, `fork` | `text-green-400 font-bold` |
| Flag name | `--user`, `--lang`, `--tags` | `text-sky-400` |
| Flag value (string) | `"hello world"` | `text-amber-400` |
| Flag value (enum) | `public`, `true` | `text-purple-400` |
| Operator | `=` | `text-gray-500` |
| Comment | `#` | `text-gray-600 italic` |
| Line continuation | `¶` (pilcrow) | `text-gray-600` |

---

## See Also

- [DESIGN_GUIDE.md](./DESIGN_GUIDE.md) — Color system, typography, layout
- [DESIGN_STATES.md](./DESIGN_STATES.md) — Loading, empty, and error states
- [DESIGN_UI.md](./DESIGN_UI.md) — Forms, modals, toasts, accessibility
