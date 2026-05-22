import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getUserFromRequest } from '../middleware/auth';
import * as models from '../db/models';
import { randomUUID } from 'node:crypto';

export default async function activityRoutes(app: FastifyInstance) {
  // GET /api/v1/projects/:id/activity?range=...
  app.get<{ Params: { id: string } }>('/api/v1/projects/:id/activity', async (request, reply) => {
    const query = request.query as any;
    const activity = await models.getProjectActivity(request.params.id, {
      start: query.start,
      end: query.end,
    });
    return { success: true, data: activity };
  });

  // POST /api/v1/projects/:id/activity — manual log
  app.post<{ Params: { id: string } }>('/api/v1/projects/:id/activity', async (request, reply) => {
    const user = getUserFromRequest(request);
    const body = request.body as any;

    const activity = await models.createActivity({
      id: randomUUID(),
      user_id: user.id,
      project_id: request.params.id,
      activity_type: body.activity_type || 'time_logged',
      metadata: body.metadata || { hours: body.hours || 1 },
    });

    return reply.status(201).send({ success: true, data: activity });
  });

  // GET /api/v1/projects/:id/contribution-graph
  app.get<{ Params: { id: string } }>('/api/v1/projects/:id/contribution-graph', async (request, reply) => {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    const startDate = new Date(now.getTime() - 364 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const data = await models.getContributionData(request.params.id, startDate, endDate);

    // Build 52-week grid
    const weeks: { date: string; count: number; level: number }[][] = [];
    const dayMap = new Map(data.map((d) => [d.date, d.count]));

    const d = new Date(startDate);
    while (d <= new Date(endDate)) {
      const week: { date: string; count: number; level: number }[] = [];
      for (let i = 0; i < 7; i++) {
        const dateStr = d.toISOString().split('T')[0];
        const count = dayMap.get(dateStr) || 0;
        let level = 0;
        if (count > 0) level = count <= 2 ? 1 : count <= 5 ? 2 : count <= 10 ? 3 : 4;
        week.push({ date: dateStr, count, level });
        d.setDate(d.getDate() + 1);
      }
      weeks.push(week);
    }

    const total = data.reduce((sum, d) => sum + d.count, 0);

    return { success: true, data: { project_id: request.params.id, weeks, total } };
  });

  // GET /api/v1/streaks
  app.get('/api/v1/streaks', async (request, reply) => {
    const user = getUserFromRequest(request);
    const streaks = await models.getStreaks(user.id);
    return { success: true, data: streaks };
  });
}
