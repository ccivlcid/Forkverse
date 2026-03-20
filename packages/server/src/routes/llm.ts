import { Router } from 'express';
import type { Database } from 'better-sqlite3';
import { z } from 'zod';
import { createProvider, detectLocalRuntimes } from '@clitoris/llm';
import { requireAuth } from '../middleware/auth.js';
import { generateId } from '../lib/id.js';
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
  if (model === 'cursor') return 'cursor';
  return 'api';
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
    const providerName = modelToProvider(model);

    // Ollama doesn't need a user key
    const keylessProviders = new Set(['ollama', 'cursor']);
    let credentials: { apiKey?: string; baseUrl?: string } = {};

    if (!keylessProviders.has(providerName)) {
      const row = db
        .prepare('SELECT api_key, base_url FROM user_llm_keys WHERE user_id = ? AND provider = ?')
        .get(userId, providerName) as LlmKeyRow | undefined;

      if (!row) {
        res.status(400).json({
          error: { code: 'KEY_NOT_CONFIGURED', message: `No API key configured for provider: ${providerName}. Add it in Settings.` },
        });
        return;
      }
      credentials = {
        apiKey: row.api_key,
        ...(row.base_url ? { baseUrl: row.base_url } : {}),
      };
    }

    try {
      const provider = createProvider(providerName, credentials);
      const userRow = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as { username: string };

      const result = await provider.transform({
        message,
        model,
        lang,
        username: userRow.username,
      });
      res.json({ data: result });
    } catch (err) {
      logger.error({ err, model, providerName }, 'LLM transform failed');
      res.status(500).json({ error: { code: 'LLM_ERROR', message: 'LLM transformation failed' } });
    }
  });

  // GET /api/llm/providers — show local runtimes + which providers user has configured
  router.get('/providers', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const localRuntimes = detectLocalRuntimes();

    const configuredRows = db
      .prepare('SELECT provider FROM user_llm_keys WHERE user_id = ?')
      .all(userId) as Array<{ provider: string }>;
    const configured = configuredRows.map((r) => ({
      provider: r.provider,
      source: 'user-settings',
      isAvailable: true,
    }));

    res.json({ data: [...localRuntimes, ...configured] });
  });

  const USER_MODEL_PROVIDERS = ['anthropic', 'openai', 'gemini'] as const;

  // GET /api/llm/models/:provider — list models using the current user's saved API key
  router.get('/models/:provider', requireAuth, async (req, res) => {
    const provider = req.params.provider;
    if (!USER_MODEL_PROVIDERS.includes(provider as (typeof USER_MODEL_PROVIDERS)[number])) {
      res.status(400).json({
        error: { code: 'INVALID_PROVIDER', message: 'provider must be anthropic, openai, or gemini' },
      });
      return;
    }
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
    try {
      let models: string[] = [];
      if (provider === 'anthropic') models = await listAnthropicModelsForKey(row.api_key);
      else if (provider === 'openai') models = await listOpenAIModelsForKey(row.api_key, row.base_url);
      else if (provider === 'gemini') models = await listGeminiModelsForKey(row.api_key);
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
    `).run(generateId(), userId, provider, apiKey, label ?? null, baseUrl ?? null);

    res.status(201).json({ data: { provider, label: label ?? null } });
  });

  // DELETE /api/llm/keys/:provider — remove user's key
  router.delete('/keys/:provider', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    db.prepare('DELETE FROM user_llm_keys WHERE user_id = ? AND provider = ?')
      .run(userId, req.params.provider);
    res.json({ data: { message: 'Key removed' } });
  });

  return router;
}
