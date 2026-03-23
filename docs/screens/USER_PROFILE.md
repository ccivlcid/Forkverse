# USER_PROFILE Screen Specification

> **Source of truth** for the User Profile screen (`/@:username`).

---

## 1. Screen Overview

| Property        | Value                                                        |
|-----------------|--------------------------------------------------------------|
| **Route**       | `/@:username`                                                |
| **Title**       | `@{username} -- terminal.social`                             |
| **Description** | Public user profile page showing identity, stats, and content. **B-plan**: Adds "Analyses" tab showing the user's repo analysis history alongside Posts, Starred, and Repos tabs. Analyses tab is the default for profiles with analyses. |
| **Auth Required** | No (view only). Yes for follow/unfollow and post interactions (star, reply, fork). |

---

## 2. Desktop Wireframe

```
┌──────────────────────────────────────────────────────────────────────────┐
│ terminal.social / @username                                              │
├────────────┬─────────────────────────────────────────────────────────────┤
│            │                                                             │
│ // navigate│  ┌─ Profile Header ─────────────────────────────────────┐   │
│ $ feed     │  │                                                       │   │
│   --global │  │  ┌────┐  @username                                    │   │
│   --local  │  │  │ ◇◇ │  domain.dev                                   │   │
│   following│  │  │ ◇◇ │  Display Name                                 │   │
│   explore  │  │  └────┘                                               │   │
│            │  │                                                       │   │
│ // by LLM  │  │  Bio text goes here. One or two lines max.            │   │
│ ● claude   │  │                                                       │   │
│ ○ gpt-4o   │  │  // github                                            │   │
│ ○ llama-3  │  │  ■ github.com/username                                │   │
│            │  │  repos: 42 · mass-followers: 128 · top: TS, Go        │   │
│ // me      │  │                                                       │   │
│ → @you     │  │  42 followers · 18 following · 67 posts               │   │
│   my posts │  │                                                       │   │
│   starred  │  │  ┌──────────────────┐                                 │   │
│            │  │  │ $ follow @user   │  ← only if viewing other user  │   │
│            │  │  └──────────────────┘                                 │   │
│            │  └───────────────────────────────────────────────────────┘   │
│            │                                                             │
│            │  ┌─ Tabs ───────────────────────────────────────────────┐   │
│            │  │  [posts]    [starred]    [repos]    [posts --raw]     │   │
│            │  └──────────────────────────────────────────────────────┘   │
│            │                                                             │
│            │  ┌─ Post Card ──────────────────────────────────────────┐   │
│            │  │ @username  domain.dev · 3m ago            --lang=en  │   │
│            │  ├────────────────────────┬──────────────────────────────┤   │
│            │  │ Natural language text  │ post --user=username \       │   │
│            │  │ goes here.             │   --lang=en \                │   │
│            │  │                        │   --message="text" \         │   │
│            │  │ #hashtag               │   --tags=hashtag             │   │
│            │  ├────────────────────────┴──────────────────────────────┤   │
│            │  │ ↩ reply 5    ◇ fork 3    ★ star 42                   │   │
│            │  └──────────────────────────────────────────────────────┘   │
│            │                                                             │
│            │  ┌─ Post Card ──────────────────────────────────────────┐   │
│            │  │ ...                                                   │   │
│            │  └──────────────────────────────────────────────────────┘   │
│            │                                                             │
│            │  ┌─ Load More ──────────────────────────────────────────┐   │
│            │  │ $ fetch --more                                       │   │
│            │  └──────────────────────────────────────────────────────┘   │
│            │                                                             │
└────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 3. Mobile Wireframe

```
┌─────────────────────────────────┐
│ ≡  terminal.social              │
├─────────────────────────────────┤
│                                 │
│  ┌─ Profile Header ──────────┐  │
│  │                            │  │
│  │    ┌────┐                  │  │
│  │    │ ◇◇ │                  │  │
│  │    └────┘                  │  │
│  │    @username               │  │
│  │    domain.dev              │  │
│  │    Display Name            │  │
│  │                            │  │
│  │    Bio text here.          │  │
│  │                            │  │
│  │    42 followers            │  │
│  │    18 following · 67 posts │  │
│  │                            │  │
│  │    ┌────────────────────┐  │  │
│  │    │ $ follow @user     │  │  │
│  │    └────────────────────┘  │  │
│  └────────────────────────────┘  │
│                                 │
│  ┌─ Tabs ────────────────────┐  │
│  │ [posts] [starred] [--raw] │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌─ Post Card ───────────────┐  │
│  │ @user · 3m ago  --lang=en │  │
│  ├───────────────────────────┤  │
│  │ Natural language text     │  │
│  │ goes here.                │  │
│  │ #hashtag                  │  │
│  ├───────────────────────────┤  │
│  │ CLI -- open source   copy │  │
│  │ post --user=name \        │  │
│  │   --message="text"        │  │
│  ├───────────────────────────┤  │
│  │ ↩ 5  ◇ 3  ★ 42           │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌─ Post Card ───────────────┐  │
│  │ ...                        │  │
│  └───────────────────────────┘  │
│                                 │
│  $ fetch --more                 │
│                                 │
└─────────────────────────────────┘
```

---

## 4. Component Tree

```
<UserProfilePage>                      // packages/client/src/pages/UserProfilePage.tsx
  <PageLayout>                         // packages/client/src/components/layout/PageLayout.tsx
    <HeaderBar />                      // packages/client/src/components/layout/HeaderBar.tsx
    <Sidebar />                        // packages/client/src/components/layout/Sidebar.tsx
    <main>
      <ProfileHeader>                  // packages/client/src/components/profile/ProfileHeader.tsx
        <AvatarPlaceholder />          // packages/client/src/components/profile/AvatarPlaceholder.tsx
        <UserIdentity />              // packages/client/src/components/profile/UserIdentity.tsx
          ├── username (amber-400)
          ├── domain (gray-400)
          └── displayName (gray-200)
        <UserBio />                    // packages/client/src/components/profile/UserBio.tsx
        <UserStats />                  // packages/client/src/components/profile/UserStats.tsx
          ├── followerCount
          ├── followingCount
          └── postCount
        <GitHubInfo />                // packages/client/src/components/profile/GitHubInfo.tsx
          ├── githubUrl (link to github.com)
          ├── reposCount
          ├── githubFollowers
          └── topLanguages
        <FollowButton />              // packages/client/src/components/profile/FollowButton.tsx
        <ContributionGraph />         // packages/client/src/components/profile/ContributionGraph.tsx
          └── (all users — grass heatmap, 52 weeks)
        <GithubFollowSync />          // packages/client/src/components/profile/GithubFollowSync.tsx
          └── (own profile only — following/followers subtabs)
      </ProfileHeader>
      <ProfileTabs>                    // packages/client/src/components/profile/ProfileTabs.tsx
        ├── "posts"
        ├── "starred"
        ├── "repos"
        └── "posts --raw"
      </ProfileTabs>
      <PostList>                       // packages/client/src/components/post/PostList.tsx
        <PostCard />                   // packages/client/src/components/post/PostCard.tsx
          <PostHeader />              // packages/client/src/components/post/PostHeader.tsx
          <DualPanel>                 // packages/client/src/components/post/DualPanel.tsx
            <NaturalPanel />          // packages/client/src/components/post/NaturalPanel.tsx
            <CliPanel />             // packages/client/src/components/post/CliPanel.tsx
          </DualPanel>
          <ActionBar />              // packages/client/src/components/post/ActionBar.tsx
        <LoadMoreButton />            // packages/client/src/components/common/LoadMoreButton.tsx
      </PostList>
    </main>
  </PageLayout>
</UserProfilePage>
```

---

## 5. State Requirements

### Zustand Stores

**`authStore`** (existing)
```typescript
{
  user: User | null;          // current logged-in user (for follow button visibility)
}
```

**`profileStore`** (new)
```typescript
{
  // Profile data
  profile: {
    id: string;
    username: string;
    domain: string | null;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    // GitHub fields
    githubUsername: string | null;
    githubProfileUrl: string | null;
    githubReposCount: number;
    githubFollowers: number;
    topLanguages: string[];
    createdAt: string;
    followerCount: number;
    followingCount: number;
    postCount: number;
    isFollowing: boolean;
  } | null;

  // Profile posts
  posts: Post[];
  cursor: string | null;
  hasMore: boolean;

  // Active tab
  activeTab: "posts" | "starred" | "repos" | "raw";

  // Loading / error
  isLoadingProfile: boolean;
  isLoadingPosts: boolean;
  error: string | null;

  // Actions
  fetchProfile: (username: string) => Promise<void>;
  fetchPosts: (username: string, tab: string) => Promise<void>;
  fetchMorePosts: () => Promise<void>;
  toggleFollow: (username: string) => Promise<void>;
  setActiveTab: (tab: "posts" | "starred" | "repos" | "raw") => void;
  reset: () => void;
}
```

### Data Shape: `Post`
```typescript
interface Post {
  id: string;
  userId: string;
  messageRaw: string;
  messageCli: string;
  lang: string;
  tags: string[];
  mentions: string[];
  visibility: "public" | "private" | "unlisted";
  llmModel: string;
  parentId: string | null;
  forkedFromId: string | null;
  createdAt: string;
  user: {
    username: string;
    domain: string | null;
    displayName: string;
    avatarUrl: string | null;
  };
  starCount: number;
  replyCount: number;
  forkCount: number;
  isStarred: boolean;
}
```

---

## 6. API Calls

### On Mount

| Trigger          | Endpoint                              | Method | Purpose                         |
|------------------|---------------------------------------|--------|---------------------------------|
| Page load        | `/api/users/@:username`               | GET    | Fetch profile data              |
| Page load        | `/api/users/@:username/posts`         | GET    | Fetch user's posts (default tab)|
| Page load        | `/api/github/contributions/:username` | GET    | Fetch contribution graph data (all users) |
| Page load (own profile) | `/api/github/following`        | GET    | Fetch GitHub following + Forkverse status |
| Page load (own profile) | `/api/github/followers`        | GET    | Fetch GitHub followers + Forkverse status |

### On User Interaction

| Trigger                 | Endpoint                                   | Method | Purpose                         |
|-------------------------|---------------------------------------------|--------|---------------------------------|
| Click "starred" tab     | `/api/users/@:username/starred`             | GET    | Fetch starred posts             |
| Click "repos" tab       | `/api/users/@:username/repos`               | GET    | Fetch GitHub pinned repos       |
| Click "posts --raw" tab | `/api/users/@:username/posts?raw=true`      | GET    | Fetch raw (CLI-only) posts      |
| Click "posts" tab       | `/api/users/@:username/posts`               | GET    | Fetch normal posts              |
| Click follow/unfollow   | `/api/users/@:username/follow`              | POST   | Toggle follow status            |
| Click "$ fetch --more"  | `/api/users/@:username/posts?cursor=X`      | GET    | Load next page of posts         |
| Click star on post      | `/api/posts/:id/star`                       | POST   | Toggle star on a post           |
| Click fork on post      | `/api/posts/:id/fork`                       | POST   | Fork a post                     |
| Click reply on post     | Navigate to `/post/:id` or open reply composer | --  | Start reply flow                |
| Click "sync all follows" | `/api/github/sync-follows`                 | POST   | Bulk-follow GitHub following on Forkverse (own profile only) |
| Click "follow →" in sync list | `/api/users/@:username/follow`        | POST   | Follow individual Forkverse user from sync list |

---

## 7. User Interactions

| Element                | Action             | Result                                                    |
|------------------------|--------------------|-----------------------------------------------------------|
| `@username` in header  | Click              | Copy username to clipboard                                |
| Domain link            | Click              | Open external domain URL in new tab                       |
| Follow button          | Click              | POST toggle follow; update button text and follower count |
| Follow button          | Hover              | Border transitions to `border-green-400`                  |
| Tab: "posts"           | Click              | Fetch and display user's posts; underline active tab      |
| Tab: "starred"         | Click              | Fetch and display user's starred posts                    |
| Tab: "repos"           | Click              | Fetch and display user's pinned GitHub repos              |
| GitHub profile link    | Click              | Open github.com profile in new tab                        |
| Tab: "posts --raw"     | Click              | Fetch and display posts in CLI-only format (no natural panel) |
| Post card              | Click on body      | Navigate to `/post/:id` (post detail)                     |
| Post card: ↩ reply     | Click              | Navigate to `/post/:id` with reply composer focused       |
| Post card: ◇ fork      | Click              | Fork post (requires auth); show success inline            |
| Post card: ★ star      | Click              | Toggle star (requires auth); update count                 |
| Post card: copy (⎘)    | Click              | Copy CLI text to clipboard                                |
| Post card: @username   | Click              | Navigate to `/@username`                                  |
| Post card: #hashtag    | Click              | Navigate to `/explore?tag=hashtag`                        |
| Load more button       | Click              | Fetch next page; append to list                           |
| Keyboard: `j`          | Press              | Move focus to next post card                              |
| Keyboard: `k`          | Press              | Move focus to previous post card                          |
| Keyboard: `s`          | Press              | Star focused post                                         |
| Keyboard: `f`          | Press              | Fork focused post                                         |
| Follower count         | Click              | Navigate to `/@username/followers` (future)               |
| Following count        | Click              | Navigate to `/@username/following` (future)               |

---

## 8. Loading State

```
┌─ Profile Header (Skeleton) ──────────────────────────────────────────┐
│                                                                       │
│  ┌────┐  ████████████                                                 │
│  │    │  ████████                                                     │
│  │    │  ████████████████                                             │
│  └────┘                                                               │
│                                                                       │
│  ████████████████████████████████████████                             │
│                                                                       │
│  ██████ · ██████ · ██████                                            │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

┌─ Tabs ───────────────────────────────────────────────────────────────┐
│  [posts]    [starred]    [repos]    [posts --raw]                     │
└──────────────────────────────────────────────────────────────────────┘

┌─ Post Skeleton ──────────────────────────────────────────────────────┐
│ ████████ · ██████                                                     │
├──────────────────────────┬───────────────────────────────────────────┤
│ ██████████████████████   │ ██████████████████████                     │
│ ████████████████         │ ██████████████                             │
│ ██████████████████████   │ ██████████████████████                     │
├──────────────────────────┴───────────────────────────────────────────┤
│ ↩ --  ◇ --  ★ --                                                     │
└──────────────────────────────────────────────────────────────────────┘

┌─ Post Skeleton ──────────────────────────────────────────────────────┐
│ ...                                                                   │
└──────────────────────────────────────────────────────────────────────┘
```

**Implementation:**
- Profile header fields: `bg-gray-700/50 animate-pulse rounded-sm` blocks in place of text
- Post skeletons: 3 placeholder cards with pulsing bars (opacity pulse only, no shimmer)
- Tabs render immediately (not skeleton) but are disabled until profile loads
- Action bar shows icons with `--` placeholders for counts

---

## 9. Empty State

### Empty State: "posts" tab (no posts yet)

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                     $ ls posts                                        │
│                     error: no posts found                             │
│                                                                       │
│                     @username hasn't posted yet.                      │
│                     Check back later or explore the global feed.      │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### Empty State: "starred" tab (no starred posts)

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                     $ ls starred                                      │
│                     error: no starred posts                           │
│                                                                       │
│                     @username hasn't starred any posts yet.           │
│                     Stars will appear here.                           │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

**Styling:**
- Container: centered within main content area, `py-16`
- Command line: `text-green-400 font-mono text-sm`
- Error line: `text-red-400 font-mono text-sm`
- Description: `text-gray-400 font-sans text-sm mt-4`

---

## 10. Error State

### Profile Not Found (404)

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                     $ whoami @username                                 │
│                     error: user not found (404)                       │
│                                                                       │
│                     This user does not exist.                         │
│                     Check the username and try again.                 │
│                                                                       │
│                     ┌──────────────────────┐                         │
│                     │ $ cd /feed --global  │                         │
│                     └──────────────────────┘                         │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### Network / Server Error (500)

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                     $ whoami @username                                 │
│                     error: connection refused (500)                   │
│                                                                       │
│                     Something went wrong loading this profile.        │
│                     Please try again.                                 │
│                                                                       │
│                     ┌──────────────┐                                  │
│                     │ $ retry      │                                  │
│                     └──────────────┘                                  │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### Posts Failed to Load (profile loads, posts fail)

Profile header renders normally. Post list area shows:

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│    $ fetch posts --user=@username                                     │
│    error: failed to load posts                                       │
│                                                                       │
│    ┌──────────────┐                                                  │
│    │ $ retry      │                                                  │
│    └──────────────┘                                                  │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

**Styling:**
- Command: `text-green-400 font-mono`
- Error: `text-red-400 font-mono`
- Description: `text-gray-400 font-sans text-sm`
- Retry / navigation button: `border border-gray-700 text-green-400 font-mono text-sm px-4 py-2 hover:bg-[#1e293b] transition-colors duration-150`

---

## 11. Test IDs (`data-testid`)

| Element | `data-testid` | Purpose |
|---------|---------------|---------|
| Profile header container | `profile-header` | E2E: verify profile loaded |
| Username display | `profile-username` | E2E: verify username |
| Domain display | `profile-domain` | E2E: verify domain |
| Display name | `profile-display-name` | E2E: verify display name |
| Bio text | `profile-bio` | E2E: verify bio |
| Follower count | `profile-followers` | E2E: verify follower count |
| Following count | `profile-following` | E2E: verify following count |
| Post count | `profile-post-count` | E2E: verify post count |
| GitHub info section | `profile-github-info` | E2E: verify GitHub data displayed |
| GitHub profile link | `github-profile-link` | E2E: click GitHub link |
| Follow/unfollow button | `follow-button` | E2E: toggle follow |
| Tab: posts | `tab-posts` | E2E: switch to posts tab |
| Tab: starred | `tab-starred` | E2E: switch to starred tab |
| Tab: repos | `tab-repos` | E2E: switch to repos tab |
| Tab: posts --raw | `tab-raw` | E2E: switch to raw tab |
| Load more button | `load-more-button` | E2E: load more posts |
| Profile 404 error | `profile-not-found` | E2E: verify 404 state |
| Profile empty state | `profile-empty` | E2E: verify empty state |
| Contribution graph | `contribution-graph` | E2E: verify heatmap renders |
| GitHub follow sync | `github-follow-sync` | E2E: verify own-profile sync section |
| Sync all follows button | `sync-all-follows` | E2E: trigger bulk follow |

---

## 12. Accessibility Notes

| Requirement | Implementation |
|-------------|---------------|
| Profile header | `role="banner"` with `aria-label="User profile for @username"` |
| Follow button | `aria-pressed="true/false"` reflects following state |
| Profile tabs | `role="tablist"` with `role="tab"` per tab, `aria-selected` |
| Tab panel | `role="tabpanel"` with `aria-labelledby` pointing to active tab |
| Follower/following counts | `role="link"` with `aria-label="128 followers"` (future navigation) |
| Avatar placeholder | `aria-hidden="true"` (decorative) |
| GitHub info | `aria-label="GitHub profile information"` with link `rel="noopener noreferrer"` |
| Repos tab panel | Same tabpanel pattern as other tabs |
| External domain link | `rel="noopener noreferrer"` with `aria-label="Visit jiyeon.kim (opens in new tab)"` |

---

## 13. Contribution Graph

Displayed below the follow button on all user profiles. Shows the last 52 weeks of GitHub contribution activity as a heatmap.

```
// contributions — 2025

░░▒▒▒░░░▓▓▒░░░░▒▒▓▓▓░░░▒▒░░▓▓▓▓▒░░░▒▒▒▒░░▒▒▒▓▓░░░▒▒▓▓░░░░▒▒▒░░
(52 weeks, 7 rows — Mon through Sun)

1,247 contributions in the last year
```

**Color levels:**

| Level | Count | Color class |
|-------|-------|-------------|
| 0 | 0 | `bg-gray-800` (empty) |
| 1 | 1–3 | `bg-green-900` |
| 2 | 4–6 | `bg-green-700` |
| 3 | 7–9 | `bg-green-500` |
| 4 | 10+ | `bg-green-400` |

**API:** `GET /api/github/contributions/:username` (GitHub GraphQL)

**Loading state:** Placeholder grid with `animate-pulse bg-gray-800` cells.

**Error state:** `// contribution data unavailable` — shown silently (non-blocking).

---

## 14. GitHub Follow Sync (Own Profile Only)

Displayed below the Contribution Graph when viewing the authenticated user's own profile. Provides two subtabs: `[following]` and `[followers]`.

```
// github sync

[following]  [followers]
─────────────────────────────────────────────────────────────────

octocat        github.com/octocat    [not on Forkverse]
jiyeon-kim     @jiyeon_dev           [follow →]
tsdev          @tsdev                [following ✓]

[sync all follows]   // follows all Forkverse users from GitHub following list
```

**Following subtab columns:**

| Column | Description |
|--------|-------------|
| GitHub login | GitHub username (links to github.com profile) |
| Forkverse user | `@username` if registered, `[not on Forkverse]` if not |
| Action | `[follow →]` if not yet following; `[following ✓]` if already following; blank if not on Forkverse |

**Followers subtab columns:**

| Column | Description |
|--------|-------------|
| GitHub login | GitHub username |
| Forkverse user | `@username` or `[not on Forkverse]` |
| Action | `[follow back →]` if not following back; `[mutual ✓]` if mutual; blank if not on Forkverse |

**Sync all follows button:** Calls `POST /api/github/sync-follows`. Shows result: `✓ N users followed`.

**Visibility:** Only rendered when `authStore.user.username === profileUsername`.

---

## See Also

- [DESIGN_GUIDE.md](../design/DESIGN_GUIDE.md) — Visual tokens, component specs, UI states
- [API.md](../specs/API.md) — Endpoint request/response details
- [CONVENTIONS.md](../guides/CONVENTIONS.md) — Coding rules for implementation
- [POST_DETAIL.md](./POST_DETAIL.md) — Related screen specification
- [SETTINGS.md](./SETTINGS.md) — Related screen specification
