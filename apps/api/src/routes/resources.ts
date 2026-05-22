import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getUserFromRequest } from '../middleware/auth';
import * as models from '../db/models';
import { randomUUID } from 'node:crypto';

export default async function resourceRoutes(app: FastifyInstance) {
  // GET /api/v1/projects/:id/resources
  app.get<{ Params: { id: string } }>('/api/v1/projects/:id/resources', async (request, reply) => {
    const resources = await models.getProjectResources(request.params.id);
    return { success: true, data: resources };
  });

  // POST /api/v1/projects/:id/resources
  app.post<{ Params: { id: string } }>('/api/v1/projects/:id/resources', async (request, reply) => {
    const user = getUserFromRequest(request);
    const body = request.body as any;
    if (!body.url) return reply.status(400).send({ success: false, error: 'URL is required' });

    // Try to fetch OG metadata
    let title = body.title || '';
    let description = body.description || '';
    let favicon_url = null;
    let og_image_url = null;

    try {
      const res = await fetch(body.url);
      const html = await res.text();
      const getMeta = (name: string) => {
        const regex = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
        const match = regex.exec(html);
        return match ? match[1] : null;
      };
      title = title || getMeta('og:title') || getMeta('twitter:title') || body.url;
      description = description || getMeta('og:description') || getMeta('description') || '';
      og_image_url = getMeta('og:image') || null;
      // Favicon
      const faviconMatch = /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i.exec(html);
      if (faviconMatch) favicon_url = faviconMatch[1];
    } catch {
      // Silently fail metadata fetch
    }

    const resource = await models.createResource({
      id: randomUUID(),
      project_id: request.params.id,
      url: body.url,
      title,
      description,
      favicon_url,
      og_image_url,
      category: body.category || 'other',
      notes: body.notes || '',
      added_by: user.id,
    });

    // Log activity
    await models.createActivity({
      id: randomUUID(),
      user_id: user.id,
      project_id: request.params.id,
      activity_type: 'resource_added',
      metadata: { resource_id: resource.id, url: body.url },
    });

    return reply.status(201).send({ success: true, data: resource });
  });

  // DELETE /api/v1/resources/:resourceId
  app.delete<{ Params: { resourceId: string } }>('/api/v1/resources/:resourceId', async (request, reply) => {
    await models.deleteResource(request.params.resourceId);
    return { success: true, data: { deleted: true } };
  });
}
