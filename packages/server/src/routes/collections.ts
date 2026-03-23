import { Router } from 'express';
import type { Database } from 'better-sqlite3';
import { z } from 'zod';
import { generateId } from '../lib/id.js';
import { requireAuth } from '../middleware/auth.js';

interface CollectionRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: number;
  created_at: string;
}

interface CollectionItemRow {
  analysis_id: string;
  repo_owner: string;
  repo_name: string;
  output_type: string;
  status: string;
  added_at: string;
}

function mapCollection(row: CollectionRow) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    isPublic: !!row.is_public,
    createdAt: row.created_at,
  };
}

export function createCollectionsRouter(db: Database): Router {
  const router = Router();

  // GET /api/collections — list user's collections
  router.get('/', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const rows = db.prepare(`
      SELECT c.*, (SELECT COUNT(*) FROM collection_items WHERE collection_id = c.id) AS item_count
      FROM collections c WHERE c.user_id = ? ORDER BY c.created_at DESC
    `).all(userId) as (CollectionRow & { item_count: number })[];

    res.json({
      data: rows.map((r) => ({ ...mapCollection(r), itemCount: r.item_count })),
    });
  });

  // POST /api/collections — create collection
  router.post('/', requireAuth, (req, res) => {
    const schema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      isPublic: z.boolean().default(false),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
      return;
    }

    const userId = req.session.userId!;
    const id = generateId();
    const { name, description, isPublic } = parsed.data;

    db.prepare('INSERT INTO collections (id, user_id, name, description, is_public) VALUES (?, ?, ?, ?, ?)')
      .run(id, userId, name, description ?? null, isPublic ? 1 : 0);

    const row = db.prepare('SELECT * FROM collections WHERE id = ?').get(id) as CollectionRow;
    res.status(201).json({ data: { ...mapCollection(row), itemCount: 0 } });
  });

  // DELETE /api/collections/:id
  router.delete('/:id', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const result = db.prepare('DELETE FROM collections WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    if (result.changes === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Collection not found' } });
      return;
    }
    res.json({ data: { deleted: true } });
  });

  // GET /api/collections/:id/items — list analyses in a collection
  router.get('/:id/items', (req, res) => {
    const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id) as CollectionRow | undefined;
    if (!collection) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Collection not found' } });
      return;
    }
    // Private collections only visible to owner
    if (!collection.is_public && collection.user_id !== req.session?.userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Collection not found' } });
      return;
    }

    const items = db.prepare(`
      SELECT ci.analysis_id, a.repo_owner, a.repo_name, a.output_type, a.status, ci.added_at
      FROM collection_items ci
      JOIN analyses a ON a.id = ci.analysis_id
      WHERE ci.collection_id = ?
      ORDER BY ci.added_at DESC
    `).all(req.params.id) as CollectionItemRow[];

    res.json({ data: { collection: mapCollection(collection), items } });
  });

  // POST /api/collections/:id/items — add analysis to collection
  router.post('/:id/items', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const collection = db.prepare('SELECT * FROM collections WHERE id = ? AND user_id = ?').get(req.params.id, userId) as CollectionRow | undefined;
    if (!collection) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Collection not found' } });
      return;
    }

    const { analysisId } = req.body as { analysisId?: string };
    if (!analysisId) {
      res.status(400).json({ error: { code: 'MISSING_FIELD', message: 'analysisId required' } });
      return;
    }

    const analysis = db.prepare('SELECT id FROM analyses WHERE id = ?').get(analysisId);
    if (!analysis) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Analysis not found' } });
      return;
    }

    db.prepare('INSERT OR IGNORE INTO collection_items (collection_id, analysis_id) VALUES (?, ?)').run(req.params.id, analysisId);
    res.json({ data: { added: true } });
  });

  // DELETE /api/collections/:id/items/:analysisId
  router.delete('/:id/items/:analysisId', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const collection = db.prepare('SELECT id FROM collections WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    if (!collection) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Collection not found' } });
      return;
    }

    db.prepare('DELETE FROM collection_items WHERE collection_id = ? AND analysis_id = ?').run(req.params.id, req.params.analysisId);
    res.json({ data: { removed: true } });
  });

  return router;
}
