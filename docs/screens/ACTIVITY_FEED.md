# Activity Feed — `/activity`

> Page specification for the activity feed screen.

## Overview

| Property | Value |
|----------|-------|
| Route | `/activity` |
| Page | `ActivityFeedPage` |
| Auth | Required |
| Layout | `AppShell` |
| Store | `activityStore` |

## Features

- **Two tabs**: Feed (following + own) / Global (all platform activity)
- **GitHub Sync button**: Triggers `POST /api/activity/sync-github` to import GitHub events
- **Activity event types**: follow, star_post, fork_post, reply, github_push, github_pr_merge, github_pr_open, github_release, github_star, github_fork, github_create
- **Cursor-based pagination** with infinite scroll
- **Terminal aesthetic**: Event descriptions formatted as CLI-style entries

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/activity/feed` | Following + own activity |
| `GET` | `/api/activity/global` | All platform activity |
| `POST` | `/api/activity/sync-github` | Sync GitHub events to activity feed |

## Components Used

- `AppShell` (layout)
- `FeedList` pattern (infinite scroll)
- Activity event cards (inline rendering per event type)
