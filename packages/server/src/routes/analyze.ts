import { Router } from 'express';
import type { Database } from 'better-sqlite3';
import type { Logger } from 'pino';
import { z } from 'zod';
import { generateId } from '../lib/id.js';
import { requireAuth } from '../middleware/auth.js';
import type { AnalysisProgress } from '@forkverse/shared';

const startSchema = z.object({
  repoOwner: z.string().min(1).max(100),
  repoName: z.string().min(1).max(100),
  outputType: z.enum(['report', 'pptx', 'video']).default('report'),
  llmModel: z.string().min(1),
  lang: z.string().length(2).default('en'),
  userPrompt: z.string().max(500).optional(),
  options: z.record(z.unknown()).default({}),
});

interface AnalysisRow {
  id: string;
  user_id: string;
  repo_owner: string;
  repo_name: string;
  output_type: string;
  llm_model: string;
  lang: string;
  options_json: string;
  result_url: string | null;
  result_summary: string | null;
  result_sections_json: string | null;
  status: string;
  progress_json: string;
  duration_ms: number | null;
  created_at: string;
}

function mapAnalysis(row: AnalysisRow) {
  return {
    id: row.id,
    userId: row.user_id,
    repoOwner: row.repo_owner,
    repoName: row.repo_name,
    outputType: row.output_type,
    llmModel: row.llm_model,
    lang: row.lang,
    optionsJson: JSON.parse(row.options_json) as Record<string, unknown>,
    resultUrl: row.result_url,
    resultSummary: row.result_summary,
    sections: row.result_sections_json ? JSON.parse(row.result_sections_json) : null,
    status: row.status,
    progress: JSON.parse(row.progress_json) as AnalysisProgress[],
    durationMs: row.duration_ms,
    createdAt: row.created_at,
  };
}

interface AnalysisWithUserRow extends AnalysisRow {
  username: string;
  domain: string | null;
  display_name: string;
  avatar_url: string | null;
  star_count: number;
}

function mapAnalysisWithUser(row: AnalysisWithUserRow, isStarred: boolean) {
  return {
    ...mapAnalysis(row),
    user: {
      username: row.username,
      domain: row.domain,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
    },
    starCount: row.star_count,
    isStarred,
  };
}

export function createAnalyzeRouter(db: Database, logger: Logger): Router {
  const router = Router();

  // POST /api/analyze — enqueue analysis job
  router.post('/', requireAuth, async (req, res) => {
    const parsed = startSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
      return;
    }

    const { repoOwner, repoName, outputType, llmModel, lang, userPrompt, options } = parsed.data;
    const userId = req.session.userId!;
    const analysisId = generateId();
    const jobId = generateId();

    // Create analysis record
    db.prepare(`
      INSERT INTO analyses (id, user_id, repo_owner, repo_name, output_type, llm_model, lang, options_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(analysisId, userId, repoOwner, repoName, outputType, llmModel, lang, JSON.stringify({ ...options, userPrompt }));

    // Enqueue job
    db.prepare(`
      INSERT INTO analysis_jobs (id, analysis_id) VALUES (?, ?)
    `).run(jobId, analysisId);

    logger.info({ analysisId, jobId, repoOwner, repoName }, 'Analysis job enqueued');

    const row = db.prepare('SELECT * FROM analyses WHERE id = ?').get(analysisId) as AnalysisRow;
    res.status(201).json({ data: mapAnalysis(row) });
  });

  // GET /api/analyze — list user's analyses
  router.get('/', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const rows = db.prepare('SELECT * FROM analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(userId) as AnalysisRow[];
    res.json({ data: rows.map(mapAnalysis) });
  });

  // GET /api/analyze/:id — get single analysis (owner only)
  router.get('/:id', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const row = db.prepare('SELECT * FROM analyses WHERE id = ? AND user_id = ?').get(req.params.id, userId) as AnalysisRow | undefined;
    if (!row) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Analysis not found' } });
      return;
    }
    res.json({ data: mapAnalysis(row) });
  });

  // GET /api/analyze/:id/progress — SSE progress streaming
  router.get('/:id/progress', (req, res) => {
    const row = db.prepare('SELECT id, status, progress_json FROM analyses WHERE id = ?').get(req.params.id) as { id: string; status: string; progress_json: string } | undefined;
    if (!row) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Analysis not found' } });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const send = (data: unknown) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Send current state immediately
    send({ status: row.status, progress: JSON.parse(row.progress_json) });

    if (row.status === 'completed' || row.status === 'failed') {
      res.end();
      return;
    }

    // Poll for updates
    const interval = setInterval(() => {
      try {
        const current = db.prepare('SELECT status, progress_json FROM analyses WHERE id = ?').get(req.params.id) as { status: string; progress_json: string } | undefined;
        if (!current) { clearInterval(interval); res.end(); return; }

        send({ status: current.status, progress: JSON.parse(current.progress_json) });

        if (current.status === 'completed' || current.status === 'failed') {
          clearInterval(interval);
          res.end();
        }
      } catch {
        clearInterval(interval);
        res.end();
      }
    }, 1000);

    req.on('close', () => { clearInterval(interval); });
  });

  // GET /api/analyze/:id/download
  router.get('/:id/download', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const row = db.prepare('SELECT * FROM analyses WHERE id = ? AND user_id = ?').get(req.params.id, userId) as AnalysisRow | undefined;

    if (!row) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Analysis not found' } });
      return;
    }
    if (row.status !== 'completed' || !row.result_url) {
      res.status(400).json({ error: { code: 'NOT_READY', message: 'File not available' } });
      return;
    }

    if (row.output_type === 'video') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', 'inline');
      res.sendFile(row.result_url);
    } else {
      const filename = `${row.repo_owner}-${row.repo_name}-analysis.pptx`;
      res.download(row.result_url, filename);
    }
  });

  // POST /api/analyze/:id/share — create feed post from analysis
  router.post('/:id/share', requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const row = db.prepare('SELECT * FROM analyses WHERE id = ? AND user_id = ?').get(req.params.id, userId) as AnalysisRow | undefined;

    if (!row) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Analysis not found' } });
      return;
    }
    if (row.status !== 'completed') {
      res.status(400).json({ error: { code: 'NOT_COMPLETED', message: 'Analysis not completed yet' } });
      return;
    }

    const shareSchema = z.object({ caption: z.string().max(2000).optional() });
    const parsed = shareSchema.safeParse(req.body);
    const caption = parsed.success ? parsed.data.caption : undefined;

    const summary = row.result_summary ?? '';
    const firstLine = summary.split('\n').find((l) => l.trim()) ?? '';
    const messageRaw = caption ?? `Analyzed ${row.repo_owner}/${row.repo_name} (${row.output_type})\n\n${summary.slice(0, 500)}`;
    const messageCli = `analyze --repo=${row.repo_owner}/${row.repo_name} --output=${row.output_type} --model=${row.llm_model}\n# ${firstLine.slice(0, 120)}`;

    const postId = generateId();
    const tags = JSON.stringify(['analysis', row.output_type, 'github']);

    db.prepare(`
      INSERT INTO posts (id, user_id, message_raw, message_cli, lang, tags, mentions, visibility, llm_model, intent, emotion)
      VALUES (?, ?, ?, ?, ?, ?, '[]', 'public', ?, 'announcement', 'neutral')
    `).run(postId, userId, messageRaw, messageCli, row.lang, tags, row.llm_model);

    try {
      const ghRes = await fetch(`https://api.github.com/repos/${row.repo_owner}/${row.repo_name}`, {
        headers: { 'User-Agent': 'Forkverse', Accept: 'application/vnd.github.v3+json' },
      });
      if (ghRes.ok) {
        const ghRepo = await ghRes.json() as { stargazers_count: number; forks_count: number; language: string | null };
        db.prepare('INSERT OR REPLACE INTO repo_attachments (post_id, repo_owner, repo_name, repo_stars, repo_forks, repo_language) VALUES (?, ?, ?, ?, ?, ?)').run(postId, row.repo_owner, row.repo_name, ghRepo.stargazers_count, ghRepo.forks_count, ghRepo.language);
      }
    } catch { /* skip */ }

    res.status(201).json({ data: { postId } });
  });

  // GET /api/analyze/popular — public
  router.get('/popular', (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const period = (req.query.period as string) ?? 'all';
    const daysMap: Record<string, number> = { day: 1, week: 7, month: 30, all: 0 };
    const days = daysMap[period] ?? 0;

    const query = days > 0
      ? `SELECT a.*, u.username, u.domain, u.display_name, u.avatar_url,
           (SELECT COUNT(*) FROM analysis_stars WHERE analysis_id = a.id) AS star_count
         FROM analyses a JOIN users u ON u.id = a.user_id
         WHERE a.status = 'completed' AND a.created_at >= datetime('now', '-' || ? || ' days')
         ORDER BY star_count DESC, a.created_at DESC LIMIT ?`
      : `SELECT a.*, u.username, u.domain, u.display_name, u.avatar_url,
           (SELECT COUNT(*) FROM analysis_stars WHERE analysis_id = a.id) AS star_count
         FROM analyses a JOIN users u ON u.id = a.user_id
         WHERE a.status = 'completed'
         ORDER BY star_count DESC, a.created_at DESC LIMIT ?`;

    const rows = (days > 0
      ? db.prepare(query).all(String(days), limit)
      : db.prepare(query).all(limit)
    ) as AnalysisWithUserRow[];

    res.json({ data: rows.map((r) => mapAnalysisWithUser(r, false)) });
  });

  // GET /api/analyze/detail/:id — public shareable
  router.get('/detail/:id', (req, res) => {
    const row = db.prepare(`
      SELECT a.*, u.username, u.domain, u.display_name, u.avatar_url,
        (SELECT COUNT(*) FROM analysis_stars WHERE analysis_id = a.id) AS star_count
      FROM analyses a
      JOIN users u ON u.id = a.user_id
      WHERE a.id = ? AND a.status = 'completed'
    `).get(req.params.id) as AnalysisWithUserRow | undefined;

    if (!row) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Analysis not found' } });
      return;
    }

    let isStarred = false;
    const userId = req.session?.userId;
    if (userId) {
      const star = db.prepare('SELECT 1 FROM analysis_stars WHERE user_id = ? AND analysis_id = ?').get(userId, row.id);
      isStarred = !!star;
    }

    res.json({ data: mapAnalysisWithUser(row, isStarred) });
  });

  // POST /api/analyze/:id/star — toggle star
  router.post('/:id/star', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const analysisId = req.params.id;

    const analysis = db.prepare('SELECT id FROM analyses WHERE id = ? AND status = ?').get(analysisId, 'completed');
    if (!analysis) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Analysis not found' } });
      return;
    }

    const existing = db.prepare('SELECT 1 FROM analysis_stars WHERE user_id = ? AND analysis_id = ?').get(userId, analysisId);

    if (existing) {
      db.prepare('DELETE FROM analysis_stars WHERE user_id = ? AND analysis_id = ?').run(userId, analysisId);
    } else {
      db.prepare('INSERT INTO analysis_stars (user_id, analysis_id) VALUES (?, ?)').run(userId, analysisId);
    }

    const count = db.prepare('SELECT COUNT(*) AS cnt FROM analysis_stars WHERE analysis_id = ?').get(analysisId) as { cnt: number };
    res.json({ data: { starred: !existing, starCount: count.cnt } });
  });

  // POST /api/analyze/compare — start comparison analysis
  router.post('/compare', requireAuth, (req, res) => {
    const compareSchema = z.object({
      repoA: z.string().min(3).max(200), // owner/name
      repoB: z.string().min(3).max(200),
      llmModel: z.string().min(1),
      lang: z.string().length(2).default('en'),
    });

    const parsed = compareSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
      return;
    }

    const userId = req.session.userId!;
    const id = generateId();
    const [aOwner, aName] = parsed.data.repoA.split('/');
    const [bOwner, bName] = parsed.data.repoB.split('/');

    if (!aOwner || !aName || !bOwner || !bName) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Format: owner/repo' } });
      return;
    }

    db.prepare(`
      INSERT INTO comparisons (id, user_id, repo_a_owner, repo_a_name, repo_b_owner, repo_b_name, llm_model, lang)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, aOwner, aName, bOwner, bName, parsed.data.llmModel, parsed.data.lang);

    // Run comparison analysis for both repos in parallel
    // Creates two separate analysis jobs, results combined by comparison ID
    const analysisAId = generateId();
    const analysisBId = generateId();
    const jobAId = generateId();
    const jobBId = generateId();

    db.prepare(`INSERT INTO analyses (id, user_id, repo_owner, repo_name, output_type, llm_model, lang, options_json) VALUES (?, ?, ?, ?, 'report', ?, ?, ?)`)
      .run(analysisAId, userId, aOwner, aName, parsed.data.llmModel, parsed.data.lang, JSON.stringify({ comparisonId: id }));
    db.prepare(`INSERT INTO analyses (id, user_id, repo_owner, repo_name, output_type, llm_model, lang, options_json) VALUES (?, ?, ?, ?, 'report', ?, ?, ?)`)
      .run(analysisBId, userId, bOwner, bName, parsed.data.llmModel, parsed.data.lang, JSON.stringify({ comparisonId: id }));

    db.prepare(`INSERT INTO analysis_jobs (id, analysis_id) VALUES (?, ?)`).run(jobAId, analysisAId);
    db.prepare(`INSERT INTO analysis_jobs (id, analysis_id) VALUES (?, ?)`).run(jobBId, analysisBId);

    res.status(201).json({ data: { id, analysisAId, analysisBId, status: 'pending' } });
  });

  // GET /api/analyze/compare/:id — get comparison result
  router.get('/compare/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM comparisons WHERE id = ?').get(req.params.id) as {
      id: string; user_id: string; repo_a_owner: string; repo_a_name: string;
      repo_b_owner: string; repo_b_name: string; llm_model: string; lang: string;
      result_json: string | null; status: string; duration_ms: number | null; created_at: string;
    } | undefined;

    if (!row) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Comparison not found' } });
      return;
    }

    res.json({
      data: {
        id: row.id,
        repoA: `${row.repo_a_owner}/${row.repo_a_name}`,
        repoB: `${row.repo_b_owner}/${row.repo_b_name}`,
        llmModel: row.llm_model,
        lang: row.lang,
        result: row.result_json ? JSON.parse(row.result_json) : null,
        status: row.status,
        durationMs: row.duration_ms,
        createdAt: row.created_at,
      },
    });
  });

  return router;
}
