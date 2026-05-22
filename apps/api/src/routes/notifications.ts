import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getUserFromRequest } from '../middleware/auth';
import * as models from '../db/models';

export default async function notificationRoutes(app: FastifyInstance) {
  // GET /api/v1/notifications
  app.get('/api/v1/notifications', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getUserFromRequest(request);
    const notifications = await models.getUserNotifications(user.id);
    return { success: true, data: notifications };
  });

  // PATCH /api/v1/notifications/read-all
  app.patch('/api/v1/notifications/read-all', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getUserFromRequest(request);
    await models.markNotificationsRead(user.id);
    return { success: true, data: { read: true } };
  });
}
