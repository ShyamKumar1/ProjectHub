import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getUserFromRequest } from '../middleware/auth';
import * as models from '../db/models';

export default async function userRoutes(app: FastifyInstance) {
  // GET /api/v1/users/me
  app.get('/api/v1/users/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getUserFromRequest(request);
    const fullUser = await models.findUserById(user.id);
    if (!fullUser) return reply.status(404).send({ success: false, error: 'User not found' });
    return { success: true, data: fullUser };
  });

  // PATCH /api/v1/users/me
  app.patch('/api/v1/users/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getUserFromRequest(request);
    const body = request.body as any;
    const updated = await models.updateUser(user.id, body);
    return { success: true, data: updated };
  });

  // GET /api/v1/users/search?q=...
  app.get('/api/v1/users/search', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getUserFromRequest(request);
    const { q } = request.query as { q?: string };
    if (!q) return reply.status(400).send({ success: false, error: 'Query parameter q is required' });
    const results = await models.searchUsers(q, user.id);
    return { success: true, data: results };
  });

  // GET /api/v1/users/:id
  app.get<{ Params: { id: string } }>('/api/v1/users/:id', async (request, reply) => {
    const found = await models.findUserById(request.params.id);
    if (!found) return reply.status(404).send({ success: false, error: 'User not found' });
    const { google_id, github_id, ...safe } = found;
    return { success: true, data: safe };
  });
}
