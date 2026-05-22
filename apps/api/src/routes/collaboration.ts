import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getUserFromRequest } from '../middleware/auth';
import * as models from '../db/models';
import { randomUUID } from 'node:crypto';

export default async function collaborationRoutes(app: FastifyInstance) {
  // ─── Friendships ─────────────────────────────────────

  // POST /api/v1/friends/request
  app.post('/api/v1/friends/request', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getUserFromRequest(request);
    const body = request.body as { user_id: string };
    if (!body.user_id) return reply.status(400).send({ success: false, error: 'user_id is required' });
    if (body.user_id === user.id) return reply.status(400).send({ success: false, error: 'Cannot friend yourself' });

    // Check user exists
    const target = await models.findUserById(body.user_id);
    if (!target) return reply.status(404).send({ success: false, error: 'User not found' });

    await models.sendFriendRequest(user.id, body.user_id);

    // Create notification
    await models.createNotification({
      id: randomUUID(),
      user_id: body.user_id,
      type: 'friend_request',
      title: `${user.name} sent you a friend request`,
      metadata: { from_user_id: user.id },
    });

    return { success: true, data: { sent: true } };
  });

  // GET /api/v1/friends
  app.get('/api/v1/friends', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getUserFromRequest(request);
    const friends = await models.getFriends(user.id);
    return { success: true, data: friends };
  });

  // GET /api/v1/friends/requests
  app.get('/api/v1/friends/requests', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getUserFromRequest(request);
    const requests = await models.getPendingRequests(user.id);
    return { success: true, data: requests };
  });

  // POST /api/v1/friends/accept
  app.post('/api/v1/friends/accept', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getUserFromRequest(request);
    const body = request.body as { user_id: string };
    const accepted = await models.acceptFriendRequest(body.user_id, user.id);
    if (!accepted) return reply.status(400).send({ success: false, error: 'No pending request found' });
    return { success: true, data: { accepted: true } };
  });

  // POST /api/v1/friends/block
  app.post('/api/v1/friends/block', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getUserFromRequest(request);
    const body = request.body as { user_id: string };
    await models.blockFriendship(user.id, body.user_id);
    return { success: true, data: { blocked: true } };
  });

  // ─── Project Members ────────────────────────────────

  // POST /api/v1/projects/:id/members
  app.post<{ Params: { id: string } }>('/api/v1/projects/:id/members', async (request, reply) => {
    const user = getUserFromRequest(request);
    const project = await models.getProjectById(request.params.id);
    if (!project) return reply.status(404).send({ success: false, error: 'Project not found' });
    if (project.owner_id !== user.id) {
      return reply.status(403).send({ success: false, error: 'Only owner can add members' });
    }

    const body = request.body as { user_id: string; role?: string };
    const member = await models.addMember(request.params.id, body.user_id, body.role || 'viewer');

    // Notification
    await models.createNotification({
      id: randomUUID(),
      user_id: body.user_id,
      type: 'member_added',
      title: `You were added to "${project.name}"`,
      metadata: { project_id: project.id, role: body.role || 'viewer' },
    });

    // Log activity
    await models.createActivity({
      id: randomUUID(),
      user_id: user.id,
      project_id: request.params.id,
      activity_type: 'member_added',
      metadata: { new_user_id: body.user_id },
    });

    return reply.status(201).send({ success: true, data: member });
  });

  // PATCH /api/v1/projects/:id/members/:userId
  app.patch<{ Params: { id: string; userId: string } }>('/api/v1/projects/:id/members/:userId', async (request, reply) => {
    const user = getUserFromRequest(request);
    const project = await models.getProjectById(request.params.id);
    if (!project) return reply.status(404).send({ success: false, error: 'Project not found' });
    if (project.owner_id !== user.id) {
      return reply.status(403).send({ success: false, error: 'Only owner can change roles' });
    }

    const body = request.body as { role: string };
    await models.updateMemberRole(request.params.id, request.params.userId, body.role);
    return { success: true, data: { updated: true } };
  });

  // DELETE /api/v1/projects/:id/members/:userId
  app.delete<{ Params: { id: string; userId: string } }>('/api/v1/projects/:id/members/:userId', async (request, reply) => {
    const user = getUserFromRequest(request);
    const project = await models.getProjectById(request.params.id);
    if (!project) return reply.status(404).send({ success: false, error: 'Project not found' });
    if (project.owner_id !== user.id) {
      return reply.status(403).send({ success: false, error: 'Only owner can remove members' });
    }

    await models.removeMember(request.params.id, request.params.userId);
    return { success: true, data: { removed: true } };
  });
}
