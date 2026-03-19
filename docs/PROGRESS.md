# PROGRESS.md — Development Status

> **Source of truth** for development status, phase tracking, and decision log.
> Last updated: 2026-03-19

---

## Current Phase: Phase 0 — Documentation & Setup

The project is in the **documentation and scaffolding** phase. No application code has been written yet.

---

## Phase Overview

| Phase | Name | Status |
|-------|------|--------|
| Phase 0 | Documentation & Setup | **In Progress** |
| Phase 1 | Core | Not Started |
| Phase 2 | Social | Not Started |
| Phase 3 | Expansion | Not Started |

---

## Phase 0 — Documentation & Setup

### Completed

- [x] Repository initialized
- [x] CLAUDE.md — AI assistant guide
- [x] README.md — Public-facing readme
- [x] Monorepo folder structure (`packages/client`, `server`, `shared`, `llm`)
- [x] `docs/guides/CONVENTIONS.md` — Strict coding rules
- [x] `docs/guides/DESIGN_GUIDE.md` — Visual system and component specs
- [x] `docs/guides/PROMPTS.md` — Vibe coding prompt templates
- [x] `docs/specs/PRD.md` — Product requirements document
- [x] `docs/specs/DATABASE.md` — Database design and reference
- [x] `docs/specs/API.md` — Full REST API documentation
- [x] `docs/specs/api-schema.json` — OpenAPI 3.1 schema
- [x] `docs/architecture/ARCHITECTURE.md` — System architecture
- [x] `docs/architecture/architecture.json` — Full system configuration
- [x] `docs/architecture/backend-dependencies.mmd` — Server dependency graph
- [x] `docs/architecture/frontend-imports.mmd` — Client import graph
- [x] `docs/architecture/org-chart.mmd` — Monorepo folder hierarchy
- [x] `docs/architecture/schema-erd.md` — Database ERD and data flows
- [x] `docs/OVERVIEW.md` — Project overview
- [x] `docs/PROGRESS.md` — This file

### Remaining

- [ ] `package.json` (root) — pnpm workspace config
- [ ] `pnpm-workspace.yaml`
- [ ] `tsconfig.base.json`
- [ ] `.eslintrc.cjs`
- [ ] `.prettierrc`
- [ ] `.gitignore`
- [ ] `.env.example`
- [ ] Per-package `package.json` files
- [ ] Per-package `tsconfig.json` files
- [ ] Vite config (`packages/client`)
- [ ] Tailwind config (`packages/client`)
- [ ] DB migration files (`packages/server/src/db/migrations/`)

---

## Phase 1 — Core (Not Started)

| Feature | Status | Notes |
|---------|--------|-------|
| User registration/login | Not Started | Session-based auth (express-session) |
| Post creation (dual format) | Not Started | Natural language + CLI side by side |
| LLM transformation | Not Started | claude-sonnet first |
| Global feed | Not Started | Cursor-based pagination |
| Star | Not Started | Toggle via composite PK |
| Reply | Not Started | Threaded via parent_id |

### Key Deliverables
- `@clitoris/shared` — Type definitions (Post, User, ApiResponse)
- `@clitoris/llm` — Anthropic provider + transformer
- `@clitoris/server` — Express app, routes (posts, users, llm), DB setup
- `@clitoris/client` — Shell layout, global feed page, post card, composer

---

## Phase 2 — Social (Not Started)

| Feature | Status | Notes |
|---------|--------|-------|
| Follow/unfollow | Not Started | |
| Local feed | Not Started | Posts from followed users |
| Fork | Not Started | Clone post to own timeline |
| User profile page | Not Started | `/@:username` route |

---

## Phase 3 — Expansion (Not Started)

| Feature | Status | Notes |
|---------|--------|-------|
| Multi-LLM support | Not Started | GPT-4o, Llama-3 providers |
| Multilingual auto-translation | Not Started | `--translate=auto` |
| Explore/trending | Not Started | Algorithm TBD |
| Custom LLM connections | Not Started | User-provided API keys |

---

## Document Index

```
docs/
├── OVERVIEW.md                          # Project overview & core concepts
├── PROGRESS.md                          # Development status (this file)
├── guides/
│   ├── CONVENTIONS.md                   # Strict coding rules & prohibitions
│   ├── DESIGN_GUIDE.md                  # Visual system & component specs
│   └── PROMPTS.md                       # Vibe coding prompt templates
├── specs/
│   ├── PRD.md                           # Full product requirements
│   ├── DATABASE.md                      # DB schema, queries, migrations
│   ├── API.md                           # REST API documentation (18 endpoints)
│   └── api-schema.json                  # OpenAPI 3.1 schema
└── architecture/
    ├── ARCHITECTURE.md                  # System architecture & data flows
    ├── architecture.json                # Full system config (JSON)
    ├── backend-dependencies.mmd         # Server module dependency graph
    ├── frontend-imports.mmd             # Client component import graph
    ├── org-chart.mmd                    # Monorepo folder hierarchy
    └── schema-erd.md                    # Database ERD + data flow examples
```

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-19 | Use SQLite over PostgreSQL | Zero config, single file, sufficient for MVP |
| 2026-03-19 | No ORM, raw SQL only | AI generates cleaner raw SQL; less abstraction |
| 2026-03-19 | pnpm monorepo | Clear package boundaries help AI navigate code |
| 2026-03-19 | Tailwind only, no custom CSS | AI generates Tailwind reliably; consistent output |
| 2026-03-19 | Zustand over Redux | Less boilerplate; AI produces cleaner stores |
| 2026-03-19 | No light mode | Terminal aesthetic demands dark-only |
| 2026-03-19 | Unicode icons only | No icon library dependencies; terminal feel |
| 2026-03-19 | Vibe coding approach | AI-driven development with strict conventions |
| 2026-03-19 | All docs under docs/ | Single location, organized by category (guides/specs/architecture) |

---

## See Also

- [CLAUDE.md](../CLAUDE.md) — Project overview and documentation map
- [PRD.md](./specs/PRD.md) — Product requirements and MVP phases
- [OVERVIEW.md](./OVERVIEW.md) — Project vision and glossary
