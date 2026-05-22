import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getUserFromRequest } from '../middleware/auth';
import * as models from '../db/models';
import { randomUUID } from 'node:crypto';

export default async function taskRoutes(app: FastifyInstance) {
  // GET /api/v1/projects/:id/tasks
  app.get<{ Params: { id: string } }>('/api/v1/projects/:id/tasks', async (request, reply) => {
    const tasks = await models.getProjectTasks(request.params.id);
    return { success: true, data: tasks };
  });

  // POST /api/v1/projects/:id/tasks
  app.post<{ Params: { id: string } }>('/api/v1/projects/:id/tasks', async (request, reply) => {
    const user = getUserFromRequest(request);
    const body = request.body as any;
    if (!body.title) return reply.status(400).send({ success: false, error: 'Title is required' });

    const task = await models.createTask({
      id: randomUUID(),
      project_id: request.params.id,
      title: body.title,
      description: body.description,
      due_date: body.due_date,
      priority: body.priority,
      parent_task_id: body.parent_task_id,
      estimated_hours: body.estimated_hours,
      assignee_id: body.assignee_id,
      created_by: user.id,
    });

    return reply.status(201).send({ success: true, data: task });
  });

  // PATCH /api/v1/tasks/:taskId
  app.patch<{ Params: { taskId: string } }>('/api/v1/tasks/:taskId', async (request, reply) => {
    const user = getUserFromRequest(request);
    const body = request.body as any;
    const task = await models.getTaskById(request.params.taskId);
    if (!task) return reply.status(404).send({ success: false, error: 'Task not found' });

    const updated = await models.updateTask(request.params.taskId, body);

    // If status changed to completed, log activity
    if (body.status === 'completed' && task.status !== 'completed') {
      await models.createActivity({
        id: randomUUID(),
        user_id: user.id,
        project_id: task.project_id,
        activity_type: 'task_completed',
        metadata: { task_id: task.id, task_title: task.title },
      });
    }

    return { success: true, data: updated };
  });

  // DELETE /api/v1/tasks/:taskId
  app.delete<{ Params: { taskId: string } }>('/api/v1/tasks/:taskId', async (request, reply) => {
    await models.deleteTask(request.params.taskId);
    return { success: true, data: { deleted: true } };
  });
}
