# API.md — REST API Specification

> **Source of truth** for all REST API endpoints, request/response formats, and error handling.
> Base URL: `/api`
> Content-Type: `application/json`
> Authentication: Session-based (express-session)

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

### POST `/auth/register`

Create a new user account.

**Request:**
```json
{
  "username": "jiyeon_dev",
  "password": "securepassword123",
  "displayName": "Jiyeon"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "01912345-6789-7abc-def0-123456789abc",
    "username": "jiyeon_dev",
    "displayName": "Jiyeon",
    "domain": null,
    "bio": null,
    "avatarUrl": null,
    "createdAt": "2026-03-19T12:00:00Z"
  }
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `400` | Invalid input (username too short, password too weak) |
| `409` | Username already taken |

---

### POST `/auth/login`

Authenticate and create a session.

**Request:**
```json
{
  "username": "jiyeon_dev",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "01912345-6789-7abc-def0-123456789abc",
    "username": "jiyeon_dev",
    "displayName": "Jiyeon"
  }
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| `401` | Invalid username or password |

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
messageRaw:  string, min 1, max 2000
messageCli:  string, min 1, max 4000
lang:        string, length 2 (ISO 639-1)
tags:        string[], max 10 items, each max 50 chars
mentions:    string[], max 20 items
visibility:  enum ["public", "private", "unlisted"]
llmModel:    enum ["claude-sonnet", "gpt-4o", "llama-3", "cursor", "cli", "api", "custom"]
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
    "isStarred": false
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
      "isStarred": false
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

### POST `/posts/:id/reply`

Reply to a post. Requires authentication.

**Request:**
```json
{
  "messageRaw": "Totally agree!",
  "messageCli": "reply --to=01912345-aaaa --message=\"Totally agree!\" --lang=en",
  "lang": "en",
  "tags": [],
  "mentions": [],
  "visibility": "public",
  "llmModel": "claude-sonnet"
}
```

**Response:** `201 Created` — Same shape as POST `/posts` response, with `parentId` set.

**Errors:**
| Code | Condition |
|------|-----------|
| `400` | Validation error |
| `401` | Not authenticated |
| `404` | Parent post not found |

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
| `model` | `claude-sonnet`, `gpt-4o`, `llama-3`, `cursor`, `cli`, `api`, `custom` |

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
model:    enum ["claude-sonnet", "gpt-4o", "llama-3", "cursor", "cli", "api", "custom"]
lang:     string, length 2
```

**Response:** `200 OK`
```json
{
  "data": {
    "messageCli": "post --user=0xmitsuki.sh --lang=en --message=\"CLI flags as universal language layer\" --tags=cli-first --visibility=public",
    "model": "claude-sonnet",
    "tokensUsed": 142
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

## 6. Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /llm/transform` | 30 requests | 1 minute |
| `POST /auth/login` | 10 requests | 1 minute |
| `POST /auth/register` | 5 requests | 1 minute |
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

## 7. Pagination

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

## 8. Endpoint Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | No | Register new user |
| `POST` | `/auth/login` | No | Login |
| `POST` | `/auth/logout` | Yes | Logout |
| `GET` | `/auth/me` | Yes | Current user |
| `PUT` | `/auth/me` | Yes | Update profile |
| `DELETE` | `/auth/me` | Yes | Delete account |
| `POST` | `/posts` | Yes | Create post |
| `GET` | `/posts/feed/global` | No | Global feed |
| `GET` | `/posts/feed/local` | Yes | Local feed |
| `GET` | `/posts/:id` | No | Single post |
| `POST` | `/posts/:id/reply` | Yes | Reply to post |
| `POST` | `/posts/:id/fork` | Yes | Fork post |
| `POST` | `/posts/:id/star` | Yes | Toggle star |
| `DELETE` | `/posts/:id` | Yes | Delete post |
| `GET` | `/posts/by-llm/:model` | No | Posts by LLM |
| `GET` | `/users/@:username` | No | User profile |
| `GET` | `/users/@:username/posts` | No | User posts |
| `GET` | `/users/@:username/starred` | No | User starred |
| `POST` | `/users/@:username/follow` | Yes | Toggle follow |
| `POST` | `/llm/transform` | Yes | LLM transformation |

---

## See Also

- [api-schema.json](./api-schema.json) — OpenAPI 3.1 machine-readable schema
- [DATABASE.md](./DATABASE.md) — Database schema backing these endpoints
- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) — Request lifecycle and error flows
- [TESTING.md](../guides/TESTING.md) — API route test patterns
