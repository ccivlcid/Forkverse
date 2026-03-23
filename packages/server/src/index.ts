import './loadEnv.js';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import pino from 'pino';
import path from 'node:path';

import { createDb } from './db/index.js';
import { createAuthRouter } from './routes/auth.js';
import { createPostsRouter } from './routes/posts.js';
import { createUsersRouter } from './routes/users.js';
import { createLlmRouter } from './routes/llm.js';
import { createAnalyzeRouter } from './routes/analyze.js';
import { createGithubRouter } from './routes/github.js';
import { createWebhookRouter } from './routes/webhook.js';
import { createActivityRouter } from './routes/activity.js';
import { createNotificationRouter } from './routes/notifications.js';
import { createInfluenceRouter } from './routes/influence.js';
import { createMessagesRouter } from './routes/messages.js';
import { createMediaRouter } from './routes/media.js';
import { createCollectionsRouter } from './routes/collections.js';
import { createErrorHandler } from './middleware/error.js';
import { startWorker } from './lib/worker.js';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(process.env.NODE_ENV !== 'production' ? { transport: { target: 'pino-pretty' } } : {}),
});

const DB_PATH = process.env.DATABASE_URL ?? path.join(process.cwd(), 'forkverse.db');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const db = createDb(DB_PATH, logger);

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:7878',
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET ?? 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  },
}));

app.use('/api/auth', createAuthRouter(db, logger));
app.use('/api/posts', createPostsRouter(db, logger));
app.use('/api/users', createUsersRouter(db));
app.use('/api/llm', createLlmRouter(db, logger));
app.use('/api/analyze', createAnalyzeRouter(db, logger));
app.use('/api/github', createGithubRouter(db));
app.use('/api/webhook', createWebhookRouter(db, logger));
app.use('/api/activity', createActivityRouter(db));
app.use('/api/notifications', createNotificationRouter(db));
app.use('/api/influence', createInfluenceRouter(db));
app.use('/api/messages', createMessagesRouter(db));
app.use('/api/media', createMediaRouter(db, logger, UPLOADS_DIR));
app.use('/api/collections', createCollectionsRouter(db));
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/api/health', (_req, res) => {
  res.json({ data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Deep link verification for native apps
app.get('/.well-known/assetlinks.json', (_req, res) => {
  res.json([{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'social.terminal.app',
      sha256_cert_fingerprints: [process.env.ANDROID_CERT_FINGERPRINT ?? ''],
    },
  }]);
});

app.get('/.well-known/apple-app-site-association', (_req, res) => {
  res.json({
    applinks: {
      apps: [],
      details: [{
        appID: `${process.env.APPLE_TEAM_ID ?? 'TEAMID'}.social.terminal.app`,
        paths: ['/*'],
      }],
    },
  });
});

app.use(createErrorHandler(logger));

const PORT = 3771;
const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started');
});

// Start the analysis worker (in-process for MVP; can be a separate process later)
const stopWorker = startWorker(db, logger);

const shutdown = (signal: string) => {
  logger.info({ signal }, 'Shutting down...');
  stopWorker();
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
