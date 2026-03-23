# Forkverse — Marketing Strategy

> Marketing playbook for terminal.social — a developer-first Repo Analysis Platform.
> Updated: 2026-03-21

---

## 1. Positioning

### One-Line Pitch
**"Analyze any GitHub repo with AI. Share the results with developers who care."**

### Elevator Pitch (30 seconds)
Forkverse is a repo analysis platform for developers. Point it at any public GitHub repo — AI generates a structured breakdown of the architecture, stack, strengths, and risks. You get a report, a PPTX deck, or an animated video. Then share it. Other developers discover it, star it, fork it, discuss it. GitHub identity. Terminal aesthetic. No algorithmic noise.

### Category
Developer Tool + Social Platform. "Perplexity for repos" meets "dev-native social layer."

### Tagline Options
| Tagline | Tone |
|---------|------|
| "Understand any repo. Share what you find." | Clean, functional |
| "AI reads the code. You share the story." | Creative |
| "Every repo has a story. AI tells it." | Narrative |
| "grep the codebase. Share the signal." | Developer-native |
| ">_ analyze any repo. distribute the insight." | Brand-voice |

**Primary tagline**: `Understand any repo. Share what you find.`

---

## 2. Target Audience

### Primary ICP (Ideal Customer Profile)
- **Who**: Software engineers, tech leads, open source contributors
- **Where**: GitHub daily users, HN readers, active on Twitter/X dev circles
- **Pain**: Reading unfamiliar codebases is slow. No structured tool exists for "quickly understand this repo and share it"
- **Behavior**: Stars repos without deeply reading them. Wants to appear informed in code discussions
- **Tools they use**: VS Code, GitHub, Cursor, Linear, Vercel, Notion

### Secondary ICP
| Persona | Need |
|---------|------|
| AI/Dev Tool Enthusiast | Test new AI capabilities, compare LLM outputs |
| Tech Content Creator | Generate presentation-ready analysis for talks/blogs |
| Tech Lead / Architect | Evaluate new libraries, assess acquisition targets |
| PM / Recruiter / Investor | Get a non-code-reading summary of a codebase |
| Open Source Maintainer | Get AI-generated summaries of their own repos to share |

### Anti-targets (NOT our audience)
- Non-technical users — the terminal aesthetic self-selects
- Enterprise teams wanting private repo scanning (future B6, not MVP)
- People looking for a Twitter clone — the feed is secondary, not the point

---

## 3. Core Marketing Messages

### Problem → Solution → Proof

| Problem | Solution | Proof |
|---------|----------|-------|
| Reading a new repo takes hours | AI analyzes it in seconds | Demo: vercel/next.js analyzed in 12s |
| GitHub star counts tell you nothing | Structured breakdown: stack, arch, risks, improvements | Screenshot: 6-section analysis result |
| No way to share what you learned from code | Social feed where analysis = content | Screenshot: shared post with analysis card |
| You need a deck for the team | PPTX output, terminal-themed, 5 slides | GIF: one-click deck download |

### Key Differentiators (vs. competitors)
| vs. | Forkverse wins because |
|-----|-----------------------|
| GitHub itself | GitHub shows stats. Forkverse explains the code. |
| ChatGPT / Claude direct | Forkverse is a product, not a prompt. Structured output, shareable, social. |
| SourceGraph / Sourcegraph Cody | Code navigation tool. Forkverse generates shareable summaries for non-deep-divers. |
| Daily.dev / dev.to | They curate links. Forkverse generates original AI-based insight from the source. |
| Linear/Notion for devs | Project management. Forkverse is a repo intelligence layer. |

---

## 4. Brand Voice

- **Tone**: Terse. Technical. Confident. No fluff.
- **Language**: Use CLI syntax in copy (`$ analyze --repo=...`). Speak like a developer.
- **Avoid**: "Revolutionary", "game-changing", "leverage", "synergy", marketing-speak
- **Use**: "analyze", "fork", "star", "grep", "output", "commit" — Git/CLI vocabulary as metaphor
- **Personality**: The senior engineer who writes clean commit messages. Direct, useful, no noise.

### Examples
```
Bad:  "Unlock the power of AI to transform your GitHub experience."
Good: "Point it at any repo. Get the breakdown."

Bad:  "Our cutting-edge platform leverages AI to provide insights."
Good: "$ analyze --repo=vercel/next.js → stack, architecture, risks. Shareable in 30s."
```

---

## 5. Launch Strategy

### Phase 1 — Pre-launch (4 weeks before)
**Goal**: Build a waitlist and seed the feed with analysis content.

**Actions:**
- [ ] Set up `terminal.social` landing page with email capture
- [ ] Seed the platform: analyze 20-30 popular repos (react, next.js, deno, bun, astro, shadcn, etc.) and post results to the public feed
- [ ] Create a "Coming Soon" post on the GitHub repo (good README is marketing)
- [ ] Start posting demo GIFs on Twitter/X: one repo analyzed per day, no pitch — just the output
- [ ] Post 2-3 teaser threads on Twitter/X (Korean dev community + global)
- [ ] Join relevant Discord servers (Korean dev communities, Hanbit, etc.) and lurk/contribute before pitching

### Phase 2 — Launch Day
**Goal**: Maximum visibility spike. Hit HN front page, Product Hunt top 5.

**Platforms (priority order):**

| Platform | Action | Timing |
|----------|--------|--------|
| **Hacker News** | "Show HN: Forkverse – AI repo analysis + developer social feed" | Tuesday-Thursday, 8-10am PT |
| **Product Hunt** | Full product listing with GIF demo, hunter outreach 2 weeks prior | Same week as HN |
| **Twitter/X** | Launch thread — problem → solution → demo → link | Same day as HN |
| **Reddit r/programming** | Post as discussion: "I built an AI repo analyzer — here's what it found on vercel/next.js" | 1 day after HN |
| **Reddit r/selfhosted** | Self-hosted angle: SQLite, no cloud required, Ollama support | Same week |
| **Dev.to / Hashnode** | Long-form: "How Forkverse analyzes a GitHub repo and what it found" | Week of launch |

**HN post strategy:**
```
Show HN: Forkverse — Analyze any GitHub repo with AI, share results as social posts

Point it at any public repo → AI (Claude, GPT-4o, Gemini, or local Ollama) generates:
- Architecture breakdown
- Tech stack map
- Strengths & risks
- Improvement paths
- Downloadable PPTX + animated HTML walkthrough

Results post to a developer feed (GitHub OAuth identity, no algo noise).
Self-hosted, SQLite, MIT.

Demo: [GIF of analyzing vercel/next.js]
GitHub: github.com/ccivlcid/Forkverse
```

### Phase 3 — Post-launch (first 4 weeks after)
**Goal**: Retain early adopters, generate organic word-of-mouth.

**Actions:**
- [ ] Reply to every comment on HN, Product Hunt, Reddit personally
- [ ] Share "what people are analyzing" weekly — top repos analyzed that week
- [ ] Ship fast: address top-voted feedback within 48 hours
- [ ] Changelog posts: "This week in Forkverse" in Discord + GitHub releases
- [ ] Reach out directly to users who share interesting analyses

---

## 6. Channels

### Priority 1 — Organic / Community (Free, High ROI)

#### Hacker News
- "Show HN" posts for major features (analysis, PPTX, video output)
- Comment on threads about GitHub, AI tools, open source discovery — mention Forkverse naturally
- Target: 100+ points = ~10k visitors, 3-5% conversion to signup

#### Twitter/X
- Daily "repo of the day" tweet: analyze a trending repo, post the output screenshot (no link required — brand awareness)
- Engage with developers complaining about "this codebase is a mess" or "I can't understand this repo"
- Target accounts to follow and engage: @simonw, @karpathy, @levelsio, @t3dotgg, Korean dev community accounts
- Format: always show the terminal output aesthetic, always include the `$ analyze` command in image

#### Reddit
- `r/programming` — post analyses as discussion, not ads
- `r/MachineLearning`, `r/LocalLLaMA` — Ollama integration angle
- `r/selfhosted` — self-hosted + SQLite + no external cloud angle
- `r/webdev`, `r/reactjs` — technical posts about the stack
- Rule: lead with value (the analysis result), mention the tool second

#### Korean Developer Community
- **Okky** (okky.kr) — Korean dev forum, post "오픈소스 레포 AI 분석기 만들었습니다" style posts
- **velog** — Korean dev blog platform, write technical posts about the AI analysis approach
- **disquiet.io** — Korean product sharing community, post product launch
- **careerly.co.kr** — Korean dev career platform, share as developer tool
- **Kakao OpenTalk / Discord** — join Korean dev open chats, mention naturally

#### GitHub
- The repo README is the best marketing page
- Respond to every issue and discussion quickly
- Add `terminal.social` analysis link in the README header
- Analyze popular repos and open a GitHub Discussion on that repo: "I analyzed this repo with AI — interesting findings" — links back naturally

### Priority 2 — Content Marketing

#### "Repo of the Week" Series
Every week, pick a trending or interesting repo, analyze it, publish:
- Twitter thread with screenshots
- Full blog post on dev.to / Hashnode
- Share to the Forkverse feed (dogfooding)

Topics to analyze for maximum engagement:
- New LLM frameworks (LangChain, LlamaIndex, etc.) — AI community interest
- Trending GitHub repos of the week
- "Mystery repos" — viral/interesting repos people are curious about
- Controversial repos (frameworks wars, etc.)

#### YouTube / Video
- Screen recording: "I analyzed Next.js with AI — here's what it found" (no narration needed, just the UI flow)
- Short-form (Reels/Shorts): 30s demo of analyzing a repo
- Target: dev YouTube channels that cover open source tools

#### Blog / Technical Content
Topics with high search/share potential:
- "How AI understands a codebase" — technical deep-dive on the analysis approach
- "I analyzed the top 50 GitHub repos — here's what I found" — data journalism angle
- "Why we chose SQLite for a social platform" — engineering decision post
- "Terminal aesthetic in 2026 — why developers love CLI UIs" — cultural post

### Priority 3 — Influencer / Developer Outreach

**Tier 1 — Direct outreach (personalized)**
- Find devs who write about GitHub tools, open source, or AI dev tools
- Send them a pre-analyzed report of one of their own repos
- "I analyzed your repo `username/repo-name` with Forkverse — found some interesting patterns. Thought you'd want to see this."
- This is personalized, useful, and not spam

**Tier 2 — Seeding**
- Give early access to known devs in Korean/global open source community
- Ask for honest feedback, not promotion
- If they like it, they'll share naturally

**Target influencer types:**
- Open source maintainers (they want attention on their repos)
- Dev tool reviewers on YouTube (Fireship, Theo t3, etc.)
- Korean dev content creators on YouTube/velog

### Priority 4 — Paid (Low priority until organic works)

**If/when paid is needed:**
- GitHub Marketplace listing (free listing, high intent audience)
- Dev.to sponsored posts (developers, not general audience)
- Newsletter sponsorships: TLDR, Console.dev, Korean dev newsletters
- **Avoid**: Google Ads, Facebook/Instagram — wrong audience

---

## 7. Growth Loops

### Primary Loop: Analyze → Share → Discover
```
User analyzes a repo
  → result posted to feed
    → others discover it, star it
      → they sign up to analyze their own repos
        → more content in the feed
          → more discovery
```

### Secondary Loop: GitHub Activity → Posts → Awareness
```
User connects GitHub webhook
  → pushes/PRs auto-post to Forkverse feed
    → posts visible in user's GitHub profile bio (linked)
      → GitHub visitors click through to Forkverse
        → new user signup
```

### Viral Loop: Analysis Sharing
```
User analyzes a popular repo (e.g., a viral GitHub project)
  → shares result on Twitter with "analyzed X with Forkverse"
    → original repo's audience sees it
      → they click to see the analysis
        → some sign up to analyze repos they're curious about
```

**Key insight**: Every time someone shares an analysis screenshot with `terminal.social` visible, that's free brand awareness. Design the output to be screenshot-worthy.

---

## 8. Screenshot-Worthy Design Principles

All marketing starts from the product looking good when screenshotted. Ensure:
- Terminal output aesthetic is immediately recognizable
- The `$ analyze --repo=owner/name` command line is always visible
- Color contrast is sharp in screenshots (green `#3fb950`, the dark background, amber usernames)
- Analysis results look structured and authoritative, not like raw LLM output
- The URL `terminal.social` is visible in browser chrome when screen-recording

---

## 9. SEO Strategy

### Target Keywords
| Intent | Keywords |
|--------|---------|
| Direct search | "github repo analyzer", "github repo ai analysis", "analyze github repository" |
| Comparison | "github code analysis tool", "ai code review tool", "open source repo analyzer" |
| Long-tail | "how to understand a new codebase quickly", "AI tool to explain github repo" |
| Brand | "Forkverse", "terminal.social" |

### Content SEO
- Each shared analysis result (`terminal.social/analysis/:id`) should be indexable
- Analysis result pages need proper `<title>`, `<meta description>` with repo name
- Static rendering (SSR or pre-render) for analysis result pages — currently client-side only (fix for SEO)
- Blog/changelog at `terminal.social/blog` eventually

---

## 10. Metrics & KPIs

### North Star Metric
**Weekly Active Analyzers** — number of unique users who run at least one repo analysis per week.

### Supporting Metrics

| Metric | Target (Month 1) | Target (Month 3) |
|--------|-----------------|-----------------|
| GitHub repo stars | 200 | 1,000 |
| Registered users | 100 | 500 |
| Weekly Active Analyzers | 20 | 150 |
| Analyses run / week | 50 | 400 |
| Feed posts / week | 30 | 200 |
| HN points on launch | 100+ | — |
| Product Hunt rank | Top 5 of day | — |
| Discord members | 50 | 200 |

### Vanity Metrics (track but don't optimize for)
- Twitter followers, Dev.to hearts, Reddit upvotes

---

## 11. Community Building

### Discord
- Create channels: `#announcements`, `#general`, `#show-your-analysis`, `#feedback`, `#self-hosting`, `#dev`
- Weekly "Repo of the Week" thread — community votes on what to analyze next
- Give early contributors a special role
- Ship feedback fast so Discord becomes a place where requests actually get built

### GitHub
- Respond to all issues within 24 hours
- Use GitHub Discussions for feature requests (visible, searchable, feels open source)
- "Good first issue" labels — developers who contribute become advocates
- Keep a public CHANGELOG.md — shows momentum

### Korean Community Specific
- Create a Korean-language channel in Discord
- Post Korean-language product updates on velog and disquiet
- Consider Kakao channel for Korean-speaking users

---

## 12. Messaging by Channel

### Twitter/X (short, punchy)
```
analyzing repos so you don't have to

$ analyze --repo=vercel/next.js

[screenshot of result]

terminal.social
```

### HN / Reddit (substance-first)
```
Built Forkverse over the past few weeks — it's a repo analysis tool.
Point it at any GitHub repo, AI (your key, your model — Claude/GPT/Gemini/Ollama)
generates a structured breakdown: stack, architecture, strengths, risks, improvements.
Results post to a developer feed. Self-hosted, SQLite, MIT.

Happy to talk about the analysis approach or any of the tech choices.
```

### Product Hunt (marketing language, but still technical)
```
Tagline: "AI-powered repo analysis. Developer-native social feed."

Description: Forkverse analyzes any public GitHub repo with AI and turns the results into
shareable developer content. Pick your LLM (Claude, GPT-4o, Gemini, or local Ollama),
run the analysis, export as report/PPTX/video, post to the developer feed.
GitHub OAuth identity. Terminal aesthetic. Open source.
```

---

## 13. Launch Timeline

```
Week -4  Set up landing + email capture. Begin seeding analyses on platform.
Week -3  Polish demo GIFs. Prep Product Hunt listing. Begin Twitter teasers.
Week -2  Contact Product Hunt hunter. Reddit/HN pre-engagement (contribute, don't pitch).
Week -1  Final QA. Prepare launch-day content (threads, posts, blog draft).
Day 0    Product Hunt live at 00:01 PST. HN Show HN at 8am PT. Twitter thread. Discord open.
Day 1    Reply to all comments. Reddit r/programming post. Changelog.
Week +1  "What we learned" post on HN/dev.to. Address top feedback. Ship one visible fix.
Week +2  "Repo of the Week" series starts. Begin influencer outreach (personalized).
Month 2  Evaluate metrics. Double down on what's working. Consider paid if organic plateaued.
```

---

## 14. Budget Guidance

### Zero-budget launch (recommended starting point)
All channels in Sections 6 Priority 1 and 2 are free. Focus entirely on:
1. GitHub repo quality (README, demo GIF, clean code)
2. HN Show HN post
3. Twitter/X daily "repo of the day" screenshots
4. Korean community posts (Okky, velog, disquiet)

### Low-budget phase (if needed, ~$500/month)
- Dev.to sponsored content: $200-300
- Console.dev or TLDR newsletter: $200-400
- **Not worth it until organic shows traction**

### Medium-budget phase (~$2-5k/month, only after PMF signals)
- GitHub Marketplace promoted listing
- Targeted newsletter sponsorships (Bytes.dev, JavaScript Weekly)
- Short-form video production for YouTube Shorts / Reels

---

## 15. Open Source Marketing

The GitHub repo IS a marketing asset. Rules:
- README must make the product self-evident in 30 seconds — demo GIF above the fold
- Stars on GitHub are social proof on Product Hunt, HN, Twitter
- "Star us on GitHub" CTA on the landing page
- Use GitHub Releases properly — each release is a marketing moment
- Contributors get credited visibly (CONTRIBUTORS.md or README)
- "Built with Forkverse" badge for repos that have been analyzed and shared

---

## See Also

- [PRD.md](./PRD.md) — Product requirements (B-plan)
- [Forkverse_최종통합본_Part1_제품전략_공개전략.md](./Forkverse_최종통합본_Part1_제품전략_공개전략.md) — Product strategy & open strategy
- [APP_RELEASE.md](./APP_RELEASE.md) — Android/iOS store release guide
- [MOBILE.md](./MOBILE.md) — Mobile strategy
