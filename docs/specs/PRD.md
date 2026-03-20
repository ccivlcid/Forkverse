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
- **GitHub-native identity**: Login exclusively via GitHub OAuth. Your developer identity is your social identity.
- **LLM as analysis engine**: Beyond post transformation, LLMs analyze GitHub repos and generate reports, presentations, and videos.

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
| US-20 | User | See intent/emotion metadata on posts | I can understand the tone at a glance |
| US-21 | User | Read posts in my language | I can enjoy content written in other languages |
| US-22 | User | Translation preserves tone and emotion | "ㅋㅋ 대박이다" feels like "omg no way lol", not "That is amazing." |
| US-10 | Developer | Use keyboard shortcuts | I can navigate without a mouse |
| US-11 | Developer | Login with my GitHub account | I don't need another password to remember |
| US-12 | Developer | See my GitHub profile on CLItoris | My developer identity carries over |
| US-13 | Developer | Attach a repo to my post | I can discuss specific projects |
| US-14 | Developer | Browse trending repos mentioned in posts | I can discover interesting projects |
| US-15 | Developer | Analyze a GitHub repo with AI | I can quickly understand unfamiliar codebases |
| US-16 | Developer | Generate a PPTX from repo analysis | I can present project architecture to my team |
| US-17 | Developer | Generate a video walkthrough of a repo | I can share visual explanations of code |
| US-18 | Developer | Install and use local LLMs | I can analyze repos offline with privacy |
| US-19 | Developer | See other users' repo analyses in the feed | I can discover insights about projects |

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
- `--intent`: Inferred communication intent (`casual` | `formal` | `question` | `announcement` | `reaction`)
- `--emotion`: Inferred emotional tone (`neutral` | `happy` | `surprised` | `frustrated` | `excited` | `sad` | `angry`)

`--intent` and `--emotion` are extracted automatically by the LLM during transformation — the user does not set these manually. They are stored in the DB and displayed as metadata on the post card.

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
| **gemini** | API | All Gemini models (gemini-2.5-pro, 2.5-flash, 2.0-flash...) | Google GenAI SDK (`@google/genai`) |
| **ollama** | Local | All installed local models | Ollama REST API |
| **cursor** | API | Cursor-supported models | Cursor AI |
| **api** | API | Any model on the endpoint | Generic OpenAI-compatible REST |
| **custom** | Custom | User-configured | User-provided configuration |

**Key principle: Every provider exposes a model selector.** Users pick both the provider AND the specific model within that provider. For example: Anthropic provider → claude-sonnet-4, or OpenAI provider → gpt-4o.

**Connection types:**
- **API providers**: Require API key, call external endpoints, fetch available model list
- **Local LLM**: Run models locally via Ollama (no API key needed), list installed models
- **Generic API**: Connect any OpenAI-compatible endpoint with custom base URL + model name
- **Auto-detection**: Server scans local env vars, config files (`~/.config/gcloud/`, `~/.anthropic/`), and PATH for available providers. Users already logged into providers on their PC need no additional setup — see `docs/llm/LLM_INTEGRATION.md` section 7

**Transformation flow:**
```
Natural language input → [Cmd+Enter] → Select provider → CLI format conversion → Save as dual-format
```

#### LLM Execution Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **Cloud API** | Anthropic, OpenAI, Gemini via API keys | Post transformation, repo analysis |
| **Local LLM** | Ollama, llama.cpp installed on user's PC | Offline analysis, privacy-sensitive repos |

**Local LLM setup:**
CLItoris provides in-app guidance for installing and managing local models:
```
$ llm --install ollama
> detecting system: Apple M2 Pro, 32GB RAM
> recommended model: llama-3-8b-q4
> downloading... ████████░░ 72%

$ llm --list-local
> ollama/llama-3-8b     (4.7GB, quantized Q4)
> ollama/codellama-13b  (7.3GB, quantized Q4)
```

Users can switch between cloud and local models per task. Local models require no API key and keep all data on-device.

### 4.5 Multilingual Support

- Each post displays language via `--lang` tag
- `--translate=auto` option for automatic translation
- `--dual-format` option for original + translation side by side

#### 4.5.1 Metadata Extraction (`transform`)

When a user posts, the LLM performs structured metadata extraction using a dedicated JSON-output prompt:

```json
{
  "message": "original text, unchanged",
  "lang": "ISO 639-1 code (ko, en, ja, zh, ...)",
  "intent": "casual | formal | question | announcement | reaction",
  "emotion": "neutral | happy | surprised | frustrated | excited | sad | angry",
  "tags": ["extracted", "hashtags"]
}
```

**Rules:**
- `message`: original text copied exactly as-is
- `lang`: primary language detected from text
- `intent`/`emotion`: inferred from tone, word choice, and structure
- `tags`: only extracted when hashtags are explicitly present or topic is very clear
- Always wrapped in `try/catch` — falls back to `{ intent: "neutral", emotion: "neutral" }` on parse failure

This replaces the single-step CLI-string output with a structured two-phase approach:
1. LLM returns JSON metadata → extracted and stored
2. Server reconstructs the CLI command string from the JSON fields

#### 4.5.2 Real-Time Translation (`translate`)

When a feed post's `lang` differs from the viewer's `ui_lang`, the post is translated on the fly:

**Flow:**
1. Feed renders post with `post.lang !== user.ui_lang`
2. Client checks translation cache (`translations` table) by `(post_id, target_lang)`
3. **Cache hit** → return cached text immediately (no LLM call)
4. **Cache miss** → call user's configured LLM with tone-aware translation prompt, cache result

**Tone-aware translation principle:**
Translation preserves `intent` and `emotion` metadata, not just literal meaning:
```
"ㅋㅋ 대박이다" (ko, casual, surprised) → "omg no way lol"   ✓
"ㅋㅋ 대박이다"                          → "That is amazing." ✗ (wrong tone)
```

**Cost model:** Translation uses the **user's own LLM key** — no server-side LLM cost.

**Cache policy:**
- Cache stored per `(post_id, target_lang)` in the `translations` table
- Cache never expires (translations are deterministic for a given post+lang pair)
- Cache populated lazily on first view

**UI:**
- Original text always shown in the natural language panel
- Translation shown inline below original when `ui_lang ≠ post.lang`, togglable
- Badge: `--translated-from=ko` in `text-purple-400/70` style

### 4.6 User Profiles

- `@username` format (e.g., `@jiyeon_dev`, `@0xmitsuki`)
- Custom domain linking (e.g., `jiyeon.kim`, `mitsuki.sh`, `arjun.io`, `lena.dev`)
- View own posts (`my posts`, `my posts --raw`)
- Starred posts (`starred`)

### 4.7 GitHub Integration

All authentication flows through GitHub OAuth. No username/password registration exists.

**Authentication flow:**
```
/login (Connect) → GitHub OAuth → Callback → Existing user? → / (feed)
                                            → New user? → /setup (profile config)
```

**GitHub data imported on connect:**
- Avatar URL (synced as profile picture)
- Display name
- Bio
- Public repos count
- GitHub username (used as default CLItoris username suggestion)

**Repo attachment:**
Posts can reference GitHub repositories via `--repo=owner/name` flag. Attached repos display as mini cards within post cards showing repo name, stars, forks, and primary language.

**Trending repos:**
The Explore page includes a "repos mentioned this week" section showing the most-referenced repositories across all posts.

**GitHub scopes requested:**
- `read:user` — Public profile information
- `user:email` — Email for account linking

No repository access is requested. CLItoris reads public profile data only.

### 4.8 "by LLM" Filter

Browse content filtered by the LLM model that generated it:
- claude-sonnet
- gpt-4o
- gemini-2.5-pro
- llama-3

### 4.9 Repo Analysis (`$ analyze`)

LLMs can analyze GitHub repositories and produce structured outputs. Analysis results can be shared as posts.

**Command format:**
```
$ analyze --repo=owner/name --output=<type> --model=<model> --lang=<lang>
```

#### Output Types

**Report** (`--output=report`):
Structured analysis of repo architecture, tech stack, complexity metrics, key patterns, and AI-generated summary. Displayed as a terminal-style report card.

```
$ analyze --repo=vercel/next.js --output=report

┌─ Analysis Report ──────────────────────────────────────┐
│  repo: vercel/next.js                                   │
│  stars: 128k · forks: 27k · contributors: 3,200        │
│                                                         │
│  // architecture                                        │
│  type: monorepo (turborepo)                             │
│  primary-lang: TypeScript (87%)                         │
│  build: turbopack + webpack                             │
│                                                         │
│  // complexity                                          │
│  files: 2,847 · avg-depth: 4.2 · circular-deps: 3     │
│  test-coverage: ~72% (estimated)                        │
│                                                         │
│  // ai summary                                          │
│  "Next.js is a production-grade React framework         │
│   with hybrid rendering strategies..."                  │
│                                                         │
│  generated by: claude-sonnet · 12.3s                    │
└─────────────────────────────────────────────────────────┘
```

**PPTX Presentation** (`--output=pptx`):
Auto-generated slide deck covering architecture, data flow, tech stack, and roadmap. Downloadable or attachable to posts.

Options:
- `--slides=N` — Number of slides (default 10)
- `--style=minimal|corporate|terminal` — Slide design style
- `--focus=architecture|api|security|overview` — Analysis focus area

**Video Walkthrough** (`--output=video`):
AI-generated video with terminal-style animations walking through repo structure. Includes AI narration.

Options:
- `--duration=30s|60s|120s` — Video length
- `--type=walkthrough|demo|pitch` — Video style
- `--format=mp4|webm` — Output format

#### Analysis Flow

```
Select repo → Choose output type → Pick LLM model → Start analysis
    ↓              ↓                    ↓                ↓
GitHub API    report|pptx|video    cloud|local|cli    Progress display
    ↓                                                    ↓
Clone (shallow) → LLM analysis → Generate output → Preview
                                                      ↓
                                          Download or Post to feed
```

#### Sharing Analysis Results

Analysis outputs can be:
1. **Downloaded** — `.md` report, `.pptx` file, `.mp4` video
2. **Posted to feed** — Shared as a special analysis post with preview card
3. **Attached to existing post** — Referenced in a regular post via `--attach=analysis:<id>`

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
/setup                  → First-time profile setup (after GitHub OAuth)
/@:username/repos       → User's pinned GitHub repos
/analyze                → Repo analysis tool
```

### 6.2 Data Model

```
User {
  id, username, domain, display_name,
  bio, avatar_url, created_at,
  github_id, github_username,
  github_avatar_url, github_profile_url,
  github_repos_count, github_connected_at
}

Post {
  id, user_id, message_raw, message_cli,
  lang, tags[], mentions[], visibility,
  llm_model, parent_id (reply),
  forked_from_id, created_at,
  intent (casual|formal|question|announcement|reaction),
  emotion (neutral|happy|surprised|frustrated|excited|sad|angry)
}

Translation {
  id, post_id, lang (target language),
  text (translated content),
  created_at
  -- UNIQUE(post_id, lang) -- cache key
}

Follow { follower_id, following_id }
Star   { user_id, post_id }
Fork   { user_id, original_post_id, forked_post_id }

RepoAttachment {
  post_id, repo_owner, repo_name,
  repo_stars, repo_forks, repo_language,
  cached_at
}

Analysis {
  id, user_id, repo_owner, repo_name,
  output_type (report | pptx | video),
  llm_model, lang, options_json,
  result_url, result_summary,
  status (pending | processing | completed | failed),
  duration_ms, created_at
}
```

## 7. Monorepo & Tech Stack

> Monorepo structure, package list, and full tech stack: see `CLAUDE.md` (Tech Stack + Monorepo sections).
> Directory tree: see `docs/architecture/architecture.json` and `docs/architecture/org-chart.mmd`.

## 9. API Endpoints

24 REST endpoints organized into 6 groups:
- **Auth** (4): github (OAuth start), github/callback, logout, me
- **Posts** (8): create, feed/global, feed/local, get, reply, fork, star, delete, by-llm
- **Users** (5): profile, posts, starred, repos, follow
- **LLM** (2): transform, list-local
- **GitHub** (2): sync profile, trending repos
- **Analyze** (3): start analysis, get analysis, list user analyses

> Full API documentation with request/response examples: see `docs/specs/API.md`
> OpenAPI 3.1 schema: see `docs/specs/api-schema.json`

## 10. MVP Scope

### Phase 1 — Core
- [ ] GitHub OAuth login
- [ ] First-time profile setup (/setup)
- [ ] Post creation (dual format)
- [ ] LLM transformation (claude-sonnet first)
- [ ] Global feed
- [ ] Star/reply

### Phase 2 — Social
- [ ] Follow/following
- [ ] Local feed
- [ ] Fork functionality
- [ ] User profile page with GitHub info

### Phase 3 — Expansion
- [ ] Multi-LLM support (gpt-4o, llama-3)
- [ ] Local LLM installation guide (`$ llm --install`)
- [ ] **Metadata extraction**: `intent` + `emotion` fields via JSON-output LLM prompt (section 4.5.1)
- [ ] **Real-time translation**: tone-aware, cached in `translations` table, uses user's LLM key (section 4.5.2)
  - DB: `posts.intent`, `posts.emotion` columns + `translations` table
  - LLM: `packages/llm/prompts/transform.md` (JSON output), `packages/llm/prompts/translate.md`
  - API: `POST /api/posts/:id/translate` (returns cached or fresh translation)
  - UI: translation toggle below natural panel when `post.lang ≠ ui_lang`
- [ ] Explore/trending
- [ ] Custom LLM connections

### Phase 4 — GitHub Deep Integration
- [ ] Repo attachment on posts
- [ ] Trending repos on Explore page
- [ ] GitHub activity → auto-posts
- [ ] GitHub profile sync (daily)
- [ ] User profile repos tab
- [ ] Repo analysis — report output (`$ analyze --output=report`)

### Phase 5 — Analysis & Generation
- [ ] Repo analysis — PPTX generation (`$ analyze --output=pptx`)
- [ ] Repo analysis — Video generation (`$ analyze --output=video`)
- [ ] `/analyze` dedicated page
- [ ] Analysis results as feed posts
- [ ] Analysis history per user

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
├── design/DESIGN_GUIDE.md         → Visual system, component specs
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

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Feed loading (global) | < 500ms | Time from request to first post rendered (p95) |
| Feed loading (local) | < 500ms | Time from request to first post rendered (p95) |
| LLM transformation | < 5s | Time from submit to CLI preview displayed (p95) |
| Post creation | < 300ms | Time from confirm to post appearing in feed (p95) |
| Star toggle | < 100ms | Time from click to UI update (optimistic) |
| Page initial load | < 2s | Time from navigation to interactive (LCP) |
| Bundle size (client) | < 500KB | Gzipped JS + CSS total |
| SQLite query | < 50ms | Any single query execution time (p95) |
| Repo analysis (report) | < 30s | Time from start to report rendered (p95) |
| Repo analysis (pptx) | < 60s | Time from start to download available (p95) |
| Repo analysis (video) | < 180s | Time from start to video playback ready (p95) |

### Accessibility

- Full keyboard navigation support (vim-style `j`/`k` for posts)
- All interactive elements have `focus-visible` ring
- All icon-only buttons have `aria-label`
- Minimum contrast ratio 4.5:1 (WCAG AA)
- Screen reader compatible (semantic HTML, `aria-live` for dynamic updates)
- Skip navigation link for keyboard users

### Responsive Design

| Breakpoint | Layout |
|------------|--------|
| < 640px (mobile) | Sidebar hidden, dual panel stacks vertically, icon-only action bar |
| 640-1024px (tablet) | Sidebar collapsible, dual panel side by side |
| > 1024px (desktop) | Full layout with fixed sidebar |

### Security

| Measure | Implementation |
|---------|---------------|
| XSS prevention | React auto-escaping + DOMPurify for CLI rendering |
| SQL injection | Prepared statements only (better-sqlite3) |
| CSRF protection | Session-based with SameSite cookies |
| Rate limiting | express-rate-limit per endpoint (see API.md section 6) |
| OAuth security | GitHub OAuth 2.0 with PKCE, state parameter for CSRF |
| Input validation | zod schemas at API boundary |
| Session security | httpOnly, secure, SameSite=Lax cookies |

### Open Source Principles

- All post data structured for forking
- CLI output is plain text, easily parseable
- API follows REST conventions with OpenAPI schema
- No vendor lock-in on LLM providers (pluggable architecture)

---

## See Also

- [API.md](./API.md) — Full REST API documentation
- [DATABASE.md](./DATABASE.md) — Database schema and queries
- [Screen specs](../screens/) — Page-by-page UI specifications (LOGIN, SETUP, GLOBAL_FEED, etc.)
- [DESIGN_GUIDE.md](../design/DESIGN_GUIDE.md) — Visual design system
