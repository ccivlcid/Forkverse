# CLAUDE.md

Guidance for AI assistants working with the Forkverse repository.

> **Source of truth** for project overview, tech stack, and documentation index.

## Project Overview

**Forkverse** is a **Repo Analysis Platform** with a terminal/CLI aesthetic.
Users analyze GitHub repositories using AI, and the results are transformed into structured developer insights — reports, presentations, and video walkthroughs.
Analysis results can be shared, starred, and forked within a developer-oriented social layer.

**Core principle**: **Analyze first, social second.**
The primary value is repo analysis and insight generation. Social features (feed, star, fork, follow) serve as the distribution layer for analysis results.

**Domain**: `terminal.social`

## Tech Stack

| Area | Technology |
|------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| State management | Zustand v5 |
| Routing | React Router v7 (`react-router-dom`) |
| Backend | Node.js + Express 5 + tsx (TypeScript direct execution) |
| DB | SQLite (`better-sqlite3`) + 19 versioned migrations |
| Logging | pino |
| Testing | Vitest (frontend + server), Playwright (E2E) |
| Package manager | pnpm |
| LLM Integration | Anthropic SDK, OpenAI SDK, Google Gemini SDK, Ollama, Cursor, Generic API |
| i18n | 4 languages (en, ko, zh, ja) — client-side via Zustand |

## Monorepo Structure

pnpm workspaces monorepo.

```
packages/
├── client/    # @forkverse/client — React frontend (Vite + Tailwind)
│   ├── src/lib/native.ts          # Capacitor native plugin integration (lazy-loaded)
│   ├── src/hooks/usePullToRefresh.ts  # Pull-to-refresh touch hook
│   └── capacitor.config.ts        # Capacitor native app config
├── server/    # @forkverse/server — Express API server (tsx)
│   ├── src/lib/worker.ts          # Analysis job queue worker (polling, retry, backoff)
│   ├── src/lib/llmGateway.ts      # Centralized LLM call routing with logging
│   └── src/lib/crypto.ts          # AES-256-GCM encryption for API keys at rest
├── shared/    # @forkverse/shared — Shared types, constants
└── llm/       # @forkverse/llm — LLM provider integration (Anthropic, OpenAI, Ollama)
docs/          # All project documentation (organized by subfolder)
tests/         # unit (Vitest), e2e (Playwright)
scripts/       # Build/deploy scripts
```

### Commands

```bash
pnpm dev              # Run all dev servers
pnpm dev:client       # Frontend only
pnpm dev:server       # Backend only
pnpm build            # Build all packages
pnpm test             # Vitest unit tests
pnpm test:e2e         # Playwright E2E
pnpm lint             # ESLint
pnpm format           # Prettier
pnpm seed             # Seed DB with mock users & posts (scripts/seed.ts)
```

### Package Dependencies

```
client ──→ shared, llm (types)
server ──→ shared, llm
llm    ──→ shared
```

## Design Conventions

- **UI**: Dark background (`#0d1117`), monospace font (JetBrains Mono), terminal aesthetic
- **Colors**: Green (`#3fb950`) CLI keywords, Yellow (`#d29922`) usernames, Cyan (`#76e3ea`) hashtags, Blue (`#58a6ff`) links, Purple (`#bc8cff`) accents
- **Surface**: `#161b22` cards/panels, `#30363d` borders, `#e6edf3` primary text, `#7d8590` muted text
- **Layout**: Left sidebar navigation, Analyze as primary entry point, dual-panel posts (natural language | CLI) in social layer
- **Keyboard**: Vim-like shortcuts (j/k nav, s star, o open, g-chord page navigation)
- **Mobile**: Bottom navigation with Analyze as center action, PWA-ready, future Capacitor/native app

## Development Workflow

### Branch Conventions

- Feature branches follow the pattern: `claude/<description>-<id>`
- All development happens on feature branches; never push directly to `main`

### Commit Guidelines

- Use conventional commit style: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
- Keep subject line under 50 characters
- No vague messages like "fix bugs" or "update code"

## PROGRESS.md Rule

**MANDATORY**: Update `docs/PROGRESS.md` at the start AND end of every task.

- **Before starting**: Add the task to the relevant phase table with status `In Progress`
- **After completing**: Mark it `Complete` and add a decision log entry if a significant choice was made

This rule applies to every coding task regardless of size.

---

## Vibe Coding

This project is built through AI-driven development. Humans set direction, AI implements.

### Quick Start for AI

```bash
# 1. Bootstrap (copy configs from docs/setup/CONFIGS.md)
pnpm install

# 2. Set up environment
cp .env.example .env
# Add ANTHROPIC_API_KEY, SESSION_SECRET

# 3. Run migrations (see docs/specs/DATABASE.md section 6)
# Migrations auto-run on server start

# 4. Start development
pnpm dev
```

### Implementation Order
1. `@forkverse/shared` — Types first (Analysis, Post, User, ApiResponse)
2. `@forkverse/server` — DB setup + API routes + Analysis Job pipeline
3. `@forkverse/llm` — LLM providers + analyzer + transformer
4. `@forkverse/client` — Shell layout → Analyze page → Result page → Social pages

### Product Strategy
- **Product**: Repo Analysis Platform (B-plan) — see `docs/specs/Forkverse_최종통합본_Part1_제품전략_공개전략.md`
- **Architecture**: API + Worker separation planned — see `docs/specs/Forkverse_최종통합본_Part2_아키텍처_UIUX_로드맵.md`
- **Business**: Open Core + SaaS hosting
- **Mobile**: PWA → Capacitor (App Store) → Native (if needed) — see `docs/specs/MOBILE.md`

## Documentation Map

All documentation lives under `docs/` organized by category.

```
docs/
├── GLOSSARY.md                        # Unified terminology index (analysis + social terms)
├── PROGRESS.md                        # Development status and decision log (A-plan complete, B-plan in progress)
├── setup/                             # Project bootstrapping
│   └── CONFIGS.md                     # All config files (package.json, tsconfig, vite, tailwind)
├── guides/                            # Development guides
│   ├── CONVENTIONS.md                 # Strict coding rules, naming, prohibitions
│   ├── PATTERNS.md                    # Implementation patterns (optimistic updates, pagination, auth)
│   ├── PROMPTS.md                     # Vibe coding prompt templates
│   ├── ENV.md                         # Environment variables reference
│   ├── I18N.md                        # Internationalization (4 languages)
│   ├── error.md                       # Error handling guide
│   ├── TROUBLESHOOTING.md            # Common issues & solutions for local development
│   └── DEPLOY_MOBILE.md             # Android & iOS 배포 실전 가이드
├── design/                            # Visual design system
│   ├── DESIGN_GUIDE.md               # Visual system index — colors, typography, layout
│   ├── DESIGN_COMPONENTS.md          # Component specs (Post Card, Sidebar, Composer, etc.)
│   ├── DESIGN_STATES.md              # Interaction states, animations, loading/empty/error
│   ├── DESIGN_UI.md                  # Icons, responsive, accessibility, modals, forms
│   └── tokens.json                    # Design token definitions
├── testing/                           # Test documentation
│   ├── TESTING.md                     # Testing overview, config, commands, coverage, rules
│   ├── TESTING_PATTERNS.md           # Component/store/API/E2E/LLM test patterns
│   ├── TESTING_SETUP.md              # Mock patterns, test factories, environment setup
│   └── fixtures.json                  # Test fixture data
├── screens/                           # Page-by-page UI screen specifications
│   ├── routes.json                    # Route definitions
│   ├── HOME.md                        # / — Hero + Analyze CTA + popular analyses (primary entry)
│   ├── ANALYZE.md                     # /analyze — Repo analysis tool (primary feature)
│   ├── ANALYSIS_RESULT.md             # /analysis/:id — Analysis result detail with sections
│   ├── FEED.md                        # /feed — Global + Local feed (social layer)
│   ├── EXPLORE.md                     # /explore — Trending analyses + repos
│   ├── POST_DETAIL.md                 # /post/:id — Single post + replies
│   ├── USER_PROFILE.md               # /@:username — User profile + analyses
│   ├── LOGIN.md                       # /login — GitHub OAuth connect (SSH metaphor)
│   ├── SETUP.md                       # /setup — First-time profile setup
│   ├── SETTINGS.md                    # /settings — User settings
│   ├── GITHUB_FEED.md                 # /github — GitHub Stars, Notifications, Issues & PRs
│   ├── ACTIVITY_FEED.md               # /activity — Activity feed (following + global)
│   └── SEARCH.md                      # /search — Full-text search (analyses, posts, users, tags)
├── specs/                             # Technical specifications
│   ├── PRD.md                         # Product requirements document (B-plan: Repo Analysis Platform)
│   ├── MOBILE.md                      # Mobile strategy (PWA → Capacitor → Native roadmap)
│   ├── DATABASE.md                    # DB schema, queries, migrations, migration files
│   ├── API.md                         # REST API documentation (73 endpoints, error formats, rate limits)
│   ├── api-schema.json                # OpenAPI 3.1 schema (machine-readable)
│   ├── types.ts                       # Shared type definitions
│   ├── Forkverse_최종통합본_Part1_제품전략_공개전략.md    # Product strategy & open-source strategy
│   └── Forkverse_최종통합본_Part2_아키텍처_UIUX_로드맵.md # Architecture, UI/UX, tech roadmap
├── llm/                               # LLM integration documentation
│   ├── LLM_INTEGRATION.md            # LLM overview, system prompt, provider interface, execution modes
│   ├── LLM_PROVIDERS.md              # 7 provider implementations (Anthropic, OpenAI, Gemini, Ollama, etc.)
│   └── LLM_DETECTION.md              # Credential auto-detection, response parsing, error handling
└── architecture/                      # Architecture diagrams
    ├── ARCHITECTURE.md                # System architecture, data flows, auth, errors
    ├── architecture.json              # Full system config (JSON)
    ├── component-map.json             # Component dependency map
    ├── backend-dependencies.mmd       # Server module dependency graph (Mermaid)
    ├── frontend-imports.mmd           # Client component import graph (Mermaid)
    ├── org-chart.mmd                  # Monorepo folder hierarchy (Mermaid)
    └── schema-erd.md                  # Database ERD + data flow examples
```

**Required reading (priority order):**
1. `CLAUDE.md` — Project summary (this file)
2. `docs/specs/Forkverse_최종통합본_Part1_제품전략_공개전략.md` — Product strategy (B-plan direction)
3. `docs/specs/Forkverse_최종통합본_Part2_아키텍처_UIUX_로드맵.md` — Architecture & roadmap
4. `docs/specs/PRD.md` — Product requirements (Repo Analysis Platform)
5. `docs/specs/MOBILE.md` — Mobile strategy (PWA → Capacitor → Native)
6. `docs/setup/CONFIGS.md` — Config files to bootstrap the project
7. `docs/guides/CONVENTIONS.md` — Coding rules, naming, prohibitions
8. `docs/GLOSSARY.md` — Unified terminology index (analysis + social terms)
9. `docs/design/DESIGN_GUIDE.md` — Visual system index (colors, typography, layout)
10. `docs/design/DESIGN_COMPONENTS.md` — Component specifications
11. `docs/design/DESIGN_STATES.md` — Interaction states, loading/empty/error
12. `docs/design/DESIGN_UI.md` — Icons, responsive, accessibility, forms
13. `docs/guides/PATTERNS.md` — Implementation patterns (optimistic updates, pagination, auth, performance)
14. `docs/screens/*` — Page-by-page UI screen specifications
15. `docs/llm/LLM_INTEGRATION.md` — LLM overview, system prompt, provider interface
16. `docs/architecture/ARCHITECTURE.md` — System architecture, auth, error flows
17. `docs/specs/DATABASE.md` — DB schema, queries, migrations
18. `docs/specs/API.md` — REST API documentation with error formats
19. `docs/testing/TESTING.md` — Testing overview, config, rules
20. `docs/testing/TESTING_PATTERNS.md` — Test code examples
21. `docs/testing/TESTING_SETUP.md` — Mocks, factories, environment setup
22. `docs/guides/TROUBLESHOOTING.md` — Common issues & solutions
23. `docs/guides/ENV.md` — Environment variables reference
