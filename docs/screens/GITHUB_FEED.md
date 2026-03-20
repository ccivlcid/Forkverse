# GITHUB_FEED Screen Specification

> **Source of truth** for the GitHub Feed screen (`/github`).

---

## 1. Screen Overview

| Property | Value |
|---|---|
| **Route** | `/github` |
| **Title** | `terminal.social / github --connect` |
| **Description** | GitHub platform integration page. Shows the user's GitHub Stars, Notifications, and open Issues/PRs in a tabbed interface. Requires GitHub OAuth with `notifications` and `repo` scopes. |
| **Auth Required** | Yes. Redirects to `/login` if not authenticated. |
| **Layout** | AppShell + max-w-2xl content area |

---

## 2. Desktop Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│ terminal.social / github                          @user ▾       │
├────────────────┬────────────────────────────────────────────────┤
│                │                                                 │
│ // navigate    │  $ github --connect                            │
│   feed --global│  $ gh star list                                │
│   feed --local │                                                 │
│   explore      │  [stars]  [notifications]  [issues & PRs]     │
│ $ github       │  ──────────────────────────────────────────── │
│                │                                                 │
│ // by LLM      │  ■ vercel/next.js                              │
│ ▸ anthropic    │    The React Framework for production          │
│                │    ● TypeScript  ★ 128k  ⑂ 27k  #react       │
│                │    starred 2d ago                               │
│                │                                                 │
│                │  ■ sindresorhus/awesome                        │
│                │    😎 Awesome lists about all kinds of...      │
│                │    ● Markdown  ★ 320k  ⑂ 27k                  │
│                │    starred 5d ago                               │
│                │                                                 │
└────────────────┴────────────────────────────────────────────────┘
```

### Notifications Tab

```
┌────────────────┬────────────────────────────────────────────────┐
│ (sidebar)      │                                                 │
│                │  $ gh notifications                             │
│                │  [stars]  [notifications ●]  [issues & PRs]   │
│                │  ──────────────────────────────────────────── │
│                │                        $ mark-read --all (3)   │
│                │                                                 │
│                │  ● Issue  assigned  owner/repo                 │
│                │    Fix: memory leak in event loop              │
│                │    → open   ✓ mark read            2h ago     │
│                │                                                 │
│                │  ● PullRequest  review-req  owner/repo         │
│                │    feat: add dark mode support                  │
│                │    → open   ✓ mark read            4h ago     │
│                │                                                 │
│                │  ○ Issue  watching  owner/repo (read)          │
│                │    Update dependencies                          │
│                │    → open                          1d ago      │
│                │                                                 │
└────────────────┴────────────────────────────────────────────────┘
```

### Issues & PRs Tab

```
┌────────────────┬────────────────────────────────────────────────┐
│ (sidebar)      │                                                 │
│                │  $ gh issue list --assigned                     │
│                │  [stars]  [notifications]  [issues & PRs ●]   │
│                │  ──────────────────────────────────────────── │
│                │                                                 │
│                │  --assigned  --created  --mentioned            │
│                │                                                 │
│                │  # Fix login redirect loop    owner/repo #42   │
│                │    enhancement  bug            8h ago          │
│                │                                                 │
│                │  ⑂ Add GitHub activity sync   owner/repo #17  │
│                │    feat                        1d ago          │
│                │                                                 │
└────────────────┴────────────────────────────────────────────────┘
```

---

## 3. Component Tree

```
GitHubFeedPage                          src/pages/GitHubFeedPage.tsx
├── AppShell                            src/components/layout/AppShell.tsx
└── MainContent
    ├── PageHeader                      // "$ github --connect"
    ├── TabBar                          [stars] [notifications] [issues & PRs]
    ├── StarsTab                        (rendered when tab === 'stars')
    │   ├── StarredRepoCard[]           avatar, fullName, description, lang, stats, topics
    │   ├── LoadingSpinner
    │   ├── ErrorBox
    │   └── EmptyBox
    ├── NotificationsTab                (rendered when tab === 'notifications')
    │   ├── MarkAllReadButton           shows unread count; calls mark-read for each
    │   ├── NotificationCard[]          unread dot, type badge, reason badge, title, links
    │   ├── LoadingSpinner
    │   ├── ErrorBox
    │   └── EmptyBox
    └── IssuesTab                       (rendered when tab === 'issues')
        ├── FilterBar                   --assigned / --created / --mentioned buttons
        ├── IssueCard[]                 type icon (#/⑂), title, repo, number, labels
        ├── LoadingSpinner
        ├── ErrorBox
        └── EmptyBox
```

---

## 4. Tab Descriptions

### `[stars]`

- Fetches `GET /api/github/stars` on mount
- Shows starred repos: owner avatar, `owner/name` link, description, language dot, star/fork counts, topic badges (max 4), "starred Xd ago"
- Language dot colors use well-known language color map (TypeScript → `#3178c6`, etc.)
- Empty state: `$ git star --list  # no results`

### `[notifications]`

- Fetches `GET /api/github/notifications` on mount
- Requires `notifications` scope; shows `error: notifications scope required` if missing
- Unread notifications show green dot indicator; read notifications are dimmed (opacity-60)
- Reason badge values: `assigned`, `mentioned`, `review-req`, `watching`, `author`, `comment`, `state-change`, `team-mention`
- `$ mark-read --all (N)` button shown when there are unread notifications
- Per-notification `✓ mark read` button calls `POST /api/github/notifications/:id/mark-read`
- Empty state: `$ gh notifications --all  # inbox zero`

### `[issues & PRs]`

- Fetches `GET /api/github/issues?filter=<filter>` when filter changes
- Requires `repo` scope; shows `error: repo scope required` if missing
- Filter bar: `--assigned` (default), `--created`, `--mentioned`
- Issue type icon: `#` (green) for issues, `⑂` (purple) for PRs
- Shows: title, repo name, issue number, labels (colored), relative timestamp
- Empty state: `$ gh issue list --<filter>  # no open items`

---

## 5. State

```typescript
// Local state per tab component (not in Zustand store)
interface StarsState {
  items: StarredRepo[];
  loading: boolean;
  error: string | null;
}

interface NotificationsState {
  items: GhNotification[];
  loading: boolean;
  error: string | null;
  marking: Set<string>;   // IDs currently being marked read
}

interface IssuesState {
  items: GhIssue[];
  loading: boolean;
  error: string | null;
  filter: 'assigned' | 'created' | 'mentioned';
}
```

---

## 6. API Calls

| Trigger | Endpoint | Method | Auth | Description |
|---------|----------|--------|------|-------------|
| Stars tab mount | `/api/github/stars` | GET | Yes | Fetch starred repos |
| Notifications tab mount | `/api/github/notifications` | GET | Yes | Fetch notifications |
| Issues tab mount / filter change | `/api/github/issues?filter=<f>` | GET | Yes | Fetch issues & PRs |
| Click `✓ mark read` | `/api/github/notifications/:id/mark-read` | POST | Yes | Mark one notification read |
| Click `$ mark-read --all` | `/api/github/notifications/:id/mark-read` (batched) | POST | Yes | Mark all unread notifications read |

---

## 7. Error States

| Scenario | Display |
|----------|---------|
| No GitHub token | `error: GitHub token not available. Please re-login.` |
| Missing `notifications` scope | `error: notifications scope required. Please re-login.` |
| Missing `repo` scope | `error: repo scope required. Please re-login.` |
| GitHub API failure (502) | `error: Failed to load <resource>` |
| Network error | `error: Failed to load <resource>` |

---

## 8. Sidebar Integration

The `/github` route appears as a nav item in the sidebar:

```
// navigate
  feed --global
  feed --local
  explore
  github          ← new
```

Active state: left border `border-[#3dd68c]`, text `text-[#3dd68c]`, background `bg-[#3dd68c]/[0.06]`.

---

## See Also

- [API.md](../specs/API.md) — `/api/github/*` endpoint documentation
- [SETTINGS.md](./SETTINGS.md) — OAuth tab with GitHub sync actions
- [DATABASE.md](../specs/DATABASE.md) — `github_synced_events` table
