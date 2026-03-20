import { execSync, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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
  cliTool: z.string().optional(), // which CLI tool to use (claude-code, codex, etc.)
});

const saveKeySchema = z.object({
  provider: z.enum(['anthropic', 'openai', 'gemini', 'ollama', 'openrouter', 'together', 'groq', 'cerebras', 'api']),
  apiKey: z.string().min(1),
  label: z.string().max(100).optional(),
  baseUrl: z.string().optional(),
});

const CLI_TRANSFORM_TOOLS = ['claude-code', 'codex', 'gemini-cli', 'opencode'] as const;

function modelToProvider(model: string, cliTool?: string): string {
  if (cliTool === 'cursor') return 'cursor';
  // If a CLI tool is explicitly specified, use CLI provider
  if (cliTool && CLI_TRANSFORM_TOOLS.includes(cliTool as (typeof CLI_TRANSFORM_TOOLS)[number])) return 'cli';
  if (model.startsWith('claude')) return 'anthropic';
  if (model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('o3') || model.startsWith('o4')) return 'openai';
  if (model.startsWith('gemini')) return 'gemini';
  if (model.startsWith('llama')) return 'ollama';
  if (model === 'cursor') return 'cursor';
  if (model === 'cli') return 'cli';
  return 'api';
}

interface LlmKeyRow {
  api_key: string;
  base_url: string | null;
}

// ── CLI detection ─────────────────────────────────────────────

export interface CliToolStatus {
  id: string;
  name: string;
  installed: boolean;
  version: string | null;
  authenticated: boolean;
  models: string[];
  installCmd: string | null;
}

interface CliDetectConfig {
  id: string;
  name: string;
  bin: string;
  versionArgs: string[];
  /** Tried in order until a version is parsed or exit 0 with plausible output */
  versionArgSets?: string[][];
  parseVersion: (out: string) => string | null;
  installCmd: string;
}

const CURSOR_MODELS_ENDPOINT =
  (process.env['CURSOR_LLM_BASE'] ?? 'http://localhost:3100/v1').replace(/\/$/, '') + '/models';

function stripAnsi(s: string): string {
  return s.replace(/\u001b\[[0-9;]*m/g, '');
}

/** Fallback when tool-specific parser misses (e.g. only two-part semver, odd banners) */
function parseLooseSemver(out: string): string | null {
  const t = stripAnsi(out).trim();
  const m = t.match(/\b\d+\.\d+\.\d+\b/) ?? t.match(/\b\d+\.\d+\b/);
  return m ? m[0] : null;
}

function looksLikeShellNotFound(out: string): boolean {
  const t = stripAnsi(out).toLowerCase();
  return (
    /not recognized|not found|cannot find|is not recognized|bad command|not internal or external|명령|不是内部或外部命令/.test(
      t,
    )
  );
}

/** Hardcoded fallback directories — covers npm/pnpm/homebrew/nvm globals. */
const CLI_PATH_FALLBACK_DIRS: string[] = process.platform === 'win32'
  ? [
      path.join(os.homedir(), '.local', 'bin'),
      path.join(process.env['ProgramFiles'] ?? 'C:\\Program Files', 'nodejs'),
      path.join(process.env['LOCALAPPDATA'] ?? '', 'Programs', 'nodejs'),
      path.join(process.env['APPDATA'] ?? '', 'npm'),
    ].filter(Boolean)
  : [
      '/opt/homebrew/bin',
      '/usr/local/bin',
      '/usr/bin',
      '/bin',
      path.join(os.homedir(), '.local', 'bin'),
      path.join(os.homedir(), 'bin'),
    ];

/** Augment PATH with well-known CLI binary locations (adapted from agentoffice). */
function withCliPathFallback(pathValue: string | undefined): string {
  const parts = (pathValue ?? '')
    .split(path.delimiter)
    .map((item) => item.trim())
    .filter(Boolean);
  const seen = new Set(parts);

  // Also try npm global prefix (may add /opt/node22/bin etc.)
  try {
    const prefix = execSync('npm prefix -g', { encoding: 'utf8', timeout: 5000 }).trim();
    if (prefix) {
      const binDir = process.platform === 'win32' ? prefix : path.join(prefix, 'bin');
      if (!seen.has(binDir)) { parts.push(binDir); seen.add(binDir); }
    }
  } catch { /* ignore */ }

  for (const dir of CLI_PATH_FALLBACK_DIRS) {
    if (!dir || seen.has(dir)) continue;
    parts.push(dir);
    seen.add(dir);
  }
  return parts.join(path.delimiter);
}

/** Build an env object with augmented PATH for CLI probing. */
function cliProbeEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  const augmented = withCliPathFallback(env['PATH']);
  env['PATH'] = augmented;
  if (process.platform === 'win32') env['Path'] = augmented;
  return env;
}

async function fetchCursorCliModels(): Promise<string[]> {
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 2500);
    try {
      const res = await fetch(CURSOR_MODELS_ENDPOINT, { signal: ac.signal });
      if (!res.ok) return [];
      const data = (await res.json()) as { data?: Array<{ id: string }> };
      const ids = (data.data ?? []).map((m) => m.id).filter(Boolean);
      return [...new Set(ids)].sort();
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return [];
  }
}

function jsonHasKey(filePath: string, key: string): boolean {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const j = JSON.parse(raw) as Record<string, unknown>;
    return j != null && typeof j === 'object' && key in j && j[key] != null;
  } catch {
    return false;
  }
}

function fileExistsNonEmpty(filePath: string): boolean {
  try {
    const stat = fs.statSync(filePath);
    return stat.isFile() && stat.size > 2;
  } catch {
    return false;
  }
}

/** CLI logged in on this machine (OAuth / local cred files) — no server API keys */
function localCliSessionOk(toolId: string): boolean {
  const home = os.homedir();
  switch (toolId) {
    case 'claude-code':
      if (jsonHasKey(path.join(home, '.claude.json'), 'oauthAccount') || jsonHasKey(path.join(home, '.claude.json'), 'session')) {
        return true;
      }
      return fileExistsNonEmpty(path.join(home, '.claude', 'auth.json'));
    case 'codex': {
      const authPath = path.join(home, '.codex', 'auth.json');
      return jsonHasKey(authPath, 'OPENAI_API_KEY') || jsonHasKey(authPath, 'tokens');
    }
    case 'gemini-cli':
      if (fileExistsNonEmpty(path.join(home, '.gemini', 'oauth_creds.json'))) return true;
      if (jsonHasKey(path.join(home, '.gemini', 'oauth_creds.json'), 'access_token')) return true;
      {
        const appData = process.env.APPDATA;
        if (appData) {
          const adc = path.join(appData, 'gcloud', 'application_default_credentials.json');
          if (fileExistsNonEmpty(adc) && jsonHasKey(adc, 'client_id')) return true;
        }
      }
      return false;
    case 'opencode':
      if (fileExistsNonEmpty(path.join(home, '.local', 'share', 'opencode', 'auth.json'))) return true;
      {
        const xdg = process.env.XDG_DATA_HOME;
        if (xdg && fileExistsNonEmpty(path.join(xdg, 'opencode', 'auth.json'))) return true;
      }
      if (process.platform === 'darwin') {
        return fileExistsNonEmpty(path.join(home, 'Library', 'Application Support', 'opencode', 'auth.json'));
      }
      return false;
    case 'cursor':
      return fileExistsNonEmpty(path.join(home, '.cursor', 'cli-config.json'));
    default:
      return false;
  }
}

function getUserLlmKeyRow(db: Database, userId: string, provider: string): LlmKeyRow | undefined {
  return db
    .prepare('SELECT api_key, base_url FROM user_llm_keys WHERE user_id = ? AND provider = ?')
    .get(userId, provider) as LlmKeyRow | undefined;
}

// ── Model list via user-saved keys only (REST only — no cloud SDK deps on server) ──

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

const CLI_TOOL_CONFIGS: CliDetectConfig[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    bin: 'claude',
    versionArgs: ['--version'],
    parseVersion: (out) => out.match(/(\d+\.\d+\.\d+)/)?.[1] ?? null,
    installCmd: 'npm install -g @anthropic-ai/claude-code',
  },
  {
    id: 'codex',
    name: 'Codex CLI',
    bin: 'codex',
    versionArgs: ['--version'],
    parseVersion: (out) => out.match(/(\d+\.\d+\.\d+)/)?.[1] ?? null,
    installCmd: 'npm install -g @openai/codex',
  },
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    bin: process.env['GEMINI_CLI_BIN'] ?? 'gemini',
    versionArgs: ['--version'],
    versionArgSets: [['--version'], ['-V']],
    parseVersion: (out) => out.match(/(\d+\.\d+\.\d+)/)?.[1] ?? null,
    installCmd: 'npm install -g @google/gemini-cli',
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    bin: 'opencode',
    versionArgs: ['--version'],
    parseVersion: (out) => out.match(/(\d+\.\d+\.\d+)/)?.[1] ?? null,
    installCmd: 'npm install -g opencode',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    bin: 'cursor',
    versionArgs: ['--version'],
    parseVersion: (out) => out.match(/(\d+\.\d+\.\d+)/)?.[1] ?? null,
    installCmd: 'https://cursor.com/download',
  },
];

/** Default model lists when only CLI session exists and no DB API key to query. */
const CLI_DEFAULT_MODELS: Record<string, string[]> = {
  'claude-code': ['claude-sonnet-4-20250514', 'claude-haiku-4-20250414'],
  codex: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
  'gemini-cli': ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
  opencode: ['gpt-4o', 'claude-sonnet-4-20250514'],
};

/**
 * Per-user: enrich CLI status with models + auth.
 * authenticated = localCliSession OR dbApiKey (either path makes the tool usable).
 * Models are fetched from DB key when available, otherwise default list is used.
 */
async function enrichCliStatusForUser(
  statuses: CliToolStatus[],
  db: Database,
  userId: string,
): Promise<CliToolStatus[]> {
  const out: CliToolStatus[] = [];
  for (const s of statuses) {
    let models: string[] = [];
    const hasLocalSession = localCliSessionOk(s.id);
    let hasDbKey = false;

    try {
      if (s.id === 'claude-code') {
        const row = getUserLlmKeyRow(db, userId, 'anthropic');
        if (row?.api_key) {
          hasDbKey = true;
          models = await listAnthropicModelsForKey(row.api_key);
        }
      } else if (s.id === 'codex') {
        const row = getUserLlmKeyRow(db, userId, 'openai');
        if (row?.api_key) {
          hasDbKey = true;
          models = await listOpenAIModelsForKey(row.api_key, row.base_url);
        }
      } else if (s.id === 'gemini-cli') {
        const row = getUserLlmKeyRow(db, userId, 'gemini');
        if (row?.api_key) {
          hasDbKey = true;
          models = await listGeminiModelsForKey(row.api_key);
        }
      } else if (s.id === 'opencode') {
        const openaiRow = getUserLlmKeyRow(db, userId, 'openai');
        const anthRow = getUserLlmKeyRow(db, userId, 'anthropic');
        hasDbKey = !!(openaiRow?.api_key || anthRow?.api_key);
        const parts: string[] = [];
        if (openaiRow?.api_key) {
          try {
            parts.push(...(await listOpenAIModelsForKey(openaiRow.api_key, openaiRow.base_url)));
          } catch { /* ignore */ }
        }
        if (anthRow?.api_key) {
          try {
            parts.push(...(await listAnthropicModelsForKey(anthRow.api_key)));
          } catch { /* ignore */ }
        }
        models = [...new Set(parts)].sort();
      } else if (s.id === 'cursor') {
        models = await fetchCursorCliModels();
      }
    } catch {
      /* keep models [] */
    }

    // If CLI session exists but no DB key → use default model list so user can select
    if (models.length === 0 && hasLocalSession && CLI_DEFAULT_MODELS[s.id]) {
      models = CLI_DEFAULT_MODELS[s.id];
    }

    const authenticated = hasLocalSession || hasDbKey;
    out.push({ ...s, models, authenticated });
  }
  return out;
}

const cliStatusCache = new Map<string, { data: CliToolStatus[]; expiresAt: number }>();
const CLI_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function execCmd(
  bin: string,
  args: string[],
  timeoutMs = 5000,
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ out: string; code: number }> {
  const { spawn } = await import('node:child_process');
  return new Promise((resolve, reject) => {
    // shell: true is required on Windows to find .cmd npm global binaries
    // stdin: 'ignore' prevents interactive CLIs from hanging waiting for input
    const child = spawn(bin, args, {
      timeout: timeoutMs,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env,
    }) as ChildProcess;
    let out = '';
    child.stdout?.on('data', (chunk: Buffer) => { out += chunk.toString(); });
    child.stderr?.on('data', (chunk: Buffer) => { out += chunk.toString(); });
    child.on('close', (code: number | null) => {
      if (code !== null) resolve({ out, code });
      else reject(new Error('process killed'));
    });
    child.on('error', reject);
  });
}

/**
 * Detect a single CLI tool (adapted from agentoffice pattern).
 * 1. `which`/`where` to confirm binary exists — fast, reliable.
 * 2. `--version` to parse version string — fallback if format changes.
 */
async function detectCliTool(config: CliDetectConfig): Promise<CliToolStatus> {
  const probeEnv = cliProbeEnv();

  // Step 1: check if binary exists in PATH via which/where
  const whichCmd = process.platform === 'win32' ? 'where' : 'which';
  try {
    await execCmd(whichCmd, [config.bin], 3000, probeEnv);
  } catch {
    return {
      id: config.id, name: config.name,
      installed: false, version: null, authenticated: false,
      models: [], installCmd: config.installCmd,
    };
  }

  // Step 2: binary found — try to get version
  let version: string | null = null;
  const argSets = config.versionArgSets ?? [config.versionArgs];
  for (const args of argSets) {
    try {
      const { out, code } = await execCmd(config.bin, args, 8000, probeEnv);
      const parsed = config.parseVersion(out) ?? parseLooseSemver(out);
      if (parsed) { version = parsed; break; }
      if (code === 0 && out.trim() && !looksLikeShellNotFound(out)) {
        version = parseLooseSemver(out);
        break;
      }
    } catch {
      /* try next arg set */
    }
  }

  // authenticated + models filled in enrichCliStatusForUser
  return {
    id: config.id, name: config.name,
    installed: true, version, authenticated: false,
    models: [],
    installCmd: config.installCmd,
  };
}

async function getCliStatus(forceRefresh: boolean, db: Database, userId: string): Promise<CliToolStatus[]> {
  if (!forceRefresh) {
    const hit = cliStatusCache.get(userId);
    if (hit && Date.now() < hit.expiresAt) {
      return hit.data;
    }
  }
  const base = await Promise.all(CLI_TOOL_CONFIGS.map(detectCliTool));
  const data = await enrichCliStatusForUser(base, db, userId);
  cliStatusCache.set(userId, { data, expiresAt: Date.now() + CLI_CACHE_TTL });
  return data;
}

export function createLlmRouter(db: Database, logger: Logger): Router {
  const router = Router();

  // POST /api/llm/transform — uses key stored by user in settings
  // Smart fallback: if CLI tool requested but local session missing, fall back to API provider.
  router.post('/transform', requireAuth, async (req, res) => {
    const parsed = transformSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
      return;
    }

    const { message, model, lang, cliTool } = parsed.data;
    const userId = req.session.userId!;
    let providerName = modelToProvider(model, cliTool);

    // ── Smart fallback: CLI tool → API provider when local session is missing ──
    // If user selected a CLI tool but the binary isn't logged in locally,
    // fall back to the corresponding API provider using the user's saved API key.
    const CLI_TOOL_TO_API: Record<string, string> = {
      'claude-code': 'anthropic',
      codex: 'openai',
      'gemini-cli': 'gemini',
    };
    let fallbackUsed = false;

    if (providerName === 'cli' && cliTool) {
      const hasLocalSession = localCliSessionOk(cliTool);
      if (!hasLocalSession) {
        // For opencode: determine API provider from model name prefix
        const apiProvider = CLI_TOOL_TO_API[cliTool] ?? modelToProvider(model);
        const row = getUserLlmKeyRow(db, userId, apiProvider);
        if (row?.api_key) {
          logger.info({ cliTool, apiProvider }, 'CLI session missing — falling back to API provider');
          providerName = apiProvider;
          fallbackUsed = true;
        }
        // else: proceed with CLI anyway (may work or fail with descriptive error)
      }
    }

    // Ollama and CLI tools don't need a user key
    const keylessProviders = new Set(['ollama', 'cursor', 'cli']);
    let credentials: { apiKey?: string; baseUrl?: string } = {};

    if (!keylessProviders.has(providerName)) {
      const row = db
        .prepare('SELECT api_key, base_url FROM user_llm_keys WHERE user_id = ? AND provider = ?')
        .get(userId, providerName) as LlmKeyRow | undefined;

      if (!row) {
        const hint = cliTool
          ? `CLI tool "${cliTool}" requires local login or an API key in Settings.`
          : `No API key configured for provider: ${providerName}. Add it in Settings.`;
        res.status(400).json({
          error: { code: 'KEY_NOT_CONFIGURED', message: hint },
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

      let transformModel = model;
      // CliProvider keys tools by id (claude-code, codex, …), not by sub-model from the settings UI
      if (providerName === 'cli') {
        if (cliTool && CLI_TRANSFORM_TOOLS.includes(cliTool as (typeof CLI_TRANSFORM_TOOLS)[number])) {
          transformModel = cliTool;
        } else if (CLI_TRANSFORM_TOOLS.includes(model as (typeof CLI_TRANSFORM_TOOLS)[number])) {
          transformModel = model;
        } else {
          res.status(400).json({
            error: {
              code: 'CLI_TOOL_REQUIRED',
              message:
                'For CLI transforms, pass cliTool (claude-code, codex, gemini-cli, or opencode) matching the selected sub-model.',
            },
          });
          return;
        }
      }

      const result = await provider.transform({
        message,
        model: transformModel,
        lang,
        username: userRow.username,
      });
      res.json({ data: { ...result, fallback: fallbackUsed ? providerName : undefined } });
    } catch (err) {
      logger.error({ err, model, providerName, cliTool }, 'LLM transform failed');
      const detail = providerName === 'cli'
        ? `CLI tool failed. Run "${CLI_TOOL_CONFIGS.find((c) => c.id === cliTool)?.bin ?? cliTool} login" or add an API key in Settings.`
        : 'LLM transformation failed';
      res.status(500).json({ error: { code: 'LLM_ERROR', message: detail } });
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

    cliStatusCache.delete(userId);
    res.status(201).json({ data: { provider, label: label ?? null } });
  });

  // DELETE /api/llm/keys/:provider — remove user's key
  router.delete('/keys/:provider', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    db.prepare('DELETE FROM user_llm_keys WHERE user_id = ? AND provider = ?')
      .run(userId, req.params.provider);
    cliStatusCache.delete(userId);
    res.json({ data: { message: 'Key removed' } });
  });

  // GET /api/llm/cli/status — binary detection + per-user models/auth (Settings API keys + local CLI login files)
  // ?refresh=1 to bypass cache — auth required (no server LLM env keys)
  router.get('/cli/status', requireAuth, async (req, res) => {
    const forceRefresh = req.query['refresh'] === '1';
    const userId = req.session.userId!;
    const statuses = await getCliStatus(forceRefresh, db, userId);
    res.json({ data: statuses });
  });

  // POST /api/llm/cli/install — run install command for a CLI tool (local dev only)
  router.post('/cli/install', requireAuth, async (req, res) => {
    const { id } = req.body as { id?: string };
    const config = CLI_TOOL_CONFIGS.find((c) => c.id === id);
    if (!config?.installCmd) {
      res.status(400).json({ error: { code: 'INVALID_TOOL', message: 'Unknown tool or no install command' } });
      return;
    }

    const { spawn } = await import('node:child_process');
    const parts = config.installCmd.trim().split(/\s+/).filter(Boolean);
    const cmd = parts[0];
    const args = parts.slice(1);
    if (!cmd) {
      res.status(400).json({ error: { code: 'INVALID_INSTALL', message: 'Empty install command' } });
      return;
    }
    try {
      await new Promise<void>((resolve, reject) => {
        const child = spawn(cmd, args, { timeout: 120_000, shell: true }) as ChildProcess;
        child.on('close', (code: number | null) => {
          if (code === 0) resolve();
          else reject(new Error(`install exited with code ${String(code)}`));
        });
        child.on('error', reject);
      });
      res.json({ data: { success: true } });
    } catch (err) {
      res.status(500).json({ error: { code: 'INSTALL_FAILED', message: err instanceof Error ? err.message : 'install failed' } });
    }
  });

  return router;
}
