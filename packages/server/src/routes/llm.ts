import { Router } from 'express';
import type { Database } from 'better-sqlite3';
import { z } from 'zod';
import { createProvider } from '@forkverse/llm';
import { requireAuth } from '../middleware/auth.js';
import { generateId } from '../lib/id.js';
import { encrypt, decrypt } from '../lib/crypto.js';
import type { Logger } from 'pino';

const transformSchema = z.object({
  message: z.string().min(1).max(2000),
  model: z.string().min(1),
  lang: z.string().length(2),
});

const saveKeySchema = z.object({
  provider: z.enum(['anthropic', 'openai', 'gemini', 'ollama', 'openrouter', 'together', 'groq', 'cerebras', 'api']),
  apiKey: z.string().min(1),
  label: z.string().max(100).optional(),
  baseUrl: z.string().optional(),
});

function modelToProvider(model: string): string {
  if (model.startsWith('claude')) return 'anthropic';
  if (model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('o3') || model.startsWith('o4')) return 'openai';
  if (model.startsWith('gemini')) return 'gemini';
  if (model.startsWith('llama')) return 'ollama';
  // OpenRouter models often use provider/model format
  if (model.includes('/')) return 'openrouter';
  return 'api';
}

// Infer provider from model, falling back to checking user's saved keys
function resolveProvider(model: string, userId: string, database: Database): { provider: string; apiKey: string; baseUrl: string | null } | null {
  // 1. Try direct model-to-provider mapping
  const direct = modelToProvider(model);
  if (direct !== 'api') {
    const row = database.prepare(
      'SELECT api_key, base_url FROM user_llm_keys WHERE user_id = ? AND provider = ?'
    ).get(userId, direct) as LlmKeyRow | undefined;
    if (row) return { provider: direct, apiKey: decrypt(row.api_key), baseUrl: row.base_url };
  }

  // 2. Check all user's providers and try to find one that has this model
  const allKeys = database.prepare(
    'SELECT provider, api_key, base_url FROM user_llm_keys WHERE user_id = ?'
  ).all(userId) as Array<{ provider: string; api_key: string; base_url: string | null }>;

  // Prefer the 'api' provider (custom) or any OpenAI-compatible provider
  for (const row of allKeys) {
    if (['openrouter', 'together', 'groq', 'cerebras', 'ollama', 'api'].includes(row.provider)) {
      return { provider: row.provider, apiKey: decrypt(row.api_key), baseUrl: row.base_url };
    }
  }

  // 3. Try first available provider
  if (allKeys.length > 0) {
    const first = allKeys[0]!;
    return { provider: first.provider, apiKey: decrypt(first.api_key), baseUrl: first.base_url };
  }

  return null;
}

interface LlmKeyRow {
  api_key: string;
  base_url: string | null;
}

// ── Model list via user-saved keys only ──

const ANTHROPIC_VERSION = '2023-06-01';

async function listAnthropicModelsForKey(apiKey: string): Promise<string[]> {
  const ids: string[] = [];
  let afterId: string | undefined;
  const headers = {
    'x-api-key': apiKey,
    'anthropic-version': ANTHROPIC_VERSION,
  };
  for (let page = 0; page < 20; page++) {
    const url = new URL('https://api.anthropic.com/v1/models');
    url.searchParams.set('limit', '100');
    if (afterId) url.searchParams.set('after_id', afterId);
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`anthropic models HTTP ${String(res.status)}`);
    }
    const body = (await res.json()) as {
      data?: Array<{ id: string }>;
      has_more?: boolean;
      last_id?: string;
    };
    for (const m of body.data ?? []) {
      if (m.id.startsWith('claude')) ids.push(m.id);
    }
    if (!body.has_more) break;
    afterId = body.last_id;
    if (!afterId) break;
  }
  return [...new Set(ids)].sort();
}

async function listOpenAIModelsForKey(apiKey: string, baseUrl?: string | null): Promise<string[]> {
  const base = (baseUrl?.trim() || 'https://api.openai.com/v1').replace(/\/$/, '');
  const url = `${base}/models`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!res.ok) {
    throw new Error(`openai models HTTP ${String(res.status)}`);
  }
  const body = (await res.json()) as { data?: Array<{ id: string }> };
  return (body.data ?? [])
    .map((m) => m.id)
    .filter((id) => /^(gpt-|o1-|o3-|o4-)/.test(id))
    .sort();
}

async function listGeminiModelsForKey(apiKey: string): Promise<string[]> {
  const out: string[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < 20; page++) {
    const url = new URL('https://generativelanguage.googleapis.com/v1beta/models');
    url.searchParams.set('pageSize', '100');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const res = await fetch(url.toString(), {
      headers: { 'x-goog-api-key': apiKey },
    });
    if (!res.ok) {
      throw new Error(`gemini models HTTP ${String(res.status)}`);
    }
    const body = (await res.json()) as {
      models?: Array<{ name?: string }>;
      nextPageToken?: string;
    };
    for (const m of body.models ?? []) {
      const id = m.name?.replace(/^models\//, '') ?? '';
      if (/^gemini/i.test(id)) out.push(id);
    }
    pageToken = body.nextPageToken;
    if (!pageToken) break;
  }
  return [...new Set(out)].sort();
}

export function createLlmRouter(db: Database, logger: Logger): Router {
  const router = Router();

  // POST /api/llm/transform — uses key stored by user in settings
  router.post('/transform', requireAuth, async (req, res) => {
    const parsed = transformSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
      return;
    }

    const { message, model, lang } = parsed.data;
    const userId = req.session.userId!;

    const resolved = resolveProvider(model, userId, db);
    if (!resolved) {
      res.status(400).json({
        error: { code: 'KEY_NOT_CONFIGURED', message: `No API key configured. Add one in Settings → API.` },
      });
      return;
    }

    const credentials: { apiKey?: string; baseUrl?: string } = {
      apiKey: resolved.apiKey,
      ...(resolved.baseUrl ? { baseUrl: resolved.baseUrl } : {}),
    };

    try {
      const provider = createProvider(resolved.provider, credentials);
      const userRow = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as { username: string };

      const result = await provider.transform({
        message,
        model,
        lang,
        username: userRow.username,
      });
      res.json({ data: result });
    } catch (err) {
      logger.error({ err, model, provider: resolved.provider }, 'LLM transform failed');
      res.status(500).json({ error: { code: 'LLM_ERROR', message: 'LLM transformation failed' } });
    }
  });

  // GET /api/llm/providers — which providers user has configured
  router.get('/providers', requireAuth, (req, res) => {
    const userId = req.session.userId!;

    const configuredRows = db
      .prepare('SELECT provider FROM user_llm_keys WHERE user_id = ?')
      .all(userId) as Array<{ provider: string }>;
    const configured = configuredRows.map((r) => ({
      provider: r.provider,
      source: 'user-settings',
      isAvailable: true,
    }));

    res.json({ data: configured });
  });

  // GET /api/llm/models/:provider — list models using the current user's saved API key
  router.get('/models/:provider', requireAuth, async (req, res) => {
    const provider = req.params.provider as string;
    const userId = req.session.userId!;
    const row = db
      .prepare('SELECT api_key, base_url FROM user_llm_keys WHERE user_id = ? AND provider = ?')
      .get(userId, provider) as LlmKeyRow | undefined;
    if (!row?.api_key) {
      res.status(400).json({
        error: { code: 'KEY_NOT_CONFIGURED', message: `No API key saved for ${provider}` },
      });
      return;
    }
    const apiKey = decrypt(row.api_key);
    try {
      let models: string[] = [];
      if (provider === 'anthropic') {
        models = await listAnthropicModelsForKey(apiKey);
      } else if (provider === 'openai') {
        models = await listOpenAIModelsForKey(apiKey, row.base_url);
      } else if (provider === 'gemini') {
        models = await listGeminiModelsForKey(apiKey);
      } else {
        // OpenAI-compatible providers (openrouter, together, groq, cerebras, ollama, api)
        const p = createProvider(provider, { apiKey, ...(row.base_url ? { baseUrl: row.base_url } : {}) });
        models = await p.listModels();
      }
      res.json({ data: models });
    } catch (err) {
      logger.error({ err, provider }, 'user model list failed');
      res.status(502).json({
        error: { code: 'MODELS_LIST_FAILED', message: 'Could not list models for this provider' },
      });
    }
  });

  // GET /api/llm/providers/list — saved providers for current user (with label + base_url)
  router.get('/providers/list', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const rows = db
      .prepare('SELECT provider, label, base_url FROM user_llm_keys WHERE user_id = ?')
      .all(userId) as Array<{ provider: string; label: string | null; base_url: string | null }>;
    res.json({ data: rows });
  });

  // POST /api/llm/keys — save user's API key for a provider
  router.post('/keys', requireAuth, (req, res) => {
    const parsed = saveKeySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
      return;
    }

    const { provider, apiKey, label, baseUrl } = parsed.data;
    const userId = req.session.userId!;

    db.prepare(`
      INSERT INTO user_llm_keys (id, user_id, provider, api_key, label, base_url)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, provider) DO UPDATE SET
        api_key = excluded.api_key,
        label = excluded.label,
        base_url = excluded.base_url
    `).run(generateId(), userId, provider, encrypt(apiKey), label ?? null, baseUrl ?? null);

    res.status(201).json({ data: { provider, label: label ?? null } });
  });

  // DELETE /api/llm/keys/:provider — remove user's key
  router.delete('/keys/:provider', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    db.prepare('DELETE FROM user_llm_keys WHERE user_id = ? AND provider = ?')
      .run(userId, req.params.provider);
    res.json({ data: { message: 'Key removed' } });
  });

  // ── Agent CRUD ──────────────────────────────────────────────

  const agentSchema = z.object({
    name: z.string().min(1).max(100),
    endpointUrl: z.string().url(),
    apiKey: z.string().max(500).optional(),
    protocol: z.enum(['openai', 'anthropic', 'custom']).default('openai'),
    model: z.string().max(200).optional(),
    systemPrompt: z.string().max(4000).optional(),
    icon: z.string().max(10).optional(),
  });

  router.get('/agents', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const rows = db.prepare(
      'SELECT id, name, endpoint_url, protocol, model, system_prompt, icon, created_at FROM chat_agents WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId) as Array<{
      id: string; name: string; endpoint_url: string; protocol: string;
      model: string | null; system_prompt: string | null; icon: string | null; created_at: string;
    }>;
    res.json({
      data: rows.map(r => ({
        id: r.id, name: r.name, endpointUrl: r.endpoint_url,
        protocol: r.protocol, model: r.model, systemPrompt: r.system_prompt,
        icon: r.icon, createdAt: r.created_at,
      })),
    });
  });

  router.post('/agents', requireAuth, (req, res) => {
    const parsed = agentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid' } });
      return;
    }
    const userId = req.session.userId!;
    const id = generateId();
    const { name, endpointUrl, apiKey, protocol, model, systemPrompt, icon } = parsed.data;
    db.prepare(
      'INSERT INTO chat_agents (id, user_id, name, endpoint_url, api_key, protocol, model, system_prompt, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, userId, name, endpointUrl, apiKey ?? null, protocol, model ?? null, systemPrompt ?? null, icon ?? null);
    res.json({ data: { id, name, endpointUrl, protocol, model, systemPrompt, icon } });
  });

  router.delete('/agents/:id', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    db.prepare('DELETE FROM chat_agents WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ data: { ok: true } });
  });

  // ── POST /api/llm/chat — proxy to external agent endpoint (SSE) ──

  const chatSchema = z.object({
    agentId: z.string().min(1),
    messages: z.array(z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    })).min(1).max(100),
  });

  router.post('/chat', requireAuth, async (req, res) => {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid' } });
      return;
    }

    const { agentId, messages } = parsed.data;
    const userId = req.session.userId!;

    const agent = db.prepare(
      'SELECT endpoint_url, api_key, protocol, model, system_prompt FROM chat_agents WHERE id = ? AND user_id = ?'
    ).get(agentId, userId) as {
      endpoint_url: string; api_key: string | null; protocol: string;
      model: string | null; system_prompt: string | null;
    } | undefined;

    if (!agent) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Agent not found' } });
      return;
    }

    // Prepend system prompt if configured
    const allMessages = agent.system_prompt
      ? [{ role: 'system' as const, content: agent.system_prompt }, ...messages]
      : messages;

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const endpoint = agent.endpoint_url.replace(/\/+$/, '');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (agent.api_key) headers.Authorization = `Bearer ${agent.api_key}`;

    try {
      if (agent.protocol === 'anthropic') {
        // Anthropic Messages API
        const system = allMessages.find(m => m.role === 'system')?.content ?? '';
        const apiMsgs = allMessages.filter(m => m.role !== 'system');
        if (agent.api_key) headers['x-api-key'] = agent.api_key;
        headers['anthropic-version'] = ANTHROPIC_VERSION;
        delete headers.Authorization;

        const fetchRes = await fetch(`${endpoint}/v1/messages`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: agent.model ?? 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            stream: true,
            ...(system ? { system } : {}),
            messages: apiMsgs,
          }),
        });

        if (!fetchRes.ok || !fetchRes.body) {
          res.write(`data: ${JSON.stringify({ error: await fetchRes.text().catch(() => 'Request failed') })}\n\n`);
          res.end();
          return;
        }

        const reader = fetchRes.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const d = line.slice(6);
            if (d === '[DONE]') continue;
            try {
              const p = JSON.parse(d) as { type?: string; delta?: { text?: string } };
              if (p.type === 'content_block_delta' && p.delta?.text) {
                res.write(`data: ${JSON.stringify({ text: p.delta.text })}\n\n`);
              }
            } catch { /* skip */ }
          }
        }
      } else {
        // OpenAI-compatible (covers OpenClaw, Dify, Coze, Ollama, custom agents)
        const chatUrl = agent.protocol === 'custom'
          ? endpoint  // custom: use endpoint URL as-is
          : `${endpoint}/chat/completions`;  // openai: append path

        const fetchRes = await fetch(chatUrl, {
          method: 'POST',
          headers,
          signal: AbortSignal.timeout(120_000),
          body: JSON.stringify({
            ...(agent.model ? { model: agent.model } : {}),
            stream: true,
            messages: allMessages,
          }),
        });

        if (!fetchRes.ok || !fetchRes.body) {
          res.write(`data: ${JSON.stringify({ error: await fetchRes.text().catch(() => 'Request failed') })}\n\n`);
          res.end();
          return;
        }

        const reader = fetchRes.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const d = line.slice(6);
            if (d === '[DONE]') continue;
            try {
              const p = JSON.parse(d) as { choices?: Array<{ delta?: { content?: string } }>; text?: string; response?: string };
              // OpenAI format
              const content = p.choices?.[0]?.delta?.content
                // Some agents return {text} or {response} directly
                ?? p.text ?? p.response;
              if (content) {
                res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
              }
            } catch { /* skip */ }
          }
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      logger.error({ err }, 'Agent chat proxy error');
      res.write(`data: ${JSON.stringify({ error: 'Connection to agent failed' })}\n\n`);
      res.end();
    }
  });

  return router;
}
