# CLItoris

> A terminal-themed social network where every post is both human-readable and machine-parseable.

```
┌─ Natural Language ──────────┐  ┌─ CLI — open source ─────────┐
│                              │  │                              │
│ CLI is the new lingua        │  │ post --user=0xmitsuki.sh \  │
│ franca. Think in any         │  │   --lang=en \               │
│ language, post in any        │  │   --message="CLI flags as   │
│ language — the flags stay    │  │   universal language layer"\ │
│ the same.                    │  │   --tags=cli-first \        │
│ #cli-first                   │  │   --visibility=public       │
│                              │  │                              │
│  ↩ reply 9  ◇ fork 3  ★ 31 │  │                              │
└──────────────────────────────┘  └──────────────────────────────┘
```

## What is this?

Write what you want to say. An LLM translates it into a CLI command. Both get posted side by side.

- **Dual-format posts** — Natural language + CLI command, always together
- **Fork, don't repost** — Clone posts like repos, with attribution
- **LLM as translator** — Choose your model: Claude, GPT, or Llama
- **Terminal aesthetic** — Dark, dense, monospace, content-first
- **Everything is open source** — Posts are structured, forkable data

## Tech Stack

| Area | Technology |
|------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| State | Zustand |
| Backend | Node.js + Express + tsx |
| Database | SQLite (better-sqlite3) |
| LLM | Anthropic SDK, OpenAI SDK, Ollama |
| Testing | Vitest + Playwright |
| Monorepo | pnpm workspaces |

## Project Structure

```
packages/
├── client/    # @clitoris/client — React frontend
├── server/    # @clitoris/server — Express API server
├── shared/    # @clitoris/shared — Shared types & constants
└── llm/       # @clitoris/llm — LLM provider integration
```

## Development

```bash
pnpm install          # Install dependencies
pnpm dev              # Run all dev servers
pnpm dev:client       # Frontend only
pnpm dev:server       # Backend only
pnpm test             # Run unit tests
pnpm test:e2e         # Run E2E tests
pnpm lint             # Lint
pnpm format           # Format
```

## Documentation

All docs live under `docs/` organized by category.

| Folder | Document | Description |
|--------|----------|-------------|
| root | [CLAUDE.md](./CLAUDE.md) | AI assistant guide |
| `docs/` | [Overview](./docs/OVERVIEW.md) | Project overview |
| `docs/` | [Progress](./docs/PROGRESS.md) | Development status |
| `docs/guides/` | [Conventions](./docs/guides/CONVENTIONS.md) | Strict coding rules |
| `docs/guides/` | [Design Guide](./docs/guides/DESIGN_GUIDE.md) | Visual system |
| `docs/guides/` | [Prompts](./docs/guides/PROMPTS.md) | Vibe coding templates |
| `docs/guides/` | [Testing](./docs/guides/TESTING.md) | Testing patterns |
| `docs/guides/` | [Env](./docs/guides/ENV.md) | Environment variables |
| `docs/screens/` | 8 screen specs | Page-by-page UI wireframes |
| `docs/specs/` | [PRD](./docs/specs/PRD.md) | Product requirements |
| `docs/specs/` | [Database](./docs/specs/DATABASE.md) | DB schema & queries |
| `docs/specs/` | [API](./docs/specs/API.md) | REST API docs (18 endpoints) |
| `docs/specs/` | [api-schema.json](./docs/specs/api-schema.json) | OpenAPI 3.1 schema |
| `docs/architecture/` | [Architecture](./docs/architecture/ARCHITECTURE.md) | System architecture |
| `docs/architecture/` | [architecture.json](./docs/architecture/architecture.json) | System config (JSON) |
| `docs/architecture/` | [ERD](./docs/architecture/schema-erd.md) | Database ERD |
| `docs/architecture/` | Mermaid diagrams | backend-deps, frontend-imports, org-chart |

## Status

**Phase 0 — Documentation & Setup** (in progress)

See [docs/PROGRESS.md](./docs/PROGRESS.md) for full status.

## License

TBD
