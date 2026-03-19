# OVERVIEW.md — Project Overview

## What is CLItoris?

CLItoris is a **terminal-themed social network** where every post exists in two formats simultaneously: natural language and CLI commands.

Users write what they want to say in plain language. An LLM transforms it into a CLI command. Both versions are displayed side by side — the human-readable text and the machine-readable command.

All social interactions — posting, replying, forking, starring, following — are expressed as CLI operations.

**Domain**: `terminal.social`

---

## The Core Idea

```
"Just write what you want to say. The LLM translates to CLI, and both get posted."
```

### Dual-Format Example

```
┌─ Natural Language ──────────┐  ┌─ CLI — open source ─────────┐
│                              │  │                              │
│ CLI is the new lingua        │  │ post --user=0xmitsuki.sh \  │
│ franca. Think in any         │  │   --lang=en \               │
│ language, post in any        │  │   --message="CLI flags as   │
│ language — the flags stay    │  │   universal language layer"\ │
│ the same. @jiyeon_dev        │  │   --mention=jiyeon.kim \    │
│ you're onto something.       │  │   --tags=cli-first \        │
│ #cli-first                   │  │   --visibility=public       │
│                              │  │                              │
│  ↩ reply 9  ◇ fork 3  ★ 31 │  │                              │
└──────────────────────────────┘  └──────────────────────────────┘
```

---

## Why CLItoris Exists

| Problem | CLItoris Solution |
|---------|-------------------|
| Social media is visually noisy | Terminal aesthetic: clean, dense, content-first |
| Posts are ephemeral and unstructured | Every post is a structured CLI command — parseable, forkable |
| No interoperability between platforms | CLI format is universal — pipe it, script it, fork it |
| AI-generated content has no identity | Posts labeled by which LLM model generated them |
| Content is owned by platforms | Every post is open source and forkable by design |

---

## Key Concepts

### Dual-Format Posts
Every post has two representations:
- **Natural language**: What the user wrote (readable)
- **CLI command**: LLM-generated structured representation (parseable)

### Fork, Don't Repost
Instead of reposting, users **fork** posts — like forking a repo. The original is linked, and the forker can modify the content.

### LLM as Translator
The LLM doesn't generate content — it **translates** user intent into CLI syntax. Users choose which model does the translation (Claude, GPT, Llama).

### "by LLM" Feed
Browse posts filtered by which LLM transformed them. See how Claude, GPT, and Llama each interpret the same kind of human expression.

### Everything is a Command
```
post    → create a post
reply   → respond to a post
fork    → clone a post to your timeline
star    → bookmark/like a post
follow  → subscribe to a user
```

---

## Target Users

1. **Developers** — Who live in terminals and appreciate the aesthetic
2. **AI/LLM enthusiasts** — Who want to see how different models interpret text
3. **Open source community** — Who understand fork/star/clone from GitHub

---

## Visual Identity

- Dark background (`#1a1a2e`) — always dark, no light mode
- Monospace font (JetBrains Mono) — everything feels like a terminal
- Green text (`#4ade80`) for CLI keywords
- Amber text (`#fbbf24`) for usernames
- Cyan text (`#22d3ee`) for hashtags
- Unicode symbols only — no icon libraries
- Flat surfaces, thin borders, zero shadows

---

## How It Works (User Flow)

```
1. User opens terminal.social
2. Sees global feed with dual-format posts
3. Clicks composer bar
4. Writes in natural language (any language)
5. Selects LLM model (claude-sonnet default)
6. Presses Cmd+Enter
7. LLM transforms text → CLI command
8. Preview shown → User confirms
9. Post appears in feed as dual-format card
10. Others can reply, fork, or star the post
```

---

## Tech Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| State | Zustand |
| Backend | Node.js + Express + tsx |
| Database | SQLite (better-sqlite3) |
| LLM | Anthropic SDK, OpenAI SDK, Ollama |
| Testing | Vitest + Playwright |
| Package manager | pnpm (monorepo with workspaces) |

See `docs/architecture/ARCHITECTURE.md` for system diagrams and data flows.
See `docs/specs/DATABASE.md` for schema and query reference.
See `docs/guides/DESIGN_GUIDE.md` for visual specifications.
