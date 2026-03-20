<p align="center">
  <img src="docs/design/clitoris.png" alt="CLItoris" width="520" />
</p>

<p align="center">
  <a href="https://terminal.social"><strong>terminal.social</strong></a> &middot;
  <a href="./README_ko.md"><strong>한국어</strong></a> &middot;
  <a href="./docs/PROGRESS.md"><strong>Roadmap</strong></a> &middot;
  <a href="https://discord.gg/clitoris"><strong>Discord</strong></a>
</p>

<br/>

## What is CLItoris?

# The social layer GitHub never built.

GitHub knows what you code. But it doesn't let you **talk about it**.

You push 47 commits. You merge a PR at 3am. You ship a release that fixes everything. And nobody outside your team ever knows — unless they stalk your contribution graph.

**CLItoris turns your GitHub activity into a social feed — and lets you add your voice on top.**

Your pushes, PRs, releases, and stars automatically become posts. Then you add context, thoughts, and commentary in natural language. AI transforms it all into structured CLI commands. Both versions live side by side.

**This is what GitHub is missing. This is our SNS.**

<br/>

<div align="center">
<table>
  <tr>
    <td align="center"><strong>Connects<br/>with</strong></td>
    <td align="center">🐙<br/><sub><strong>GitHub</strong><br/>OAuth · Stars<br/>Issues · PRs<br/>Webhooks</sub></td>
    <td align="center">🟣<br/><sub><strong>Anthropic</strong><br/>Claude Sonnet<br/>Claude Haiku</sub></td>
    <td align="center">🟢<br/><sub><strong>OpenAI</strong><br/>GPT-4o<br/>GPT-4o-mini</sub></td>
    <td align="center">🔵<br/><sub><strong>Google</strong><br/>Gemini 2.5 Pro<br/>Gemini Flash</sub></td>
    <td align="center">🦙<br/><sub><strong>Ollama</strong><br/>Llama · Mistral<br/>Any local model</sub></td>
    <td align="center">🔀<br/><sub><strong>Routers</strong><br/>OpenRouter<br/>Together · Groq<br/>Cerebras</sub></td>
    <td align="center">🤖<br/><sub><strong>AI Agents</strong><br/>OpenClaw · Dify<br/>Coze · Custom</sub></td>
  </tr>
</table>

<em>If it has an API, it's connected. If it runs locally, even better. If it's an agent, chat with it.</em>

</div>

<br/>

---

<br/>

## Your code already tells a story. Now give it a voice.

```
┌─ What GitHub knows ────────────────┐  ┌─ What CLItoris shows ──────────────┐
│                                    │  │                                    │
│  ✓ 3 commits pushed to main       │  │  "Finally cracked the memory leak  │
│  ✓ mass-refactoring.patch          │  │   that's been haunting us for 2    │
│  ✓ 847 additions, 1,203 deletions  │  │   weeks. Turned out the event     │
│                                    │  │   listener was never unsubscribed. │
│  (nobody sees this)                │  │   #debugging #relief"             │
│                                    │  │                                    │
└────────────────────────────────────┘  └────────────────────────────────────┘
```

GitHub shows **what** you did. CLItoris shows **why** it mattered.

<br/>

---

<br/>

## How it works

|        | What happens | Example |
|--------|-------------|---------|
| **01** | Your GitHub activity auto-posts | Push, PR merge, release, star → instant post on CLItoris |
| **02** | You add your voice | Write what you were thinking, what you learned, what broke |
| **03** | AI transforms it | Natural language becomes a structured CLI command with intent, emotion, and tags |
| **04** | Both get posted | Your words + CLI format, side by side in the feed |

```
┌─ Your voice ───────────────────────┐  ┌─ AI-generated CLI ──────────────────┐
│                                    │  │                                     │
│  While vibe-coding, I realized     │  │  post --user=jiyeon.kim \           │
│  we might be adapting to AI,       │  │    --lang=ko \                      │
│  not the other way around.         │  │    --message="observing AI          │
│                                    │  │    language convergence" \           │
│  #vibe-coding #thoughts            │  │    --tags=vibe-coding,thoughts \    │
│                                    │  │    --intent=casual \                │
│                                    │  │    --emotion=surprised              │
└────────────────────────────────────┘  └─────────────────────────────────────┘
```

<br/>

---

<br/>

## CLItoris is right for you if

- ✅ You **code every day** but nobody outside your team sees your work
- ✅ You want your **GitHub activity to have a social layer** — not just a green grid
- ✅ You want to **share the story behind the code**, not just the diff
- ✅ You're curious how **different AI models** interpret the same thought
- ✅ You want a social network where **fork** means fork, **star** means star, and **identity** means GitHub
- ✅ You want to **analyze repos with AI** and share the results
- ✅ You hate touching the mouse — **keyboard-first navigation** (`j`/`k`/`s`/`r`/`?`)
- ✅ You want to run LLMs **locally** with Ollama for full privacy
- ✅ You want to **chat with AI agents** (OpenClaw, Dify, Coze) from one place
- ✅ You want a **mobile-first** terminal social experience

<br/>

## What GitHub doesn't do — CLItoris does

| GitHub | CLItoris |
|--------|----------|
| Shows a green contribution grid. Nobody knows what those squares mean. | Every push, PR, and release becomes a **social post** with your commentary. |
| PRs are for code review. Not for sharing what you learned. | Add **your voice** — what you were thinking, what broke, what you're proud of. |
| Stars are silent. You star a repo and nothing happens socially. | Star a post and the author gets notified. Your stars become part of your social profile. |
| Followers get zero content. Following someone on GitHub gives you... nothing. | Following someone means their **posts, activity, and GitHub events** appear in your feed. |
| No way to discuss repos outside of Issues. | **Attach repos to posts**. Analyze them with AI. Share reports as social content. |
| Your GitHub life is invisible to the world. | Your GitHub life **is** your social life. Contribution graph, repos, activity — all visible on your profile. |

<br/>

---

<br/>

## GitHub activity → Social content

Your coding life automatically becomes social content. No copy-paste, no manual posting.

<div align="center">
<table>
<tr>
<td align="center" width="33%">
<h3>⚡ Auto-Post</h3>
Push to main, merge a PR, publish a release — CLItoris automatically posts it to your feed. Set up a webhook once, forget about it.
</td>
<td align="center" width="33%">
<h3>📥 Activity Import</h3>
Sync your recent GitHub events with one click. Pushes, PRs, releases, stars, forks — all become posts.
</td>
<td align="center" width="33%">
<h3>💬 Add Your Voice</h3>
GitHub shows the diff. You add the story — what you learned, what frustrated you, what made you proud.
</td>
</tr>
</table>
</div>

### Full GitHub integration

<div align="center">
<table>
<tr>
<td align="center"><strong>🌱 Contribution<br/>Graph</strong><br/><sub>Your grass heatmap<br/>on your profile</sub></td>
<td align="center"><strong>👥 Follow<br/>Sync</strong><br/><sub>Auto-follow GitHub<br/>friends on CLItoris</sub></td>
<td align="center"><strong>📊 Activity<br/>Import</strong><br/><sub>Push · PR · Release<br/>→ posts</sub></td>
<td align="center"><strong>🔔 Notifications</strong><br/><sub>GitHub notifications<br/>in-app</sub></td>
</tr>
<tr>
<td align="center"><strong>🪝 Webhook<br/>Auto-Post</strong><br/><sub>Push, merge, release<br/>→ instant post</sub></td>
<td align="center"><strong>⭐ Stars</strong><br/><sub>Browse your<br/>GitHub starred repos</sub></td>
<td align="center"><strong>📋 Issues &<br/>PR Reviews</strong><br/><sub>Track assigned issues<br/>and review requests</sub></td>
<td align="center"><strong>🔑 Identity</strong><br/><sub>GitHub = CLItoris<br/>No separate account</sub></td>
</tr>
</table>
</div>

<br/>

---

<br/>

## More than activity — a full social network

<table>
<tr>
<td align="center" width="33%">
<h3>🖥️ Dual-Format Posts</h3>
Every post shows your original text and its CLI representation side by side. AI extracts intent, emotion, and hashtags automatically.
</td>
<td align="center" width="33%">
<h3>🤖 9+ AI Providers</h3>
Claude, GPT-4o, Gemini, Ollama, OpenRouter, Together, Groq, Cerebras, or any OpenAI-compatible endpoint.
</td>
<td align="center" width="33%">
<h3>💬 AI Agent Chat</h3>
Connect external AI agents (OpenClaw, Dify, Coze) and chat with them directly inside CLItoris. Streaming responses.
</td>
</tr>
<tr>
<td align="center">
<h3>📊 Repo Analysis</h3>
Analyze any GitHub repo with AI. Architecture reports, PPTX decks, animated video walkthroughs.
</td>
<td align="center">
<h3>🔍 GitHub Explore</h3>
Trending repos, search repositories and users — like GitHub search, with terminal aesthetic.
</td>
<td align="center">
<h3>📱 Mobile-First</h3>
Redesigned for touch. Bottom nav, full-screen notifications, agent icon profile tab, backdrop-blur glass UI.
</td>
</tr>
<tr>
<td align="center">
<h3>⌨️ Keyboard-First</h3>
<code>j</code>/<code>k</code> navigate, <code>s</code> star, <code>r</code> reply, <code>/</code> compose. No mouse needed.
</td>
<td align="center">
<h3>🌍 4 Languages</h3>
Full UI in English, Korean, Chinese, Japanese. Write posts in any language — AI handles the rest.
</td>
<td align="center">
<h3>✉️ Direct Messages</h3>
Send private messages to any user. Real-time conversation threads. Mobile-optimized inbox.
</td>
</tr>
</table>

<br/>

## Social, the developer way

| Instead of... | You... | Like... |
|---------------|--------|---------|
| Retweet | **Fork** | Forking a repo |
| Like | **Star** | Starring a repo |
| Quote tweet | **Quote** | Quoting a commit message |
| React | **React** with `lgtm` `ship_it` `fire` `bug` `thinking` `rocket` `eyes` `heart` | Code review reactions |

<br/>

## Repo analysis

Analyze any GitHub repo with AI. Choose your output format.

```bash
$ analyze --repo=vercel/next.js --output=report   # Architecture analysis
$ analyze --repo=owner/name --output=pptx          # 5-slide terminal-themed deck
$ analyze --repo=owner/name --output=video          # Animated HTML walkthrough
```

Share the result as a post. Others discover it in the feed.

<br/>

## Mobile screenshots

<p align="center"><em>Same terminal.social experience — tuned for touch, bottom navigation, and small screens.</em></p>

<table>
<tr>
<td align="center" width="50%">
<p><strong>Profile</strong><br/><sub>Contribution graph, influence score, agent chat, messages, GitHub.</sub></p>
<img src="docs/screens/모바일1.png" width="300" alt="CLItoris mobile: profile with contribution graph and influence" />
</td>
<td align="center" width="50%">
<p><strong>Agent connect</strong><br/><sub><code>$ agent --connect</code> — OpenClaw, Dify, Coze, OpenAI, Anthropic, Ollama, custom.</sub></p>
<img src="docs/screens/모바일2.png" width="300" alt="CLItoris mobile: AI agent provider setup" />
</td>
</tr>
<tr>
<td align="center" width="50%">
<p><strong>Repo analysis</strong><br/><sub><code>$ analyze</code> — pick report, PPTX, or video; model from CLI or Settings.</sub></p>
<img src="docs/screens/모바일3.png" width="300" alt="CLItoris mobile: analyze GitHub repository" />
</td>
<td align="center" width="50%">
<p><strong>Global feed</strong><br/><sub><code>grep</code> search, <code>--global</code> / <code>--local</code>, dual-format posts.</sub></p>
<img src="docs/screens/모바일4.png" width="300" alt="CLItoris mobile: global feed and search" />
</td>
</tr>
<tr>
<td align="center" width="50%">
<p><strong>New post</strong><br/><sub><code>$ post --new</code> — natural language + CLI; optional repo attachment.</sub></p>
<img src="docs/screens/모바일5.png" width="300" alt="CLItoris mobile: new post composer" />
</td>
<td align="center" width="50%">
<p><strong>GitHub explore</strong><br/><sub><code>$ gh search --trending</code> — trending repos, filters, search.</sub></p>
<img src="docs/screens/모바일6.png" width="300" alt="CLItoris mobile: GitHub explore and trending" />
</td>
</tr>
<tr>
<td align="center" width="50%">
<p><strong>Feed &amp; mentions</strong><br/><sub>Reply with <code>@</code> — user autocomplete on the go.</sub></p>
<img src="docs/screens/모바일7.png" width="300" alt="CLItoris mobile: feed with mention autocomplete" />
</td>
<td align="center" width="50%">
<p><strong>User profile</strong><br/><sub>Posts, starred, repos — follow, message, GitHub identity.</sub></p>
<img src="docs/screens/모바일8.png" width="300" alt="CLItoris mobile: user profile and repos tab" />
</td>
</tr>
</table>

<br/>

---

<br/>

## What CLItoris is not

|  |  |
|--|--|
| **Not another Twitter clone.** | No algorithmic feed. No ads. No engagement bait. Your GitHub activity is the content. |
| **Not a code editor.** | CLItoris is a social network, not an IDE. |
| **Not cloud-only.** | Run LLMs locally with Ollama. Your data stays on your machine. |
| **Not English-only.** | Write in Korean, Japanese, Chinese, or any language. AI handles CLI transformation. |
| **Not a closed platform.** | Open source. Self-hosted. Your data, your instance. |

<br/>

---

<br/>

## Quickstart

Open source. Self-hosted. No CLItoris account required.

```bash
git clone https://github.com/ccivlcid/CLItoris.git
cd CLItoris
cp .env.example .env          # Add GitHub OAuth credentials
pnpm install
pnpm dev
```

Open **http://localhost:7878** and connect with GitHub.

> **Requirements:** Node.js 18+, pnpm 8+, [GitHub OAuth App](https://github.com/settings/developers) (callback: `http://localhost:3771/api/auth/github/callback`)

<br/>

## FAQ

**How does GitHub activity become posts?**
Two ways: (1) Set up a GitHub webhook — pushes, PR merges, and releases auto-post instantly. (2) Click "Sync GitHub" to import recent events manually.

**Do I need an AI key?**
Not for GitHub activity posts. For writing your own posts with AI transformation, you can use free local models via [Ollama](https://ollama.ai) — no API key needed.

**What languages can I write in?**
Any language. The AI transforms your text regardless. The UI itself supports English, Korean, Chinese, and Japanese.

**How is this different from Twitter/X?**
Your GitHub activity is the backbone. Identity is GitHub-only. Social actions use Git metaphors (fork, star). Terminal aesthetic. No algorithmic feed, no ads.

**Can I self-host?**
Yes. Clone, configure `.env`, run `pnpm dev`. SQLite database — no external services required except GitHub OAuth.

<br/>

## Development

```bash
pnpm dev              # Full dev (client + server, watch mode)
pnpm build            # Build all packages
pnpm test             # Unit tests (Vitest)
pnpm test:e2e         # E2E tests (Playwright)
pnpm seed             # Load sample data
```

See [CLAUDE.md](./CLAUDE.md) for the full development guide.

<br/>

## Contributing

We welcome contributions. Read the [project guide](./CLAUDE.md) and [conventions](./docs/guides/CONVENTIONS.md) first.

<br/>

## Community

- [Discord](https://discord.gg/clitoris) — Join the community
- [GitHub Issues](https://github.com/ccivlcid/CLItoris/issues) — Bugs and feature requests

<br/>

## License

MIT

<br/>

---

<p align="center">
  <sub>Your code tells a story. Give it a voice.</sub>
</p>

<p align="center">
  <strong>>_CLI</strong>toris &nbsp;&middot;&nbsp; terminal.social
</p>
