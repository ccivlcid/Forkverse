import { Router } from 'express';
import type { Database } from 'better-sqlite3';
import type { Logger } from 'pino';
import multer from 'multer';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { generateId } from '../lib/id.js';
import { requireAuth } from '../middleware/auth.js';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm', 'video/quicktime',
]);

// Map MIME type to forced extension (prevents .exe masquerading as image)
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function createMediaRouter(db: Database, logger: Logger, uploadsDir: string): Router {
  const router = Router();

  // Ensure uploads directory exists
  mkdirSync(uploadsDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      // Force extension based on MIME type, not user-provided filename
      const ext = MIME_TO_EXT[file.mimetype] ?? '.bin';
      cb(null, `${generateId()}${ext}`);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE, files: 4 },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}`));
      }
    },
  });

  // POST /media/upload — upload up to 4 files, returns media IDs
  router.post('/upload', requireAuth, (req, res, next) => {
    upload.array('files', 4)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(413).json({ error: { code: 'FILE_TOO_LARGE', message: 'File exceeds 50MB limit' } });
            return;
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            res.status(400).json({ error: { code: 'TOO_MANY_FILES', message: 'Maximum 4 files allowed' } });
            return;
          }
        }
        res.status(400).json({ error: { code: 'UPLOAD_ERROR', message: err.message } });
        return;
      }
      next();
    });
  }, (req, res) => {
    const userId = req.session.userId!;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ error: { code: 'NO_FILES', message: 'No files uploaded' } });
      return;
    }

    const media = files.map((file) => {
      const id = generateId();
      const url = `/uploads/${file.filename}`;

      db.prepare(`
        INSERT INTO media_attachments (id, user_id, filename, mime_type, file_size)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, userId, file.filename, file.mimetype, file.size);

      logger.info({ mediaId: id, mime: file.mimetype, size: file.size }, 'Media uploaded');

      return { id, url, mimeType: file.mimetype, fileSize: file.size, width: null, height: null };
    });

    res.status(201).json({ data: media });
  });

  return router;
}
