# LLM_INTEGRATION.md -- LLM Integration Logic

> **Owner:** Forkverse Core Team
> **Status:** Source of Truth
> **Purpose:** Defines how Forkverse uses LLM providers for three operations: **analyze** (repo analysis — primary), **transform** (post CLI conversion), and **translate** (tone-aware translation). Core interface, prompts, execution modes, and provider registration live here.
> Updated: 2026-03-21 — B-plan: `analyze()` operation added as primary LLM use case.

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Prompt](#2-system-prompt)
3. [Provider Interface](#3-provider-interface)
4. [LLM Execution Modes](#4-llm-execution-modes)
5. [Provider Registration](#5-provider-registration)

> **Split files:**
> - [LLM_PROVIDERS.md](./LLM_PROVIDERS.md) — 4 provider implementations (Anthropic, OpenAI, Gemini, Generic API)
> - [LLM_DETECTION.md](./LLM_DETECTION.md) — Response parsing, error handling

---

## 1. Overview

Forkverse uses LLMs for three operations, in priority order:

### 1.0 `analyze()` — Repo analysis (B-plan PRIMARY)

```
User enters GitHub repo URL + output type + model
       |
       v
Server fetches repo metadata via GitHub API
       |
       v
Server clones repo (shallow, depth=1), scans structure
       |
       v
LLM receives analyze prompt + repo context (file tree, key files, README, package.json)
       |
       v
LLM outputs structured JSON:
  { summary, techStack, architecture, strengths, risks, improvements }
       |
       v
Server generates output:
  - report: structured markdown with sections
  - pptx: 5-slide terminal-style presentation
  - video: HTML terminal animation with typewriter effect
       |
       v
Result saved to DB (result_sections_json) and file system
UI displays sectioned result with copy/share/download actions
```

**Prompt**: `packages/llm/prompts/analyze.md` (planned — currently inline in analyze route)

**Output schema:**
```json
{
  "summary": "Executive summary of the repository...",
  "techStack": {
    "primary": "TypeScript",
    "languages": [{ "name": "TypeScript", "percentage": 87 }, ...],
    "frameworks": ["React", "Next.js"],
    "buildTools": ["Turbopack", "Webpack"],
    "testing": ["Jest", "Playwright"]
  },
  "architecture": {
    "type": "monorepo",
    "description": "Turborepo-based monorepo with...",
    "patterns": ["App Router", "Server Components", "ISR"],
    "entryPoints": ["packages/next/src/server/next.ts"]
  },
  "strengths": [
    "Comprehensive TypeScript adoption (87%)",
    "Strong testing infrastructure"
  ],
  "risks": [
    "High circular dependency count (3)",
    "Complex build pipeline"
  ],
  "improvements": [
    "Consider migrating remaining JS files to TypeScript",
    "Add dependency graph visualization"
  ]
}
```

**Fallback**: On JSON parse failure, server wraps raw LLM text as `summary` and leaves other fields empty.

**Cost considerations**: Repo analysis uses significantly more tokens than transform/translate. Context includes file tree, README, key config files — typically 5K-20K input tokens. Output is 1K-3K tokens. Cost tracking per analysis is planned for Phase B5 (LLM Gateway).

### 1.1 `transform()` — Metadata extraction + CLI generation

```
User writes message (natural language)
       |
       v
LLM receives transform.md prompt + user message
       |
       v
LLM outputs structured JSON:
  { message, lang, intent, emotion, tags }
       |
       v
Server reconstructs the CLI command string from the JSON fields
       |
       v
UI displays BOTH the original message AND the generated CLI command
Metadata (intent, emotion) stored in DB and shown as badges
```

The JSON-output approach ensures reliable parsing. The server always builds the final CLI string — the LLM never outputs CLI syntax directly. Fallback: if JSON parse fails, `intent` and `emotion` default to `neutral`.

### 1.2 `translate()` — Tone-aware translation (lazy, cached)

```
Feed renders post where post.lang ≠ user.ui_lang
       |
       v
Check translations cache (post_id, target_lang)
       |
  Cache hit → return immediately (no LLM call)
  Cache miss → call LLM with translate.md prompt
                 (uses post.intent + post.emotion for tone preservation)
       |
       v
Store in translations table, show below original text (togglable)
```

Translation uses the **viewer's own LLM key** — zero server cost.

---

## 2. Prompts

All prompts live in `packages/llm/prompts/` and are loaded at runtime via `readFileSync`. **Never hardcode prompt content in TypeScript** — edit the `.md` files directly.

| File | Purpose | Output format | Priority |
|------|---------|---------------|----------|
| `analyze.md` | Repo analysis — structured insight generation | JSON object (sections) | **PRIMARY (B-plan)** |
| `transform.md` | Metadata extraction from natural language post | JSON object | Secondary (social layer) |
| `translate.md` | Tone-aware translation of post content | Plain translated text | Secondary |
| `system.md` | Legacy single-step CLI generation (retained for reference) | CLI command string | Deprecated |

### 2.1 `transform.md` — Metadata Extraction

Called once per post creation. The LLM returns a JSON object; the server reconstructs the CLI string.

**Output schema:**
```json
{
  "message": "original text, unchanged",
  "lang": "ISO 639-1 code (ko, en, ja, zh, ...)",
  "intent": "casual | formal | question | announcement | reaction",
  "emotion": "neutral | happy | surprised | frustrated | excited | sad | angry",
  "tags": ["extracted", "hashtags"]
}
```

**Few-shot examples (embedded in the prompt):**
```
"ㅋㅋ 대박이다"
→ {"message":"ㅋㅋ 대박이다","lang":"ko","intent":"reaction","emotion":"surprised","tags":[]}

"Just deployed my first agent pipeline 🔥 #agent #vibecoding"
→ {"message":"...","lang":"en","intent":"announcement","emotion":"excited","tags":["agent","vibecoding"]}
```

**Fallback**: On JSON parse failure, server defaults `intent = "neutral"`, `emotion = "neutral"` and falls back to `detectLang()` for language.

### 2.2 `translate.md` — Tone-Aware Translation

Called lazily when `post.lang ≠ viewer.ui_lang` and no cache entry exists. Uses `post.intent` and `post.emotion` to preserve tone.

**Template variables:**
- `{{MESSAGE}}` — source post text
- `{{SOURCE_LANG}}` / `{{TARGET_LANG}}` — ISO 639-1 codes
- `{{INTENT}}` / `{{EMOTION}}` — from post metadata

**Tone preservation principle:**
```
"ㅋㅋ 대박이다" (ko, casual, surprised) → "omg no way lol"   ✓
"ㅋㅋ 대박이다"                          → "That is amazing." ✗
```

---

## 3. Provider Interface

All LLM providers implement the same interface. This lives in `packages/llm/src/types.ts`.

```typescript
interface LlmProvider {
  name: string;
  listModels(): Promise<string[]>;
  analyze(input: AnalyzeRequest): Promise<AnalyzeResponse>;     // B-plan PRIMARY
  transform(input: TransformRequest): Promise<TransformResponse>;
  translate(input: TranslateInput): Promise<string>;
}

interface AnalyzeRequest {
  repoContext: {
    owner: string;
    name: string;
    fileTree: string;        // directory listing
    readme: string;          // README.md content (truncated)
    packageJson?: string;    // package.json or equivalent
    keyFiles: string[];      // content of important config files
  };
  outputType: 'report' | 'pptx' | 'video';
  model: string;
  lang: string;
  focus?: 'overview' | 'architecture' | 'api' | 'security';
}

interface AnalyzeResponse {
  sections: {
    summary: string;
    techStack: object;
    architecture: object;
    strengths: string[];
    risks: string[];
    improvements: string[];
  };
  model: string;
  tokensUsed: number;
}

interface TransformRequest {
  message: string;
  model: string;
  lang: string;      // hint — LLM may override with detected lang
  username: string;
}

interface TransformResponse {
  messageCli: string;   // server-reconstructed CLI string
  model: string;
  tokensUsed: number;
  lang: string;         // LLM-detected language (ISO 639-1)
  tags: string[];       // LLM-extracted hashtags
  intent: PostIntent;   // LLM-extracted communication intent
  emotion: PostEmotion; // LLM-extracted emotional tone
}

interface TranslateInput {
  message: string;
  sourceLang: string;
  targetLang: string;
  intent: PostIntent;
  emotion: PostEmotion;
  model: string;
}
```

### Field Details

| Field | Description |
|---|---|
| `TransformRequest.message` | The raw natural language text the user typed. |
| `TransformRequest.model` | Model identifier, e.g. `claude-sonnet-4-20250514`, `gpt-4o`, `llama3`. |
| `TransformRequest.lang` | ISO 639-1 hint (from user setting or `detectLang()`). LLM may override. |
| `TransformRequest.username` | The authenticated user's handle, used in CLI command construction. |
| `TransformResponse.messageCli` | The CLI command string, reconstructed server-side from the LLM JSON output. |
| `TransformResponse.lang` | Language as detected by the LLM (authoritative over the hint). |
| `TransformResponse.tags` | Hashtags extracted by the LLM from the message. |
| `TransformResponse.intent` | Communication intent inferred by the LLM. |
| `TransformResponse.emotion` | Emotional tone inferred by the LLM. |
| `TransformResponse.model` | The model that actually processed the request. |
| `TransformResponse.tokensUsed` | Total tokens consumed (prompt + completion). |

---

## 4. LLM Execution Mode

All LLM operations use cloud API providers. Users select a provider and model, and the server calls the provider's API with the user's stored API key.

| Mode | Description | Use Case |
|------|-------------|----------|
| **Cloud API** | Anthropic, OpenAI, Gemini, or any OpenAI-compatible endpoint via API keys | Post transformation, repo analysis, translation |

---

## 5. Provider Registration

All providers are registered in a central factory. Adding a new provider requires:
1. Create `packages/llm/src/providers/{name}.ts` implementing `LlmProviderInterface`
2. Register in the factory in `provider-factory.ts`
3. Add the provider enum to `LlmProvider` type in `@forkverse/shared`
4. Add key management UI in the Settings screen

> **Key policy**: API keys are NEVER stored in environment variables. They are provided by the user through the Settings UI (`/settings`) and stored per-user in the `user_llm_keys` database table. The factory receives credentials as a parameter.

```typescript
// packages/llm/src/provider-factory.ts
export interface ProviderCredentials {
  apiKey?: string;   // Required for all providers (anthropic, openai, gemini, api)
  baseUrl?: string;  // Required for api provider
}

/**
 * Create a provider instance with user-supplied credentials.
 * Keys come from the user's settings, not process.env.
 */
export function createProvider(name: string, credentials: ProviderCredentials = {}): LlmProviderInterface {
  switch (name) {
    case "anthropic":
      return new AnthropicProvider(credentials.apiKey!);
    case "openai":
      return new OpenAiProvider(credentials.apiKey!);
    case "gemini":
      return new GeminiProvider(credentials.apiKey!);
    case "api":
      return new GenericApiProvider("custom", credentials.baseUrl!, credentials.apiKey ?? "");
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}
```

### Key Lookup Flow (server-side)

```
POST /api/llm/transform
  ↓
Look up user_llm_keys WHERE user_id = req.session.userId AND provider = providerName
  ↓
  ├── Found → pass { apiKey } to createProvider(name, credentials)
  └── Not found (cloud provider) → 400 KEY_NOT_CONFIGURED
       "No API key configured for provider: anthropic. Add it in Settings."
```

---

## See Also

- [LLM_PROVIDERS.md](./LLM_PROVIDERS.md) -- All 4 provider implementations (Anthropic, OpenAI, Gemini, Generic API)
- [LLM_DETECTION.md](./LLM_DETECTION.md) -- Error handling, response parsing
- [docs/setup/CONFIGS.md](../setup/CONFIGS.md) -- Project configuration files
- [docs/GLOSSARY.md](../GLOSSARY.md) -- Unified terminology index
- [docs/specs/API.md](./API.md) -- API specification
- [docs/specs/PRD.md](./PRD.md) -- Product requirements
- [docs/guides/ENV.md](../guides/ENV.md) -- Environment variables (server config only — API keys are user-managed)
