# PROGRESS.md — Development Status

> **Source of truth** for development status, phase tracking, and decision log.
> Last updated: 2026-03-19 (Phase 0 completed)

---

## Current Phase: Phase 0 — Documentation & Setup (COMPLETE)

Phase 0 is **complete**. All documentation, configuration files, and project scaffolding are in place. Ready for Phase 1 (Core) implementation.

---

## Phase Overview

| Phase | Name | Status |
|-------|------|--------|
| Phase 0 | Documentation & Setup | **Complete** |
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

- [x] `package.json` (root) — pnpm workspace config
- [x] `pnpm-workspace.yaml`
- [x] `tsconfig.base.json`
- [x] `.eslintrc.cjs`
- [x] `.prettierrc`
- [x] `.gitignore`
- [x] `.env.example`
- [x] Per-package `package.json` files (client, server, shared, llm)
- [x] Per-package `tsconfig.json` files (client, server, shared, llm)
- [x] Vite config (`packages/client/vite.config.ts`)
- [x] Tailwind config (`packages/client/tailwind.config.ts`)
- [x] Vitest config (`vitest.config.ts`)
- [x] Playwright config (`playwright.config.ts`)
- [x] DB migration files (`packages/server/src/db/migrations/001-003`)
- [x] LLM parser unit test examples in TESTING.md

### Remaining

Phase 0 is **complete**. All documentation and configuration files are in place. Ready for Phase 1 implementation.

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

### Phase 1 Acceptance Criteria

| Feature | Acceptance Criteria |
|---------|-------------------|
| User registration/login | User can register with username/password, login, and maintain session across page reloads |
| Post creation (dual format) | User writes natural language, LLM transforms to CLI, both display side by side in a post card |
| LLM transformation | Anthropic provider works with claude-sonnet; transformation completes in < 3 seconds |
| Global feed | Feed loads 20 posts with cursor-based pagination; infinite scroll works without duplicates |
| Star | Toggle star with optimistic update; star count reflects correctly; duplicate stars prevented |
| Reply | Threaded replies display under parent post; reply count updates correctly |

---

## Phase 2 — Social (Not Started)

| Feature | Status | Notes |
|---------|--------|-------|
| Follow/unfollow | Not Started | |
| Local feed | Not Started | Posts from followed users |
| Fork | Not Started | Clone post to own timeline |
| User profile page | Not Started | `/@:username` route |

### Phase 2 Acceptance Criteria

| Feature | Acceptance Criteria |
|---------|-------------------|
| Follow/unfollow | Toggle follow with optimistic update; follower/following counts update; self-follow prevented |
| Local feed | Shows only posts from followed users; empty state when not following anyone |
| Fork | Clones post to user's timeline with `forkedFromId` link; fork count updates; duplicate fork prevented |
| User profile page | Displays user info, stats, posts tab, starred tab; follow button for other users |

---

## Phase 3 — Expansion (Not Started)

| Feature | Status | Notes |
|---------|--------|-------|
| Multi-LLM support | Not Started | GPT-4o, Gemini, Llama-3 providers |
| Multilingual auto-translation | Not Started | `--translate=auto` |
| Explore/trending | Not Started | Algorithm TBD |
| Custom LLM connections | Not Started | User-provided API keys |

### Phase 3 Acceptance Criteria

| Feature | Acceptance Criteria |
|---------|-------------------|
| Multi-LLM support | OpenAI (gpt-4o), Gemini (gemini-2.5-pro), and Ollama (llama-3) providers work end-to-end; model selector shows available models per provider; credential auto-detection badges shown |
| Multilingual auto-translation | `--translate=auto` flag detects source language and appends translation; dual-language display in post card |
| Explore/trending | Posts sorted by star count within time window (24h/7d/30d); trending tag cloud updates dynamically |
| Custom LLM connections | User can configure custom OpenAI-compatible endpoint with base URL + API key; connection test validates before save |

---

> Document index: see `CLAUDE.md` (Documentation Map section) — single source of truth for file tree.

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
