# SETTINGS Screen Specification

> **Source of truth** for the Settings screen (`/settings`).
> Last updated: 2026-03-20 — Full redesign: single-scroll → tabbed layout

---

## 1. Screen Overview

| Property | Value |
|---|---|
| **Route** | `/settings` |
| **Title** | `settings -- terminal.social` |
| **Auth Required** | Yes. Redirects to `/login?redirect=/settings` if not authenticated. |
| **Layout** | AppShell + tabbed content area (max-w-2xl mx-auto) |

---

## 2. Tab Structure

```
$ settings --tab=[profile | language | oauth | api | channel | github]
                    ────────  ────────  ─────  ───  ───────   ──────
```

| Tab | Label | Contents | Badge |
|-----|-------|----------|-------|
| `profile` | profile | Display name, domain, bio, avatar, danger zone | — |
| `language` | language | UI lang, default post lang | — |
| `oauth` | oauth | GitHub connection status & management | `connected` / `!` |
| `api` | api | LLM API key management (anthropic, openai, gemini) | configured count |
| `channel` | channel | Subscribe / manage topic channels | — |
| `github` | github | PR review requests + webhook setup instructions | review count |

Active tab URL param: `/settings?tab=profile` (default: `profile`)

---

## 3. Tab Navigation Wireframe

```
┌──────────────────────────────────────────────────────────────────────┐
│ terminal.social / settings                                           │
├────────────┬─────────────────────────────────────────────────────────┤
│  sidebar   │                                                         │
│            │  $ settings --tab=                                      │
│            │  [profile] [language] [oauth ●] [api 2/3] [channel]        │
│            │  ─────────────────────────────────────────────────────  │
│            │                                                         │
│            │  (tab content here)                                     │
│            │                                                         │
└────────────┴─────────────────────────────────────────────────────────┘
```

Tab bar styling:
- Container: `flex gap-1 border-b border-gray-700 mb-6 pb-0`
- Inactive tab: `px-3 py-1.5 font-mono text-sm text-[#7a8898] border border-transparent hover:text-gray-300`
- Active tab: `px-3 py-1.5 font-mono text-sm text-green-400 border border-gray-700 border-b-[#1a1a2e] bg-[#1a1a2e] -mb-px`
- Badge: `ml-1.5 text-[10px] px-1 bg-green-400/10 text-green-400 rounded`

---

## 4. Tab Contents

---

### Tab: `profile`

```
// profile

$ set --display-name="Jiyeon Kim"
$ set --domain="jiyeon.dev"
$ set --bio="building things in the terminal"
$ set --avatar-url="https://..."

[Apply changes]

─────────────────────────────────────────────────────

// danger

$ delete --account
This action is irreversible.

[$ delete --confirm]  →  Are you sure? [yes, delete] [cancel]
```

**Fields:**

| Flag | Type | Max | Placeholder |
|------|------|-----|-------------|
| `--display-name` | text | 50 | user.displayName |
| `--domain` | text | 100 | `yourdomain.dev` |
| `--bio` | textarea | 300 | `Write something about yourself...` |
| `--avatar-url` | url | — | `https://...` |

**API:** `PUT /api/auth/me` → `{ displayName, domain, bio, avatarUrl }`

---

### Tab: `language`

```
// language

$ set --ui-lang=
  ○ en  English
  ● ko  한국어
  ○ zh  中文
  ○ ja  日本語

$ set --default-post-lang=
  ● auto  (detect from input)
  ○ en
  ○ ko
  ○ zh
  ○ ja
```

**State:** `uiStore.lang` (client-only, persisted to `localStorage('clitoris:ui-lang')`)
**API:** none — purely client-side setting. Survives page reload; default `en` if no stored value.

---

### Tab: `oauth`

```
// oauth connections

$ oauth --provider=github --status
> connected: github.com/jiyeon-kim
> scope: read:user, user:email, notifications, repo
> connected at: 2026-03-20T02:30:00Z

[sync profile]   [import activity]   [disconnect github]

─────────────────────────────────────────────────────

// sync result (after action)
✓ profile synced
✓ 3 new posts created (30 events scanned)

─────────────────────────────────────────────────────

// future providers (coming soon)

$ oauth --provider=gitlab  [not connected]
$ oauth --provider=gitea   [not connected]
```

**States:**

| State | Display |
|-------|---------|
| Connected | `text-emerald-400` badge `[connected]`, username, full scope list, timestamp, action buttons |
| Disconnected | `text-yellow-400` `[not connected]`, connect button |

**Actions:**

| Action | Endpoint | Description |
|--------|----------|-------------|
| Sync profile | `POST /api/users/sync-profile` | Re-fetches GitHub avatar, bio, repo count |
| Import activity | `POST /api/users/sync-activity` | Imports recent GitHub events as posts (deduped) |
| Disconnect GitHub | `DELETE /api/auth/github` | Unlinks GitHub; keeps account but disables OAuth login |
| Connect (if disconnected) | `GET /api/auth/github` | Initiates OAuth flow |

**Sync result messages:**
- `✓ profile synced` — profile sync succeeded
- `✓ N new posts created (M events scanned)` — activity import result
- `0 new posts (all already imported)` — all events already deduped

> Note: Disconnecting GitHub while it is the only login method will lock the user out. Show warning.

---

### Tab: `api`

LLM 클라우드 API 키 관리. 키는 서버 DB에 암호화 저장, 클라이언트에 평문 노출 없음.

```
// llm api keys
// keys are stored server-side and never exposed to the client

$ set --llm-key=anthropic
  [configured ✓]  [× remove]

$ set --llm-key=openai
  [not configured]  [+ add key]
    → input: sk-...    [save]

$ set --llm-key=gemini
  [not configured]  [+ add key]

─────────────────────────────────────────────────────

// local providers (no key needed)
> ollama     — running at localhost:11434
```

**Providers requiring keys:**

| Provider | Key format | Docs |
|----------|-----------|------|
| anthropic | `sk-ant-...` | platform.anthropic.com |
| openai | `sk-...` | platform.openai.com |
| gemini | `AIza...` | aistudio.google.com |

**API:**

| Action | Endpoint | Method |
|--------|----------|--------|
| List configured | `GET /api/llm/providers` | GET |
| Save key | `POST /api/llm/keys` | POST `{ provider, apiKey }` |
| Remove key | `DELETE /api/llm/keys/:provider` | DELETE |

**Badge:** `api 2/3` — configured count out of 3 cloud providers.

---

### Tab: `channel`

채널 = 해시태그 기반 토픽 스트림 (IRC 채널 컨셉). 구독하면 로컬 피드에 해당 태그 포스트가 포함됨.

```
// channel subscriptions

$ channel --list
> #ai-tools      142 posts  3.2k members  [unsubscribe]
> #rust          89 posts   1.1k members  [unsubscribe]
> #devops        204 posts  4.5k members  [unsubscribe]

$ channel --join
  ┌────────────────────────────────┐
  │ #                              │  (type channel name)
  └────────────────────────────────┘
  [join channel]

─────────────────────────────────────────────────────

// trending channels
> #llm           +234 this week  [join]
> #terminal      +89 this week   [join]
> #typescript    +67 this week   [join]
```

**Data model:**

```typescript
interface Channel {
  id: string;
  name: string;        // e.g. "ai-tools" (without #)
  postCount: number;
  memberCount: number;
  subscribedAt: string;
}
```

**API:**

| Action | Endpoint | Method |
|--------|----------|--------|
| List subscribed | `GET /api/channels` | GET |
| Subscribe | `POST /api/channels/:name/subscribe` | POST |
| Unsubscribe | `DELETE /api/channels/:name/subscribe` | DELETE |
| List trending | `GET /api/channels/trending` | GET |

> Phase note: Channel backend (DB table, routes) is **not yet implemented**. Tab renders as coming-soon placeholder until Phase 3 is complete.

---

### Tab: `github`

GitHub 통합 관리. PR 리뷰 요청 목록과 Webhook 설정 안내를 제공.

```
// github integration

$ github --reviews
> review-requested:@me

┌─────────────────────────────────────────────────────────────────────┐
│ #88  feat: add dark mode              owner/repo        2026-03-20  │
│      [enhancement]                    by contributor    [open PR →] │
├─────────────────────────────────────────────────────────────────────┤
│ #42  fix: memory leak in event loop   owner/other-repo  2026-03-19  │
│      [bug]                            by someone        [open PR →] │
└─────────────────────────────────────────────────────────────────────┘

// 0 reviews pending  (when empty)

─────────────────────────────────────────────────────────────────────

$ github --webhook --setup

// auto-post on push, PR, release, and branch create events

Payload URL:   https://yourdomain/api/webhook/github
Content type:  application/json
Secret:        (set GITHUB_WEBHOOK_SECRET in your server .env)

Events:  ● push
         ● pull_request  (opened, merged, closed)
         ● release       (published)
         ● create        (branch, tag)

[copy payload URL]
```

**PR Reviews section:**

| State | Display |
|-------|---------|
| Reviews pending | List rows with PR title, repo, author, label badges, `[open PR →]` link |
| Empty | `// 0 reviews pending` — green monospace message |
| Loading | Skeleton rows with pulsing bars |
| Error | `error: failed to fetch reviews` in red monospace |

**Webhook section:**

Provides setup instructions for connecting a GitHub repository webhook. No configuration is stored in the UI — the user copies the payload URL and configures the webhook directly in GitHub repository settings.

| Field | Value |
|-------|-------|
| Payload URL | `https://yourdomain/api/webhook/github` (server URL) |
| Content type | `application/json` |
| Secret | Value of `GITHUB_WEBHOOK_SECRET` env var (set server-side) |
| Events | `push`, `pull_request`, `release`, `create` |

**API:**

| Action | Endpoint | Description |
|--------|----------|-------------|
| List PR reviews | `GET /api/github/reviews` | PRs where `review-requested:@me` |

**Badge:** `github N` where `N` is the count of open review requests (hidden when 0).

---

## 5. Component Tree

```
<SettingsPage>
  <AppShell breadcrumb="settings">
    <Toast />                       // shared toast (success/error)
    <TabBar>                        // tab navigation
      <TabButton tab="profile" />
      <TabButton tab="language" />
      <TabButton tab="oauth" badge="connected" />
      <TabButton tab="api" badge="2/3" />
      <TabButton tab="channel" />
      <TabButton tab="github" badge="3" />
    </TabBar>

    {tab === 'profile'  && <ProfileTab />}
    {tab === 'language' && <LanguageTab />}
    {tab === 'oauth'    && <OAuthTab />}
    {tab === 'api'      && <ApiTab />}
    {tab === 'channel'  && <ChannelTab />}
    {tab === 'github'   && <GithubTab />}
  </AppShell>
</SettingsPage>
```

All tab components live in `packages/client/src/components/settings/`.

---

## 6. State

**URL state:** `?tab=profile` (via `useSearchParams`)

**Local state per tab** (no global settings store needed):
- Each tab manages its own loading/saving state
- Toast is shared via prop drilling or a simple local state in SettingsPage
- `authStore.user` is the source of truth for profile fields

---

## 7. URL / Navigation

| URL | Result |
|-----|--------|
| `/settings` | Opens `profile` tab (default) |
| `/settings?tab=language` | Opens language tab |
| `/settings?tab=oauth` | Opens OAuth tab |
| `/settings?tab=api` | Opens API tab |
| `/settings?tab=channel` | Opens channel tab |
| `/settings?tab=github` | Opens GitHub integration tab |
| `/settings?tab=invalid` | Falls back to `profile` |

Tab switch: updates URL param without page reload (`replace: false`).

---

## 8. Loading & Error States

Same patterns as current implementation:
- Skeleton pulse on initial load where data is needed
- Button text changes to `applying...` / `saving...` / `testing...` during async ops
- Errors inline below the relevant field/action in `text-red-400 font-mono text-xs`
- Success toast: `text-emerald-400`, auto-dismiss 2.5s, top-right fixed

---

## 9. Implementation Order

1. `TabBar` component + URL param switching
2. `ProfileTab` — migrate existing profile + danger zone
3. `LanguageTab` — migrate existing language section
4. `ApiTab` — migrate existing LLM key management
5. `OAuthTab` — migrate existing GitHub section + disconnect action
6. `ChannelTab` — new: requires DB migration + API routes (Phase 3)

---

## 10. API Endpoints

| Endpoint | Method | Status | Purpose |
|----------|--------|--------|---------|
| `GET /api/llm/providers` | GET | ✅ Done | List local runtimes + user-configured API keys |
| `POST /api/llm/keys` | POST `{ provider, apiKey }` | ✅ Done | Save user API key |
| `DELETE /api/llm/keys/:provider` | DELETE | ✅ Done | Remove user API key |
| `GET /api/auth/me/pending` | GET | ✅ Done | Return pending GitHub profile (pre-setup) |
| `DELETE /api/auth/github` | DELETE | ⏳ Planned | Disconnect GitHub OAuth |
| `GET /api/channels` | GET | ⏳ Phase 3 | List subscribed channels |
| `POST /api/channels/:name/subscribe` | POST | ⏳ Phase 3 | Subscribe to channel |
| `DELETE /api/channels/:name/subscribe` | DELETE | ⏳ Phase 3 | Unsubscribe |
| `GET /api/channels/trending` | GET | ⏳ Phase 3 | Trending channel list |
| `GET /api/github/reviews` | GET | ✅ Done | PR review requests for authenticated user |

---

## See Also

- [DESIGN_GUIDE.md](../design/DESIGN_GUIDE.md) — Visual tokens
- [API.md](../specs/API.md) — Existing endpoint docs
- [CONVENTIONS.md](../guides/CONVENTIONS.md) — Coding rules
