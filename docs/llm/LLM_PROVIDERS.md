# LLM_PROVIDERS.md — Provider Implementations

> **Source of truth** for all 6 LLM provider implementations.
> See [LLM_INTEGRATION.md](./LLM_INTEGRATION.md) for system prompt, interface, and overview.

---

All providers live under `packages/llm/src/providers/`. Each file exports a class implementing `LlmProvider`.

## 1. anthropic.ts -- Anthropic SDK

```typescript
// packages/llm/src/providers/anthropic.ts
import Anthropic from "@anthropic-ai/sdk";
import type { LlmProvider, TransformRequest, TransformResponse } from "../types.js";
import { SYSTEM_PROMPT, buildFewShotMessages } from "../prompt.js";
import { parseCliCommand } from "../parser.js";

export class AnthropicProvider implements LlmProvider {
  name = "anthropic";
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async listModels(): Promise<string[]> {
    return [
      "claude-sonnet-4-20250514",
      "claude-haiku-4-20250414",
    ];
  }

  async transform(input: TransformRequest): Promise<TransformResponse> {
    const response = await this.client.messages.create({
      model: input.model,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        ...buildFewShotMessages(input.username),
        { role: "user", content: input.message },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return {
      messageCli: parseCliCommand(text),
      model: response.model,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  }
}
```

## 2. openai.ts -- OpenAI SDK

```typescript
// packages/llm/src/providers/openai.ts
import OpenAI from "openai";
import type { LlmProvider, TransformRequest, TransformResponse } from "../types.js";
import { SYSTEM_PROMPT, buildFewShotMessages } from "../prompt.js";
import { parseCliCommand } from "../parser.js";

export class OpenAiProvider implements LlmProvider {
  name = "openai";
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async listModels(): Promise<string[]> {
    const list = await this.client.models.list();
    return list.data
      .filter((m) => m.id.startsWith("gpt-"))
      .map((m) => m.id);
  }

  async transform(input: TransformRequest): Promise<TransformResponse> {
    const response = await this.client.chat.completions.create({
      model: input.model,
      max_tokens: 512,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...buildFewShotMessages(input.username),
        { role: "user", content: input.message },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";
    return {
      messageCli: parseCliCommand(text),
      model: response.model,
      tokensUsed: response.usage?.total_tokens ?? 0,
    };
  }
}
```

## 3. ollama.ts -- Ollama REST API

```typescript
// packages/llm/src/providers/ollama.ts
import type { LlmProvider, TransformRequest, TransformResponse } from "../types.js";
import { SYSTEM_PROMPT, buildFewShotMessages } from "../prompt.js";
import { parseCliCommand } from "../parser.js";

const OLLAMA_BASE = process.env.OLLAMA_HOST ?? "http://localhost:11434";

export class OllamaProvider implements LlmProvider {
  name = "ollama";

  async listModels(): Promise<string[]> {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`);
    const data = (await res.json()) as { models: Array<{ name: string }> };
    return data.models.map((m) => m.name);
  }

  async transform(input: TransformRequest): Promise<TransformResponse> {
    const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: input.model,
        stream: false,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...buildFewShotMessages(input.username),
          { role: "user", content: input.message },
        ],
      }),
    });

    const data = (await res.json()) as {
      message: { content: string };
      model: string;
      eval_count?: number;
      prompt_eval_count?: number;
    };

    return {
      messageCli: parseCliCommand(data.message.content),
      model: data.model,
      tokensUsed: (data.eval_count ?? 0) + (data.prompt_eval_count ?? 0),
    };
  }
}
```

## 4. cursor.ts -- Cursor API

```typescript
// packages/llm/src/providers/cursor.ts
import type { LlmProvider, TransformRequest, TransformResponse } from "../types.js";
import { SYSTEM_PROMPT, buildFewShotMessages } from "../prompt.js";
import { parseCliCommand } from "../parser.js";

const CURSOR_BASE = "http://localhost:3100/v1";

export class CursorProvider implements LlmProvider {
  name = "cursor";

  async listModels(): Promise<string[]> {
    const res = await fetch(`${CURSOR_BASE}/models`);
    const data = (await res.json()) as { data: Array<{ id: string }> };
    return data.data.map((m) => m.id);
  }

  async transform(input: TransformRequest): Promise<TransformResponse> {
    const res = await fetch(`${CURSOR_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: input.model,
        max_tokens: 512,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...buildFewShotMessages(input.username),
          { role: "user", content: input.message },
        ],
      }),
    });

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
      model: string;
      usage?: { total_tokens: number };
    };

    return {
      messageCli: parseCliCommand(data.choices[0]?.message?.content ?? ""),
      model: data.model,
      tokensUsed: data.usage?.total_tokens ?? 0,
    };
  }
}
```

## 5. gemini.ts -- Google Gemini SDK

```typescript
// packages/llm/src/providers/gemini.ts
import { GoogleGenAI } from "@google/genai";
import type { LlmProvider, TransformRequest, TransformResponse } from "../types.js";
import { SYSTEM_PROMPT, buildFewShotMessages } from "../prompt.js";
import { parseCliCommand } from "../parser.js";

export class GeminiProvider implements LlmProvider {
  name = "gemini";
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async listModels(): Promise<string[]> {
    return [
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
    ];
  }

  async transform(input: TransformRequest): Promise<TransformResponse> {
    const fewShot = buildFewShotMessages(input.username);
    const historyText = fewShot
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const response = await this.client.models.generateContent({
      model: input.model,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 512,
      },
      contents: [
        { role: "user", parts: [{ text: `${historyText}\nuser: ${input.message}` }] },
      ],
    });

    const text = response.text ?? "";
    return {
      messageCli: parseCliCommand(text),
      model: input.model,
      tokensUsed: (response.usageMetadata?.promptTokenCount ?? 0) +
                  (response.usageMetadata?.candidatesTokenCount ?? 0),
    };
  }
}
```

## 7. api.ts -- Generic OpenAI-Compatible Endpoint

For any provider that exposes an OpenAI-compatible `/v1/chat/completions` endpoint (LM Studio, vLLM, Together AI, Groq, etc.).

```typescript
// packages/llm/src/providers/api.ts
import type { LlmProvider, TransformRequest, TransformResponse } from "../types.js";
import { SYSTEM_PROMPT, buildFewShotMessages } from "../prompt.js";
import { parseCliCommand } from "../parser.js";

export class GenericApiProvider implements LlmProvider {
  name: string;
  private baseUrl: string;
  private apiKey: string;

  constructor(name: string, baseUrl: string, apiKey: string) {
    this.name = name;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
  }

  async listModels(): Promise<string[]> {
    const res = await fetch(`${this.baseUrl}/v1/models`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    const data = (await res.json()) as { data: Array<{ id: string }> };
    return data.data.map((m) => m.id);
  }

  async transform(input: TransformRequest): Promise<TransformResponse> {
    const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        model: input.model,
        max_tokens: 512,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...buildFewShotMessages(input.username),
          { role: "user", content: input.message },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`API request failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
      model: string;
      usage?: { total_tokens: number };
    };

    return {
      messageCli: parseCliCommand(data.choices[0]?.message?.content ?? ""),
      model: data.model,
      tokensUsed: data.usage?.total_tokens ?? 0,
    };
  }
}
```

---

## See Also

- [LLM_INTEGRATION.md](./LLM_INTEGRATION.md) -- Overview, system prompt, provider interface, execution modes
- [LLM_DETECTION.md](./LLM_DETECTION.md) -- Error handling, response parsing, credential auto-detection
- [docs/guides/ENV.md](../guides/ENV.md) -- Environment variables (API keys)
