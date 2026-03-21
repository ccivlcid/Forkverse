# PROGRESS.md — Development Status

> **Source of truth** for development status, phase tracking, and decision log.
> Last updated: 2026-03-21 (PC optimization audit)

---

## Current Phase: B-plan Transition — Phase B1 (Complete)

A-plan (SNS-focused) Phases 0–6 are complete. Product direction pivoted to B-plan (Repo Analysis Platform).
Phase B1 entry point transition is now complete. Phase B2 and B3 are next.

---

## B-plan Phase Overview

| Phase | Name | Status |
|-------|------|--------|
| Phase B1 | Entry Point Transition | **Complete** |
| Phase B2 | Analysis Result Enhancement | Planned |
| Phase B3 | Mobile Web Completion + PWA | Planned |
| Phase B4 | App Store Release (Capacitor) | Planned |
| Phase B5 | Backend Scaling (Worker + Postgres) | Planned |
| Phase B6 | Extended Features | Planned |

---

## Phase B1 — Entry Point Transition (Complete)

| Feature | Status | Notes |
|---------|--------|-------|
| Home page removed | **Complete** | Removed HomePage; `/` redirects to `/feed` |
| Feed route migration | **Complete** | GlobalFeed at `/feed`; `/` → `/feed` redirect |
| Navigation restructure | **Complete** | Sidebar: analyze first; logo → `/feed` |
| Mobile nav center = dropup | **Complete** | Center button opens analyze / write post options |
| Header `+ post` removed | **Complete** | Replaced with mobile dropup |
| AnalyzePage i18n | **Complete** | All strings use `t()` across 4 languages |
| AnalyzePage URL prefill | **Complete** | `?repo=` and `?output=` params prefill form |
| AnalyzePage user prompt | **Complete** | Textarea + .md file upload for LLM focus |
| Analysis history removed | **Complete** | Simplified per Jobs philosophy |
| Analysis share review step | **Complete** | Edit caption before posting to feed |
| CreatePostPage redesign | **Complete** | Thread-style → clean full-screen composer, LLM-free |
| Post CLI format — LLM removed | **Complete** | Server auto-generates `post --user=@x ¶ ...` format |
| postStore simplified | **Complete** | Removed transformToCli, cliPreview, selectedModel |
| i18n — all new keys | **Complete** | home.*, analyze.*, new.*, feed.compose.* in en/ko/zh/ja |
| ActivityFeedPage redesign | **Complete** | Avatar, color badges, day grouping, collapse, filter tabs |
| Mobile optimization audit | **Complete** | viewport-fit=cover, h-dvh, safe areas, touch targets, 16px inputs |
| PROGRESS.md update rule | **Complete** | Added mandatory rule to CLAUDE.md |
| Documentation sync | **Complete** | This update |

---

## Phase B2 — Analysis Result Enhancement (Planned)

| Feature | Status | Notes |
|---------|--------|-------|
| Sectioned result page | Planned | Summary → Stack → Architecture → Strengths → Risks → Improvements → CLI View |
| `/analysis/:id` route | Planned | Dedicated shareable result page |
| Section navigation | Planned | Sidebar or tab navigation within result |
| Copy/share per section | Planned | Each section has copy and share buttons |
| Mobile card stack | Planned | Sections as swipeable/scrollable cards on mobile |

---

## Phase B3 — Mobile Web Completion + PWA (Planned)

| Feature | Status | Notes |
|---------|--------|-------|
| Analyze input mobile UX | Planned | Single-column form, large touch targets |
| Result viewing mobile | Planned | Card stack, collapsible sections |
| PWA manifest + SW | Planned | Installable, offline shell, app icon |
| Touch interactions | Planned | Swipe, pull-to-refresh, haptic feedback |

---

## Phase B4 — App Store Release (Planned)

| Feature | Status | Notes |
|---------|--------|-------|
| Capacitor integration | Planned | Wrap web app as native shell |
| Push notifications | Planned | FCM (Android) / APNs (iOS) |
| Deep links | Planned | `terminal.social/*` → app |
| Android Play Store | Planned | APK/AAB build + listing |
| iOS App Store | Planned | IPA build + listing |

---

## Phase B5 — Backend Scaling (Planned)

| Feature | Status | Notes |
|---------|--------|-------|
| API + Worker separation | Planned | Analysis jobs processed by Worker, not API server |
| Job Queue | Planned | BullMQ or similar; analysis_job lifecycle management |
| SQLite → Postgres | Planned | Migration for concurrent users, search, analytics |
| LLM Gateway | Planned | Provider abstraction, cost/latency tracking, prompt versioning |
| Redis | Planned | Cache, queue backend, session store |

---

## Phase B6 — Extended Features (Planned)

| Feature | Status | Notes |
|---------|--------|-------|
| Comparison analysis | Planned | Side-by-side repo comparison |
| Private repo analysis | Planned | Paid feature, requires expanded GitHub OAuth scope |
| Team workspaces | Planned | Shared analysis history, access control |
| Collections/bookmarks | Planned | Organize saved analyses |
| React Native migration | Planned | If Capacitor performance is insufficient |

---

## A-plan Phases (Complete — Legacy)

> A-plan (SNS-focused) development is complete. These phases established the social layer
> that now serves as the distribution mechanism for B-plan's analysis results.

| Phase | Name | Status |
|-------|------|--------|
| Phase 0 | Documentation & Setup | **Complete** |
| Phase 1 | Core (Auth, Posts, Feed, LLM) | **Complete** |
| Phase 2 | Social (Follow, Fork, Profile) | **Complete** |
| Phase 3 | Expansion (Settings, Analyze, GitHub sync, PPTX, Video) | **Complete** |
| Phase 4 | GitHub Platform + Media | **Complete** |
| Phase 5 | GitHub Social + UI Polish | **Complete** |
| Phase 6 | SNS Social Features (Reactions, Quote, FTS, Notifications) | **Complete** |

<details>
<summary>A-plan Phase Details (click to expand)</summary>

### Phase 0 — Documentation & Setup
All documentation, configuration files, and project scaffolding.

### Phase 1 — Core
- Shared types, LLM providers (Anthropic, OpenAI, Gemini, Ollama, Generic API)
- LLM transform (JSON flow), translate (tone-aware, cached)
- DB migrations 001–007, Auth routes, Posts routes, LLM routes, Users routes
- Client: AppShell, Sidebar, GlobalFeedPage, PostCard, LoginPage, SetupPage, PostDetailPage

### Phase 2 — Social
- Follow/unfollow, Local feed, Fork, User profile, Explore page

### Phase 3 — Expansion
- SettingsPage (5 tabs), Multi-LLM UI, AnalyzePage, GitHub activity sync
- Analysis → feed post sharing, PPTX generation, Video generation
- Keyboard shortcuts, Seed script, GitHub feed page

### Phase 5 — GitHub Social + UI Polish
- GitHub follow sync, topLanguages, PR Review Requests, Webhook auto-posting
- Contribution Graph, Local Feed mock data, UI contrast improvements

### Phase 6 — SNS Social Features
- Emoji reactions (8 types), Quote posts, Full-text search (FTS5)
- Notifications (7 types), Activity feed, Webhook dedup, ErrorBoundary, Suggested users

</details>

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-21 | **Logout added to mobile + sidebar** | Mobile: ⏻ in + dropup; Desktop sidebar: ⏻ button next to username |
| 2026-03-21 | **README / README_ko sync** | Rewritten to reflect B-plan: Repo Analysis Platform hero, LLM-free posting, activity feed redesign, mobile/desktop nav changes |
| 2026-03-21 | **Post creation 500 fix** | llm_model NOT NULL constraint — removed from INSERT, uses DEFAULT 'claude-sonnet' |
| 2026-03-21 | **CreatePostPage desktop modal** | PC: centered modal (600px, backdrop, backdrop-click to close); mobile: unchanged full-screen |
| 2026-03-21 | **PC desktop optimization audit** | Fixed textarea font regression (sm:text-xs → sm:text-sm), scrollbar visibility, sidebar active border indicator, added post --new to sidebar nav |
| 2026-03-21 | **PROGRESS.md update mandatory** | Added rule to CLAUDE.md: update before and after every task |
| 2026-03-21 | **LLM removed from post creation** | Posts no longer require LLM; server auto-generates CLI format (`post --user=@x ¶ ...`); reduces friction and dependency |
| 2026-03-21 | **Activity feed: collapse consecutive GitHub events** | Push ×7 to same repo → one line; filter tabs (all/social/github) added |
| 2026-03-21 | **Mobile audit applied** | viewport-fit=cover, h-dvh, safe area insets, 16px inputs, 44px touch targets |
| 2026-03-21 | **Home page removed** | Landing page content deferred to separate marketing site; `/` now redirects to `/feed` |
| 2026-03-21 | **Analysis history removed from AnalyzePage** | Clutter; Jobs philosophy — focus on the current task |
| 2026-03-21 | **Analysis share: review step added** | User edits caption before posting to feed; server accepts optional `caption` param |
| 2026-03-21 | **CreatePostPage: LLM-free, full-screen** | Simple, fast, no model dependency; server generates CLI format automatically |
| 2026-03-21 | **Logo → /feed** | Logo was going to `/` (home) which no longer exists; feed is the hub |
| 2026-03-21 | **ActivityFeedPage redesign** | Avatar + color badges + day groups + collapse + filter tabs |
| 2026-03-21 | **Pivot to B-plan (Repo Analysis Platform)** | SNS alone lacks differentiation and retention; repo analysis provides clear utility, monetization path, and natural social distribution |
| 2026-03-21 | **Analyze first, social second** | First-time visitors should see analysis CTA, not a feed; social features distribute analysis results |
| 2026-03-21 | **Open Core business model** | Core backend proprietary SaaS; frontend/SDK/docs partially open-sourced for trust and developer inflow |
| 2026-03-21 | **Mobile: PWA → Capacitor → Native** | PWA is free and immediate; Capacitor reuses web code for store release; native only if needed at scale |
| 2026-03-19 | Use SQLite over PostgreSQL | Zero config, single file, sufficient for MVP (Postgres planned for Phase B5) |
| 2026-03-19 | No ORM, raw SQL only | AI generates cleaner raw SQL; less abstraction |
| 2026-03-19 | pnpm monorepo | Clear package boundaries help AI navigate code |
| 2026-03-19 | Tailwind only, no custom CSS | AI generates Tailwind reliably; consistent output |
| 2026-03-19 | Zustand over Redux | Less boilerplate; AI produces cleaner stores |
| 2026-03-19 | No light mode | Terminal aesthetic demands dark-only |
| 2026-03-19 | Unicode icons only | No icon library dependencies; terminal feel |
| 2026-03-19 | Vibe coding approach | AI-driven development with strict conventions |
| 2026-03-20 | LLM outputs JSON (not CLI string) | Reliable parsing; server reconstructs CLI; enables intent/emotion extraction |
| 2026-03-20 | Translation cached per (post_id, lang) | Zero server cost (uses viewer's key); instant on cache hit |
| 2026-03-20 | Ports: 3771 (server) / 7878 (client) | Avoids common port conflicts |
| 2026-03-20 | Video generation uses animated HTML (no ffmpeg) | Self-contained HTML with CSS/JS animation; no binary deps |
| 2026-03-20 | GitHub OAuth scope: `notifications repo` | Required for platform integration |
| 2026-03-20 | Contribution graph via GitHub GraphQL API | REST API does not expose contribution data |

---

## See Also

- [CLAUDE.md](../CLAUDE.md) — Project overview and documentation map
- [PRD.md](./specs/PRD.md) — Product requirements (B-plan)
- [GLOSSARY.md](./GLOSSARY.md) — Unified terminology index
- [MOBILE.md](./specs/MOBILE.md) — Mobile strategy
