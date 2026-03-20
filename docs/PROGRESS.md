# PROGRESS.md — Development Status

> **Source of truth** for development status, phase tracking, and decision log.
> Last updated: 2026-03-20

---

## Current Phase: Phase 6 — SNS Social Features (Complete)

All Phase 0–6 features are complete. Phase 6 added emoji reactions, quote posts, full-text search, notifications, activity feed, and ErrorBoundary.

---

## Phase Overview

| Phase | Name | Status |
|-------|------|--------|
| Phase 0 | Documentation & Setup | **Complete** |
| Phase 1 | Core | **Complete** |
| Phase 2 | Social | **Complete** |
| Phase 3 | Expansion | **Complete** |
| Phase 4 | GitHub Platform + Media | **Complete** |
| Phase 5 | GitHub Social + UI Polish | **Complete** |
| Phase 6 | SNS Social Features | **Complete** |

---

## Phase 0 — Documentation & Setup ✅

All documentation, configuration files, and project scaffolding complete.

---

## Phase 1 — Core (In Progress)

| Feature | Status | Notes |
|---------|--------|-------|
| `@clitoris/shared` types | ✅ Done | Post, User, ApiResponse, PostIntent, PostEmotion, TranslateResponse |
| `@clitoris/llm` providers | ✅ Done | 7 providers: Anthropic, OpenAI, Gemini, Ollama, Cursor, CLI, Generic API |
| LLM transform (JSON flow) | ✅ Done | transform.md → JSON → CLI reconstruction; intent/emotion extracted |
| LLM translate | ✅ Done | translate.md; tone-aware, cached in DB |
| DB migrations 001–007 | ✅ Done | users, posts, social, llm_keys, lang_columns, intent_emotion, translations |
| Server: auth routes | ✅ Done | GitHub OAuth, session, setup |
| Server: posts routes | ✅ Done | CRUD, feed, star, fork, reply, translate endpoint |
| Server: llm routes | ✅ Done | transform, providers list, key management |
| Server: users routes | ✅ Done | profile, follow |
| Client: AppShell + Sidebar | ✅ Done | Header, nav, LLM filter |
| Client: GlobalFeedPage | ✅ Done | FeedList + infinite scroll (composer is a modal via HeaderBar) |
| Client: PostCard | ✅ Done | Dual panel, intent badge, translate toggle |
| Client: LoginPage | ✅ Done | GitHub OAuth connect screen |
| Client: SetupPage | ✅ Done | First-time profile setup |
| Client: PostDetailPage | ✅ Done | `/post/:id` — single post + threaded replies + reply composer |
| App routes (full) | ✅ Done | All routes: `/post/:id`, `/@:username`, `/feed/local`, `/explore`, `/settings`, `/analyze` |

### Phase 1 Acceptance Criteria

| Feature | Acceptance Criteria |
|---------|-------------------|
| GitHub OAuth login | User can login with GitHub OAuth, complete profile setup, and maintain session across page reloads |
| Post creation (dual format) | User writes natural language, LLM transforms to CLI, both display side by side in a post card |
| LLM transformation | Anthropic provider works with claude-sonnet; transformation completes in < 3 seconds |
| Global feed | Feed loads 20 posts with cursor-based pagination; infinite scroll works without duplicates |
| Star | Toggle star with optimistic update; star count reflects correctly; duplicate stars prevented |
| Reply | Threaded replies display under parent post; reply count updates correctly |

---

## Phase 2 — Social (Not Started)

| Feature | Status | Notes |
|---------|--------|-------|
| Follow/unfollow | ✅ Done | Server + client UI (UserProfilePage) |
| Local feed | ✅ Done | `/feed/local` — posts from followed users |
| Fork | ✅ Done | Server route + ActionBar UI |
| User profile page | ✅ Done | `/@:username` route |
| Explore page | ✅ Done | `/explore` — trending tags + star-sorted posts |

### Phase 2 Acceptance Criteria

| Feature | Acceptance Criteria |
|---------|-------------------|
| Follow/unfollow | Toggle follow with optimistic update; follower/following counts update; self-follow prevented |
| Local feed | Shows only posts from followed users; empty state when not following anyone |
| Fork | Clones post to user's timeline with `forkedFromId` link; fork count updates; duplicate fork prevented |
| User profile page | Displays user info, stats, posts tab, starred tab; follow button for other users |

---

## Phase 3 — Expansion (In Progress)

| Feature | Status | Notes |
|---------|--------|-------|
| SettingsPage (tabbed) | ✅ Done | 5 tabs: profile, language, oauth, api, channel |
| ProfileTab | ✅ Done | Display name, bio, domain, avatar, danger zone |
| LanguageTab | ✅ Done | UI lang (en/ko/zh/ja) + persisted to localStorage |
| OAuthTab | ✅ Done | GitHub connection status + disconnect |
| ApiTab | ✅ Done | LLM API key management (anthropic/openai/gemini) |
| ChannelTab | ⏳ Stub | UI placeholder; backend not yet implemented |
| Sidebar my LLM section | ✅ Done | Shows configured API providers; links to settings API tab |
| UI language persistence | ✅ Done | `localStorage('clitoris:ui-lang')` — survives page reload |
| Multi-LLM UI | ✅ Done | API models in Composer; LLM filter in Explore/Sidebar |
| Reference UI polish | ✅ Done | Panel labels (ⓘ 자연어 / ⊡ CLI), ¶ continuation, ↵/○ icons, HeaderBar subtitle |
| ExplorePage | ✅ Done | Trending tags, star-sorted posts, tag filter |
| AnalyzePage | ✅ Done | `/analyze` — repo input, progress polling, result display, history |
| GitHub activity → auto-posts | ✅ Done | `POST /api/users/sync-activity` — imports push/PR/release/create/star/fork events; deduped via `github_synced_events` table |
| GitHub profile sync | ✅ Done | `POST /api/users/sync-profile` — re-fetches avatar, bio, repos count from GitHub public API; OAuthTab sync buttons |
| Analysis → feed post | ✅ Done | `POST /api/analyze/:id/share` — creates post from analysis result with repo attachment; AnalyzePage share button |
| PPTX generation | ✅ Done | `pptxgenjs` 5-slide terminal-style deck; `GET /api/analyze/:id/download`; stored in `uploads/analyses/`; AnalyzePage download button |
| Video generation | ✅ Done | Terminal animation HTML; scene-by-scene typewriter effect; `▶ open animation` button; served inline via download endpoint |
| Keyboard shortcuts | ✅ Done | `useKeyboardShortcuts` hook; j/k nav, s star, o open, u author, g+chord pages, ?, /; `KeyboardHelpModal`; [?] button in header |
| Seed script | ✅ Done | `scripts/seed.ts` — 5 users, 12 posts, 31 stars, 12 follows, 1 reply; runs migrations first; `pnpm seed` |
| GitHub feed page | ✅ Done | `/github` route — `GitHubFeedPage` with 3 tabs: stars, notifications, issues & PRs; mark-read action; filter bar |

---

## Phase 5 — GitHub Social + UI Polish (Complete)

| Feature | Status | Notes |
|---------|--------|-------|
| GitHub follow sync | ✅ Done | `GET /api/github/following` — following list + CLItoris membership; `POST /api/github/sync-follows` — bulk-follow on CLItoris; `GithubFollowSync` component on own profile page |
| GitHub followers | ✅ Done | `GET /api/github/followers` — followers list + CLItoris membership + mutual-follow status |
| topLanguages | ✅ Done | `POST /api/users/sync-profile` computes repo language stats → stored in `top_languages` DB column (migration `012_add_top_languages.sql`) → displayed as badges on profile |
| PR Review Requests | ✅ Done | `GET /api/github/reviews` — `review-requested:@me` GitHub search; displayed in Settings → `github` tab |
| Webhook auto-posting | ✅ Done | `POST /api/webhook/github` — HMAC-SHA256 signature verification; push/PR/release/create events → immediate post creation; new router `packages/server/src/routes/webhook.ts` |
| Contribution Graph | ✅ Done | `GET /api/github/contributions/:username` — GitHub GraphQL; `ContributionGraph` component; grass heatmap on all user profiles |
| GithubTab (Settings) | ✅ Done | New `github` tab in Settings: PR Review Requests list + Webhook setup instructions |
| Local Feed mock data | ✅ Done | `packages/client/src/mocks/localFeedMock.ts` — 6 mock posts (Korean/English mix, various LLM models); `LocalFeedPage` auto-injects when API returns empty |
| UI contrast improvements | ✅ Done | All component text colors improved: `#525270`→`#7a8898`, `#404060`→`#7a8898`, `#6b6b8a`→`#9aacbf`; PostCard timestamps/separators/flags, DualPanel copy/translate buttons, ComposerModal hints/model indicator/lang selector/transform button |

---

## Phase 6 — SNS Social Features (Complete)

| Feature | Status | Notes |
|---------|--------|-------|
| Emoji reactions | ✅ Done | `POST /api/posts/:id/react` — 8 reactions (lgtm, ship_it, fire, bug, thinking, rocket, eyes, heart); `ReactionBar` component; migration `016_create_reactions.sql` |
| Quote posts | ✅ Done | `quotedPostId` field on posts; `QuotedPost` component; migrations `018_add_quoted_post_id.sql` + `019_add_quoted_post_index.sql` |
| Full-text search | ✅ Done | FTS5 virtual table `posts_fts` on `message_raw` + `tags`; auto-sync triggers; `GET /api/posts/search`; `SearchPage` + `searchStore`; migration `017_create_posts_fts.sql` |
| Notifications | ✅ Done | `notifications` table; 7 types (reply, mention, quote, star, fork, follow, reaction); `NotificationBell` component; `notificationStore`; 4 endpoints; migration `015_create_notifications.sql` |
| Activity feed | ✅ Done | `activity_feed` table; following + global feeds; GitHub sync; `ActivityFeedPage` + `activityStore`; 3 endpoints; migration `014_create_activity_feed.sql` |
| Webhook dedup | ✅ Done | `webhook_deliveries` table; idempotent webhook processing; migration `013_create_webhook_deliveries.sql` |
| ErrorBoundary | ✅ Done | App-level React class component error boundary with terminal-style crash UI |
| SQL injection fix | ✅ Done | Sanitized FTS5 queries (escape special chars, wrap terms in quotes); parameterized all user inputs |
| Suggested users | ✅ Done | `GET /api/users/suggested` — recommends users to follow based on activity |

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
| 2026-03-19 | All docs under docs/ | Single location, organized by category |
| 2026-03-20 | LLM outputs JSON (not CLI string) | Reliable parsing; server reconstructs CLI; enables intent/emotion extraction |
| 2026-03-20 | Translation cached per (post_id, lang) | Zero server cost (uses viewer's key); instant on cache hit |
| 2026-03-20 | Ports changed to 3771 (server) / 7878 (client) | Avoids common port conflicts (3000/5173 often occupied) |
| 2026-03-20 | CLI tool feature removed | Removed CLI-based LLM tools (claude-code, codex, gemini-cli, opencode); API-only LLM connections |
| 2026-03-20 | UI language persisted in localStorage | `clitoris:ui-lang` key; avoids API round-trip for a client-only preference |
| 2026-03-20 | GitHub OAuth fix: `/api/auth/me/pending` endpoint | SetupPage called this endpoint; missing 404 caused login loop; fixed by adding endpoint |
| 2026-03-20 | Sidebar my LLM: `/api/llm/providers` | API keys from server (source of truth); sidebar shows configured providers |
| 2026-03-20 | GitHub OAuth scope expanded to `notifications repo` | Required for platform integration (notifications, issues, PRs); only applies to the logged-in user's own data |
| 2026-03-20 | GitHub token stored in DB (`github_access_token`, `github_token_scope`) | Persists token across sessions; migration 011 |
| 2026-03-20 | GitHub activity dedup via `github_synced_events` table | Prevents re-importing same event; migration 010 |
| 2026-03-20 | Video generation uses animated HTML (no ffmpeg) | Self-contained HTML with CSS/JS typewriter animation; no binary deps; served inline |
| 2026-03-20 | Analysis share uses dedicated endpoint `POST /api/analyze/:id/share` | Creates post with repo_attachment from analysis metadata; not a plain post creation |
| 2026-03-20 | Keyboard g-chord uses `useRef` for pending state | Avoids stale closure; g+h/l/e/a/p/s navigate pages; 600ms timeout |
| 2026-03-20 | Seed script reads migrations at runtime | `scripts/seed.ts` runs all migrations before inserting; same DB path as dev server |
| 2026-03-20 | GitHub follow sync in own profile, not Settings | `GithubFollowSync` component lives on `/@me` profile page — contextually closer to social graph than settings config |
| 2026-03-20 | topLanguages stored as JSON TEXT column | `top_languages TEXT DEFAULT '[]'` — computed on sync-profile call; parsed in application code; migration 012 |
| 2026-03-20 | Webhook uses HMAC-SHA256 via `X-Hub-Signature-256` | Industry-standard GitHub webhook verification; `GITHUB_WEBHOOK_SECRET` env var; 400 on signature mismatch |
| 2026-03-20 | Contribution graph via GitHub GraphQL API | REST API does not expose contribution data; GraphQL `contributionsCollection` is the only official source |
| 2026-03-20 | LocalFeedMock auto-injected when API returns empty | Avoids empty-state UX during development; 6 posts with Korean/English mix to test dual-format rendering |
| 2026-03-20 | UI contrast: gray palette shift to `#7a8898` / `#9aacbf` | Previous `#525270` / `#6b6b8a` values failed WCAG AA contrast against `#1a1a2e` background; new values pass 4.5:1 ratio |

---

## See Also

- [CLAUDE.md](../CLAUDE.md) — Project overview and documentation map
- [PRD.md](./specs/PRD.md) — Product requirements and MVP phases
- [GLOSSARY.md](./GLOSSARY.md) — Unified terminology index
