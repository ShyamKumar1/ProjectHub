import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getUserFromRequest } from '../middleware/auth';
import * as models from '../db/models';
import { randomUUID } from 'node:crypto';

export default async function projectRoutes(app: FastifyInstance) {
  // GET /api/v1/projects
  app.get('/api/v1/projects', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getUserFromRequest(request);
    const projects = await models.getUserProjects(user.id);
    return { success: true, data: projects };
  });

  // POST /api/v1/projects
  app.post('/api/v1/projects', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getUserFromRequest(request);
    const body = request.body as any;
    if (!body.name) return reply.status(400).send({ success: false, error: 'Name is required' });

    const project = await models.createProject({
      id: randomUUID(),
      owner_id: user.id,
      name: body.name,
      description: body.description,
      icon: body.icon,
      status: body.status,
      visibility: body.visibility,
    });

    // Log activity
    await models.createActivity({
      id: randomUUID(),
      user_id: user.id,
      project_id: project.id,
      activity_type: 'project_created',
    });

    return reply.status(201).send({ success: true, data: project });
  });

  // GET /api/v1/projects/:id
  app.get<{ Params: { id: string } }>('/api/v1/projects/:id', async (request, reply) => {
    const user = getUserFromRequest(request);
    const project = await models.getProjectById(request.params.id);
    if (!project) return reply.status(404).send({ success: false, error: 'Project not found' });

    const members = await models.getProjectMembers(project.id);
    const tasks = await models.getProjectTasks(project.id);
    const resources = await models.getProjectResources(project.id);
    const activity = await models.getProjectActivity(project.id, undefined, 20);
    const linkedRepo = await models.getLinkedRepo(project.id);

    return {
      success: true,
      data: {
        ...project,
        members,
        tasks,
        resources,
        activity,
        linked_repo: linkedRepo,
      },
    };
  });

  // PATCH /api/v1/projects/:id
  app.patch<{ Params: { id: string } }>('/api/v1/projects/:id', async (request, reply) => {
    const user = getUserFromRequest(request);
    const project = await models.getProjectById(request.params.id);
    if (!project) return reply.status(404).send({ success: false, error: 'Project not found' });
    if (project.owner_id !== user.id) {
      const role = await models.getUserProjectRole(project.id, user.id);
      if (role !== 'admin' && role !== 'editor') {
        return reply.status(403).send({ success: false, error: 'Not authorized' });
      }
    }

    const body = request.body as any;
    const updated = await models.updateProject(request.params.id, body);
    return { success: true, data: updated };
  });

  // DELETE /api/v1/projects/:id
  app.delete<{ Params: { id: string } }>('/api/v1/projects/:id', async (request, reply) => {
    const user = getUserFromRequest(request);
    const project = await models.getProjectById(request.params.id);
    if (!project) return reply.status(404).send({ success: false, error: 'Project not found' });
    if (project.owner_id !== user.id) {
      return reply.status(403).send({ success: false, error: 'Only the owner can delete a project' });
    }

    await models.deleteProject(request.params.id);
    return { success: true, data: { deleted: true } };
  });
}
