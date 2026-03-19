# CLItoris — Product Requirements Document

> **Source of truth** for product requirements, feature specifications, and MVP scope.

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

### User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| US-1 | User | Write a post in natural language | I can express myself naturally |
| US-2 | User | See my post transformed to CLI | Both humans and machines can read it |
| US-3 | User | Choose which AI model transforms my post | I can compare how different AIs interpret me |
| US-4 | User | Star posts I like | I can bookmark them for later |
| US-5 | User | Fork another user's post | I can remix and respond with my own version |
| US-6 | User | Reply to posts | I can have conversations |
| US-7 | User | Follow other users | I see their posts in my local feed |
| US-8 | User | Filter feed by AI model | I can compare Claude vs GPT vs Llama outputs |
| US-9 | User | Write in any language | The CLI flags work the same regardless of language |
| US-10 | Developer | Use keyboard shortcuts | I can navigate without a mouse |

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

Users select an LLM provider when composing posts to perform natural language → CLI transformation:

| Provider | Type | Model Selection | Description |
|----------|------|----------------|-------------|
| **anthropic** | API | All Anthropic models (claude-sonnet, opus, haiku...) | Anthropic SDK |
| **openai** | API | All OpenAI models (gpt-4o, gpt-4, o1, o3...) | OpenAI SDK |
| **ollama** | Local | All installed local models | Ollama REST API |
| **cursor** | API | Cursor-supported models | Cursor AI |
| **cli** | CLI | Depends on CLI tool | Claude Code, Codex, Gemini CLI, OpenCode |
| **api** | API | Any model on the endpoint | Generic OpenAI-compatible REST |
| **custom** | Custom | User-configured | User-provided configuration |

**Key principle: Every provider exposes a model selector.** Users pick both the provider AND the specific model within that provider. For example: Anthropic provider → claude-sonnet-4, or OpenAI provider → gpt-4o.

**Connection types:**
- **API providers**: Require API key, call external endpoints, fetch available model list
- **Local LLM**: Run models locally via Ollama (no API key needed), list installed models
- **CLI adapter**: Execute CLI coding tools (Claude Code, Codex, Gemini CLI, Cursor, OpenCode)
- **Generic API**: Connect any OpenAI-compatible endpoint with custom base URL + model name

**Transformation flow:**
```
Natural language input → [Cmd+Enter] → Select provider → CLI format conversion → Save as dual-format
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

pnpm workspaces monorepo with 4 packages:

| Package | Name | Description |
|---------|------|-------------|
| `packages/client` | `@clitoris/client` | React 19 frontend (Vite + Tailwind) |
| `packages/server` | `@clitoris/server` | Express API server (tsx) |
| `packages/shared` | `@clitoris/shared` | Shared TypeScript types and constants |
| `packages/llm` | `@clitoris/llm` | LLM provider integration (Anthropic, OpenAI, Ollama) |

> Full directory tree and file-level breakdown: see `docs/architecture/architecture.json`
> Visual diagram: see `docs/architecture/org-chart.mmd`

## 8. Tech Stack

> Full tech stack details: see `CLAUDE.md` (Tech Stack section)

Key choices: React 19 + TypeScript + Vite + Tailwind CSS (frontend), Express + tsx (backend), SQLite + better-sqlite3 (database), Zustand (state), pnpm workspaces (monorepo).

## 9. API Endpoints

18 REST endpoints organized into 4 groups:
- **Auth** (4): register, login, logout, me
- **Posts** (8): create, feed/global, feed/local, get, reply, fork, star, delete, by-llm
- **Users** (4): profile, posts, starred, follow
- **LLM** (1): transform

> Full API documentation with request/response examples: see `docs/specs/API.md`
> OpenAPI 3.1 schema: see `docs/specs/api-schema.json`

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
2. **Documentation is context** — CLAUDE.md and docs/ serve as AI's memory
3. **One thing at a time** — One feature per prompt. Iterate in small units
4. **Review then feedback** — Run AI output, provide specific feedback

### AI-Optimized Documentation System

```
CLAUDE.md                          → Project summary (first thing AI reads)
docs/
├── guides/CONVENTIONS.md          → Coding rules (naming, patterns, prohibitions)
├── guides/DESIGN_GUIDE.md         → Visual system, component specs
├── guides/PROMPTS.md              → Vibe coding prompt templates
├── specs/PRD.md                   → Product requirements
├── specs/DATABASE.md              → DB schema, queries, migrations
├── specs/API.md                   → REST API documentation
├── architecture/ARCHITECTURE.md   → System architecture, data flows
└── architecture/*.mmd             → Mermaid diagrams
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

---

## See Also

- [API.md](./API.md) — Full REST API documentation
- [DATABASE.md](./DATABASE.md) — Database schema and queries
- [Screen specs](../screens/) — Page-by-page UI specifications
- [DESIGN_GUIDE.md](../guides/DESIGN_GUIDE.md) — Visual design system
