# DESIGN COMPONENTS — Component Specifications

> Part of the [Design Guide](./DESIGN_GUIDE.md). Detailed specifications for all reusable UI components.

---

## 1. Post Card (Dual Format)

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

| Property | Value |
|----------|-------|
| Action bar | `border-t border-gray-700 px-4 py-2 text-gray-500 text-xs` |
| Action hover | `hover:text-green-400` (reply), `hover:text-blue-400` (fork), `hover:text-yellow-400` (star) |
| Copy button | `text-gray-600 hover:text-gray-300 text-xs` |

---

## 2. Sidebar Navigation

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

---

## 3. Composer Bar

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

---

## 4. Header Bar

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

---

## 5. Action Counters

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
| Operator | `=`, `\` | `text-gray-500` |
| Comment | `#` | `text-gray-600 italic` |
| Line continuation | `\` | `text-gray-600` |

---

## See Also

- [DESIGN_GUIDE.md](./DESIGN_GUIDE.md) — Color system, typography, layout
- [DESIGN_STATES.md](./DESIGN_STATES.md) — Loading, empty, and error states
- [DESIGN_UI.md](./DESIGN_UI.md) — Forms, modals, toasts, accessibility
