import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { authMiddleware } from './middleware/auth';
import 'dotenv/config';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import activityRoutes from './routes/activity';
import resourceRoutes from './routes/resources';
import collaborationRoutes from './routes/collaboration';
import githubRoutes from './routes/github';
import notificationRoutes from './routes/notifications';

async function start() {
  const app = Fastify({
    logger: true,
  });

  // Plugins
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'projecthub-dev-secret-change-in-production',
    cookie: {
      cookieName: 'token',
      signed: false,
    },
  });

  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'projecthub-cookie-secret',
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Public routes
  await app.register(authRoutes);

  // Protected routes — require auth
  app.addHook('onRequest', async (request, reply) => {
    // Skip auth and health routes
    if (request.url.startsWith('/api/v1/auth/') || request.url.startsWith('/api/v1/health')) return;
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({ success: false, error: 'Unauthorized' });
    }
  });

  await app.register(userRoutes);
  await app.register(projectRoutes);
  await app.register(taskRoutes);
  await app.register(activityRoutes);
  await app.register(resourceRoutes);
  await app.register(collaborationRoutes);
  await app.register(githubRoutes);
  await app.register(notificationRoutes);

  // Health check
  app.get('/api/v1/health', async () => ({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } }));

  // Start
  const port = parseInt(process.env.PORT || '4000', 10);
  const host = process.env.HOST || '0.0.0.0';
  await app.listen({ port, host });
  console.log(`🏗️  ProjectHub API running on http://${host}:${port}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
