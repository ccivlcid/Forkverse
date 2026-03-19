# USER_PROFILE Screen Specification

> **Source of truth** for the User Profile screen (`/@:username`).

---

## 1. Screen Overview

| Property        | Value                                                        |
|-----------------|--------------------------------------------------------------|
| **Route**       | `/@:username`                                                |
| **Title**       | `@{username} -- terminal.social`                             |
| **Description** | Public user profile page showing identity, stats, and posts. Visitors can browse posts; authenticated users can follow/unfollow and interact with posts. |
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
│ ○ gpt-4o   │  │  42 followers · 18 following · 67 posts               │   │
│ ○ llama-3  │  │                                                       │   │
│            │  │  ┌──────────────────┐                                 │   │
│ // me      │  │  │ $ follow @user   │  ← only if viewing other user  │   │
│ → @you     │  │  └──────────────────┘                                 │   │
│   my posts │  │                                                       │   │
│   starred  │  └───────────────────────────────────────────────────────┘   │
│            │                                                             │
│            │  ┌─ Tabs ───────────────────────────────────────────────┐   │
│            │  │  [posts]    [starred]    [posts --raw]                │   │
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
        <FollowButton />              // packages/client/src/components/profile/FollowButton.tsx
      </ProfileHeader>
      <ProfileTabs>                    // packages/client/src/components/profile/ProfileTabs.tsx
        ├── "posts"
        ├── "starred"
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
  activeTab: "posts" | "starred" | "raw";

  // Loading / error
  isLoadingProfile: boolean;
  isLoadingPosts: boolean;
  error: string | null;

  // Actions
  fetchProfile: (username: string) => Promise<void>;
  fetchPosts: (username: string, tab: string) => Promise<void>;
  fetchMorePosts: () => Promise<void>;
  toggleFollow: (username: string) => Promise<void>;
  setActiveTab: (tab: "posts" | "starred" | "raw") => void;
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

### On User Interaction

| Trigger                 | Endpoint                                   | Method | Purpose                         |
|-------------------------|---------------------------------------------|--------|---------------------------------|
| Click "starred" tab     | `/api/users/@:username/starred`             | GET    | Fetch starred posts             |
| Click "posts --raw" tab | `/api/users/@:username/posts?raw=true`      | GET    | Fetch raw (CLI-only) posts      |
| Click "posts" tab       | `/api/users/@:username/posts`               | GET    | Fetch normal posts              |
| Click follow/unfollow   | `/api/users/@:username/follow`              | POST   | Toggle follow status            |
| Click "$ fetch --more"  | `/api/users/@:username/posts?cursor=X`      | GET    | Load next page of posts         |
| Click star on post      | `/api/posts/:id/star`                       | POST   | Toggle star on a post           |
| Click fork on post      | `/api/posts/:id/fork`                       | POST   | Fork a post                     |
| Click reply on post     | Navigate to `/post/:id` or open reply composer | --  | Start reply flow                |

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
│  [posts]    [starred]    [posts --raw]                                │
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
| Follow/unfollow button | `follow-button` | E2E: toggle follow |
| Tab: posts | `tab-posts` | E2E: switch to posts tab |
| Tab: starred | `tab-starred` | E2E: switch to starred tab |
| Tab: posts --raw | `tab-raw` | E2E: switch to raw tab |
| Load more button | `load-more-button` | E2E: load more posts |
| Profile 404 error | `profile-not-found` | E2E: verify 404 state |
| Profile empty state | `profile-empty` | E2E: verify empty state |

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
| External domain link | `rel="noopener noreferrer"` with `aria-label="Visit jiyeon.kim (opens in new tab)"` |

---

## See Also

- [DESIGN_GUIDE.md](../guides/DESIGN_GUIDE.md) — Visual tokens, component specs, UI states
- [API.md](../specs/API.md) — Endpoint request/response details
- [CONVENTIONS.md](../guides/CONVENTIONS.md) — Coding rules for implementation
- [POST_DETAIL.md](./POST_DETAIL.md) — Related screen specification
- [SETTINGS.md](./SETTINGS.md) — Related screen specification
