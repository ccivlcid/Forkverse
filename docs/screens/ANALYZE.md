# ANALYZE Screen Specification

> **Source of truth** for the Analyze screen (`/analyze`).
> **B-plan**: This is the **primary feature page** of the platform. Users reach it from the Home Hero CTA or the center mobile nav button.

---

## 1. Screen Overview

| Property        | Value                                                        |
|-----------------|--------------------------------------------------------------|
| **Route**       | `/analyze`                                                   |
| **Title**       | `terminal.social / analyze`                                  |
| **Description** | **Primary feature page.** Users enter a GitHub repo, select output type (report, pptx, video), choose an LLM model, and start analysis. Shows real-time progress and results. Includes a history of past analyses. Reachable from Home Hero CTA, sidebar (first item), and mobile nav (center button). |
| **Auth Required** | Yes. Redirects to `/login` if not authenticated.            |
| **Priority**    | **P0** — Core entry point of the platform. |

---

## 2. Desktop Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ terminal.social / analyze                                        @user ▾       │
├────────────────┬────────────────────────────────────────────────────────────────┤
│                │                                                                │
│ // navigate    │  ┌─ Analyzer ─────────────────────────────────────────────┐   │
│   feed --global│  │                                                         │   │
│   feed --local │  │  // analyze github repo                                │   │
│   explore      │  │                                                         │   │
│ $ analyze      │  │  $ analyze                                              │   │
│                │  │  --repo=█owner/name                                     │   │
│ // by LLM      │  │                                                         │   │
│ ● claude-sonnet│  │  --output= [report]  [pptx]  [video]                   │   │
│ ○ gpt-4o       │  │                                                         │   │
│ ○ llama-3      │  │  --model= [claude-sonnet ▾]                            │   │
│ ○ local        │  │                                                         │   │
│                │  │  --lang=en                                              │   │
│ // me          │  │                                                         │   │
│ → @you         │  │  // options (conditional, depends on output type)       │   │
│   my posts     │  │  --slides=10                     (pptx only)           │   │
│   starred      │  │  --style=terminal                (pptx only)           │   │
│   analyses     │  │  --duration=60s                  (video only)          │   │
│                │  │  --type=walkthrough              (video only)          │   │
│                │  │  --focus=overview                (all types)           │   │
│                │  │                                                         │   │
│                │  │  ┌──────────────────────────────────────────────────┐   │   │
│                │  │  │ [Enter] start analysis                          │   │   │
│                │  │  └──────────────────────────────────────────────────┘   │   │
│                │  │                                                         │   │
│                │  └─────────────────────────────────────────────────────────┘   │
│                │                                                                │
│                │  ┌─ Recent Analyses ───────────────────────────────────────┐   │
│                │  │ // your analyses                                        │   │
│                │  │                                                          │   │
│                │  │ ■ vercel/next.js       report · claude-sonnet · 3h ago  │   │
│                │  │   "Production-grade React framework with hybrid..."     │   │
│                │  │                                                          │   │
│                │  │ ■ ccivlcid/Forkverse    pptx   · gpt-4o · 1d ago        │   │
│                │  │   10 slides · terminal style · downloaded 2x            │   │
│                │  │                                                          │   │
│                │  │ ■ facebook/react       video  · gemini · 3d ago         │   │
│                │  │   60s walkthrough · mp4 · viewed 15x                    │   │
│                │  │                                                          │   │
│                │  │  ┌──────────────────────────────────────────────────┐   │   │
│                │  │  │ $ fetch --more                                   │   │   │
│                │  │  └──────────────────────────────────────────────────┘   │   │
│                │  └─────────────────────────────────────────────────────────┘   │
│                │                                                                │
└────────────────┴────────────────────────────────────────────────────────────────┘
```

### Desktop — Analysis In Progress

```
┌────────────────┬────────────────────────────────────────────────────────────────┐
│                │                                                                │
│ (sidebar)      │  ┌─ Analyzer ─────────────────────────────────────────────┐   │
│                │  │                                                         │   │
│                │  │  // analyzing repo                                      │   │
│                │  │                                                         │   │
│                │  │  $ analyze --repo=vercel/next.js --output=report        │   │
│                │  │                                                         │   │
│                │  │  > cloning repo (shallow)...              ✓ done        │   │
│                │  │  > scanning files: 2,847 files found      ✓ done        │   │
│                │  │  > detecting languages: 14 languages      ✓ done        │   │
│                │  │  > analyzing architecture...              ░░░░░░░░░░    │   │
│                │  │  > generating summary...                  pending       │   │
│                │  │                                                         │   │
│                │  │  elapsed: 8.2s                                          │   │
│                │  │                                                         │   │
│                │  │  ┌──────────────────────────────────────────────────┐   │   │
│                │  │  │ $ cancel                                         │   │   │
│                │  │  └──────────────────────────────────────────────────┘   │   │
│                │  │                                                         │   │
│                │  └─────────────────────────────────────────────────────────┘   │
│                │                                                                │
└────────────────┴────────────────────────────────────────────────────────────────┘
```

### Desktop — Analysis Complete (Report)

```
┌────────────────┬────────────────────────────────────────────────────────────────┐
│                │                                                                │
│ (sidebar)      │  ┌─ Analysis Report ──────────────────────────────────────┐   │
│                │  │                                                         │   │
│                │  │  repo: vercel/next.js                                   │   │
│                │  │  stars: 128k · forks: 27k · contributors: 3,200        │   │
│                │  │                                                         │   │
│                │  │  // architecture                                        │   │
│                │  │  type: monorepo (turborepo)                             │   │
│                │  │  primary-lang: TypeScript (87%)                         │   │
│                │  │  build: turbopack + webpack                             │   │
│                │  │                                                         │   │
│                │  │  // complexity                                          │   │
│                │  │  files: 2,847 · avg-depth: 4.2 · circular-deps: 3     │   │
│                │  │  test-coverage: ~72% (estimated)                        │   │
│                │  │                                                         │   │
│                │  │  // key patterns                                        │   │
│                │  │  - App Router + Pages Router dual architecture          │   │
│                │  │  - Incremental Static Regeneration (ISR)                │   │
│                │  │  - Server Components with streaming                     │   │
│                │  │                                                         │   │
│                │  │  // ai summary                                          │   │
│                │  │  "Next.js is a production-grade React framework         │   │
│                │  │   with hybrid rendering strategies..."                  │   │
│                │  │                                                         │   │
│                │  │  generated by: claude-sonnet · 12.3s                    │   │
│                │  │                                                         │   │
│                │  │  ┌──────────────┐  ┌───────────────────────┐           │   │
│                │  │  │ $ download   │  │ $ post --attach=report│           │   │
│                │  │  └──────────────┘  └───────────────────────┘           │   │
│                │  │                                                         │   │
│                │  └─────────────────────────────────────────────────────────┘   │
│                │                                                                │
└────────────────┴────────────────────────────────────────────────────────────────┘
```

---

## 3. Mobile Wireframe

```
┌─────────────────────────────────┐
│ ≡  terminal.social      @user ▾│
├─────────────────────────────────┤
│                                  │
│ ┌─ Analyzer ─────────────────┐  │
│ │                              │  │
│ │  // analyze github repo     │  │
│ │                              │  │
│ │  $ analyze                   │  │
│ │  --repo=█owner/name         │  │
│ │                              │  │
│ │  --output=                   │  │
│ │  [report] [pptx] [video]    │  │
│ │                              │  │
│ │  --model=                    │  │
│ │  [claude-sonnet ▾]          │  │
│ │                              │  │
│ │  --lang=en                   │  │
│ │                              │  │
│ │  ┌────────────────────────┐  │  │
│ │  │ [Enter] start analysis │  │  │
│ │  └────────────────────────┘  │  │
│ │                              │  │
│ └──────────────────────────────┘  │
│                                  │
│ ┌─ Recent Analyses ──────────┐  │
│ │ // your analyses            │  │
│ │                              │  │
│ │ ■ vercel/next.js            │  │
│ │   report · claude · 3h ago  │  │
│ │                              │  │
│ │ ■ ccivlcid/Forkverse         │  │
│ │   pptx · gpt-4o · 1d ago   │  │
│ │                              │  │
│ │ $ fetch --more              │  │
│ └──────────────────────────────┘  │
│                                  │
└─────────────────────────────────┘
```

### Mobile — Analysis In Progress

```
┌─────────────────────────────────┐
│ ≡  terminal.social      @user ▾│
├─────────────────────────────────┤
│                                  │
│ ┌─ Analyzer ─────────────────┐  │
│ │                              │  │
│ │  // analyzing repo           │  │
│ │                              │  │
│ │  $ analyze                   │  │
│ │  --repo=vercel/next.js       │  │
│ │  --output=report             │  │
│ │                              │  │
│ │  > cloning repo...    ✓ done │  │
│ │  > scanning files...  ✓ done │  │
│ │  > analyzing...    ░░░░░░░░  │  │
│ │  > generating...     pending │  │
│ │                              │  │
│ │  elapsed: 8.2s               │  │
│ │                              │  │
│ │  ┌────────────────────────┐  │  │
│ │  │ $ cancel               │  │  │
│ │  └────────────────────────┘  │  │
│ │                              │  │
│ └──────────────────────────────┘  │
│                                  │
└─────────────────────────────────┘
```

### Mobile — Analysis Complete (Report)

```
┌─────────────────────────────────┐
│ ≡  terminal.social      @user ▾│
├─────────────────────────────────┤
│                                  │
│ ┌─ Analysis Report ──────────┐  │
│ │                              │  │
│ │  repo: vercel/next.js        │  │
│ │  stars: 128k · forks: 27k   │  │
│ │                              │  │
│ │  // architecture             │  │
│ │  type: monorepo (turborepo)  │  │
│ │  primary-lang: TS (87%)      │  │
│ │                              │  │
│ │  // key patterns             │  │
│ │  - App Router + Pages Router │  │
│ │  - ISR                       │  │
│ │  - Server Components         │  │
│ │                              │  │
│ │  // ai summary               │  │
│ │  "Next.js is a production-   │  │
│ │   grade React framework..."  │  │
│ │                              │  │
│ │  generated by: claude · 12s  │  │
│ │                              │  │
│ │  ┌──────────┐ ┌───────────┐  │  │
│ │  │$ download│ │$ post     │  │  │
│ │  └──────────┘ └───────────┘  │  │
│ │                              │  │
│ └──────────────────────────────┘  │
│                                  │
└─────────────────────────────────┘
```

---

## 4. Component Tree

```
AnalyzePage                             src/pages/AnalyzePage.tsx
├── AppShell                            src/components/layout/AppShell.tsx
│   ├── HeaderBar                       src/components/layout/HeaderBar.tsx
│   ├── Sidebar                         src/components/layout/Sidebar.tsx
│   │   └── (analyze is active nav item)
│   └── MainContent                     (slot)
│       ├── AnalyzerForm                src/components/analyze/AnalyzerForm.tsx
│       │   ├── SectionLabel            // "// analyze github repo"
│       │   ├── RepoInput              src/components/analyze/RepoInput.tsx
│       │   │   └── prefix: "$ analyze --repo="
│       │   ├── OutputTypeSelector      src/components/analyze/OutputTypeSelector.tsx
│       │   │   └── [report] [pptx] [video] toggle buttons
│       │   ├── ModelSelector           src/components/composer/ModelSelector.tsx (reused)
│       │   ├── LangInput              src/components/analyze/LangInput.tsx
│       │   ├── OutputOptions           src/components/analyze/OutputOptions.tsx
│       │   │   ├── SlidesOption       (pptx only: --slides=N)
│       │   │   ├── StyleOption        (pptx only: --style=)
│       │   │   ├── DurationOption     (video only: --duration=)
│       │   │   ├── VideoTypeOption    (video only: --type=)
│       │   │   └── FocusOption        (all: --focus=)
│       │   └── SubmitButton            src/components/auth/SubmitButton.tsx (reused)
│       ├── AnalysisProgress            src/components/analyze/AnalysisProgress.tsx
│       │   ├── ProgressStep[]         src/components/analyze/ProgressStep.tsx
│       │   │   └── step name + status (done ✓ / active ░░░ / pending)
│       │   ├── ElapsedTimer           src/components/analyze/ElapsedTimer.tsx
│       │   └── CancelButton
│       ├── AnalysisResult              src/components/analyze/AnalysisResult.tsx
│       │   ├── ReportResult           src/components/analyze/ReportResult.tsx
│       │   ├── PptxResult             src/components/analyze/PptxResult.tsx
│       │   ├── VideoResult            src/components/analyze/VideoResult.tsx
│       │   ├── DownloadButton         src/components/analyze/DownloadButton.tsx
│       │   └── PostAttachButton       src/components/analyze/PostAttachButton.tsx
│       └── RecentAnalyses              src/components/analyze/RecentAnalyses.tsx
│           ├── AnalysisCard[]         src/components/analyze/AnalysisCard.tsx
│           └── LoadMoreButton         src/components/common/LoadMoreButton.tsx
```

---

## 5. State Requirements

### Zustand Stores

**`analyzeStore`** — `src/stores/analyzeStore.ts`

```typescript
interface AnalyzeState {
  // Form state
  repoInput: string;
  outputType: 'report' | 'pptx' | 'video';
  selectedModel: LlmModel;
  lang: string;
  options: {
    slides: number;            // pptx: default 10
    style: 'minimal' | 'corporate' | 'terminal';  // pptx
    duration: '30s' | '60s' | '120s';             // video
    videoType: 'walkthrough' | 'demo' | 'pitch';  // video
    focus: 'overview' | 'architecture' | 'api' | 'security';  // all
  };

  // Analysis state
  status: 'idle' | 'cloning' | 'scanning' | 'analyzing' | 'generating' | 'completed' | 'failed';
  progress: ProgressStep[];
  elapsedMs: number;
  currentAnalysis: Analysis | null;
  error: string | null;

  // History
  recentAnalyses: Analysis[];
  historyCursor: string | null;
  hasMoreHistory: boolean;
  isLoadingHistory: boolean;

  // Actions
  setRepoInput: (value: string) => void;
  setOutputType: (type: 'report' | 'pptx' | 'video') => void;
  setModel: (model: LlmModel) => void;
  setLang: (lang: string) => void;
  setOption: (key: string, value: any) => void;
  startAnalysis: () => Promise<void>;
  cancelAnalysis: () => void;
  fetchHistory: () => Promise<void>;
  fetchMoreHistory: () => Promise<void>;
  downloadResult: (analysisId: string) => void;
  postResult: (analysisId: string) => Promise<void>;
  reset: () => void;
}

interface ProgressStep {
  name: string;
  status: 'pending' | 'active' | 'done' | 'failed';
  detail?: string;
}

interface Analysis {
  id: string;
  userId: string;
  repoOwner: string;
  repoName: string;
  outputType: 'report' | 'pptx' | 'video';
  llmModel: string;
  lang: string;
  optionsJson: Record<string, any>;
  resultUrl: string | null;
  resultSummary: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  durationMs: number | null;
  createdAt: string;
}
```

---

## 6. API Calls

### On Mount

| Trigger       | Endpoint                              | Method | Auth | Purpose                           |
|---------------|---------------------------------------|--------|------|-----------------------------------|
| Page load     | `/api/auth/me`                        | GET    | Yes  | Check auth, redirect if not logged in |
| Page load     | `/api/analyze`                        | GET    | Yes  | Fetch recent analyses history     |

### On User Interaction

| Trigger               | Endpoint                              | Method | Auth | Purpose                           |
|-----------------------|---------------------------------------|--------|------|-----------------------------------|
| Click start analysis  | `/api/analyze`                        | POST   | Yes  | Start repo analysis               |
| Click cancel          | `/api/analyze/:id/cancel`             | POST   | Yes  | Cancel in-progress analysis       |
| Click download        | `/api/analyze/:id/download`           | GET    | Yes  | Download PPTX file or open HTML video inline |
| Click post to feed    | `/api/analyze/:id/share`              | POST   | Yes  | Create post from analysis with repo attachment |
| Click fetch more      | `/api/analyze?cursor=X`               | GET    | Yes  | Load more analysis history        |

### Server-Sent Events (SSE)

| Trigger           | Endpoint                              | Purpose                               |
|-------------------|---------------------------------------|---------------------------------------|
| Analysis started  | `/api/analyze/:id/progress`           | Stream real-time progress updates     |

**Start analysis request:**
```json
{
  "repoOwner": "vercel",
  "repoName": "next.js",
  "outputType": "report",
  "llmModel": "claude-sonnet",
  "lang": "en",
  "options": {
    "focus": "architecture"
  }
}
```

**SSE progress events:**
```
event: step
data: {"name": "cloning repo", "status": "done"}

event: step
data: {"name": "analyzing architecture", "status": "active", "detail": "processing 847/2847 files"}

event: complete
data: {"analysisId": "abc123", "resultUrl": "/api/analyze/abc123/download"}
```

**Start analysis response (201):**
```json
{
  "id": "01968a3b-4c5d-7e8f-9012-abcdef123456",
  "status": "processing",
  "progressUrl": "/api/analyze/01968a3b-4c5d-7e8f-9012-abcdef123456/progress"
}
```

**Analysis complete response (GET /api/analyze/:id):**
```json
{
  "id": "01968a3b-4c5d-7e8f-9012-abcdef123456",
  "repoOwner": "vercel",
  "repoName": "next.js",
  "outputType": "report",
  "llmModel": "claude-sonnet",
  "lang": "en",
  "status": "completed",
  "resultUrl": "/api/analyze/01968a3b.../download",
  "resultSummary": "Production-grade React framework with hybrid rendering...",
  "durationMs": 12300,
  "createdAt": "2026-03-20T10:30:00Z"
}
```

**History list response (GET /api/analyze?cursor=X):**
```json
{
  "analyses": [ /* Analysis[] */ ],
  "cursor": "2026-03-19T08:00:00Z",
  "hasMore": true
}
```

---

## 7. User Interactions

### Mouse / Touch

| Element                 | Action    | Result                                                  |
|-------------------------|-----------|----------------------------------------------------------|
| Repo input              | Type      | Updates `repoInput`; auto-suggest from user's GitHub repos |
| Repo input              | Focus     | Border changes to `border-green-400`                     |
| Output type buttons     | Click     | Toggle active output type; show/hide conditional options |
| Model selector          | Click     | Open model dropdown (reuses composer selector)           |
| Lang input              | Type      | Updates language code                                    |
| Option fields           | Type      | Update respective option values                          |
| Start analysis button   | Click     | Validate inputs, POST `/api/analyze`, show progress      |
| Cancel button           | Click     | POST cancel, return to form                              |
| Download button         | Click     | Trigger file download                                    |
| Post to feed button     | Click     | Create post with analysis result, navigate to feed       |
| Analysis card (history) | Click     | Expand to show result preview or re-open completed analysis |
| Fetch more button       | Click     | Load next page of analysis history                       |

### Keyboard Shortcuts

| Key          | Context           | Action                                       |
|--------------|-------------------|----------------------------------------------|
| `Enter`      | Form focused       | Start analysis                               |
| `Escape`     | Progress shown     | Cancel analysis                              |
| `Tab`        | Form               | Move between fields                          |
| `Shift+Tab`  | Form               | Move to previous field                       |
| `1` / `2` / `3` | Output type focused | Select report / pptx / video             |
| `d`          | Result shown       | Download result                              |
| `p`          | Result shown       | Post result to feed                          |

### Validation Rules (Client-side)

| Field        | Rule                                    | Error Message                                  |
|--------------|-----------------------------------------|------------------------------------------------|
| Repo         | `owner/name` format, non-empty          | `error: --repo invalid format (use owner/name)` |
| Repo         | Max 100 chars                           | `error: --repo max 100 characters`             |
| Lang         | 2-5 char language code (ISO 639)        | `error: --lang invalid language code`          |
| Slides       | Integer 3–30 (pptx only)               | `error: --slides must be between 3 and 30`     |
| Duration     | One of 30s, 60s, 120s (video only)     | `error: --duration invalid value`              |

---

## 8. Loading State

### Analysis In Progress

Progress is displayed as a terminal-style step list with real-time SSE updates:

```
> cloning repo (shallow)...              ✓ done
> scanning files: 2,847 files found      ✓ done
> detecting languages: 14 languages      ✓ done
> analyzing architecture...              ░░░░░░░░░░
> generating summary...                  pending
```

**Implementation:**
- Each step has three states: `pending` (text-gray-500), `active` (text-green-400 + pulsing progress bar), `done` (text-green-400 + ✓)
- Elapsed timer updates every 100ms: `elapsed: 8.2s`
- Cancel button visible throughout
- The form is hidden during analysis, replaced by the progress view
- Progress bar uses `░` characters with opacity pulse animation

### History Loading

- Show 3 skeleton analysis cards with pulsing opacity
- Cards render immediately once data arrives

---

## 9. Empty State

### No Analysis History

```
┌─ Recent Analyses ───────────────────────────────────────┐
│                                                          │
│  $ ls analyses                                           │
│  > 0 analyses found.                                     │
│                                                          │
│  You haven't analyzed any repos yet.                     │
│  Enter a repo above and start your first analysis.       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 10. Error State

### Invalid Repo (404)

```
  $ analyze --repo=nonexistent/repo
  error: repository not found (404)
  hint: check the owner/name and ensure the repo is public.
```

### Analysis Failed (LLM Error)

```
  > cloning repo (shallow)...              ✓ done
  > scanning files: 1,204 files found      ✓ done
  > analyzing architecture...              ✗ failed

  error: llm request failed (502)
  hint: try a different model or try again later.

  ┌──────────────┐
  │ $ retry      │
  └──────────────┘
```

### Repo Too Large

```
  error: repository too large (413)
  hint: repos over 500MB are not supported. try --focus=<specific-area>.
```

### Rate Limited (429)

```
  error: analysis rate limit exceeded. try again in 5m (429)
```

### Network Error (500)

```
  error: connection failed. please try again (500)
```

**Styling for all errors:**
- Error text: `text-red-400 font-mono text-sm`
- Hint text: `text-yellow-400/70 font-mono text-sm`
- Failed steps show `✗` in `text-red-400`
- Retry button: `border border-gray-700 text-green-400 font-mono text-sm px-4 py-2 hover:bg-[#1e293b]`

---

## 11. Test IDs (`data-testid`)

| Element | `data-testid` | Purpose |
|---------|---------------|---------|
| Repo input | `analyze-repo-input` | E2E: type repo name |
| Output type: report | `output-type-report` | E2E: select report output |
| Output type: pptx | `output-type-pptx` | E2E: select pptx output |
| Output type: video | `output-type-video` | E2E: select video output |
| Model selector | `analyze-model-selector` | E2E: select LLM model |
| Lang input | `analyze-lang-input` | E2E: set language |
| Start button | `analyze-start` | E2E: start analysis |
| Cancel button | `analyze-cancel` | E2E: cancel analysis |
| Progress container | `analyze-progress` | E2E: verify progress display |
| Progress step | `progress-step` | E2E: verify individual steps |
| Result container | `analyze-result` | E2E: verify result display |
| Download button | `analyze-download` | E2E: download result |
| Post to feed button | `analyze-post` | E2E: post result to feed |
| Analysis card | `analysis-card` | E2E: click history item |
| Recent analyses | `recent-analyses` | E2E: verify history section |
| Empty state | `analyze-empty` | E2E: verify empty state |
| Error state | `analyze-error` | E2E: verify error state |
| Retry button | `analyze-retry` | E2E: retry failed analysis |

---

## 12. Accessibility Notes

| Requirement | Implementation |
|-------------|---------------|
| Analyzer form | `role="form"` with `aria-label="Analyze a GitHub repository"` |
| Output type selector | `role="radiogroup"` with `role="radio"` per option, `aria-checked` |
| Progress steps | `role="list"` with `aria-live="polite"` for real-time updates |
| Elapsed timer | `aria-live="off"` (visual only, not announced) |
| Cancel button | `aria-label="Cancel analysis"` |
| Result section | `role="region"` with `aria-label="Analysis result"` |
| Download button | `aria-label="Download analysis result as {type}"` |
| Analysis cards | `role="article"` with `aria-labelledby` pointing to repo name |
| Error messages | `role="alert"` with `aria-live="assertive"` |

---

## 13. Entry Points

Users reach the Analyze page from:

| Source | Mechanism |
|--------|-----------|
| Home Hero CTA | "Analyze" button on `/` |
| Desktop sidebar | First nav item: `$ analyze` |
| Mobile bottom nav | Center button (Analyze icon) |
| Analysis result page | "Re-analyze" or "Analyze another" button |
| User profile | "Analyze a repo" prompt in empty analyses tab |

After analysis completes, the user can:
1. View result inline (current behavior)
2. Navigate to `/analysis/:id` for full sectioned view (Phase B2)
3. Share to feed as a post
4. Download (report/pptx/video)

---

## See Also

- [HOME.md](./HOME.md) — Home page with Analyze CTA (primary entry)
- [ANALYSIS_RESULT.md](./ANALYSIS_RESULT.md) — Analysis result detail page (Phase B2)
- [DESIGN_GUIDE.md](../design/DESIGN_GUIDE.md) — Visual tokens, component specs, UI states
- [API.md](../specs/API.md) — Endpoint request/response details
- [CONVENTIONS.md](../guides/CONVENTIONS.md) — Coding rules for implementation
- [LLM_INTEGRATION.md](../llm/LLM_INTEGRATION.md) — LLM provider details
- [FEED.md](./FEED.md) — Feed where analysis results can be posted
