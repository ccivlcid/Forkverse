# Search — `/search`

> Page specification for the search screen.

## Overview

| Property | Value |
|----------|-------|
| Route | `/search` |
| Page | `SearchPage` |
| Auth | Not required |
| Layout | `AppShell` |
| Store | `searchStore` |

## Features

- **Live search** with 300ms debounce (race-condition safe)
- **Three result types**: Posts (full-text via FTS5), Users (username/display name match), Tags (tag string match)
- **Keyboard shortcut**: `/` focuses the search input from anywhere
- **Empty state**: Shows prompt to start typing
- **Results display**: Posts as PostCard components, Users as profile rows, Tags as clickable badges

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/posts/search?q=...` | Full-text search across posts, users, tags |

## Components Used

- `AppShell` (layout)
- `PostCard` (post results)
- Inline user/tag result components

## Search Implementation

- Backend: SQLite FTS5 virtual table `posts_fts` on `message_raw` and `tags`
- Query sanitization: Special FTS5 characters escaped, terms wrapped in quotes
- User search: `LIKE` query on `username` and `display_name`
- Tag search: Aggregate `json_each(tags)` grouping
