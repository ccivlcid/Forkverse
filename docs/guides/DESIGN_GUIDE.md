# DESIGN GUIDE — CLItoris Visual System

> **Source of truth** for all visual design, colors, typography, component specs, and UI states.
> Every pixel must feel like a terminal. If it looks like a generic web app, it's wrong.

This guide is split into focused sub-documents for easier navigation:

| Document | Contents |
|----------|----------|
| **DESIGN_GUIDE.md** (this file) | Design philosophy, color system, typography, layout |
| [DESIGN_COMPONENTS.md](./DESIGN_COMPONENTS.md) | Component specifications (Post Card, Sidebar, Composer, Header, etc.) |
| [DESIGN_STATES.md](./DESIGN_STATES.md) | Interaction states, animations, dark mode, loading/empty/error states |
| [DESIGN_UI.md](./DESIGN_UI.md) | Iconography, responsive rules, accessibility, modals, toasts, forms, z-index, scrollbar, focus management |

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

## Do / Don't Quick Reference

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

- [DESIGN_COMPONENTS.md](./DESIGN_COMPONENTS.md) — Component specifications
- [DESIGN_STATES.md](./DESIGN_STATES.md) — Interaction states, loading/empty/error
- [DESIGN_UI.md](./DESIGN_UI.md) — Icons, responsive, accessibility, forms
- [CONVENTIONS.md](./CONVENTIONS.md) — Tailwind-only rule, naming conventions
- [Screen specs](../screens/) — Page-by-page wireframes using these design tokens
- [PROMPTS.md](./PROMPTS.md) — Component creation prompt templates
