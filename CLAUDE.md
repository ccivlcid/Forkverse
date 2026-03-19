# CLAUDE.md

Guidance for AI assistants working with the CLItoris repository.

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
| LLM Integration | Anthropic SDK, OpenAI SDK, Ollama |

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

## Documentation Map

All documentation lives under `docs/` organized by category.

```
docs/
├── OVERVIEW.md                        # Project overview and core concepts
├── PROGRESS.md                        # Development status and decision log
├── guides/                            # Development guides
│   ├── CONVENTIONS.md                 # Strict coding rules, naming, prohibitions
│   ├── DESIGN_GUIDE.md                # Visual system, component specs, colors/typography
│   └── PROMPTS.md                     # Vibe coding prompt templates
├── specs/                             # Technical specifications
│   ├── PRD.md                         # Product requirements document
│   ├── DATABASE.md                    # DB schema, queries, migrations, ERD
│   ├── API.md                         # REST API documentation (18 endpoints)
│   └── api-schema.json                # OpenAPI 3.1 schema (machine-readable)
└── architecture/                      # Architecture diagrams
    ├── ARCHITECTURE.md                # System architecture, data flows, LLM integration
    ├── architecture.json              # Full system config (JSON)
    ├── backend-dependencies.mmd       # Server module dependency graph (Mermaid)
    ├── frontend-imports.mmd           # Client component import graph (Mermaid)
    ├── org-chart.mmd                  # Monorepo folder hierarchy (Mermaid)
    └── schema-erd.md                  # Database ERD + data flow examples
```

**Required reading (priority order):**
1. `CLAUDE.md` — Project summary (this file)
2. `docs/guides/CONVENTIONS.md` — Coding rules, naming, prohibitions
3. `docs/guides/DESIGN_GUIDE.md` — Visual system, component specs
4. `docs/architecture/ARCHITECTURE.md` — System architecture, data flows
5. `docs/specs/DATABASE.md` — DB schema, queries, migrations
6. `docs/specs/PRD.md` — Full product requirements
7. `docs/specs/API.md` — REST API documentation
