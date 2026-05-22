import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getUserFromRequest } from '../middleware/auth';
import * as models from '../db/models';
import { randomUUID } from 'node:crypto';

export default async function githubRoutes(app: FastifyInstance) {
  // POST /api/v1/projects/:id/link-repo
  app.post<{ Params: { id: string } }>('/api/v1/projects/:id/link-repo', async (request, reply) => {
    const user = getUserFromRequest(request);
    const body = request.body as { repo: string };
    if (!body.repo) return reply.status(400).send({ success: false, error: 'repo (owner/repo) is required' });

    await models.linkRepo({
      id: randomUUID(),
      project_id: request.params.id,
      user_id: user.id,
      github_repo_full_name: body.repo,
    });

    return { success: true, data: { linked: true, repo: body.repo } };
  });

  // GET /api/v1/projects/:id/repo-status
  app.get<{ Params: { id: string } }>('/api/v1/projects/:id/repo-status', async (request, reply) => {
    const linked = await models.getLinkedRepo(request.params.id);
    if (!linked) return { success: true, data: null };

    // Try to fetch from GitHub API (if user has GitHub token)
    try {
      const res = await fetch(`https://api.github.com/repos/${linked.github_repo_full_name}`, {
        headers: process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {},
      });
      if (res.ok) {
        const gh = await res.json();
        return {
          success: true,
          data: {
            ...linked,
            repo_data: {
              description: gh.description,
              language: gh.language,
              stars: gh.stargazers_count,
              forks: gh.forks_count,
              open_issues: gh.open_issues_count,
              pushed_at: gh.pushed_at,
            },
          },
        };
      }
    } catch {
      // Fallback
    }

    return { success: true, data: linked };
  });
}
