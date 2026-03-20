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
import { createErrorHandler } from './middleware/error.js';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(process.env.NODE_ENV !== 'production' ? { transport: { target: 'pino-pretty' } } : {}),
});

const DB_PATH = process.env.DATABASE_URL ?? path.join(process.cwd(), 'clitoris.db');
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

app.get('/api/health', (_req, res) => {
  res.json({ data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use(createErrorHandler(logger));

const PORT = 3771;
const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started');
});

const shutdown = (signal: string) => {
  logger.info({ signal }, 'Shutting down...');
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
