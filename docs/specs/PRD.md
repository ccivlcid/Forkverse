# Forkverse — Product Requirements Document

> **Source of truth** for product requirements, feature specifications, and MVP scope.
> Updated: 2026-03-21 — Pivoted to B-plan (Repo Analysis Platform).

## 1. Product Overview

**Forkverse** is a **Repo Analysis Platform** with a terminal/CLI aesthetic.
Users analyze GitHub repositories using AI, and the results are transformed into structured developer insights — reports, presentations, and video walkthroughs.
Analysis results can be shared, starred, and forked within a developer-oriented social layer.

**One-line definition**: Analyze a repo, turn it into developer-ready insights, and share it like code culture.

**Domain**: `terminal.social`

**Core principle**: **Analyze first, social second.**

## 2. Core Concept

- **"Enter a repo. Get structured insights. Share them."**
- GitHub repo URL → AI analysis → structured report (Executive Summary, Tech Stack, Architecture, Strengths, Risks, Improvements)
- Results exportable as report, PPTX, or video walkthrough
- CLI View as brand differentiator — analysis results displayed in terminal aesthetic
- **GitHub-native identity**: Login exclusively via GitHub OAuth
- **LLM as analysis engine**: Multiple providers (Anthropic, OpenAI, Gemini, Ollama) for repo analysis
- **Social as distribution**: Analysis results shared as posts in a developer feed

## 3. Product Layers

Forkverse has three layers, in priority order:

### 3.1 Analyze Layer (Primary)
The core entry point and main value proposition.
- GitHub repo URL input
- Analysis type selection (report, pptx, video)
- LLM model selection
- Real-time progress tracking
- Result viewing and export

### 3.2 Insight Layer (Secondary)
Where analysis results are consumed and reused.
- Executive Summary
- Tech Stack breakdown
- Architecture inference
- Strengths & Risks identification
- Suggested Improvements
- CLI View (brand differentiator)
- Export (download, copy, share)

### 3.3 Social Layer (Tertiary)
Distribution and community around analysis results.
- Feed (shared analysis results + posts)
- Star / Fork / Reply
- User profiles with analysis history
- Explore (trending analyses, popular repos)
- Follow system

## 4. User Personas

| Persona | Description | Primary Use |
|---------|------------|-------------|
| **Developer / Tech Lead** | Evaluates unfamiliar repos quickly | Repo analysis for code review, onboarding |
| **AI/Dev Tool Enthusiast** | Actively tries new developer tools | Analyze repos, compare LLM outputs, share findings |
| **Tech Content Creator** | Writes about open source, gives talks | Generate presentation materials from repos |
| **PM / Architect / Recruiter** | Needs quick repo-level understanding | Architecture overview, tech stack assessment |

### User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| US-1 | Developer | Enter a GitHub repo URL and get an AI analysis | I can quickly understand an unfamiliar codebase |
| US-2 | Developer | See analysis results in structured sections | I can find specific info (stack, architecture, risks) fast |
| US-3 | Developer | Choose which AI model analyzes the repo | I can compare different AI perspectives |
| US-4 | Developer | Download analysis as PPTX | I can present project architecture to my team |
| US-5 | Developer | Generate a video walkthrough | I can share visual explanations of code |
| US-6 | Developer | Share analysis results to the feed | Others can discover my insights |
| US-7 | User | Star analyses I find useful | I can bookmark them for later |
| US-8 | User | Fork an analysis and re-analyze | I can get a fresh perspective with a different model |
| US-9 | User | Browse trending analyses | I can discover interesting projects and insights |
| US-10 | User | See my analysis history | I can revisit past results |
| US-11 | Developer | Login with GitHub | My developer identity carries over |
| US-12 | Developer | Use local LLMs (Ollama) | I can analyze private repos offline |
| US-13 | User | View the feed for shared analyses | I can browse what others have analyzed |
| US-14 | User | Follow other users | I see their shared analyses in my feed |
| US-15 | User | Write posts with LLM-generated CLI format | I can participate in the social layer (legacy SNS feature) |
| US-16 | User | Read posts in my language | I can enjoy content written in other languages |

## 5. Key Features

### 5.1 Repo Analysis (`$ analyze`) — PRIMARY FEATURE

LLMs analyze GitHub repositories and produce structured outputs.

**Command format:**
```
$ analyze --repo=owner/name --output=<type> --model=<model> --lang=<lang>
```

#### Output Types

**Report** (`--output=report`):
Structured analysis with sections:
1. Executive Summary
2. Tech Stack
3. Architecture Inference
4. Strengths
5. Risks
6. Suggested Improvements
7. CLI View

**PPTX Presentation** (`--output=pptx`):
Auto-generated slide deck. Options: `--slides=N`, `--style=`, `--focus=`

**Video Walkthrough** (`--output=video`):
Terminal-style animation walkthrough. Options: `--duration=`, `--type=`, `--format=`

#### Analysis Flow

```
Home (Hero CTA) or /analyze → Enter repo → Choose output → Pick model
    ↓                                                          ↓
GitHub API fetch → Shallow clone → LLM analysis → Generate output
    ↓                                                          ↓
Progress display (SSE) → Result view (sectioned) → Share / Download / Export
```

#### Sharing Analysis Results

1. **Downloaded** — `.md` report, `.pptx` file, video
2. **Posted to feed** — Shared as analysis post with preview card
3. **Direct URL** — Shareable link to analysis result page (`/analysis/:id`)

### 5.2 Feed System (Social Layer)

- **Global feed** (`/feed`): All shared posts and analysis results
- **Local feed** (`/feed?tab=local`): Posts from followed users
- **Explore** (`/explore`): Trending analyses, popular repos, discover

### 5.3 Posts (Dual Format)

Each post is displayed in two formats simultaneously: natural language and CLI command.
Posts can be standalone or linked to analysis results.

**Post attributes:**
- `--user`: Author
- `--lang`: Language code
- `--message`: Body content
- `--tags`: Hashtags
- `--visibility`: public, private, unlisted
- `--intent`/`--emotion`: LLM-inferred metadata

### 5.4 Interactions

| Action | CLI Representation | Description |
|--------|-------------------|-------------|
| Star | `star` | Bookmark an analysis or post |
| Fork | `fork` | Re-analyze a repo or clone a post |
| Reply | `reply` | Respond to a post |
| React | `react` | Emoji reactions (lgtm, ship_it, fire, bug, thinking, rocket, eyes, heart) |

### 5.5 LLM Integration

| Provider | Type | Description |
|----------|------|-------------|
| **anthropic** | API | Anthropic SDK (Claude models) |
| **openai** | API | OpenAI SDK (GPT models) |
| **gemini** | API | Google GenAI SDK (Gemini models) |
| **ollama** | Local | Ollama REST API (local models) |
| **api** | API | Generic OpenAI-compatible REST |
| **custom** | Custom | User-configured |

### 5.6 GitHub Integration

- GitHub OAuth login (only auth method)
- Repo analysis via GitHub API
- GitHub profile sync (avatar, bio, repos)
- Activity sync (push, PR, release events → auto-posts)
- Contribution graph

### 5.7 Multilingual Support

- 4 UI languages: en, ko, zh, ja
- Analysis output in user-selected language
- Post translation (tone-aware, cached)

## 6. Information Architecture

### 6.1 Navigation (B-plan)

```
/                       → Home (Hero + Analyze CTA + popular analyses)
/analyze                → Repo analysis tool (primary feature)
/analysis/:id           → Analysis result detail (sectioned view)
/feed                   → Global feed (shared analyses + posts)
/feed?tab=local         → Local feed (following only)
/explore                → Trending analyses, popular repos
/search                 → Search analyses, posts, users, tags
/@:username             → User profile (analyses, posts, starred)
/post/:id               → Single post + thread
/login                  → GitHub OAuth connect
/setup                  → First-time profile setup
/settings               → User settings
/github                 → GitHub Stars, Notifications, Issues & PRs
/activity               → Activity feed
/leaderboard            → Influence ranking
/chat                   → Multi-agent chat
/messages               → Direct messages
```

### 6.2 Navigation Priority

| Context | Primary | Secondary |
|---------|---------|-----------|
| First visit | Home → Analyze | Explore |
| Return visit | Analyze → Feed | Explore, Profile |
| Desktop sidebar | analyze, feed, explore, search, ... | github, activity, messages |
| Mobile bottom nav | Feed, Explore, **Analyze (center)**, Activity, Profile |

### 6.3 Data Model

```
User {
  id, username, domain, display_name,
  bio, avatar_url, created_at,
  github_id, github_username,
  github_avatar_url, github_profile_url,
  github_repos_count, github_connected_at,
  top_languages
}

Analysis {
  id, user_id, repo_owner, repo_name,
  output_type (report | pptx | video),
  llm_model, lang, options_json,
  result_url, result_summary,
  result_sections_json,
  status (pending | processing | completed | failed),
  duration_ms, created_at
}

Post {
  id, user_id, message_raw, message_cli,
  lang, tags[], mentions[], visibility,
  llm_model, parent_id (reply),
  forked_from_id, analysis_id (linked analysis),
  intent, emotion, created_at
}

Translation { id, post_id, lang, text, created_at }
Follow { follower_id, following_id }
Star { user_id, post_id }
Fork { user_id, original_post_id, forked_post_id }
Reaction { id, user_id, post_id, emoji, created_at }
Notification { id, user_id, type, actor_id, post_id, read, created_at }
RepoAttachment { post_id, repo_owner, repo_name, repo_stars, repo_forks, repo_language }
```

## 7. MVP Scope (B-plan)

### Phase B1 — Entry Point Transition
- [ ] New Home page (Hero + Analyze CTA + popular analyses)
- [ ] Navigation restructure (Analyze as primary)
- [ ] Mobile bottom nav: center = Analyze
- [ ] `/feed` route (move current GlobalFeed from `/`)

### Phase B2 — Analysis Result Enhancement
- [ ] Sectioned result page (Summary, Stack, Architecture, Strengths, Risks, Improvements)
- [ ] `/analysis/:id` dedicated result page
- [ ] Section navigation + copy/share per section
- [ ] Mobile card stack view for results

### Phase B3 — Mobile Web Completion
- [ ] Analyze input mobile optimization
- [ ] Result viewing mobile optimization
- [ ] Touch interactions
- [ ] PWA (manifest, service worker, offline shell)

### Phase B4 — App Store Release (Capacitor)
- [ ] Capacitor integration
- [ ] Push notifications (FCM/APNs)
- [ ] Deep links (terminal.social URL → app)
- [ ] Android Play Store release
- [ ] iOS App Store release

### Phase B5 — Backend Scaling
- [ ] API + Worker separation (analysis jobs)
- [ ] Job Queue for async analysis
- [ ] SQLite → Postgres migration
- [ ] LLM Gateway standardization

### Phase B6 — Extended Features
- [ ] PPTX generation improvements
- [ ] Comparison analysis (repo vs repo)
- [ ] Private repo analysis (paid)
- [ ] Team workspaces
- [ ] Collections / bookmarks

## 8. Non-Functional Requirements

### Performance Targets

| Metric | Target |
|--------|--------|
| Home page load | < 1s (LCP) |
| Analyze page load | < 500ms |
| Repo analysis (report) | < 30s (p95) |
| Repo analysis (pptx) | < 60s (p95) |
| Repo analysis (video) | < 180s (p95) |
| Feed loading | < 500ms (p95) |
| Post creation | < 300ms (p95) |
| Star toggle | < 100ms (optimistic) |
| Bundle size (client) | < 500KB gzipped |
| SQLite query | < 50ms (p95) |

### Responsive Design

| Breakpoint | Layout |
|------------|--------|
| < 640px (mobile) | Bottom nav, stacked layout, Analyze center button |
| 640-1024px (tablet) | Sidebar collapsible, side-by-side panels |
| > 1024px (desktop) | Full layout with fixed sidebar |

### Mobile App Targets

| Platform | Method | Timeline |
|----------|--------|----------|
| Mobile Web | PWA | Phase B3 |
| Android | Capacitor → Play Store | Phase B4 |
| iOS | Capacitor → App Store | Phase B4 |
| Native (optional) | React Native | Phase B6+ (if needed) |

### Security

| Measure | Implementation |
|---------|---------------|
| XSS prevention | React auto-escaping + DOMPurify |
| SQL injection | Prepared statements (better-sqlite3) |
| CSRF protection | Session-based with SameSite cookies |
| Rate limiting | express-rate-limit per endpoint |
| OAuth security | GitHub OAuth 2.0 with PKCE |
| Input validation | zod schemas at API boundary |
| Session security | httpOnly, secure, SameSite=Lax cookies |

## 9. Monetization Direction

### Free Plan
- Public repo analysis
- Monthly analysis limit
- Basic LLM model
- Basic reports

### Paid Plan
- Increased analysis quota
- Premium models (GPT-4, Claude Opus)
- Private repo analysis
- Team workspace
- Advanced export
- Comparison analysis

### Enterprise
- Team shared workspace
- Analysis history management
- Access control
- Internal project analysis
- API access

## 10. Success Metrics

### Product Metrics
- Analysis requests per day
- Analysis completion rate
- Result share rate
- Shared analysis view count
- Return visit rate
- Star / Fork ratio

### Operational Metrics
- Average analysis time
- Failure rate
- Job retry rate
- LLM cost per analysis

### Quality Metrics
- Result satisfaction score
- Summary usefulness
- Architecture inference accuracy
- Improvement suggestion relevance

---

## See Also

- [Forkverse_최종통합본_Part1](./Forkverse_최종통합본_Part1_제품전략_공개전략.md) — Product strategy & open-source strategy
- [Forkverse_최종통합본_Part2](./Forkverse_최종통합본_Part2_아키텍처_UIUX_로드맵.md) — Architecture, UI/UX, tech roadmap
- [MOBILE.md](./MOBILE.md) — Mobile strategy (PWA → Capacitor → Native)
- [API.md](./API.md) — Full REST API documentation
- [DATABASE.md](./DATABASE.md) — Database schema and queries
- [Screen specs](../screens/) — Page-by-page UI specifications
- [DESIGN_GUIDE.md](../design/DESIGN_GUIDE.md) — Visual design system
