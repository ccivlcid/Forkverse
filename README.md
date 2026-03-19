# CLItoris

**The social network that speaks your language — and CLI.**

> Write what you want to say. An AI translates it into a CLI command. Both get posted side by side.

```
┌─ What you write ────────────────┐  ┌─ What the AI creates ──────────┐
│                                  │  │                                │
│  CLI is the new lingua franca.   │  │  post --user=0xmitsuki.sh \   │
│  Think in any language, post in  │  │    --lang=en \                │
│  any language — the flags stay   │  │    --message="CLI flags as    │
│  the same.                       │  │    universal language layer" \ │
│  #cli-first                      │  │    --tags=cli-first \         │
│                                  │  │    --visibility=public        │
│   ↩ reply 9  ◇ fork 3  ★ 31    │  │                                │
└──────────────────────────────────┘  └────────────────────────────────┘
```

---

## How It Works

```
1.  Write anything in natural language         "AI is changing how we code"
2.  Pick an AI model                           [claude-sonnet ▾]
3.  Press Cmd+Enter                            ⏎
4.  AI transforms it into CLI format           post --message="AI is changing..."
5.  Both versions posted side by side           ✅ Published as dual-format
```

That's it. Every post lives in two worlds: **human-readable** and **machine-parseable**.

---

## Features

### Dual-Format Posts
Every post shows your original text alongside its CLI representation. Think of it as subtitles for code.

### Fork, Don't Repost
See something interesting? **Fork it** — like forking a repo. Your version links back to the original, and you can remix the content.

### Choose Your AI
Pick which AI model translates your posts:
- **Claude** (Anthropic) — default
- **GPT-4o** (OpenAI)
- **Llama 3** (local via Ollama)
- **Custom** — bring your own model

### Browse by AI
Curious how different AIs interpret the same ideas? Filter the feed by model and compare.

### Terminal Aesthetic
Dark backgrounds. Monospace fonts. Green text on black. No gradients, no rounded corners, no fluff. Just content.

```
┌────────────┬─────────────────────────────────────────┐
│ // navigate │  $ feed --global --dual-format          │
│ $ feed      │                                         │
│   following │  @jiyeon_dev · jiyeon.kim · 3m ago  ko  │
│   explore   │  ┌──────────────┐ ┌──────────────────┐ │
│             │  │ Natural text │ │ post --user=...  │ │
│ // by LLM   │  └──────────────┘ └──────────────────┘ │
│ ● claude    │  ↩ reply 14  ◇ fork 7  ★ star 42      │
│ ○ gpt-4o    │                                         │
│ ○ llama-3   │  @0xmitsuki · mitsuki.sh · 11m ago en  │
│ ○ custom    │  ┌──────────────┐ ┌──────────────────┐ │
│             │  │ CLI is the   │ │ post --user=...  │ │
│ // me       │  │ new lingua.. │ │   --lang=en ...  │ │
│ @you        │  └──────────────┘ └──────────────────┘ │
│ my posts    │  ↩ reply 9  ◇ fork 3  ★ star 31       │
│ starred     │                                         │
└─────────────┴─────────────────────────────────────────┘
```

### Multilingual
Write in any language. The AI handles the translation to CLI format. Every post shows its language tag (`--lang=ko`, `--lang=en`, `--lang=hi`).

### Keyboard-First
Navigate with `j`/`k`, star with `s`, reply with `r`, fork with `f`, compose with `/`. Terminal users feel at home.

---

## Quick Start

```bash
git clone https://github.com/ccivlcid/CLItoris.git
cd CLItoris
cp .env.example .env            # Add your API keys
pnpm install                    # Install dependencies
pnpm dev                        # Start dev servers
```

Open `http://localhost:5173` and start posting.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| State | Zustand |
| Backend | Node.js + Express + tsx |
| Database | SQLite (better-sqlite3) |
| AI Models | Anthropic SDK, OpenAI SDK, Ollama |
| Testing | Vitest + Playwright |
| Monorepo | pnpm workspaces |

---

## Project Structure

```
packages/
├── client/    # React frontend (Vite + Tailwind)
├── server/    # Express API server
├── shared/    # Shared TypeScript types & constants
└── llm/       # AI model integrations
```

---

## Contributing

This project is built with **vibe coding** — AI-driven development with strict conventions.

Before contributing, read:
1. [CLAUDE.md](./CLAUDE.md) — Project guide for AI assistants
2. [Conventions](./docs/guides/CONVENTIONS.md) — Strict coding rules
3. [Design Guide](./docs/guides/DESIGN_GUIDE.md) — Visual system

Full documentation lives in [`docs/`](./docs/) organized by category:
- `docs/guides/` — Coding conventions, design system, testing, prompts
- `docs/screens/` — Page-by-page UI specifications (8 screens)
- `docs/specs/` — PRD, database schema, API documentation
- `docs/architecture/` — System diagrams and Mermaid flowcharts

---

## Status

**Phase 0 — Documentation & Setup** (in progress)

See [PROGRESS.md](./docs/PROGRESS.md) for the full roadmap.

---

## License

TBD
