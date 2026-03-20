# LLM_INTEGRATION.md -- LLM Transformation Logic

> **Owner:** CLItoris Core Team
> **Status:** Source of Truth
> **Purpose:** Defines how CLItoris transforms natural language into CLI commands using LLM providers. Core interface, system prompt, execution modes, and provider registration live here. Provider implementations, parsing, and error handling are in split files.

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Prompt](#2-system-prompt)
3. [Provider Interface](#3-provider-interface)
4. [LLM Execution Modes](#4-llm-execution-modes)
5. [Provider Registration](#5-provider-registration)

> **Split files:**
> - [LLM_PROVIDERS.md](./LLM_PROVIDERS.md) — 7 provider implementations (Anthropic, OpenAI, Gemini, Ollama, Cursor, CLI, Generic API)
> - [LLM_DETECTION.md](./LLM_DETECTION.md) — Credential auto-detection, response parsing, error handling

---

## 1. Overview

CLItoris transforms natural language messages into terminal.social CLI commands using two LLM operations:

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

| File | Purpose | Output format |
|------|---------|---------------|
| `transform.md` | Metadata extraction from natural language post | JSON object |
| `translate.md` | Tone-aware translation of post content | Plain translated text |
| `system.md` | Legacy single-step CLI generation (retained for reference) | CLI command string |

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
  transform(input: TransformRequest): Promise<TransformResponse>;
  translate(input: TranslateInput): Promise<string>;
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

## 4. LLM Execution Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **Cloud API** | Anthropic, OpenAI, Gemini via API keys | Post transformation, repo analysis |
| **Local LLM** | Ollama, llama.cpp installed on user's PC | Offline analysis, privacy-sensitive repos |

**Local LLM setup:**
CLItoris provides in-app guidance for installing and managing local models:
```
$ llm --install ollama
> detecting system: Apple M2 Pro, 32GB RAM
> recommended model: llama-3-8b-q4
> downloading... ████████░░ 72%

$ llm --list-local
> ollama/llama-3-8b     (4.7GB, quantized Q4)
> ollama/codellama-13b  (7.3GB, quantized Q4)
```

Users can switch between cloud and local models per task. Local models require no API key and keep all data on-device.

---

## 5. Provider Registration

All providers are registered in a central factory. Adding a new provider requires:
1. Create `packages/llm/src/providers/{name}.ts` implementing `LlmProviderInterface`
2. Register in the factory in `provider-factory.ts`
3. Add the provider enum to `LlmProvider` type in `@clitoris/shared`
4. Add key management UI in the Settings screen

> **Key policy**: API keys are NEVER stored in environment variables. They are provided by the user through the Settings UI (`/settings`) and stored per-user in the `user_llm_keys` database table. The factory receives credentials as a parameter.

```typescript
// packages/llm/src/provider-factory.ts
export interface ProviderCredentials {
  apiKey?: string;   // Required for cloud providers (anthropic, openai, gemini, api)
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
    case "ollama":
      return new OllamaProvider();   // no key needed — local runtime
    case "cursor":
      return new CursorProvider();   // no key needed — local runtime
    case "cli":
      return new CliProvider();      // no key needed — local binary
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

Providers that never need a key: `ollama`, `cursor`, `cli`

---

## See Also

- [LLM_PROVIDERS.md](./LLM_PROVIDERS.md) -- All 7 provider implementations (Anthropic, OpenAI, Gemini, Ollama, Cursor, CLI, Generic API)
- [LLM_DETECTION.md](./LLM_DETECTION.md) -- Error handling, response parsing, credential auto-detection
- [docs/setup/CONFIGS.md](../setup/CONFIGS.md) -- Project configuration files
- [docs/GLOSSARY.md](../GLOSSARY.md) -- Unified terminology index
- [docs/specs/API.md](./API.md) -- API specification
- [docs/specs/PRD.md](./PRD.md) -- Product requirements
- [docs/guides/ENV.md](../guides/ENV.md) -- Environment variables (server config only — API keys are user-managed)
