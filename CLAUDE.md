# CLAUDE.md

Guidance for AI assistants working with the CLItoris repository.

> **Source of truth** for project overview, tech stack, and documentation index.

## Project Overview

**CLItoris** is a terminal/CLI-themed social network service (SNS).
Users write posts in natural language, and an LLM transforms them into CLI command format, displaying both side by side (dual-format).
All social interactions (post, follow, fork, star) are expressed as CLI commands.

**Domain**: `terminal.social`

## Tech Stack

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
| LLM Integration | Anthropic SDK, OpenAI SDK, Google Gemini SDK, Ollama, Cursor, CLI adapter, Generic API |

## Monorepo Structure

pnpm workspaces monorepo.

```
packages/
├── client/    # @clitoris/client — React frontend (Vite + Tailwind)
├── server/    # @clitoris/server — Express API server (tsx)
├── shared/    # @clitoris/shared — Shared types, constants
└── llm/       # @clitoris/llm — LLM provider integration (Anthropic, OpenAI, Ollama)
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
```

### Package Dependencies

```
client ──→ shared, llm (types)
server ──→ shared, llm
llm    ──→ shared
```

## Design Conventions

- **UI**: Dark background (`#1a1a2e`), monospace font, terminal aesthetic
- **Colors**: Green (`#4ade80`) CLI keywords, Amber (`#fbbf24`) usernames, Cyan (`#22d3ee`) hashtags
- **Layout**: Left sidebar navigation + dual-panel posts (natural language | CLI)

## Development Workflow

### Branch Conventions

- Feature branches follow the pattern: `claude/<description>-<id>`
- All development happens on feature branches; never push directly to `main`

### Commit Guidelines

- Use conventional commit style: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
- Keep subject line under 50 characters
- No vague messages like "fix bugs" or "update code"

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
1. `@clitoris/shared` — Types first (Post, User, ApiResponse)
2. `@clitoris/server` — DB setup + API routes
3. `@clitoris/llm` — LLM providers + transformer
4. `@clitoris/client` — Shell layout → pages → components

## Documentation Map

All documentation lives under `docs/` organized by category.

```
docs/
├── OVERVIEW.md                        # Project overview, core concepts, glossary
├── PROGRESS.md                        # Development status and decision log
├── setup/                             # Project bootstrapping
│   └── CONFIGS.md                     # All config files (package.json, tsconfig, vite, tailwind)
├── guides/                            # Development guides
│   ├── CONVENTIONS.md                 # Strict coding rules, naming, prohibitions
│   ├── DESIGN_GUIDE.md                # Visual system index — colors, typography, layout
│   ├── DESIGN_COMPONENTS.md           # Component specs (Post Card, Sidebar, Composer, etc.)
│   ├── DESIGN_STATES.md               # Interaction states, animations, loading/empty/error
│   ├── DESIGN_UI.md                   # Icons, responsive, accessibility, modals, forms
│   ├── PATTERNS.md                    # Implementation patterns (optimistic updates, pagination, auth)
│   ├── TESTING.md                     # Testing overview, config, commands, coverage, rules
│   ├── TESTING_PATTERNS.md            # Component/store/API/E2E/LLM test patterns
│   ├── TESTING_SETUP.md               # Mock patterns, test factories, environment setup
│   ├── TROUBLESHOOTING.md             # Common issues & solutions for local development
│   ├── ENV.md                         # Environment variables reference
│   └── PROMPTS.md                     # Vibe coding prompt templates
├── screens/                           # Page-by-page UI screen specifications
│   ├── GLOBAL_FEED.md                 # / — Main feed with composer
│   ├── LOCAL_FEED.md                  # /feed/local — Following feed
│   ├── EXPLORE.md                     # /explore — Trending/discover
│   ├── POST_DETAIL.md                 # /post/:id — Single post + replies
│   ├── USER_PROFILE.md               # /@:username — User profile
│   ├── LOGIN.md                       # /login — Terminal-style login
│   ├── REGISTER.md                    # /register — Terminal-style registration
│   └── SETTINGS.md                    # /settings — User settings
├── specs/                             # Technical specifications
│   ├── PRD.md                         # Product requirements document
│   ├── DATABASE.md                    # DB schema, queries, migrations, migration files
│   ├── API.md                         # REST API documentation (21 endpoints, error formats, rate limits)
│   ├── LLM_INTEGRATION.md            # LLM transformation logic, prompts, 7 providers, credential auto-detection
│   └── api-schema.json                # OpenAPI 3.1 schema (machine-readable)
└── architecture/                      # Architecture diagrams
    ├── ARCHITECTURE.md                # System architecture, data flows, auth, errors
    ├── architecture.json              # Full system config (JSON)
    ├── backend-dependencies.mmd       # Server module dependency graph (Mermaid)
    ├── frontend-imports.mmd           # Client component import graph (Mermaid)
    ├── org-chart.mmd                  # Monorepo folder hierarchy (Mermaid)
    └── schema-erd.md                  # Database ERD + data flow examples
```

**Required reading (priority order):**
1. `CLAUDE.md` — Project summary (this file)
2. `docs/setup/CONFIGS.md` — Config files to bootstrap the project
3. `docs/guides/CONVENTIONS.md` — Coding rules, naming, prohibitions
4. `docs/guides/DESIGN_GUIDE.md` — Visual system index (colors, typography, layout)
5. `docs/guides/DESIGN_COMPONENTS.md` — Component specifications
6. `docs/guides/DESIGN_STATES.md` — Interaction states, loading/empty/error
7. `docs/guides/DESIGN_UI.md` — Icons, responsive, accessibility, forms
8. `docs/guides/PATTERNS.md` — Implementation patterns (optimistic updates, pagination, auth)
9. `docs/screens/*` — Page-by-page UI screen specifications
10. `docs/specs/LLM_INTEGRATION.md` — LLM transformation logic and provider code
11. `docs/architecture/ARCHITECTURE.md` — System architecture, auth, error flows
12. `docs/specs/DATABASE.md` — DB schema, queries, migrations
13. `docs/specs/API.md` — REST API documentation with error formats
14. `docs/guides/TESTING.md` — Testing overview, config, rules
15. `docs/guides/TESTING_PATTERNS.md` — Test code examples
16. `docs/guides/TESTING_SETUP.md` — Mocks, factories, environment setup
17. `docs/guides/TROUBLESHOOTING.md` — Common issues & solutions
18. `docs/guides/ENV.md` — Environment variables reference
