# GLOSSARY.md — Unified Terminology Index

> **Source of truth** for all domain-specific terms used across Forkverse documentation.
> AI agents should reference this file when encountering unfamiliar terms.
> Updated: 2026-03-21 — Reorganized for B-plan (Repo Analysis Platform).

---

## Analysis Domain

| Term | Definition |
|------|-----------|
| **Analyze** | AI-powered GitHub repo analysis producing reports, PPTX, or video (`/analyze` route). Primary feature of the platform |
| **Analysis Job** | A queued analysis request with lifecycle: `pending → processing → completed / failed`. Future: processed by Worker layer |
| **Analysis Result** | Structured output from repo analysis, organized into sections (Summary, Stack, Architecture, Strengths, Risks, Improvements) |
| **CLI View** | Terminal-aesthetic representation of analysis results or posts. Brand differentiator |
| **Executive Summary** | One-paragraph AI-generated overview of an analyzed repository |
| **Insight Layer** | The middle product layer where analysis results are consumed and reused |
| **Output Type** | Format of analysis result: `report` (markdown), `pptx` (slide deck), `video` (terminal animation) |
| **Repo Analysis** | Process of cloning a GitHub repo (shallow), scanning structure, and using LLM to generate structured insights |
| **Result Section** | One of the structured parts of an analysis report: Summary, Tech Stack, Architecture, Strengths, Risks, Improvements, CLI View |

## Social Domain

| Term | Definition |
|------|-----------|
| **Activity feed** | Chronological log of platform events (follows, stars, forks, replies, GitHub events). Two views: following and global |
| **Dual-format** | Every post exists in two forms simultaneously: natural language and CLI command |
| **Dual panel** | Side-by-side display of natural language (left) and CLI command (right) |
| **Feed** | Chronological list of shared analyses and posts (global = all public, local = followed users) |
| **Fork** | Clone another user's post to your own timeline, or re-analyze a repo with different parameters |
| **Notification** | In-app alert: reply, mention, quote, star, fork, follow, reaction. Stored in `notifications` table |
| **Quote post** | A post that references another post via `quotedPostId`, displayed inline via `QuotedPost` component |
| **Reaction** | Emoji response to a post. 8 types: `lgtm`, `ship_it`, `fire`, `bug`, `thinking`, `rocket`, `eyes`, `heart` |
| **Reply** | Respond to a post, creating a threaded conversation |
| **Star** | Bookmark/like a post or analysis (toggle action) |
| **Visibility** | Post access level: `public` (everyone), `private` (author only), `unlisted` (direct link only) |

## LLM Domain

| Term | Definition |
|------|-----------|
| **By LLM filter** | Browse posts/analyses filtered by which LLM model was used |
| **Custom LLM** | User-provided LLM connection (via API key) beyond built-in providers |
| **LLM Gateway** | Future: standardized abstraction layer for multi-provider LLM operations with cost/latency tracking |
| **LLM transform** | Process of converting natural language into CLI command format using an AI model |
| **Provider** | LLM service adapter implementing `LlmProvider` interface (Anthropic, OpenAI, Gemini, Ollama, Generic API) |

## Technical Domain

| Term | Definition |
|------|-----------|
| **Capacitor** | Framework to wrap the web app as native Android/iOS apps for store distribution |
| **CLI command** | Structured text representation of a post using flags (e.g., `post --user=name --message="text"`) |
| **Cursor pagination** | Pagination using the last item's timestamp instead of page numbers. Never use OFFSET-based pagination |
| **Debounce** | Delay execution until user stops typing/clicking for N ms. Used in search and form inputs |
| **ErrorBoundary** | App-level React component that catches render errors and displays terminal-style crash UI |
| **FTS5** | SQLite full-text search engine. Virtual table `posts_fts` indexes `message_raw` and `tags` |
| **g-chord shortcut** | Two-key keyboard shortcut starting with `g` (e.g., `gh` = go home). 600ms timeout |
| **i18n** | Client-side internationalization. 4 languages: en, ko, zh, ja. Managed by `uiStore` with `t()` function |
| **isSubmitting guard** | Boolean flag in Zustand stores preventing duplicate API calls from rapid clicks |
| **Optimistic update** | UI updates immediately before server confirmation; reverts on failure |
| **PWA** | Progressive Web App — installable web app with offline support, push notifications |
| **Seed** | Mock data script (`scripts/seed.ts`) that populates DB with sample users, posts, and analyses |
| **Store** | Zustand state container (e.g., `analyzeStore.ts`, `feedStore.ts`). Located at `packages/client/src/stores/` |
| **Terminal aesthetic** | Dark backgrounds, monospace fonts, green/amber/cyan text — mimicking a CLI terminal |
| **topLanguages** | JSON array of user's top programming languages, computed from GitHub repos on profile sync |
| **UUID v7** | Time-sortable universally unique identifier used as primary key for all database tables |
| **WAL mode** | SQLite Write-Ahead Logging (`PRAGMA journal_mode = WAL`) for concurrent read access |

## GitHub Integration Domain

| Term | Definition |
|------|-----------|
| **Composer** | Input area where users write natural language text to create a post |
| **GitHub sync** | Two operations: `sync-profile` (re-fetches avatar/bio) and `sync-activity` (imports events as posts) |
| **github_synced_events** | Dedup table preventing the same GitHub event from being imported multiple times |
| **Setup** | First-time profile configuration after GitHub OAuth (`/setup` route) |
| **Webhook** | GitHub webhook receiver (`POST /api/webhook/github`) that auto-creates posts from push/PR/release events |

## Product Strategy Terms

| Term | Definition |
|------|-----------|
| **A-plan** | Original product direction: terminal/CLI-themed social network (SNS). Completed Phase 0-6 |
| **B-plan** | Current product direction: Repo Analysis Platform with social distribution layer |
| **Analyze first, social second** | UX priority principle: analysis is the primary entry point, social features support distribution |
| **Open Core** | Business model: core backend is proprietary SaaS, selected frontend/SDK/docs are open-sourced on GitHub |
| **Social Layer** | The set of features (feed, star, fork, follow, profile) that distribute analysis results |

---

## See Also

- [PRD.md](./specs/PRD.md) — Full product requirements (B-plan)
- [PATTERNS.md](./guides/PATTERNS.md) — Implementation patterns referenced above
- [LLM_INTEGRATION.md](./llm/LLM_INTEGRATION.md) — LLM provider interface details
- [MOBILE.md](./specs/MOBILE.md) — Mobile strategy and terminology
