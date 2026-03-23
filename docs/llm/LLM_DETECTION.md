# LLM_DETECTION.md — Error Handling & Response Parsing

> **Source of truth** for LLM error handling and response parsing.
> See [LLM_INTEGRATION.md](./LLM_INTEGRATION.md) for system prompt, interface, and overview.

---

## 1. Error Handling

All providers must handle errors consistently. The server layer wraps provider calls with the following logic.

| Condition | Behavior |
|---|---|
| **API key missing** | Throw `ProviderConfigError` with message: `"Missing API key for provider: {name}. Set {ENV_VAR} in .env"` |
| **Rate limit (429)** | Return HTTP 429 to the client with `Retry-After` header from upstream. Do not retry automatically. |
| **Timeout** | Default timeout is **30 seconds**. On timeout, throw `ProviderTimeoutError`. The client displays a "Request timed out, try again" message. |
| **Invalid response** | If the LLM response cannot be parsed into a valid CLI command, **retry once** with the same input. If the second attempt also fails, return the raw response with a `parseError: true` flag so the client can display a warning. |
| **Network error** | Throw `ProviderNetworkError`. The client shows a connectivity warning. |

Error class hierarchy (in `packages/llm/src/errors.ts`):

```typescript
export class LlmError extends Error {
  constructor(message: string, public readonly provider: string) {
    super(message);
    this.name = "LlmError";
  }
}

export class ProviderConfigError extends LlmError {
  constructor(provider: string, envVar: string) {
    super(`Missing API key for provider: ${provider}. Set ${envVar} in .env`, provider);
    this.name = "ProviderConfigError";
  }
}

export class ProviderTimeoutError extends LlmError {
  constructor(provider: string, timeoutMs: number) {
    super(`Provider ${provider} timed out after ${timeoutMs}ms`, provider);
    this.name = "ProviderTimeoutError";
  }
}

export class ProviderNetworkError extends LlmError {
  constructor(provider: string, cause?: Error) {
    super(`Network error reaching provider: ${provider}`, provider);
    this.name = "ProviderNetworkError";
    if (cause) this.cause = cause;
  }
}
```

---

## 2. Response Parsing

The parser lives in `packages/llm/src/parser.ts`. Its job: extract a clean `terminal.social post ...` command from whatever the LLM returned.

### Parsing Logic

```typescript
// packages/llm/src/parser.ts

const CLI_COMMAND_REGEX = /terminal\.social\s+post\s+.+/;

/**
 * Extracts a valid terminal.social CLI command from raw LLM output.
 *
 * Handles these cases:
 *   1. LLM returned just the command (ideal) -> return as-is
 *   2. LLM wrapped in code fences (```...```) -> strip fences, extract command
 *   3. LLM added explanation before/after -> find the command line with regex
 *   4. No valid command found -> throw so caller can retry
 */
export function parseCliCommand(raw: string): string {
  const trimmed = raw.trim();

  // Case 1: Raw output is already the command
  if (trimmed.startsWith("terminal.social post")) {
    return extractFirstLine(trimmed);
  }

  // Case 2: Strip markdown code fences
  const fenceMatch = trimmed.match(/```(?:\w*\n)?([\s\S]*?)```/);
  if (fenceMatch) {
    const inner = fenceMatch[1]?.trim() ?? "";
    if (inner.startsWith("terminal.social post")) {
      return extractFirstLine(inner);
    }
  }

  // Case 3: Search for the command anywhere in the output
  const lineMatch = trimmed.match(CLI_COMMAND_REGEX);
  if (lineMatch) {
    return extractFirstLine(lineMatch[0]);
  }

  // Case 4: No valid command found
  throw new ParseError(trimmed);
}

function extractFirstLine(text: string): string {
  return text.split("\n")[0]!.trim();
}

export class ParseError extends Error {
  constructor(public readonly rawOutput: string) {
    super("LLM response did not contain a valid terminal.social post command");
    this.name = "ParseError";
  }
}
```

### Fallback Strategy

When `parseCliCommand` throws a `ParseError`, the caller (provider `transform` method or server route) should:

1. **Retry once** with the same `TransformRequest`. Some models are non-deterministic and a second attempt often succeeds.
2. If the second attempt also throws `ParseError`, return a response with:
   - `messageCli` set to the raw LLM output
   - An additional `parseError: true` flag
3. The client checks `parseError` and displays a yellow warning: "Could not generate CLI command. Showing raw LLM output."

---

## 3. Ollama Detection

Forkverse detects Ollama running locally at server startup. Cloud API keys are user-managed via Settings.

> **Key policy**: API keys (Anthropic, OpenAI, Gemini, etc.) are NOT read from environment variables. Each user enters their own keys in Settings. Keys are stored in the `user_llm_keys` database table and looked up per-request.

### Detection Logic

The server checks if Ollama is running by hitting its health endpoint at startup.

| Provider | Detection Method | Key Required? |
|---------|-----------------|---------------|
| Ollama | `GET localhost:11434/api/tags` health check | No |
| Anthropic API | User-provided in Settings | **Yes** (user's own key) |
| OpenAI API | User-provided in Settings | **Yes** (user's own key) |
| Gemini API | User-provided in Settings | **Yes** (user's own key) |
| Generic API | User-provided in Settings | **Yes** (user's own key) |

### API Key Management Flow

1. User navigates to `/settings` → LLM Keys section
2. User enters their API key for a provider (e.g., Anthropic)
3. Client calls `POST /api/llm/keys` → server stores in `user_llm_keys` table
4. On transform request, server looks up the key, passes to `createProvider()`
5. Key is never logged or returned to the client after save

### GET /api/llm/providers Response

Requires a logged-in session. Returns local runtimes (e.g. Ollama) plus rows with `source: "user-settings"` for each provider the user saved a key for. Server `.env` must not be used for cloud LLM API keys.

```json
{
  "data": [
    { "provider": "ollama", "source": "localhost:11434", "isAvailable": true },
    { "provider": "anthropic", "source": "user-settings", "isAvailable": true },
    { "provider": "openai", "source": "user-settings", "isAvailable": true }
  ]
}
```

Ollama appears only if detected locally. API providers appear only if the user has saved a key.

### Client UI Integration

The composer's model selector shows availability based on combined detection:

```
┌─ Model Selector ──────────────────────────────────┐
│ ● anthropic / claude-sonnet  [configured]         │  ← user saved key
│ ○ openai / gpt-4o           [add key →]           │  ← no key saved
│ ● gemini / gemini-2.5-pro   [configured]          │  ← user saved key
│ ● ollama / llama3            [local]              │  ← running locally
└───────────────────────────────────────────────────┘
```

**Badge meanings:**
| Badge | Meaning |
|-------|---------|
| `[configured]` | User saved an API key in Settings |
| `[local]` | Local server running (Ollama) — no key needed |
| `[add key →]` | No key saved — click to go to Settings |

---

## See Also

- [LLM_INTEGRATION.md](./LLM_INTEGRATION.md) -- Overview, system prompt, provider interface, execution modes
- [LLM_PROVIDERS.md](./LLM_PROVIDERS.md) -- All 4 provider implementations
- [docs/specs/API.md](./API.md) -- API specification
- [docs/guides/ENV.md](../guides/ENV.md) -- Server environment variables (API keys are user-managed, not env vars)
