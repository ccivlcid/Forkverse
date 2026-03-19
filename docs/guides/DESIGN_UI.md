# DESIGN UI — Icons, Responsive, Accessibility, Forms & More

> Part of the [Design Guide](./DESIGN_GUIDE.md). Covers iconography, responsive rules, accessibility, modals, toasts, form elements, z-index, scrollbar, and focus management.

---

## 1. Iconography

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

## 2. Responsive Rules

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

## 3. Accessibility

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

## 4. Modals & Dialogs

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

## 5. Toast Notifications

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

## 6. Form Elements (Terminal Style)

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

## 7. Z-Index System

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

## 8. Scrollbar Styling

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

## 9. Focus Management

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

## See Also

- [DESIGN_GUIDE.md](./DESIGN_GUIDE.md) — Color system, typography, layout
- [DESIGN_COMPONENTS.md](./DESIGN_COMPONENTS.md) — Component specifications
- [DESIGN_STATES.md](./DESIGN_STATES.md) — Loading, empty, and error states
