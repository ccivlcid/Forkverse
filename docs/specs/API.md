# API.md — REST API Specification

> **Source of truth** for all REST API endpoints, request/response formats, and error handling.
> Base URL: `/api`
> Content-Type: `application/json`
> Authentication: Session-based (express-session) via GitHub OAuth
> Updated: 2026-03-21 — B-plan analysis endpoints added (see bottom of file).

---

## 1. Response Format

All endpoints return a consistent envelope:

```typescript
// Success
{
  "data": T,
  "meta"?: { cursor?: string, hasMore?: boolean }
}

// Error
{
  "error": {
    "code": string,      // machine-readable (e.g. "VALIDATION_ERROR")
    "message": string    // human-readable description
  }
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| `200` | OK | Successful GET, PUT, DELETE |
| `201` | Created | Successful POST (resource created) |
| `400` | Bad Request | Validation error (zod) |
| `401` | Unauthorized | Not logged in |
| `403` | Forbidden | Not allowed to perform action |
| `404` | Not Found | Resource does not exist |
| `409` | Conflict | Duplicate (e.g. already starred, already following) |
| `429` | Too Many Requests | Rate limit exceeded (LLM endpoints) |
| `500` | Internal Server Error | Unexpected server error |

---

## 2. Authentication

### GET `/api/auth/github`

Redirects to GitHub OAuth consent screen.

**Query Parameters:** none

**Response:** `302 Redirect` to `https://github.com/login/oauth/authorize` with client_id, redirect_uri, scope, state parameters.

---

### GET `/api/auth/github/callback`

Handles GitHub OAuth callback. Exchanges code for access token, creates/finds user, sets session.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| code | string | Authorization code from GitHub |
| state | string | CSRF state parameter |

**Success (existing user):** `302 Redirect` to `/`
**Success (new user):** `302 Redirect` to `/setup`
**Error (denied):** `302 Redirect` to `/login?error=denied`
**Error (state mismatch):** `302 Redirect` to `/login?error=state_mismatch`

---

### POST `/api/auth/setup`

Complete profile setup for new GitHub users.

**Auth:** Required (partial session from OAuth)

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | Forkverse username (3+ chars, [a-z0-9_]) |
| displayName | string | No | Display name (max 50 chars) |
| bio | string | No | Bio text (max 300 chars) |

**Success Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "username": "jiyeon_dev",
    "displayName": "Jiyeon Kim",
    "bio": "full-stack dev",
    "avatarUrl": "https://github.com/...",
    "githubUsername": "jiyeon-kim"
  }
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| 400 | Username too short or invalid characters |
| 409 | Username already taken |

---

### POST `/auth/logout`

Destroy the current session.

**Response:** `200 OK`
```json
{
  "data": { "message": "Logged out" }
}
```

---

### GET `/auth/me`

Get the currently authenticated user.

**Response:** `200 OK`
```json
{
  "data": {
    "id": "01912345-6789-7abc-def0-123456789abc",
    "username": "jiyeon_dev",
    "displayName": "Jiyeon",
    "domain": "jiyeon.kim",
    "bio": "Building terminal.social",
    "avatarUrl": null,
    "createdAt": "2026-03-19T12:00:00Z"
  }
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `401` | Not logged in |

---

### PUT `/auth/me`

Update the current user's profile. Requires authentication.

**Request:**
```json
{
  "displayName": "New Display Name",
  "domain": "newdomain.dev",
  "bio": "Updated bio text",
  "avatarUrl": "https://example.com/avatar.png"
}
```

**Validation (zod):**
```
displayName:  string, min 1, max 50 (optional)
domain:       string, valid domain format or null (optional)
bio:          string, max 300 (optional)
avatarUrl:    string, valid URL or null (optional)
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "01912345-6789-7abc-def0-123456789abc",
    "username": "jiyeon_dev",
    "displayName": "New Display Name",
    "domain": "newdomain.dev",
    "bio": "Updated bio text",
    "avatarUrl": "https://example.com/avatar.png",
    "createdAt": "2026-03-19T12:00:00Z"
  }
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `400` | Validation error (invalid domain format, bio too long) |
| `401` | Not authenticated |

---

### DELETE `/auth/me`

Delete the current user's account permanently. Requires authentication. This action is irreversible — all posts, stars, and follows are deleted.

**Request:** No body required. Server validates session.

**Response:** `200 OK`
```json
{
  "data": { "message": "Account deleted" }
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `401` | Not authenticated |
| `500` | Deletion failed (server error) |

---

## 3. Posts

### POST `/posts`

Create a new post. Requires authentication.

**Request:**
```json
{
  "messageRaw": "CLI is the new lingua franca. Think in any language, post in any language.",
  "messageCli": "post --user=0xmitsuki.sh --lang=en --message=\"CLI flags as universal language layer\" --tags=cli-first --visibility=public",
  "lang": "en",
  "tags": ["cli-first"],
  "mentions": [],
  "visibility": "public",
  "llmModel": "claude-sonnet"
}
```

**Validation (zod):**
```
messageRaw:    string, min 1, max 2000
messageCli:    string, min 1, max 4000
lang:          string, length 2 (ISO 639-1)
tags:          string[], max 10 items, each max 50 chars
mentions:      string[], max 20 items
visibility:    enum ["public", "private", "unlisted"]
llmModel:      string, min 1, max 200 (free-form model identifier)
parentId:      string (optional — set for replies)
intent:        enum ["casual", "formal", "question", "announcement", "reaction"] (default: "casual")
emotion:       enum ["neutral", "happy", "surprised", "frustrated", "excited", "sad", "angry"] (default: "neutral")
repoOwner:     string, max 100 (optional — GitHub repo attachment)
repoName:      string, max 100 (optional — GitHub repo attachment)
quotedPostId:  string (optional — for quote posts)
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "01912345-aaaa-7bbb-cccc-dddddddddddd",
    "userId": "01912345-6789-7abc-def0-123456789abc",
    "messageRaw": "CLI is the new lingua franca...",
    "messageCli": "post --user=0xmitsuki.sh ...",
    "lang": "en",
    "tags": ["cli-first"],
    "mentions": [],
    "visibility": "public",
    "llmModel": "claude-sonnet",
    "parentId": null,
    "forkedFromId": null,
    "createdAt": "2026-03-19T12:30:00Z",
    "user": {
      "username": "0xmitsuki",
      "domain": "mitsuki.sh",
      "displayName": "Mitsuki",
      "avatarUrl": null
    },
    "starCount": 0,
    "replyCount": 0,
    "forkCount": 0,
    "isStarred": false,
    "intent": "announcement",
    "emotion": "excited"
  }
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `400` | Validation error |
| `401` | Not authenticated |

---

### GET `/posts/feed/global`

Get the global public feed. No authentication required.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `cursor` | string | — | ISO timestamp for pagination (created_at of last item) |
| `limit` | number | `20` | Items per page (max 50) |

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "01912345-aaaa-7bbb-cccc-dddddddddddd",
      "userId": "01912345-6789-7abc-def0-123456789abc",
      "messageRaw": "CLI is the new lingua franca...",
      "messageCli": "post --user=0xmitsuki.sh ...",
      "lang": "en",
      "tags": ["cli-first"],
      "mentions": [],
      "visibility": "public",
      "llmModel": "claude-sonnet",
      "parentId": null,
      "forkedFromId": null,
      "createdAt": "2026-03-19T12:30:00Z",
      "user": {
        "username": "0xmitsuki",
        "domain": "mitsuki.sh",
        "displayName": "Mitsuki",
        "avatarUrl": null
      },
      "starCount": 31,
      "replyCount": 9,
      "forkCount": 3,
      "isStarred": false,
      "intent": "announcement",
      "emotion": "excited"
    }
  ],
  "meta": {
    "cursor": "2026-03-19T12:29:00Z",
    "hasMore": true
  }
}
```

---

### GET `/posts/feed/local`

Get feed from followed users. Requires authentication.

**Query Parameters:** Same as global feed.

**Response:** Same shape as global feed.

**Errors:**
| Code | Condition |
|------|-----------|
| `401` | Not authenticated |

---

### GET `/posts/:id`

Get a single post by ID.

**Response:** `200 OK`
```json
{
  "data": {
    "id": "01912345-aaaa-7bbb-cccc-dddddddddddd",
    "userId": "...",
    "messageRaw": "...",
    "messageCli": "...",
    "lang": "en",
    "tags": ["cli-first"],
    "mentions": [],
    "visibility": "public",
    "llmModel": "claude-sonnet",
    "parentId": null,
    "forkedFromId": null,
    "createdAt": "2026-03-19T12:30:00Z",
    "user": { "username": "...", "domain": "...", "displayName": "...", "avatarUrl": "..." },
    "starCount": 31,
    "replyCount": 9,
    "forkCount": 3,
    "isStarred": true,
    "forkedFrom": null,
    "replies": [
      {
        "id": "...",
        "messageRaw": "...",
        "messageCli": "...",
        "user": { "username": "...", "displayName": "..." },
        "createdAt": "...",
        "starCount": 2,
        "replyCount": 0,
        "forkCount": 0
      }
    ]
  }
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `404` | Post not found |

---

### Replies

Replies are created via `POST /posts` with the `parentId` field set to the parent post ID. There is no separate `/posts/:id/reply` endpoint.

---

### GET `/posts/feed/explore`

Get trending posts sorted by star count. No authentication required.

**Query Parameters:** Same as global feed (`cursor`, `limit`).

**Response:** Same shape as global feed, sorted by star count descending.

---

### GET `/posts/trending/tags`

Get the top 20 trending tags from the last 7 days. No authentication required.

**Response:** `200 OK`
```json
{
  "data": [
    { "tag": "cli-first", "count": 42 },
    { "tag": "rust", "count": 31 }
  ]
}
```

---

### GET `/posts/trending/repos`

Get the top 10 most-mentioned repos from the last 7 days. No authentication required.

**Response:** `200 OK`
```json
{
  "data": [
    {
      "owner": "vercel",
      "name": "next.js",
      "mentionCount": 15,
      "topTags": ["react", "ssr"],
      "stars": 128000,
      "forks": 27000,
      "language": "TypeScript"
    }
  ]
}
```

---

### GET `/posts/search`

Full-text search across posts, users, and tags. Uses FTS5.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search query |
| `cursor` | string | Pagination cursor |
| `limit` | number | Items per page (default 20, max 50) |

**Response:** `200 OK`
```json
{
  "data": {
    "posts": [ /* Post objects */ ],
    "users": [ /* UserProfile objects */ ],
    "tags": [ { "tag": "...", "count": 5 } ]
  }
}
```

---

### POST `/posts/:id/react`

Add or remove an emoji reaction on a post. Requires authentication. Toggle behavior: if the user already reacted with the same emoji, it is removed.

**Request:**
```json
{
  "emoji": "lgtm"
}
```

**Validation:** `emoji` must be one of: `lgtm`, `ship_it`, `fire`, `bug`, `thinking`, `rocket`, `eyes`, `heart`

**Response:** `200 OK`
```json
{
  "data": {
    "added": true,
    "reactions": {
      "lgtm": 3,
      "fire": 1
    }
  }
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `400` | Invalid emoji |
| `401` | Not authenticated |
| `404` | Post not found |

---

### POST `/posts/:id/fork`

Fork a post to your timeline. Requires authentication.

**Request:** No body required. The original post is cloned.

**Response:** `201 Created`
```json
{
  "data": {
    "id": "new-forked-post-id",
    "userId": "current-user-id",
    "messageRaw": "...",
    "messageCli": "...",
    "forkedFromId": "original-post-id",
    "createdAt": "2026-03-19T13:00:00Z",
    "user": { "username": "...", "displayName": "..." },
    "starCount": 0,
    "replyCount": 0,
    "forkCount": 0,
    "isStarred": false
  }
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `401` | Not authenticated |
| `404` | Original post not found |
| `409` | Already forked this post |

---

### POST `/posts/:id/star`

Toggle star on a post. Requires authentication.

**Request:** No body required.

**Response:** `200 OK`
```json
{
  "data": {
    "starred": true,
    "starCount": 32
  }
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `401` | Not authenticated |
| `404` | Post not found |

---

### DELETE `/posts/:id`

Delete a post. Requires authentication. Only the author can delete.

**Response:** `200 OK`
```json
{
  "data": { "message": "Post deleted" }
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `401` | Not authenticated |
| `403` | Not the author |
| `404` | Post not found |

---

### GET `/posts/by-llm/:model`

Get posts filtered by LLM model.

**Path Parameters:**
| Param | Values |
|-------|--------|
| `model` | `claude-sonnet`, `gpt-4o`, `gemini-2.5-pro`, `llama-3`, `api`, `custom` |

**Query Parameters:** Same as global feed (`cursor`, `limit`).

**Response:** Same shape as global feed.

---

## 4. Users

### GET `/users/@:username`

Get a user's profile.

**Response:** `200 OK`
```json
{
  "data": {
    "id": "01912345-6789-7abc-def0-123456789abc",
    "username": "jiyeon_dev",
    "domain": "jiyeon.kim",
    "displayName": "Jiyeon",
    "bio": "Building terminal.social",
    "avatarUrl": null,
    "createdAt": "2026-03-19T12:00:00Z",
    "followerCount": 128,
    "followingCount": 45,
    "postCount": 67,
    "isFollowing": false
  }
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `404` | User not found |

---

### GET `/users/@:username/posts`

Get a user's posts.

**Query Parameters:** Same as global feed (`cursor`, `limit`).

**Response:** Same shape as global feed.

**Errors:**
| Code | Condition |
|------|-----------|
| `404` | User not found |

---

### GET `/users/@:username/starred`

Get posts starred by a user.

**Query Parameters:** Same as global feed (`cursor`, `limit`).

**Response:** Same shape as global feed.

---

### POST `/users/@:username/follow`

Toggle follow on a user. Requires authentication.

**Request:** No body required.

**Response:** `200 OK`
```json
{
  "data": {
    "following": true,
    "followerCount": 129
  }
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `400` | Cannot follow yourself |
| `401` | Not authenticated |
| `404` | User not found |

---

### GET `/api/users/@:username/repos`

Returns the user's pinned GitHub repositories.

**Auth:** No

**Response (200):**
```json
{
  "data": [
    {
      "name": "Forkverse",
      "owner": "ccivlcid",
      "description": "CLI-themed SNS",
      "stars": 42,
      "forks": 12,
      "language": "TypeScript",
      "url": "https://github.com/ccivlcid/Forkverse"
    }
  ]
}
```

---

## 5. LLM

### POST `/llm/transform`

Transform natural language to CLI format. Requires authentication.
Rate limited: 30 requests per minute per user.

**Request:**
```json
{
  "message": "CLI is the new lingua franca. Think in any language, post in any language.",
  "model": "claude-sonnet",
  "lang": "en"
}
```

**Validation (zod):**
```
message:  string, min 1, max 2000
model:    string, min 1 (free-form model identifier)
lang:     string, length 2
```

**Response:** `200 OK`
```json
{
  "data": {
    "messageCli": "post --user=0xmitsuki.sh --lang=en --message=\"CLI flags as universal language layer\" --tags=cli-first --visibility=public",
    "model": "claude-sonnet",
    "tokensUsed": 142,
    "lang": "en",
    "tags": ["cli-first"],
    "intent": "announcement",
    "emotion": "excited"
  }
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `400` | Validation error |
| `401` | Not authenticated |
| `429` | Rate limit exceeded |
| `500` | LLM API error |

---

### POST `/posts/:id/translate`

Translate a post into the specified language using the caller's LLM key. Returns cached result if available (no LLM call). Requires authentication.

**Path Parameter:** `id` — post UUID

**Request:**
```json
{
  "targetLang": "ko"
}
```

**Validation:**
```
targetLang: string, length 2, one of ["en", "ko", "zh", "ja"]
```

**Response:** `200 OK`
```json
{
  "data": {
    "translatedText": "ㅋㅋ 나도 완전 공감",
    "sourceLang": "en",
    "targetLang": "ko",
    "cached": false
  }
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `400` | Validation error or source lang equals target lang |
| `401` | Not authenticated |
| `404` | Post not found |
| `400` | `KEY_NOT_CONFIGURED` — no LLM key saved for user |
| `500` | LLM API error |

---

### GET `/llm/providers`

Returns **local runtimes** (Ollama, etc.) plus **providers the logged-in user has configured** in Settings (`user_llm_keys`). **Auth required.** Server `.env` does **not** supply cloud LLM API keys.

**Response:** `200 OK`
```json
{
  "data": [
    { "provider": "ollama", "source": "localhost:11434", "isAvailable": true },
    { "provider": "anthropic", "source": "user-settings", "isAvailable": true }
  ]
}
```

> Ollama detected via health check at `localhost:11434`. User keys: Settings → LLM keys.

---

### GET `/llm/models/:provider`

Lists model ids for a cloud provider using the **logged-in user’s** key from Settings (`user_llm_keys`). **Auth required.**

| Path param | Allowed values |
|------------|------------------|
| `provider` | `anthropic`, `openai`, `gemini` |

**Response:** `200 OK`
```json
{ "data": ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022"] }
```

| Status | Meaning |
|--------|---------|
| `400` | Unknown `provider`, or no key saved for that provider |
| `502` | Upstream list API failed (`MODELS_LIST_FAILED`) |

---

### POST `/api/llm/keys`

Save or update a user's API key for a provider. Requires authentication.

**Request:**
```json
{
  "provider": "anthropic",
  "apiKey": "sk-ant-api03-...",
  "label": "My personal key",
  "baseUrl": "https://..."
}
```

**Validation:**
```
provider:  enum ["anthropic", "openai", "gemini", "api"]
apiKey:    string, min 1
label:     string, max 100 (optional)
baseUrl:   string, valid URL (optional, only for "api" provider)
```

**Response: `201 Created`**
```json
{
  "data": {
    "provider": "anthropic",
    "label": "My personal key"
  }
}
```

If a key for the same provider already exists, it is updated (upsert).

**Errors:**
| Code | Condition |
|------|-----------|
| `400` | Validation error |
| `401` | Not authenticated |

---

### DELETE `/api/llm/keys/:provider`

Remove a user's saved API key for a provider. Requires authentication.

**Response: `200 OK`**
```json
{
  "data": { "message": "Key removed" }
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `401` | Not authenticated |

---

### GET `/api/llm/providers/list`

Returns the user's saved API keys with labels and base URLs (keys are masked).

**Auth:** Yes

**Response (200):**
```json
{
  "data": [
    { "provider": "anthropic", "label": "My key", "baseUrl": null },
    { "provider": "api", "label": "Custom", "baseUrl": "https://my-server.com/v1" }
  ]
}
```

---

## 6. GitHub

### POST `/api/users/sync-profile`

Re-fetches GitHub public profile data (avatar, bio, repos count) and updates the user record.

**Auth:** Yes

**Response (200):**
```json
{
  "data": { "synced": true }
}
```

---

### POST `/api/users/sync-activity`

Imports GitHub public events as posts. Fetches the last 30 events and creates posts for PushEvent, PullRequestEvent, ReleaseEvent, CreateEvent, WatchEvent, ForkEvent. Already-imported events are skipped via the `github_synced_events` dedup table.

**Auth:** Yes

**Response (200):**
```json
{
  "data": {
    "created": 3,
    "skipped": 27,
    "scanned": 30
  }
}
```

---

### GET `/api/github/stars`

Returns repos the authenticated user has starred on GitHub (last 30, sorted by newest).

**Auth:** Yes (token optional — works without for public data)

**Response (200):**
```json
{
  "data": [
    {
      "starredAt": "2026-03-20T10:00:00Z",
      "repo": {
        "fullName": "vercel/next.js",
        "name": "next.js",
        "owner": "vercel",
        "ownerAvatar": "https://github.com/vercel.png",
        "description": "The React Framework",
        "stars": 128000,
        "forks": 27000,
        "language": "TypeScript",
        "url": "https://github.com/vercel/next.js",
        "topics": ["react", "nextjs", "ssr"],
        "pushedAt": "2026-03-19T18:00:00Z"
      }
    }
  ]
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `404` | User not found |
| `502` | GitHub API error |

---

### GET `/api/github/notifications`

Returns unread GitHub notifications for the authenticated user.

**Auth:** Yes (requires `notifications` scope)

**Response (200):**
```json
{
  "data": [
    {
      "id": "123456789",
      "reason": "assign",
      "unread": true,
      "updatedAt": "2026-03-20T09:00:00Z",
      "title": "Fix: memory leak in event loop",
      "type": "Issue",
      "repoFullName": "owner/repo",
      "repoUrl": "https://github.com/owner/repo",
      "url": "https://github.com/owner/repo/issues"
    }
  ]
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `403` | No GitHub token, or `notifications` scope missing |
| `502` | GitHub API error |

---

### GET `/api/github/issues`

Returns open issues and pull requests assigned to / created by / mentioning the authenticated user.

**Auth:** Yes (requires `repo` scope)

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `filter` | string | `assigned` | `assigned`, `created`, or `mentioned` |

**Response (200):**
```json
{
  "data": [
    {
      "id": 987654321,
      "number": 42,
      "title": "Add dark mode toggle",
      "state": "open",
      "type": "issue",
      "url": "https://github.com/owner/repo/issues/42",
      "repoFullName": "owner/repo",
      "labels": [{ "name": "enhancement", "color": "a2eeef" }],
      "author": "jiyeon_dev",
      "createdAt": "2026-03-15T12:00:00Z",
      "updatedAt": "2026-03-20T08:00:00Z"
    }
  ]
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `403` | No GitHub token, or `repo` scope missing |
| `502` | GitHub API error |

---

### POST `/api/github/notifications/:id/mark-read`

Marks a single GitHub notification thread as read.

**Auth:** Yes

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | string | GitHub notification thread ID |

**Response (200):**
```json
{
  "data": { "ok": true }
}
```

---

### GET `/api/github/following`

Returns the list of GitHub users the authenticated user follows, with Forkverse membership status for each.

**Auth:** Yes (requires `read:user` scope)

**Response (200):**
```json
{
  "data": [
    {
      "githubLogin": "octocat",
      "avatarUrl": "https://github.com/octocat.png",
      "profileUrl": "https://github.com/octocat",
      "forkverseUser": {
        "username": "octocat_dev",
        "displayName": "Octocat"
      },
      "isFollowingOnForkverse": false
    }
  ]
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `403` | No GitHub token, or `read:user` scope missing |
| `502` | GitHub API error |

---

### POST `/api/github/sync-follows`

Bulk-follows all GitHub following users who are registered on Forkverse. Skips users already followed. Returns created and skipped counts.

**Auth:** Yes

**Response (200):**
```json
{
  "data": {
    "followed": 3,
    "skipped": 12,
    "total": 15
  }
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `403` | No GitHub token |
| `502` | GitHub API error |

---

### GET `/api/github/followers`

Returns the list of GitHub users who follow the authenticated user, with Forkverse membership status and mutual-follow status.

**Auth:** Yes (requires `read:user` scope)

**Response (200):**
```json
{
  "data": [
    {
      "githubLogin": "jiyeon-kim",
      "avatarUrl": "https://github.com/jiyeon-kim.png",
      "profileUrl": "https://github.com/jiyeon-kim",
      "forkverseUser": {
        "username": "jiyeon_dev",
        "displayName": "Jiyeon Kim"
      },
      "isFollowingOnForkverse": true,
      "isFollowedBackOnForkverse": false
    }
  ]
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `403` | No GitHub token, or `read:user` scope missing |
| `502` | GitHub API error |

---

### GET `/api/github/reviews`

Returns open pull requests where the authenticated user has been requested as a reviewer (uses `review-requested:@me` GitHub search).

**Auth:** Yes (requires `repo` scope)

**Response (200):**
```json
{
  "data": [
    {
      "id": 1234567890,
      "number": 88,
      "title": "feat: add dark mode",
      "state": "open",
      "url": "https://github.com/owner/repo/pull/88",
      "repoFullName": "owner/repo",
      "author": "contributor",
      "createdAt": "2026-03-19T10:00:00Z",
      "updatedAt": "2026-03-20T08:00:00Z",
      "labels": [{ "name": "enhancement", "color": "a2eeef" }]
    }
  ]
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `403` | No GitHub token, or `repo` scope missing |
| `502` | GitHub API error |

---

### GET `/api/github/contributions/:username`

Returns the GitHub contribution graph data for any user. Uses GitHub GraphQL API. Authenticated users use their own token; unauthenticated requests use the server `GITHUB_TOKEN` fallback.

**Auth:** Optional (uses `GITHUB_TOKEN` env var as fallback)

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `username` | string | GitHub username |

**Response (200):**
```json
{
  "data": {
    "totalContributions": 1247,
    "weeks": [
      {
        "days": [
          { "date": "2025-03-20", "count": 0, "level": 0 },
          { "date": "2025-03-21", "count": 3, "level": 1 },
          { "date": "2025-03-22", "count": 7, "level": 2 }
        ]
      }
    ]
  }
}
```

Level values: `0` = none, `1` = low (1–3), `2` = medium (4–6), `3` = high (7–9), `4` = very high (10+)

**Errors:**
| Code | Condition |
|------|-----------|
| `404` | GitHub user not found |
| `502` | GitHub GraphQL API error |
| `403` | No token available (unauthenticated + no `GITHUB_TOKEN`) |

---

## 7. Webhook

### POST `/api/webhook/github`

Receives GitHub webhook events and auto-creates posts for relevant event types. Validates the `X-Hub-Signature-256` HMAC-SHA256 signature using `GITHUB_WEBHOOK_SECRET`.

**Auth:** No (verified via webhook signature header)

**Headers:**
| Header | Description |
|--------|-------------|
| `X-GitHub-Event` | Event type (`push`, `pull_request`, `release`, `create`) |
| `X-Hub-Signature-256` | HMAC-SHA256 signature of the request body |
| `X-GitHub-Delivery` | Unique delivery UUID |

**Supported events:**
| Event | Description | Post created |
|-------|-------------|--------------|
| `push` | Code pushed to branch | Yes — includes branch name, commit count, repo |
| `pull_request` | PR opened/merged/closed | Yes — includes PR title, action, repo |
| `release` | Release published | Yes — includes tag name, release name |
| `create` | Branch or tag created | Yes — includes ref type and name |

**Response (200):**
```json
{
  "data": { "ok": true, "postId": "01968a3b-..." }
}
```

**Response (204):** Returned for unsupported or ignored event types (no post created).

**Errors:**
| Code | Condition |
|------|-----------|
| `400` | Missing or invalid signature (`X-Hub-Signature-256`) |
| `400` | Malformed payload |
| `500` | Post creation failed |

> Setup: In GitHub repository settings → Webhooks, set the Payload URL to `https://yourdomain/api/webhook/github`, Content type to `application/json`, and Secret to the value of `GITHUB_WEBHOOK_SECRET`.

---

## 8. Notifications

### GET `/api/notifications`

Get user's notifications, paginated by cursor.

**Auth:** Yes

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `cursor` | string | — | Pagination cursor |
| `limit` | number | 20 | Page size (max 50) |

**Response (200):**
```json
{
  "data": [
    {
      "id": "notification-uuid",
      "userId": "user-uuid",
      "type": "star",
      "actorId": "actor-uuid",
      "actor": {
        "username": "octocat",
        "displayName": "Octocat",
        "avatarUrl": "https://...",
        "domain": null
      },
      "postId": "post-uuid",
      "message": "starred your post",
      "read": false,
      "createdAt": "2026-03-20T10:00:00Z"
    }
  ],
  "meta": { "cursor": "...", "hasMore": true }
}
```

---

### GET `/api/notifications/unread-count`

Get the count of unread notifications.

**Auth:** Yes

**Response (200):**
```json
{
  "data": { "count": 5 }
}
```

---

### POST `/api/notifications/:id/read`

Mark a single notification as read.

**Auth:** Yes

**Response (200):**
```json
{
  "data": { "ok": true }
}
```

---

### POST `/api/notifications/read-all`

Mark all notifications as read.

**Auth:** Yes

**Response (200):**
```json
{
  "data": { "ok": true }
}
```

---

## 9. Activity

### GET `/api/activity/feed`

Activity from users you follow + your own, paginated.

**Auth:** Yes

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `cursor` | string | — | Pagination cursor |
| `limit` | number | 20 | Page size (max 50) |

**Response (200):**
```json
{
  "data": [
    {
      "id": "activity-uuid",
      "actorId": "actor-uuid",
      "actor": {
        "username": "octocat",
        "displayName": "Octocat",
        "avatarUrl": "https://...",
        "domain": null
      },
      "eventType": "star_post",
      "targetUserId": null,
      "targetUser": null,
      "targetPostId": "post-uuid",
      "targetPost": { "messageRaw": "...", "messageCli": "..." },
      "metadata": {},
      "createdAt": "2026-03-20T10:00:00Z"
    }
  ],
  "meta": { "cursor": "...", "hasMore": true }
}
```

---

### GET `/api/activity/global`

All activity on the platform, paginated. No authentication required.

**Query Parameters:** Same as `/api/activity/feed`.

**Response:** Same shape as `/api/activity/feed`.

---

### POST `/api/activity/sync-github`

Fetch GitHub events and insert into activity feed.

**Auth:** Yes

**Response (200):**
```json
{
  "data": {
    "created": 3,
    "skipped": 12
  }
}
```

---

## 10. Analyze

### POST `/api/analyze`

Start a repo analysis.

**Auth:** Yes

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| repoOwner | string | Yes | GitHub repo owner |
| repoName | string | Yes | GitHub repo name |
| outputType | string | Yes | `report`, `pptx`, or `video` |
| llmModel | string | Yes | LLM model to use |
| lang | string | No | Output language (default: `en`) |
| options | object | No | Output-specific options |

**Success Response (202):**
```json
{
  "data": {
    "id": "analysis-uuid",
    "status": "processing",
    "progressUrl": "/api/analyze/analysis-uuid/progress"
  }
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| 404 | Repository not found |
| 413 | Repository too large (>500MB) |
| 429 | Analysis rate limit exceeded |

---

### GET `/api/analyze/:id`

Get analysis result.

**Auth:** Yes

**Response (200):**
```json
{
  "data": {
    "id": "analysis-uuid",
    "repoOwner": "vercel",
    "repoName": "next.js",
    "outputType": "report",
    "status": "completed",
    "resultUrl": "/api/analyze/analysis-uuid/download",
    "resultSummary": "Production-grade React framework...",
    "durationMs": 12300,
    "createdAt": "2026-03-20T10:00:00Z"
  }
}
```

---

### GET `/api/analyze`

List user's analyses.

**Auth:** Yes

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| cursor | string | - | Pagination cursor |
| limit | number | 20 | Page size (max 50) |

**Response (200):**
```json
{
  "data": [...],
  "meta": { "cursor": "next-cursor", "hasMore": true }
}
```

---

### GET `/api/analyze/:id/download`

Download the analysis result file. For `pptx` output type: returns a `.pptx` file attachment. For `video` output type: serves the animated HTML inline (`Content-Type: text/html`).

**Auth:** Yes

**Response:**
- PPTX: `200 OK` with `Content-Disposition: attachment; filename="analysis-<id>.pptx"`
- Video: `200 OK` with `Content-Type: text/html` (inline, opens in browser)

**Errors:**
| Code | Condition |
|------|-----------|
| `404` | Analysis not found or not completed |
| `403` | Analysis belongs to another user |

---

### POST `/api/analyze/:id/share`

Create a feed post from a completed analysis. The post includes the analysis summary as `messageRaw`, a generated CLI command as `messageCli`, and the repo attached as a `repo_attachment`.

**Auth:** Yes

**Response (201):**
```json
{
  "data": {
    "postId": "01968a3b-...",
    "post": { /* full Post object */ }
  }
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `404` | Analysis not found |
| `403` | Analysis belongs to another user |
| `400` | Analysis not yet completed |

---

## 11. Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /llm/transform` | 30 requests | 1 minute |
| `POST /api/auth/github/callback` | 10 requests | 1 minute |
| `POST /api/auth/setup` | 5 requests | 1 minute |
| `POST /api/analyze` | 10 requests | 1 hour |
| All other endpoints | 120 requests | 1 minute |

Rate limit headers included in every response:
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 28
X-RateLimit-Reset: 1710849600
```

### Rate Limit Response Format

When rate limits are exceeded, the API returns a `429` response with a structured error body:

```json
// 429 Too Many Requests response:
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Try again in 45 seconds.",
    "retryAfter": 45
  }
}
```

The `Retry-After` HTTP header is also set (in seconds).

### Retry Logic Pattern

Client-side retry strategy for handling rate limits and server errors:

```
Client retry strategy:
1. On 429: read Retry-After header or error.retryAfter field
2. Wait the specified seconds
3. Retry once
4. On second 429: show error toast, do not retry

On 500/network error:
1. Wait 2 seconds
2. Retry once
3. On second failure: show error toast
```

### Error Response Examples

Standard error responses for each HTTP error code:

```json
// 400 Bad Request
{ "error": { "code": "VALIDATION_ERROR", "message": "message: String must contain at least 1 character(s)" } }

// 401 Unauthorized
{ "error": { "code": "UNAUTHORIZED", "message": "Login required" } }

// 403 Forbidden
{ "error": { "code": "FORBIDDEN", "message": "Not the author of this post" } }

// 404 Not Found
{ "error": { "code": "NOT_FOUND", "message": "Post not found" } }

// 409 Conflict
{ "error": { "code": "CONFLICT", "message": "Already starred this post" } }
```

---

## 12. Pagination

All list endpoints use **cursor-based pagination**:

- Pass `cursor` (ISO timestamp of the last item's `createdAt`) to get the next page
- Response includes `meta.cursor` for the next page and `meta.hasMore` boolean
- Default `limit` is 20, maximum is 50
- First request: omit `cursor` to get the latest items

```
GET /api/posts/feed/global
GET /api/posts/feed/global?cursor=2026-03-19T12:29:00Z&limit=20
GET /api/posts/feed/global?cursor=2026-03-19T12:15:00Z&limit=20
```

---

## 13. Endpoint Summary

61 endpoints across 10 groups.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| **Auth (8)** | | | |
| `GET` | `/api/auth/github` | No | Initiate GitHub OAuth |
| `GET` | `/api/auth/github/callback` | No | OAuth callback |
| `POST` | `/api/auth/setup` | Partial | Complete profile setup |
| `GET` | `/api/auth/me/pending` | No | Pending GitHub profile in session |
| `POST` | `/api/auth/logout` | No | Logout |
| `GET` | `/api/auth/me` | Yes | Current user |
| `PUT` | `/api/auth/me` | Yes | Update profile |
| `DELETE` | `/api/auth/me` | Yes | Delete account |
| **Posts (13)** | | | |
| `POST` | `/api/posts` | Yes | Create post (also used for replies via `parentId` and quotes via `quotedPostId`) |
| `GET` | `/api/posts/feed/global` | No | Global feed |
| `GET` | `/api/posts/feed/local` | No | Local feed (following) |
| `GET` | `/api/posts/feed/explore` | No | Trending feed (sorted by stars) |
| `GET` | `/api/posts/trending/tags` | No | Top 20 trending tags (7 days) |
| `GET` | `/api/posts/trending/repos` | No | Top 10 trending repos (7 days) |
| `GET` | `/api/posts/by-llm/:model` | No | Posts by LLM model |
| `GET` | `/api/posts/search` | No | Full-text search (posts, users, tags) |
| `GET` | `/api/posts/:id` | No | Single post + replies |
| `POST` | `/api/posts/:id/star` | Yes | Toggle star |
| `POST` | `/api/posts/:id/fork` | Yes | Fork post |
| `POST` | `/api/posts/:id/translate` | No | Translate post to target language |
| `POST` | `/api/posts/:id/react` | Yes | Add/remove emoji reaction |
| `DELETE` | `/api/posts/:id` | Yes | Delete post (author only) |
| **Users (8)** | | | |
| `GET` | `/api/users/@:username` | No | User profile |
| `GET` | `/api/users/@:username/posts` | No | User posts |
| `GET` | `/api/users/@:username/starred` | No | User starred posts |
| `GET` | `/api/users/@:username/repos` | No | User's GitHub repos |
| `POST` | `/api/users/@:username/follow` | Yes | Toggle follow |
| `GET` | `/api/users/suggested` | Yes | Suggested users to follow |
| `POST` | `/api/users/sync-profile` | Yes | Re-sync GitHub profile data + top languages |
| `POST` | `/api/users/sync-activity` | Yes | Import GitHub events as posts |
| **LLM (6)** | | | |
| `POST` | `/api/llm/transform` | Yes | LLM transformation |
| `GET` | `/api/llm/providers` | Yes | Local runtimes + user's configured providers |
| `GET` | `/api/llm/models/:provider` | Yes | List models for a cloud provider |
| `GET` | `/api/llm/providers/list` | Yes | User's saved API keys with labels |
| `POST` | `/api/llm/keys` | Yes | Save user's LLM API key |
| `DELETE` | `/api/llm/keys/:provider` | Yes | Remove user's LLM API key |
| **GitHub (9)** | | | |
| `GET` | `/api/github/stars` | Yes | User's GitHub starred repos |
| `GET` | `/api/github/notifications` | Yes | User's GitHub notifications |
| `GET` | `/api/github/issues` | Yes | User's open issues & PRs |
| `POST` | `/api/github/notifications/:id/mark-read` | Yes | Mark notification as read |
| `GET` | `/api/github/contributions/:username` | Optional | GitHub contribution graph (heatmap) |
| `GET` | `/api/github/reviews` | Yes | PR review requests |
| `GET` | `/api/github/followers` | Yes | GitHub followers + Forkverse status |
| `GET` | `/api/github/following` | Yes | GitHub following + Forkverse status |
| `POST` | `/api/github/sync-follows` | Yes | Bulk-follow GitHub following on Forkverse |
| **Notifications (4)** | | | |
| `GET` | `/api/notifications` | Yes | User's notifications (paginated) |
| `GET` | `/api/notifications/unread-count` | Yes | Unread notification count |
| `POST` | `/api/notifications/:id/read` | Yes | Mark notification as read |
| `POST` | `/api/notifications/read-all` | Yes | Mark all notifications as read |
| **Activity (3)** | | | |
| `GET` | `/api/activity/feed` | Yes | Activity from followed users + self |
| `GET` | `/api/activity/global` | No | All platform activity |
| `POST` | `/api/activity/sync-github` | Yes | Sync GitHub events to activity feed |
| **Webhook (1)** | | | |
| `POST` | `/api/webhook/github` | Signature | GitHub webhook → auto-create post |
| **Analyze (5)** | | | |
| `POST` | `/api/analyze` | Yes | Start repo analysis |
| `GET` | `/api/analyze` | Yes | List user's analyses |
| `GET` | `/api/analyze/:id` | Yes | Get analysis result |
| `GET` | `/api/analyze/:id/download` | Yes | Download PPTX or view HTML video |
| `POST` | `/api/analyze/:id/share` | Yes | Share analysis result as feed post |
| **Health (1)** | | | |
| `GET` | `/api/health` | No | Server health check |

---

## B-plan: New Analysis Endpoints

> Added 2026-03-21 as part of the B-plan (Repo Analysis Platform) pivot.

### GET `/api/analyze/popular`

Get popular/trending analyses for the Home page. No authentication required.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | `10` | Max items (max 50) |
| `period` | string | `week` | Time period: `day`, `week`, `month`, `all` |

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "repoOwner": "vercel",
      "repoName": "next.js",
      "outputType": "report",
      "llmModel": "claude-sonnet",
      "lang": "en",
      "status": "completed",
      "resultSummary": "Production-grade React framework...",
      "durationMs": 12300,
      "createdAt": "2026-03-20T10:30:00Z",
      "user": { "username": "dev1", "avatarUrl": "..." },
      "starCount": 42,
      "shareCount": 5
    }
  ]
}
```

---

### GET `/api/analysis/:id`

Get full analysis result with structured sections. Public analyses visible to all.

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "repoOwner": "vercel",
    "repoName": "next.js",
    "outputType": "report",
    "llmModel": "claude-sonnet",
    "lang": "en",
    "status": "completed",
    "resultSummary": "Production-grade React framework...",
    "resultSections": {
      "summary": "Executive summary...",
      "techStack": { "primary": "TypeScript", "languages": [...], "frameworks": [...] },
      "architecture": { "type": "monorepo", "patterns": [...] },
      "strengths": ["...", "..."],
      "risks": ["...", "..."],
      "improvements": ["...", "..."],
      "cliView": "$ analyze --repo=vercel/next.js ..."
    },
    "durationMs": 12300,
    "createdAt": "2026-03-20T10:30:00Z",
    "user": { "username": "dev1", "avatarUrl": "..." },
    "starCount": 42,
    "isStarred": false
  }
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `404` | Analysis not found |

---

### POST `/api/analysis/:id/star`

Star/unstar an analysis. Requires authentication.

**Response:** `200 OK`
```json
{
  "data": { "starred": true, "starCount": 43 }
}
```

---

### GET `/api/notifications/register` (planned — Phase B4)

Register a device push notification token.

**Request:**
```json
{
  "token": "fcm-device-token-...",
  "platform": "android"
}
```

---

### B-plan Endpoint Summary

| Method | Endpoint | Auth | Phase | Purpose |
|--------|----------|------|-------|---------|
| `GET` | `/api/analyze/popular` | No | B2 | Popular analyses ranked by stars |
| `GET` | `/api/analyze/detail/:id` | No | B2 | Full analysis result with structured sections |
| `POST` | `/api/analyze/:id/star` | Yes | B2 | Star/unstar an analysis |
| `GET` | `/api/analyze/:id/progress` | No | B5 | SSE stream for real-time analysis progress |
| `POST` | `/api/analyze/compare` | Yes | B6 | Start side-by-side repo comparison |
| `GET` | `/api/analyze/compare/:id` | No | B6 | Get comparison result |
| `GET` | `/api/collections` | Yes | B6 | List user's collections |
| `POST` | `/api/collections` | Yes | B6 | Create a collection |
| `DELETE` | `/api/collections/:id` | Yes | B6 | Delete a collection |
| `GET` | `/api/collections/:id/items` | Mixed | B6 | List analyses in collection (public or owner) |
| `POST` | `/api/collections/:id/items` | Yes | B6 | Add analysis to collection |
| `DELETE` | `/api/collections/:id/items/:analysisId` | Yes | B6 | Remove analysis from collection |
| `POST` | `/api/notifications/push-token` | Yes | B4 | Register device push token |

#### SSE Progress Streaming

```
GET /api/analyze/:id/progress
Content-Type: text/event-stream

data: {"status":"processing","progress":[{"name":"fetching repo metadata","status":"done"},{"name":"analyzing structure","status":"active"},...]}

data: {"status":"completed","progress":[...]}
```

#### Comparison Analysis

```json
// POST /api/analyze/compare
{
  "repoA": "facebook/react",
  "repoB": "vuejs/core",
  "llmModel": "claude-sonnet-4-20250514",
  "lang": "en"
}
// → 201 { data: { id, analysisAId, analysisBId, status: "pending" } }

// GET /api/analyze/compare/:id
// → 200 { data: { id, repoA, repoB, result: {...} | null, status, durationMs } }
```

#### Collections

```json
// POST /api/collections
{ "name": "My best analyses", "description": "...", "isPublic": true }
// → 201 { data: { id, name, description, isPublic, itemCount: 0 } }

// POST /api/collections/:id/items
{ "analysisId": "abc123" }
// → 200 { data: { added: true } }
```

---

## See Also

- [api-schema.json](./api-schema.json) — OpenAPI 3.1 machine-readable schema
- [DATABASE.md](./DATABASE.md) — Database schema backing these endpoints
- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) — Request lifecycle and error flows
- [TESTING.md](../testing/TESTING.md) — API route test patterns
- [PRD.md](./PRD.md) — B-plan product requirements
- [MOBILE.md](./MOBILE.md) — Mobile strategy (push notifications)
