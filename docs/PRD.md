# CLItoris — Product Requirements Document

## 1. Product Overview

**CLItoris** is a terminal/CLI-themed social network service (SNS).
Users write posts in natural language, and an LLM transforms them into CLI command format, displaying both simultaneously in dual-format.
All social interactions (post, follow, fork, star) are expressed as CLI commands.

**Domain**: `terminal.social`

## 2. Core Concept

- **"Just write what you want to say. The LLM translates to CLI, and both get posted."**
- Natural language input → LLM transformation → CLI command + original text displayed side by side (dual-format)
- All content is open source and forkable

## 3. User Personas

| Persona | Description |
|---------|------------|
| Developers | Users who are comfortable with CLI and enjoy terminal aesthetics |
| AI/LLM users | Users who create content through various LLM models |
| Open source community | GitHub users familiar with fork/star concepts |

## 4. Key Features

### 4.1 Feed System

- **Global feed** (`feed --global`): All public posts
- **Local feed** (`feed --local`): Posts from followed users
- **Following** (`following`): Posts from users you follow
- **Explore** (`explore`): Trending/recommended posts

### 4.2 Posts (Dual Format)

Each post is displayed in two formats simultaneously:

```
┌─ Natural Language ──────────┐  ┌─ CLI — open source ─────────┐
│ While vibe-coding, I        │  │ post --user=jiyeon.kim \    │
│ realized we might be        │  │   --lang=ko \               │
│ adapting to AI, not the     │  │   --message="observing AI   │
│ other way around.           │  │   language convergence..." \ │
│ #vibe-coding #thoughts      │  │   --tags=vibe-coding \      │
│                              │  │   --visibility=public       │
└──────────────────────────────┘  └─────────────────────────────┘
```

**Post attributes:**
- `--user`: Author
- `--lang`: Language code (ko, en, hi, etc.)
- `--message`: Body content
- `--tags`: Hashtags (comma-separated)
- `--visibility`: Visibility scope (public, private, unlisted)
- `--mention`: Mentions

### 4.3 Interactions

| Action | CLI Representation | Description |
|--------|-------------------|-------------|
| Reply | `reply` | Reply to a post |
| Fork | `fork` | Clone a post and rewrite on your own timeline |
| Star | `star` | Like/bookmark |

### 4.4 LLM Integration

Users select an LLM model when composing posts to perform natural language → CLI transformation:

- **claude-sonnet** (default)
- **gpt-4o**
- **llama-3**
- **connect LLM** (custom LLM connection)

**Transformation flow:**
```
Natural language input → [Cmd+Enter] → Select LLM → CLI format conversion → Save as dual-format
```

### 4.5 Multilingual Support

- Each post displays language via `--lang` tag
- `--translate=auto` option for automatic translation
- `--dual-format` option for original + translation side by side

### 4.6 User Profiles

- `@username` format (e.g., `@jiyeon_dev`, `@0xmitsuki`)
- Custom domain linking (e.g., `jiyeon.kim`, `mitsuki.sh`, `arjun.io`, `lena.dev`)
- View own posts (`my posts`, `my posts --raw`)
- Starred posts (`starred`)

### 4.7 "by LLM" Filter

Browse content filtered by the LLM model that generated it:
- claude-sonnet
- gpt-4o
- llama-3

## 5. UI/UX Design

### 5.1 Design Principles

- **Terminal aesthetic**: Dark backgrounds, monospace fonts, green/amber/cyan text
- **Dual panel**: Natural language on the left, CLI command on the right
- **Minimal chrome**: No unnecessary UI decoration, content-focused

### 5.2 Color Palette

| Element | Color |
|---------|-------|
| Background | `#1a1a2e` (dark navy) |
| Primary text | `#e0e0e0` (light gray) |
| CLI keywords | `#4ade80` (green) |
| Usernames | `#fbbf24` (amber) |
| Hashtags | `#22d3ee` (cyan) |
| Language tags | `#a78bfa` (purple) |
| Command prompt | `#f97316` (orange) |

### 5.3 Layout Structure

```
┌─────────────────────────────────────────────────────┐
│ terminal.social / navigation breadcrumbs             │
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │  Main Feed                               │
│          │  ┌─ Composer Bar ───────────────────┐    │
│ // nav   │  │ Natural + CLI prompt save [LLM→CLI]│   │
│ $ feed   │  └─────────────────────────────────┘    │
│ following│  ┌─ Post Card ─────────────────────┐    │
│ explore  │  │ [Natural panel] │ [CLI panel]    │    │
│          │  │                 │                 │    │
│ // by LLM│  │ reply · fork · star              │    │
│ · claude │  └─────────────────────────────────┘    │
│ · gpt-4o │                                          │
│ · llama  │  ┌─ Post Card ─────────────────────┐    │
│          │  │ ...                               │    │
│ // me    │  └─────────────────────────────────┘    │
│ @you     │                                          │
│ my posts │                                          │
│ starred  │                                          │
└──────────┴──────────────────────────────────────────┘
```

### 5.4 Fonts

- **Body**: `JetBrains Mono`, `Fira Code`, or system monospace
- **Natural language section**: Readable sans-serif allowed (optional)

## 6. Information Architecture

### 6.1 Navigation

```
/                       → Global feed (default)
/feed/local             → Local feed
/following              → Following feed
/explore                → Explore
/by-llm/:model          → Filter by LLM
/@:username             → User profile
/@:username/posts       → User posts
/@:username/starred     → Starred posts
/post/:id               → Single post + thread
```

### 6.2 Data Model

```
User {
  id, username, domain, display_name,
  bio, avatar_url, created_at
}

Post {
  id, user_id, message_raw, message_cli,
  lang, tags[], mentions[], visibility,
  llm_model, parent_id (reply),
  forked_from_id, created_at
}

Follow { follower_id, following_id }
Star   { user_id, post_id }
Fork   { user_id, original_post_id, forked_post_id }
```

## 7. Monorepo Structure

pnpm workspaces-based monorepo.

```
CLItoris/
├── package.json              # Root — pnpm workspace config
├── pnpm-workspace.yaml       # Workspace package definitions
├── tsconfig.base.json        # Shared TypeScript config
├── .eslintrc.cjs             # Shared ESLint config
├── .prettierrc               # Shared Prettier config
├── CLAUDE.md
├── docs/
│   └── PRD.md
│
├── packages/
│   ├── client/               # @clitoris/client — React frontend
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx       # Entry point
│   │       ├── App.tsx
│   │       ├── components/    # Reusable UI components
│   │       │   ├── feed/      # Feed-related (PostCard, FeedList)
│   │       │   ├── post/      # Post dual panel
│   │       │   ├── layout/    # Sidebar, Header, Shell
│   │       │   └── common/    # Common (Button, Input, Tag)
│   │       ├── pages/         # Route pages
│   │       ├── stores/        # Zustand stores
│   │       ├── hooks/         # Custom React hooks
│   │       ├── styles/        # Global styles, theme
│   │       └── utils/         # Client utilities
│   │
│   ├── server/               # @clitoris/server — Express backend
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts       # Server entry point
│   │       ├── app.ts         # Express app setup
│   │       ├── routes/        # API route handlers
│   │       │   ├── posts.ts
│   │       │   ├── users.ts
│   │       │   └── llm.ts
│   │       ├── db/
│   │       │   ├── index.ts   # DB connection (better-sqlite3)
│   │       │   ├── schema.ts  # Table definitions
│   │       │   └── migrations/
│   │       ├── middleware/     # Auth, logging, error handling
│   │       └── utils/
│   │
│   ├── shared/               # @clitoris/shared — Shared code
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── types/         # Shared TypeScript types
│   │       │   ├── post.ts
│   │       │   ├── user.ts
│   │       │   └── api.ts
│   │       └── constants/     # Shared constants (LLM model names, colors, etc.)
│   │
│   └── llm/                  # @clitoris/llm — LLM integration module
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts       # Unified LLM interface
│           ├── providers/
│           │   ├── anthropic.ts  # Claude integration
│           │   ├── openai.ts     # GPT integration
│           │   └── ollama.ts     # Llama local integration
│           └── transformer.ts    # Natural language → CLI transformation logic
│
├── tests/
│   ├── unit/                 # Vitest unit tests
│   └── e2e/                  # Playwright E2E tests
│       └── playwright.config.ts
│
└── scripts/                  # Build/deploy/seed scripts
```

### Workspace Packages

| Package | Name | Description |
|---------|------|-------------|
| `packages/client` | `@clitoris/client` | React frontend app |
| `packages/server` | `@clitoris/server` | Express API server |
| `packages/shared` | `@clitoris/shared` | Shared types, constants |
| `packages/llm` | `@clitoris/llm` | LLM provider integration |

### Root Scripts (root package.json)

```json
{
  "scripts": {
    "dev": "pnpm --parallel -r run dev",
    "dev:client": "pnpm --filter @clitoris/client dev",
    "dev:server": "pnpm --filter @clitoris/server dev",
    "build": "pnpm -r run build",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint packages/",
    "format": "prettier --write packages/"
  }
}
```

### Package Dependencies

```
@clitoris/client ──→ @clitoris/shared
                 ──→ @clitoris/llm (API call types)

@clitoris/server ──→ @clitoris/shared
                 ──→ @clitoris/llm

@clitoris/llm    ──→ @clitoris/shared
```

## 8. Tech Stack

| Area | Technology |
|------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| State management | Zustand |
| Flow diagrams | `@xyflow/react` v12 |
| Backend | Node.js + Express + tsx (TypeScript direct execution) |
| DB | SQLite (`better-sqlite3`) + versioned migrations |
| Logging | pino |
| Testing | Vitest (frontend + server), Playwright (E2E) |
| Package manager | pnpm |
| LLM integration | Anthropic SDK, OpenAI SDK, Ollama (llama) |

## 9. API Design (Draft)

```
POST   /api/posts              → Create post
GET    /api/posts/feed/global   → Global feed
GET    /api/posts/feed/local    → Local feed
GET    /api/posts/:id           → Single post
POST   /api/posts/:id/reply     → Reply
POST   /api/posts/:id/fork      → Fork
POST   /api/posts/:id/star      → Toggle star
DELETE /api/posts/:id           → Delete post

GET    /api/users/@:username    → User profile
POST   /api/users/@:username/follow → Toggle follow
GET    /api/users/@:username/posts  → User posts

POST   /api/llm/transform      → Natural language → CLI transformation
GET    /api/posts/by-llm/:model → Filter by LLM model
```

## 10. MVP Scope

### Phase 1 — Core
- [ ] User registration/login
- [ ] Post creation (dual format)
- [ ] LLM transformation (claude-sonnet first)
- [ ] Global feed
- [ ] Star/reply

### Phase 2 — Social
- [ ] Follow/following
- [ ] Local feed
- [ ] Fork functionality
- [ ] User profile page

### Phase 3 — Expansion
- [ ] Multi-LLM support (gpt-4o, llama-3)
- [ ] Multilingual auto-translation
- [ ] Explore/trending
- [ ] Custom LLM connections

## 11. Vibe Coding Development Approach

This project is built through **vibe coding** (AI-driven development).

### Core Principles

1. **AI writes the code** — Humans set direction, AI implements
2. **Documentation is context** — CLAUDE.md, CONVENTIONS.md, ARCHITECTURE.md serve as AI's memory
3. **One thing at a time** — One feature per prompt. Iterate in small units
4. **Review then feedback** — Run AI output, provide specific feedback

### AI-Optimized Documentation System

```
CLAUDE.md          → Project summary (first thing AI reads)
CONVENTIONS.md     → Coding rules (naming, patterns, prohibitions)
docs/
├── PRD.md         → Product requirements
├── ARCHITECTURE.md → System architecture, DB schema, data flows
├── DESIGN_GUIDE.md → Visual system, component specs
└── PROMPTS.md     → Vibe coding prompt templates
```

### Why These Tech Choices Favor AI

| Choice | Reason |
|--------|--------|
| TypeScript | Language AI generates best; types communicate intent |
| React + Tailwind | Frontend combo with most AI training data |
| Express | Simple and universal; minimal room for AI errors |
| SQLite | Zero config, single file, simple migrations |
| Zustand | Minimal boilerplate vs Redux; AI generates cleanly |
| pnpm workspaces | AI clearly recognizes package boundaries |
| Vitest | Jest-compatible so AI is familiar; fast execution |
| tsx | Zero config execution unlike ts-node |

## 12. Non-Functional Requirements

- **Performance**: Feed loading < 500ms
- **Accessibility**: Full keyboard navigation support (terminal UX)
- **Responsive**: Dual-format display on mobile (vertical stack)
- **Security**: XSS prevention, SQL injection prevention, rate limiting
- **Open source**: All post data structured for forking
