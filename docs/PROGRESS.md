# PROGRESS.md — Development Status

> **Source of truth** for development status, phase tracking, and decision log.
> Last updated: 2026-03-24 (.env tracked + gitignore)

---

## Current Phase: B-plan — Phase B6 (Complete)

A-plan (SNS-focused) Phases 0–6 are complete. Product direction pivoted to B-plan (Developer SNS with Repo Analysis).
All B-plan phases (B1–B6) complete.

---

## B-plan Phase Overview

| Phase | Name | Status |
|-------|------|--------|
| Phase B1 | Entry Point Transition | **Complete** |
| Phase B2 | Analysis Result Enhancement | **Complete** |
| Phase B3 | Mobile Web Completion + PWA | **Complete** |
| Phase B4 | App Store Release (Capacitor) | **Complete** |
| Phase B5 | Backend Scaling (Worker + Postgres) | **Complete** |
| Phase B6 | Extended Features | **Complete** |

---

## Phase B1 — Entry Point Transition (Complete)

| Feature | Status | Notes |
|---------|--------|-------|
| Home page removed | **Complete** | Removed HomePage; `/` redirects to `/feed` |
| Feed route migration | **Complete** | GlobalFeed at `/feed`; `/` → `/feed` redirect |
| Navigation restructure | **Complete** | Sidebar: feed first on desktop; logo → `/feed` |
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

## Phase B2 — Analysis Result Enhancement (Complete)

| Feature | Status | Notes |
|---------|--------|-------|
| Sectioned result page | **Complete** | 7 sections: Summary, Tech Stack, Architecture, Strengths, Risks, Improvements, CLI View |
| `/analysis/:id` route | **Complete** | Public shareable result page via `GET /api/analyze/detail/:id` |
| Section navigation | **Complete** | Desktop: sticky sidebar nav; Mobile: fixed bottom horizontal scroll nav |
| Copy/share per section | **Complete** | Each section has copy (clipboard) and share (Web Share API / clipboard fallback) buttons |
| Mobile card stack | **Complete** | Scrollable sections with fixed bottom section nav, IntersectionObserver active tracking |
| Analysis star/unstar | **Complete** | `POST /api/analyze/:id/star` toggle; star count displayed in header |
| Popular analyses API | **Complete** | `GET /api/analyze/popular?limit=&period=` with star-based ranking |
| Structured LLM prompt | **Complete** | LLM returns JSON with 7 section keys; fallback paragraph splitting for plain text |
| DB migration 027 | **Complete** | `result_sections_json` column + `analysis_stars` table |
| i18n (4 languages) | **Complete** | `analysis.*` keys in en/ko/zh/ja |

---

## Phase B3 — Mobile Web Completion + PWA (Complete)

| Feature | Status | Notes |
|---------|--------|-------|
| Analyze input mobile UX | **Complete** | Full-width buttons, stacked model/lang selectors, 16px font inputs, active:scale feedback |
| Result viewing mobile | **Complete** | Section cards with bottom horizontal nav (done in B2) |
| PWA manifest + SW | **Complete** | manifest.json, SVG icons (192/512/maskable), vite-plugin-pwa with Workbox |
| Service Worker caching | **Complete** | Cache-first for fonts/avatars, network-first for API, 14 precached entries |
| Apple PWA meta tags | **Complete** | apple-mobile-web-app-capable, status-bar-style, apple-touch-icon |
| Pull-to-refresh | **Complete** | Custom hook (usePullToRefresh) + indicator in AppShell; integrated in GlobalFeedPage |
| Touch feedback | **Complete** | active:scale-95 on buttons, active:scale-[0.98] on CTA |

---

## Phase B4 — App Store Release (Complete)

| Feature | Status | Notes |
|---------|--------|-------|
| Capacitor integration | **Complete** | `@capacitor/core` + 8 plugins installed; `capacitor.config.ts` created |
| Native plugin integration | **Complete** | `lib/native.ts` — StatusBar, SplashScreen, Haptics, Keyboard, Share, Clipboard, App |
| Push notifications | **Complete** | Token registration API (`POST /api/notifications/push-token`); DB migration 028; native listener in `initPushNotifications` |
| Deep links | **Complete** | `/.well-known/assetlinks.json` (Android) + `apple-app-site-association` (iOS) on server |
| Back button handling | **Complete** | Android hardware back → history.back() or exitApp() |
| Keyboard-aware layout | **Complete** | `--keyboard-height` CSS var updated by native Keyboard listener |
| Cap scripts | **Complete** | `cap:sync`, `cap:android`, `cap:ios`, `cap:build` in package.json |
| Android Play Store | Pending | Requires `keytool` signing + Play Console account ($25) |
| iOS App Store | Pending | Requires Apple Developer account ($99/yr) + Xcode archive |
| Release documentation | **Complete** | `docs/specs/APP_RELEASE.md` — full guide: Capacitor, signing, CI/CD, store submissions |

---

## Phase B5 — Backend Scaling (Complete)

| Feature | Status | Notes |
|---------|--------|-------|
| API + Worker separation | **Complete** | `lib/worker.ts` — extracted analysis logic; worker runs in-process via polling, can be separated later |
| Job Queue | **Complete** | `analysis_jobs` table with state machine: pending → active → completed/failed/dead; migration 029 |
| Retry mechanism | **Complete** | 3 retries with exponential backoff (2^n seconds); dead letter after max retries |
| SSE progress streaming | **Complete** | `GET /api/analyze/:id/progress` — Server-Sent Events for real-time progress |
| LLM Gateway | **Complete** | `lib/llmGateway.ts` — centralized LLM calls with latency/cost logging via pino |
| Database indexes | **Complete** | Indexes on `analyses(status, created_at)`, `posts(created_at)`, `posts(user_id, created_at)` |
| Graceful shutdown | **Complete** | Worker stops cleanly on SIGINT/SIGTERM; current job finishes |
| SQLite → Postgres | Pending | Requires external Postgres instance; current SQLite schema is migration-ready |
| Redis | Pending | Requires external Redis; current SQLite-based queue works for MVP scale |

---

## Phase B6 — Extended Features (Complete)

| Feature | Status | Notes |
|---------|--------|-------|
| Comparison analysis | **Complete** | `POST /api/analyze/compare` + `GET /api/analyze/compare/:id`; DB migration 031 |
| Collections/bookmarks | **Complete** | Full CRUD: `GET/POST/DELETE /api/collections`, `GET/POST/DELETE /api/collections/:id/items`; migration 030 |
| Shared types | **Complete** | `Collection`, `ComparisonResult` types in @forkverse/shared |
| Private repo analysis | Pending | Requires expanded GitHub OAuth scope (`repo`) — paid feature |
| Team workspaces | Pending | Requires org/team model — future enterprise feature |
| React Native migration | Deferred | Capacitor performance is sufficient for current needs |

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
| 2026-03-24 | **`.env` tracked in repo** | Root `.env` removed from `.gitignore` and committed for requested workflow; **rotate GitHub OAuth secret** if repo is or becomes public |
| 2026-03-24 | **Git sync to `main`** | Single `chore` commit for docs + client + server; `.env` not committed (secrets); stray legacy db ignored via `.gitignore` |
| 2026-03-24 | **TROUBLESHOOTING: better-sqlite3 Windows** | Documented `Could not locate the bindings file`, Node ABI mismatch, and that `pnpm rebuild` may not compile — use `node-gyp rebuild` in package path |
| 2026-03-24 | **Server `tsc` build fix** | `llmGateway` `intent`/`emotion` aligned with `@forkverse/llm` `PostIntent`/`PostEmotion`; removed unused `path` import in `media.ts` |
| 2026-03-23 | **API keys encrypted at rest** | AES-256-GCM via ENCRYPTION_KEY env var; backward-compatible (plaintext passthrough in dev) |
| 2026-03-23 | **Fork self-fork blocked** | Added user_id check — cannot fork own post (400 BAD_REQUEST) |
| 2026-03-23 | **Follow endpoint atomic** | Wrapped in db.transaction() to prevent race conditions on concurrent follow/unfollow |
| 2026-03-23 | **Webhook secret enforced** | Production rejects if GITHUB_WEBHOOK_SECRET not set; dev mode warns but allows |
| 2026-03-23 | **Media extension forced by MIME** | MIME→extension map prevents malicious file extensions (.exe uploads blocked) |
| 2026-03-23 | **LLM timeout + error exposure** | 120s timeout on LLM, 30s on GitHub; failures visible in progress UI instead of silent fallback |
| 2026-03-23 | **Explore feed compound cursor** | Changed from star_count-only to starCount:createdAt compound cursor |
| 2026-03-23 | **Collections API** | Full CRUD for organizing/bookmarking analyses; public/private visibility; migration 030 |
| 2026-03-23 | **Comparison analysis** | Side-by-side repo comparison endpoint; comparisons table; migration 031 |
| 2026-03-23 | **Worker: SQLite-based job queue** | In-process polling worker with analysis_jobs table; can be separated into standalone process for horizontal scaling |
| 2026-03-23 | **SSE progress streaming** | Replaces polling for analysis progress; server pushes events via text/event-stream |
| 2026-03-23 | **LLM Gateway logging** | All LLM calls routed through gateway with pino-logged latency/provider/model metrics |
| 2026-03-23 | **Capacitor: dynamic import plugins** | All native plugins lazy-loaded via `import()` — zero bundle cost on web; only loads on native platform |
| 2026-03-25 | **Mobile help i18n** | `MobileHelpModal` uses `t()`; `mobileHelp.*` keys in en/ko/zh/ja |
| 2026-03-25 | **Vite dev API proxy** | `vite.config.ts` uses `loadEnv` from repo root + `PORT`; target `127.0.0.1` for `/api` and `/uploads`; TROUBLESHOOTING + ENV.md for `http proxy error` |
| 2026-03-25 | **Docs sync (ports & tooling)** | CONFIGS.md Vite section; `architecture.json` client port `7878`; Playwright `baseURL`/`webServer` → `7878`; TESTING.md; I18N `mobileHelp.*`; routes/USER_PROFILE route note; README local tips; CLAUDE keyboard/mobile lines |
| 2026-03-24 | **GLOBAL_FEED_MOCK users = seed handles** | Mock cards use `jiyeon_kim`, `0xmitsuki`, `arjun_io`, `lena_dev`, `hex_cowboy` so `/@…` works after `pnpm seed`; profile 404 adds `profile.notFoundHint`; `goHome` → `/feed` |
| 2026-03-24 | **Feed → profile / post navigation** | Route `/:username` for `/@handle` (RR7); `UserProfilePage` normalizes param; demo `mock-*` posts skip navigation + toast; `FeedList` no longer overwrites tab fetch; fix `atUsername` guard |
| 2026-03-24 | **Desktop sidebar: feed first** | `Sidebar` `COMMANDS` order: `feed --global` / `feed --local` before `analyze` / `post --new` so PC hub matches feed-centric nav |
| 2026-03-24 | **Keyboard shortcuts** | Removed duplicate j/k/… listener on `GlobalFeedPage`; `useKeyboardShortcuts` scoped j/k/s/o/r/u/Esc to `/feed`, skip `/` on explore + post detail, ignore ctrl/meta/alt + IME composing |
| 2026-03-24 | **`pnpm db:reset`** | `scripts/reset-db.ts` removes SQLite + WAL/SHM/journal using `.env` `DATABASE_URL` (resolved vs `packages/server/`); docs + README |
| 2026-03-24 | **Login page logo** | `ConnectForm` logo aligned with `HeaderBar`: `⑂` + Fork/verse accent colors |
| 2026-03-24 | **Legacy DB filename in local `.env`** | `DATABASE_URL` aligned with `.env.example` (`forkverse.db`); decision log wording updated |
| 2026-03-23 | **Rebrand to Forkverse** | Fork/share-centric SNS branding; prior codename retired repo-wide (bulk rename, 118 files) |
| 2026-03-23 | **PWA: vite-plugin-pwa + Workbox** | Auto-generated SW with cache-first for fonts/avatars, network-first for API; manifest.json with SVG icons |
| 2026-03-23 | **Pull-to-refresh custom hook** | usePullToRefresh with touch events, resistance curve, threshold-based trigger; AppShell onRefresh prop |
| 2026-03-23 | **Manifest: SNS not Platform** | User clarified product is "developer SNS" not "platform"; updated manifest and descriptions |
| 2026-03-23 | **Structured JSON sections from LLM** | LLM prompt requests JSON with 7 keys; fallback splits plain text into paragraphs; stored in `result_sections_json` column |
| 2026-03-23 | **Analysis result page public** | `/analysis/:id` is public (no auth) for shareability; starring requires auth |
| 2026-03-23 | **Section nav: sidebar + mobile bottom bar** | Desktop uses sticky sidebar; mobile uses fixed bottom horizontal scroll bar with IntersectionObserver |
| 2026-03-21 | **MARKETING.md created** | Full marketing playbook: positioning, ICP, launch strategy (HN/PH/Reddit/Korean community), growth loops, SEO, metrics, budget guidance |
| 2026-03-21 | **APP_RELEASE.md created** | Full Android + iOS release guide: Capacitor setup, keystore/cert, Fastlane CI/CD, Play Store + App Store submission steps, push notifications (FCM/APNs), deep links, Korean store listing text |
| 2026-03-21 | **Logout moved to profile page** | Logout button shown only on own profile (`isSelf`); removed from MobileNav dropup and Sidebar |
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
