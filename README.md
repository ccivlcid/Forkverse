<p align="center">
  <img src="docs/design/forkverse.png" alt="Forkverse" width="520" />
</p>

<p align="center">
  <a href="https://terminal.social"><strong>terminal.social</strong></a> &middot;
  <a href="./README_ko.md"><strong>한국어</strong></a> &middot;
  <a href="./docs/PROGRESS.md"><strong>Roadmap</strong></a> &middot;
  <a href="https://discord.gg/forkverse"><strong>Discord</strong></a>
</p>

<br/>

<p align="center">
  <strong>AI repo analysis. Your agents. Developer social.</strong><br/>
  <sub>terminal.social — the network built for people who read source code.</sub>
</p>

<br/>

---

<br/>

## Philosophy

Most developer tools treat social as an afterthought. Most social networks treat developers as users, not creators.

Forkverse starts from a different premise:

**The most interesting thing a developer can share isn't an opinion. It's a codebase breakdown.**

When you analyze a repo with AI, you generate something genuinely useful — architecture maps, risk assessments, tech stack clarity. That's real signal. That's worth sharing. That's what the feed should be full of.

Everything else follows from this:

- **GitHub is your identity** — not just your login. Your stars, your forks, your contribution history, your follow graph. You don't create a profile on Forkverse. You bring your GitHub and it becomes your profile.
- **Your key, your model** — We don't proxy your AI calls or store your prompts. You bring your own API key for analysis. You choose the model. You can run the whole thing on Ollama and nothing ever leaves your machine.
- **No algorithm** — The feed shows what people posted, in order, with no engagement optimization. The content that surfaces is the content that developers find worth sharing.
- **CLI vocabulary everywhere** — `fork` not retweet. `star` not like. `grep` not search. `$ post --new` not compose. This isn't aesthetic. It's about speaking the right language to the right people.
- **Open by default** — MIT license. Self-hosted on SQLite. No vendor lock-in. Run your own instance.

> *"The terminal is where real work happens. The feed should be too."*

<br/>

---

<br/>

## What Forkverse does

```
$ analyze --repo=vercel/next.js     → AI breakdown: arch, stack, risks, improvements
$ chat --agent=openrouter           → stream responses from any AI agent or model
$ post --new                        → write a post; CLI format auto-generated, no AI key needed
$ feed --global                     → discover what developers are analyzing and sharing
$ explore                           → trending analyses, repos, tags
$ gh --status                       → your GitHub universe in one place
$ msg --inbox                       → direct messages, real-time
$ log --activity                    → your GitHub activity as a social timeline
$ grep                              → full-text search across posts, users, repos, tags
$ rank --board                      → influence leaderboard
```

<br/>

---

<br/>

## `$ analyze` — AI Repo Analysis

The primary feature. Point Forkverse at any public GitHub repo.

```bash
$ analyze --repo=vercel/next.js --output=report --model=claude-sonnet-4-6
```

```
> Fetching repository metadata...          ✓ done
> Scanning file structure...               ✓ done
> Analyzing architecture patterns...       ✓ done
> Extracting tech stack...                 ✓ done
> Generating insights...                   ░░░░░░░░░░  active
```

**Three output types:**

| Output | What you get |
|--------|-------------|
| `--output=report` | Structured markdown: Executive Summary, Tech Stack, Architecture, Strengths, Risks, Improvements |
| `--output=pptx` | 5-slide terminal-themed deck — ready to present to your team |
| `--output=video` | Animated HTML walkthrough — self-contained, no ffmpeg, sharable as a file |

After analysis, review the result, edit your caption, and post it to the feed. Others discover it, discuss it, star it, fork it for their own analysis.

**Repo URL shortcuts:**
```
--repo=vercel/next.js
--repo=https://github.com/vercel/next.js
```

**Custom focus prompt:**
Upload a `.md` file to guide the AI toward what you care about — security, performance, scalability, accessibility. The analysis adapts to your lens.

### 9+ AI providers — your key, your model

<div align="center">
<table>
  <tr>
    <td align="center">🟣<br/><sub><strong>Anthropic</strong><br/>Claude Sonnet 4.6<br/>Claude Haiku 4.5</sub></td>
    <td align="center">🟢<br/><sub><strong>OpenAI</strong><br/>GPT-4o<br/>GPT-4o-mini</sub></td>
    <td align="center">🔵<br/><sub><strong>Google</strong><br/>Gemini 2.5 Pro<br/>Gemini Flash</sub></td>
    <td align="center">🦙<br/><sub><strong>Ollama</strong><br/>Llama · Mistral<br/>Qwen · any local</sub></td>
    <td align="center">🔀<br/><sub><strong>OpenRouter</strong><br/>200+ models<br/>one endpoint</sub></td>
    <td align="center">⚡<br/><sub><strong>Groq</strong><br/>Together AI<br/>Cerebras</sub></td>
    <td align="center">🔌<br/><sub><strong>Custom</strong><br/>Any OpenAI-compatible<br/>endpoint</sub></td>
  </tr>
</table>
</div>

Run with Ollama → zero data leaves your machine. Full analysis, full privacy.

<br/>

---

<br/>

## `$ chat` — Your AI Agents, Unified

You already use multiple AI tools. Forkverse brings them into one terminal-aesthetic interface.

```bash
$ agent --connect
```

**Connect external AI agents:**

| Agent | What it is |
|-------|-----------|
| **OpenClaw** | Claude-based agent with tool use and long-context support |
| **Dify** | Visual workflow agent builder — connect your published apps |
| **Coze** | Bytedance's agent platform with plugin ecosystem |
| **Custom** | Any agent with an HTTP endpoint — your own, your company's |

**Or connect providers directly:**
```bash
$ agent --provider=anthropic  --model=claude-opus-4-6
$ agent --provider=openai     --model=gpt-4o
$ agent --provider=gemini     --model=gemini-2.5-pro
$ agent --provider=ollama     --model=llama3.2
$ agent --provider=openrouter --model=<any>
$ agent --provider=groq       --model=<any>
```

**What you get:**
- Streaming responses — text appears as it generates
- Persistent conversation history per agent
- Switch between agents without losing context
- Mobile-optimized chat interface

You bring the agents. Forkverse gives them a home.

<br/>

---

<br/>

## `$ post --new` — The Composer

Writing a post in Forkverse is different from any other social platform.

```bash
$ post --new
```

**As you type, the CLI format builds itself:**
```
$ post --user=@you --repo=vercel/next.js --tags=nextjs,architecture --lang=en ¶ Analyzed next.js...
```

This is generated live, shown as a preview below your text — so you always see exactly what the post will look like in its CLI representation. No AI key needed. The server auto-generates this format from your plaintext.

**What you can attach:**
- **GitHub repo** — type `owner/repo` or paste a full `github.com/...` URL. The repo appears as a chip; it's included in the CLI format automatically.
- **Images & video** — upload up to 4 files. Paste from clipboard directly. Drag and drop.
- **@mentions** — user autocomplete as you type. Mentioned users get notified.
- **#hashtags** — inline. Tags are extracted and indexed automatically.
- **Language** — `auto`, `en`, `ko`, `zh`, `ja`. Controls how the post is stored and translated.

**How the CLI format works:**
Every post has two representations — your natural language text and the auto-generated CLI format. Both are stored. Both are visible in the feed. The CLI format is generated by the server from your text, extracted tags, mentions, and attached repo. You never write the CLI string yourself.

<br/>

---

<br/>

## `$ feed` — What Developers Are Building

The feed is where analysis results, GitHub activity, and developer thoughts surface.

```bash
$ feed --global     # Everyone's posts
$ feed --local      # People you follow
```

```
┌─ GitHub shows ──────────────────────┐  ┌─ Forkverse shows ───────────────────┐
│  vercel/next.js                     │  │  "Analyzed next.js — RSC impl is   │
│  ★ 127k  🍴 27k  TypeScript         │  │   cleaner than expected. Thin       │
│                                     │  │   abstractions. Worth reading.      │
│  (that's all you get)               │  │   #nextjs #architecture"            │
└─────────────────────────────────────┘  └────────────────────────────────────┘
```

**Dual-format posts** — every post shows both the natural language version and the CLI version. Toggle between them.

**Social actions — all using Git vocabulary:**

| Action | What it does |
|--------|-------------|
| **Star** `s` | Bookmark the post. Author gets notified. Appears in your starred tab. |
| **Fork** | Repost it with your own take. Creates a linked fork post. |
| **Quote** | Quote the post and add your own commentary. |
| **Reply** `r` | Thread-style reply. Nested conversations. |
| **React** | 8 code-review-style reactions: `lgtm` `ship_it` `fire` `bug` `thinking` `rocket` `eyes` `heart` |

**Keyboard shortcuts:**
```
j / k      navigate up/down
s          star focused post
r          reply
o          open post detail
g g        go to global feed
g l        go to local feed
g a        go to analyze
?          show all shortcuts
```

<br/>

---

<br/>

## `$ explore` — Discover

```bash
$ explore
```

- **Trending analyses** — most starred/discussed analysis posts this week
- **Trending repos** — repos most frequently analyzed on Forkverse
- **Trending tags** — hashtags with the most activity
- **Suggested users** — developers to follow based on your interests
- **GitHub trending** — pull GitHub's trending repos directly, analyze any with one click

<br/>

---

<br/>

## `$ gh --status` — GitHub, Deeply Integrated

Forkverse treats GitHub as infrastructure, not just an auth provider.

```bash
$ gh --status
```

**Webhook auto-posting:**
Set up a GitHub webhook once. Every push to main, every merged PR, every release — automatically becomes a Forkverse post. Add hashtags, mention teammates, write context. Your coding life becomes a feed without manual effort.

```
push → main @ vercel/next.js            → post --type=push --repo=vercel/next.js ¶ ...
PR merged: "Add RSC streaming support"  → post --type=pr_merge --pr=12847 ¶ ...
Release: v15.0.0                        → post --type=release --tag=v15.0.0 ¶ ...
```

**Activity import:**
Don't want to set up a webhook? Click "Sync GitHub" to import your recent events — pushes, PRs, releases, stars, forks — all become posts with one click.

**What's inside `$ gh --status`:**

<div align="center">
<table>
<tr>
<td align="center"><strong>🌱 Contribution<br/>Graph</strong><br/><sub>Your full heatmap on your profile.<br/>Hover any day to see what you shipped.</sub></td>
<td align="center"><strong>👥 Follow<br/>Sync</strong><br/><sub>Auto-follow your GitHub network.<br/>People you follow on GitHub, follow here.</sub></td>
<td align="center"><strong>🔔 Notifications</strong><br/><sub>GitHub notifications in-app.<br/>Mark read, jump to thread.</sub></td>
<td align="center"><strong>⭐ Stars</strong><br/><sub>Browse your GitHub starred repos.<br/>Analyze any of them instantly.</sub></td>
</tr>
<tr>
<td align="center"><strong>📋 Issues</strong><br/><sub>Issues assigned to you.<br/>Filtered by repo.</sub></td>
<td align="center"><strong>🔍 PR Reviews</strong><br/><sub>Pull requests waiting for<br/>your review.</sub></td>
<td align="center"><strong>🔍 Repo Search</strong><br/><sub>Search GitHub repositories.<br/>One-click analyze.</sub></td>
<td align="center"><strong>📈 Trending</strong><br/><sub>GitHub trending repos by language.<br/>Analyze what's hot.</sub></td>
</tr>
</table>
</div>

<br/>

---

<br/>

## `$ msg --inbox` — Direct Messages

```bash
$ msg --inbox
$ msg --to=@username
```

- Private 1-on-1 conversations with any user
- Real-time message delivery
- Unread count badge in navigation
- Mobile-optimized inbox and thread view
- Conversation history persisted

<br/>

---

<br/>

## `$ log --activity` — Your Timeline

```bash
$ log --activity
```

Your GitHub activity as a social timeline — not a raw event dump.

- **Day-grouped** — Today / Yesterday / This week / Earlier
- **Smart collapse** — 7 consecutive pushes to the same repo → one line with count
- **Filter tabs** — All / Social (Forkverse posts) / GitHub (raw events)
- **Avatar + color badges** — `push` `pr_merge` `release` `star` `fork` each have distinct visual treatment
- **Expandable** — click any collapsed group to see each individual event

<br/>

---

<br/>

## `$ grep` — Search

```bash
$ grep "next.js architecture"
$ grep --tag=rustlang
$ grep --user=@username
```

Full-text search across:
- Post content (both natural language and CLI format)
- Usernames and display names
- Attached repo names
- Hashtags

Powered by SQLite FTS5 — instant results, no external search service.

<br/>

---

<br/>

## `$ rank --board` — Influence

```bash
$ rank --board
```

**Influence score** is calculated from:
- Posts published
- Stars received on posts
- Forks of your posts
- Followers
- GitHub contribution activity

Leaderboard updates in real-time. Appears on your profile. Not gamified for engagement — reflects genuine developer contribution and sharing.

<br/>

---

<br/>

## User Profile — `/@username`

```bash
$ profile --user=@username
```

Every profile is a GitHub identity:
- **Posts tab** — everything they've shared
- **Starred tab** — posts they've starred (public)
- **Repos tab** — their GitHub repositories with stats
- **API tab** (self only) — manage your LLM provider keys
- **Contribution graph** — full GitHub heatmap
- **Influence score** — visible on profile
- **Follow / Message** — from the profile header
- **GitHub link** — direct link to their GitHub profile

<br/>

---

<br/>

## Settings

- **Profile** — display name, bio, avatar
- **API keys** — add/remove provider keys for Claude, GPT-4o, Gemini, Ollama, OpenRouter, custom endpoints
- **GitHub** — webhook setup guide, sync controls
- **AI Agents** — connect OpenClaw, Dify, Coze, or custom agent endpoints
- **Language** — UI language: en / ko / zh / ja

<br/>

---

<br/>

## The full feature list

| Command | Feature | Notes |
|---------|---------|-------|
| `$ analyze` | AI repo analysis | report / pptx / video output |
| | 9+ LLM providers | Claude, GPT-4o, Gemini, Ollama, OpenRouter, Groq, Together, Cerebras, custom |
| | Custom focus prompt | Upload .md to guide analysis direction |
| | Share review step | Edit caption before posting to feed |
| `$ chat` | AI agent chat | OpenClaw, Dify, Coze, custom HTTP agents |
| | Direct provider chat | Claude, GPT-4o, Gemini, Ollama, OpenRouter, Groq |
| | Streaming responses | SSE streaming, real-time text output |
| `$ post --new` | Post composer | Natural language + auto CLI format |
| | CLI live preview | See `post --user=@x ¶ ...` build as you type |
| | GitHub repo attach | `owner/repo` or full GitHub URL |
| | Media upload | Images + video, up to 4 files, paste from clipboard |
| | @mention autocomplete | Type `@` → user search dropdown |
| | #hashtag indexing | Auto-extracted, auto-indexed |
| | Language selection | auto / en / ko / zh / ja |
| `$ feed` | Global feed | All users' posts |
| | Local feed | Following only |
| | Dual-format posts | Natural language + CLI representation, toggle |
| | Star `s` | Bookmark, notifies author |
| | Fork | Repost with your own take |
| | Quote | Quote post + commentary |
| | Reply `r` | Threaded replies |
| | React | 8 reactions: lgtm ship_it fire bug thinking rocket eyes heart |
| | Keyboard nav | j/k navigate, s star, r reply, o open, g-chord routing, ? help |
| `$ explore` | Trending analyses | Most starred analysis posts |
| | Trending repos | Most analyzed repos |
| | Trending tags | Most active hashtags |
| | GitHub trending | Pull GitHub trending, one-click analyze |
| | Suggested users | Recommended follows |
| `$ gh --status` | Webhook auto-post | push / PR merge / release → instant post |
| | Activity import | One-click sync of recent GitHub events |
| | Contribution graph | Full heatmap on profile |
| | Follow sync | Auto-follow GitHub network |
| | Notifications | GitHub notifications in-app |
| | Stars browser | Browse starred repos, analyze any |
| | Issues | Assigned issues list |
| | PR reviews | Pending review requests |
| | Repo search | GitHub search + trending |
| `$ msg --inbox` | Direct messages | Real-time, private, threaded |
| `$ log --activity` | Activity feed | Day-grouped, smart collapse, all/social/github filter |
| `$ grep` | Full-text search | Posts, users, repos, tags — SQLite FTS5 |
| `$ rank --board` | Influence score + leaderboard | Posts + stars + forks + followers |
| `/@username` | User profile | Posts / Starred / Repos / API tabs |
| | Contribution graph | Full GitHub heatmap |
| `/settings` | API key management | Per-provider key storage |
| | Agent management | Connect external agents |
| | Webhook setup | GitHub webhook guide |
| General | GitHub OAuth identity | No separate account |
| | 4 UI languages | en / ko / zh / ja |
| | Mobile bottom nav | PWA-ready, App Store coming |
| | Desktop sidebar nav | Keyboard-first |
| | Dark terminal aesthetic | JetBrains Mono, #0d1117 base |
| | Self-hosted | SQLite, no external DB required |
| | Open source | MIT license |

<br/>

---

<br/>

## Demo

<video src="docs/screens/녹음 2026-03-21 132654.mp4" controls width="100%"></video>

> Can't see the video? [Download / View on GitHub](docs/screens/녹음%202026-03-21%20132654.mp4)

<br/>

---

<br/>

## Mobile screenshots

<p align="center"><em>Same terminal.social experience — tuned for touch, bottom navigation, and small screens.</em></p>

<table>
<tr>
<td align="center" width="50%">
<p><strong>Profile</strong><br/><sub>Contribution graph, influence score, agent chat, messages, GitHub.</sub></p>
<img src="docs/screens/모바일1.png" width="300" alt="Forkverse mobile: profile" />
</td>
<td align="center" width="50%">
<p><strong>Agent connect</strong><br/><sub><code>$ agent --connect</code> — OpenClaw, Dify, Coze, OpenAI, Anthropic, Ollama, custom.</sub></p>
<img src="docs/screens/모바일2.png" width="300" alt="Forkverse mobile: agent setup" />
</td>
</tr>
<tr>
<td align="center" width="50%">
<p><strong>Repo analysis</strong><br/><sub><code>$ analyze</code> — report, PPTX, or video. Review before posting.</sub></p>
<img src="docs/screens/모바일3.png" width="300" alt="Forkverse mobile: analyze" />
</td>
<td align="center" width="50%">
<p><strong>Global feed</strong><br/><sub><code>grep</code> search, dual-format posts, star, fork, react.</sub></p>
<img src="docs/screens/모바일4.png" width="300" alt="Forkverse mobile: feed" />
</td>
</tr>
<tr>
<td align="center" width="50%">
<p><strong>Post composer</strong><br/><sub><code>$ post --new</code> — write, attach repo, CLI preview auto-builds. No AI key needed.</sub></p>
<img src="docs/screens/모바일5.png" width="300" alt="Forkverse mobile: composer" />
</td>
<td align="center" width="50%">
<p><strong>GitHub explore</strong><br/><sub>Trending repos, one-click analyze, stars, notifications.</sub></p>
<img src="docs/screens/모바일6.png" width="300" alt="Forkverse mobile: GitHub" />
</td>
</tr>
<tr>
<td align="center" width="50%">
<p><strong>Feed &amp; mentions</strong><br/><sub><code>@</code> autocomplete, reply threads, reactions.</sub></p>
<img src="docs/screens/모바일7.png" width="300" alt="Forkverse mobile: feed mentions" />
</td>
<td align="center" width="50%">
<p><strong>User profile</strong><br/><sub>Posts, starred, repos — follow, message, GitHub identity.</sub></p>
<img src="docs/screens/모바일8.png" width="300" alt="Forkverse mobile: profile" />
</td>
</tr>
</table>

<br/>

---

<br/>

## Who Forkverse is for

- ✅ You want to **understand any repo in minutes**, not hours
- ✅ You want to **share AI-generated analysis** with developers who care
- ✅ You use multiple AI tools and want them **in one place**
- ✅ You want to run **analysis locally with Ollama** — zero data leaves your machine
- ✅ You code every day and want your **GitHub activity to have a social layer** — automatically
- ✅ You want a network where **fork means fork**, **star means star**, and identity is GitHub
- ✅ You hate the mouse — **keyboard-first** navigation everywhere
- ✅ You want an **open source platform** you can self-host and own

## What Forkverse is not

| | |
|--|--|
| **Not another Twitter clone** | No algorithmic feed. No ads. No engagement bait. Repo analysis and GitHub activity are the content. |
| **Not a code editor** | Social network, not an IDE. |
| **Not cloud-locked** | Ollama for local LLMs. Self-host the whole platform. SQLite — no managed DB required. |
| **Not English-only** | Write in any language. UI in en / ko / zh / ja. |
| **Not a walled garden** | MIT license. Open source. Fork it, run your own instance. |

<br/>

---

<br/>

## Quickstart

```bash
git clone https://github.com/ccivlcid/Forkverse.git
cd Forkverse
cp .env.example .env     # Add GitHub OAuth credentials
pnpm install
pnpm dev
```

Open **http://localhost:7878** → connect with GitHub.

> **Requirements:** Node.js 18+, pnpm 8+, [GitHub OAuth App](https://github.com/settings/developers)
> Callback URL: `http://localhost:3771/api/auth/github/callback`

<br/>

## FAQ

**Do I need an AI key?**
For **writing posts** — no. CLI format is generated server-side. For **repo analysis** — yes, add your key in `/@username?tab=api` (Claude, GPT-4o, Gemini, or Ollama locally). For **agent chat** — connect your provider key or an external agent endpoint.

**How does GitHub activity become posts?**
(1) Set up a GitHub webhook — pushes, PR merges, releases auto-post. (2) Click "Sync GitHub" to import recent events manually. Both methods produce real posts you can edit.

**What AI agents can I connect?**
OpenClaw, Dify, Coze, or any HTTP API. Also: Claude, GPT-4o, Gemini, Ollama directly. Run multiple simultaneously and switch between them in chat.

**Can I analyze private repos?**
Public repos only in the current version. Private repo analysis (with expanded OAuth scope) is planned for a future release.

**Can I self-host?**
Yes. Clone, configure `.env`, `pnpm dev`. SQLite — no external services required beyond GitHub OAuth. See [CLAUDE.md](./CLAUDE.md) for the full dev guide.

<br/>

## Development

```bash
pnpm dev        # Client + server (watch mode)
pnpm build      # Build all packages
pnpm test       # Vitest unit tests
pnpm test:e2e   # Playwright E2E
pnpm seed       # Load sample data
```

## Contributing

Read [CLAUDE.md](./CLAUDE.md) and [CONVENTIONS.md](./docs/guides/CONVENTIONS.md) first.

## Community

- [Discord](https://discord.gg/forkverse) — Community
- [GitHub Issues](https://github.com/ccivlcid/Forkverse/issues) — Bugs and feature requests

## License

MIT

<br/>

---

<p align="center">
  <sub>Understand any repo. Bring your agents. Share what you find.</sub>
</p>

<p align="center">
  <strong>⑂Fork</strong>verse &nbsp;&middot;&nbsp; terminal.social
</p>
