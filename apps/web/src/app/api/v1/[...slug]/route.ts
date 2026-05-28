import { NextRequest } from 'next/server';
import getSql from '@/lib/db';
import { getUserFromSession, signToken, verifyToken, json, error } from '@/lib/auth';
import { cookies } from 'next/headers';

type Handler = (req: NextRequest, sql: any, user: any, params: string[]) => Promise<Response>;

// ─── Route map ───────────────────────────────────────────

const routes = new Map<string, { GET?: Handler; POST?: Handler; PATCH?: Handler; DELETE?: Handler }>();

function route(path: string, methods: { GET?: Handler; POST?: Handler; PATCH?: Handler; DELETE?: Handler }) {
  routes.set(path, methods);
}

// ─── Auth Routes ─────────────────────────────────────────

route('auth/google', {
  POST: async (req, sql, _user, _p) => {
    const { code, code_verifier, redirect_uri } = await req.json();
    if (!code) return error('Authorization code required');

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirect_uri || '',
        grant_type: 'authorization_code',
        ...(code_verifier ? { code_verifier } : {}),
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return error('Failed to exchange authorization code: ' + (tokenData.error || 'unknown'));
    }

    // Fetch user info with the access token
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!res.ok) return error('Invalid Google token', 401);

    const gu = await res.json();
    let users = await sql`SELECT * FROM users WHERE google_id = ${gu.id}`;

    if (users.length === 0) {
      const existing = await sql`SELECT * FROM users WHERE email = ${gu.email}`;
      if (existing.length > 0) {
        await sql`UPDATE users SET google_id = ${gu.id}, avatar_url = COALESCE(avatar_url, ${gu.picture}) WHERE id = ${existing[0].id}`;
        users = await sql`SELECT * FROM users WHERE id = ${existing[0].id}`;
      } else {
        await sql`INSERT INTO users (id, email, name, avatar_url, google_id) VALUES (gen_random_uuid(), ${gu.email}, ${gu.name}, ${gu.picture}, ${gu.id})`;
        users = await sql`SELECT * FROM users WHERE google_id = ${gu.id}`;
      }
    }
    const user = users[0];
    const token = await signToken({ id: user.id, email: user.email, name: user.name });

    // Set cookie
    const response = json({
      success: true,
      data: { token, user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url, timezone: user.timezone } },
    });
    response.headers.set('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    return response;
  },
});

route('auth/session', {
  GET: async (req, sql, _user, _p) => {
    if (!_user) return error('Not authenticated', 401);
    const users = await sql`SELECT * FROM users WHERE id = ${_user.id}`;
    if (users.length === 0) return error('Session expired', 401);
    const u = users[0];
    return json({
      success: true,
      data: {
        user: { id: u.id, email: u.email, name: u.name, avatar_url: u.avatar_url, timezone: u.timezone },
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  },
});

route('auth/logout', {
  POST: async () => {
    const response = json({ success: true, data: { logged_out: true } });
    // Clear the HTTP-only cookie by setting it with an expired date
    const cookieOptions = 'HttpOnly; Path=/; Max-Age=0; SameSite=Lax' + (process.env.NODE_ENV === 'production' ? '; Secure' : '');
    response.headers.set('Set-Cookie', `token=; ${cookieOptions}`);
    return response;
  },
});

// ─── Users Routes ────────────────────────────────────────

route('users/me', {
  GET: async (req, sql, user, _p) => {
    if (!user) return error('Unauthorized', 401);
    const users = await sql`SELECT * FROM users WHERE id = ${user.id}`;
    return json({ success: true, data: users[0] });
  },
  PATCH: async (req, sql, user, _p) => {
    if (!user) return error('Unauthorized', 401);
    const body = await req.json();
    const fields: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    for (const key of ['name', 'timezone']) {
      if (body[key] !== undefined) { fields.push(`${key} = $${idx++}`); vals.push(body[key]); }
    }
    if (body.streak_preferences) {
      fields.push(`streak_preferences = $${idx++}`);
      vals.push(JSON.stringify(body.streak_preferences));
    }
    if (fields.length > 0) {
      vals.push(user.id);
      await sql`UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ${user.id}`;
    }
    const users = await sql`SELECT * FROM users WHERE id = ${user.id}`;
    return json({ success: true, data: users[0] });
  },
});

route('users/search', {
  GET: async (req, sql, user, _p) => {
    if (!user) return error('Unauthorized', 401);
    const q = req.nextUrl.searchParams.get('q');
    if (!q) return error('Query param q required');
    const results = await sql`SELECT id, email, name, avatar_url FROM users WHERE (LOWER(name) LIKE ${'%' + q.toLowerCase() + '%'} OR LOWER(email) LIKE ${'%' + q.toLowerCase() + '%'}) AND id != ${user.id} LIMIT 20`;
    return json({ success: true, data: results });
  },
});

// ─── Projects Routes ─────────────────────────────────────

route('projects', {
  GET: async (req, sql, user, _p) => {
    if (!user) return error('Unauthorized', 401);
    const projects = await sql`
      SELECT p.*,
        (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count,
        (SELECT CASE WHEN COUNT(*) > 0 THEN ROUND(100.0 * SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) / COUNT(*)) ELSE 0 END FROM tasks t WHERE t.project_id = p.id) as task_progress
      FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE p.owner_id = ${user.id} OR pm.user_id = ${user.id}
      GROUP BY p.id ORDER BY p.updated_at DESC`;
    return json({ success: true, data: projects });
  },
  POST: async (req, sql, user, _p) => {
    if (!user) return error('Unauthorized', 401);
    const body = await req.json();
    if (!body.name) return error('Name required');
    const result = await sql`
      INSERT INTO projects (id, owner_id, name, description, icon, status, visibility)
      VALUES (gen_random_uuid(), ${user.id}, ${body.name}, ${body.description || ''}, ${body.icon || '📁'}, ${body.status || 'idea'}, ${body.visibility || 'private'})
      RETURNING *`;
    return json({ success: true, data: result[0] }, 201);
  },
});

// ─── Catch-all handler ───────────────────────────────────

export async function GET(req: NextRequest, { params }: { params: { slug?: string[] } }) {
  return handleRequest(req, params.slug || [], 'GET');
}
export async function POST(req: NextRequest, { params }: { params: { slug?: string[] } }) {
  return handleRequest(req, params.slug || [], 'POST');
}
export async function PATCH(req: NextRequest, { params }: { params: { slug?: string[] } }) {
  return handleRequest(req, params.slug || [], 'PATCH');
}
export async function DELETE(req: NextRequest, { params }: { params: { slug?: string[] } }) {
  return handleRequest(req, params.slug || [], 'DELETE');
}

async function handleRequest(req: NextRequest, slug: string[], method: string) {
  try {
    const path = slug.join('/');
    const sql = getSql();

    // Auth: check cookie first, then Bearer token
    let user = await getUserFromSession();
    if (!user) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        user = await verifyToken(authHeader.slice(7));
      }
    }

    const routeDef = routes.get(path);

    if (!routeDef) {
      // Dynamic routes: projects/:id/tasks, etc.
      return handleDynamicRoute(path, method, req, sql, user);
    }

    const handler = (routeDef as any)[method];
    if (!handler) return error('Method not allowed', 405);

    return handler(req, sql, user, slug);
  } catch (err: any) {
    console.error('API Error:', err);
    return error(err.message || 'Internal server error', 500);
  }
}

// ─── Dynamic routes with path params ─────────────────────

async function handleDynamicRoute(path: string, method: string, req: NextRequest, sql: any, user: any): Promise<Response> {
  // health — no auth required
  if (path === 'health' && method === 'GET') {
    return json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
  }

  if (!user) return error('Unauthorized', 401);

  // projects/:id
  const projectMatch = path.match(/^projects\/([^/]+)$/);
  if (projectMatch) {
    const id = projectMatch[1];
    if (method === 'GET') {
      const p = (await sql`SELECT * FROM projects WHERE id = ${id}`)[0];
      if (!p) return error('Not found', 404);
      const [members, tasks, resources, activity, linkedRepo] = await Promise.all([
        sql`SELECT pm.*, u.name, u.avatar_url, u.email FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = ${id} ORDER BY pm.joined_at`,
        sql`SELECT * FROM tasks WHERE project_id = ${id} ORDER BY position ASC`,
        sql`SELECT * FROM resources WHERE project_id = ${id} ORDER BY created_at DESC`,
        sql`SELECT * FROM activity_logs WHERE project_id = ${id} ORDER BY logged_at DESC LIMIT 20`,
        sql`SELECT * FROM linked_repos WHERE project_id = ${id}`,
      ]);
      return json({ success: true, data: { ...p, members, tasks, resources, activity, linked_repo: linkedRepo[0] || null } });
    }
    if (method === 'PATCH') {
      const body = await req.json();
      const sets: string[] = [];
      const vals: any[] = [];
      let idx = 1;
      for (const key of ['name', 'description', 'icon', 'status', 'visibility']) {
        if (body[key] !== undefined) { sets.push(`${key} = $${idx++}`); vals.push(body[key]); }
      }
      if (sets.length > 0) {
        vals.push(id);
        await sql(`UPDATE projects SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${idx}`, vals);
      }
      const p = await sql`SELECT * FROM projects WHERE id = ${id}`;
      return json({ success: true, data: p[0] });
    }
    if (method === 'DELETE') {
      await sql`DELETE FROM projects WHERE id = ${id}`;
      return json({ success: true, data: { deleted: true } });
    }
  }

  // projects/:id/tasks
  const tasksMatch = path.match(/^projects\/([^/]+)\/tasks$/);
  if (tasksMatch) {
    const pid = tasksMatch[1];
    if (method === 'GET') {
      const tasks = await sql`SELECT * FROM tasks WHERE project_id = ${pid} ORDER BY position ASC`;
      return json({ success: true, data: tasks });
    }
    if (method === 'POST') {
      const body = await req.json();
      if (!body.title) return error('Title required');
      const task = (await sql`
        INSERT INTO tasks (id, project_id, title, description, due_date, priority, position, estimated_hours, assignee_id, created_by)
        VALUES (gen_random_uuid(), ${pid}, ${body.title}, ${body.description || ''}, ${body.due_date || null}, ${body.priority || 'p2'},
          (SELECT COALESCE(MAX(position), 0) + 100 FROM tasks WHERE project_id = ${pid}), ${body.estimated_hours || null}, ${body.assignee_id || null}, ${user.id})
        RETURNING *`)[0];
      return json({ success: true, data: task }, 201);
    }
  }

  // tasks/:taskId (PATCH, DELETE)
  const taskItemMatch = path.match(/^tasks\/([^/]+)$/);
  if (taskItemMatch) {
    const tid = taskItemMatch[1];
    if (method === 'PATCH') {
      const body = await req.json();
      const sets: string[] = [];
      const vals: any[] = [];
      let idx = 1;
      for (const key of ['title', 'description', 'due_date', 'priority', 'position', 'status', 'estimated_hours', 'assignee_id', 'parent_task_id']) {
        if (body[key] !== undefined) {
          sets.push(`${key} = $${idx++}`);
          vals.push(body[key]);
        }
      }
      if (sets.length > 0) {
        vals.push(tid);
        await sql(`UPDATE tasks SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${idx}`, vals);
      }

      // Log activity if completed
      const task = (await sql`SELECT * FROM tasks WHERE id = ${tid}`)[0];
      if (body.status === 'completed' && task && task.status !== 'completed') {
        // Double-check to prevent double-logging from React StrictMode
        const recheck = (await sql`SELECT * FROM tasks WHERE id = ${tid}`)[0];
        if (recheck && recheck.status === 'completed' && task.status !== 'completed') {
          await sql`INSERT INTO activity_logs (id, user_id, project_id, activity_type, metadata) VALUES (gen_random_uuid(), ${user.id}, ${task.project_id}, 'task_completed', ${JSON.stringify({ task_id: task.id, task_title: task.title })})`;
        }
      }

      return json({ success: true, data: task });
    }
    if (method === 'DELETE') {
      await sql`DELETE FROM tasks WHERE id = ${tid}`;
      return json({ success: true, data: { deleted: true } });
    }
  }

  // projects/:id/activity
  const activityMatch = path.match(/^projects\/([^/]+)\/activity$/);
  if (activityMatch) {
    const pid = activityMatch[1];
    if (method === 'GET') {
      const activity = await sql`SELECT * FROM activity_logs WHERE project_id = ${pid} ORDER BY logged_at DESC LIMIT 50`;
      return json({ success: true, data: activity });
    }
    if (method === 'POST') {
      const body = await req.json();
      const a = (await sql`
        INSERT INTO activity_logs (id, user_id, project_id, activity_type, metadata)
        VALUES (gen_random_uuid(), ${user.id}, ${pid}, ${body.activity_type || 'time_logged'}, ${JSON.stringify(body.metadata || { hours: body.hours || 1 })})
        RETURNING *`)[0];
      return json({ success: true, data: a }, 201);
    }
  }

  // projects/:id/contribution-graph
  const graphMatch = path.match(/^projects\/([^/]+)\/contribution-graph$/);
  if (graphMatch && method === 'GET') {
    const pid = graphMatch[1];
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 364 * 86400000).toISOString().split('T')[0];
    const data = await sql`SELECT DATE(logged_at) as date, COUNT(*)::int as count FROM activity_logs WHERE project_id = ${pid} AND logged_at >= ${startDate} AND logged_at < ${endDate}::date + INTERVAL '1 day' GROUP BY DATE(logged_at) ORDER BY date`;

    const dayMap = new Map(data.map((d: any) => [d.date, d.count]));
    const weeks: any[] = [];
    const d = new Date(startDate);
    while (d <= new Date(endDate)) {
      const week: any[] = [];
      for (let i = 0; i < 7; i++) {
        const dateStr = d.toISOString().split('T')[0];
        const count = (dayMap.get(dateStr) as number) || 0;
        week.push({ date: dateStr, count, level: count <= 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 10 ? 3 : 4 });
        d.setDate(d.getDate() + 1);
      }
      weeks.push(week);
    }
    const total = data.reduce((s: number, r: any) => s + r.count, 0);
    return json({ success: true, data: { project_id: pid, weeks, total } });
  }

  // projects/:id/resources
  const resourcesMatch = path.match(/^projects\/([^/]+)\/resources$/);
  if (resourcesMatch) {
    const pid = resourcesMatch[1];
    if (method === 'GET') {
      const resources = await sql`SELECT * FROM resources WHERE project_id = ${pid} ORDER BY created_at DESC`;
      return json({ success: true, data: resources });
    }
    if (method === 'POST') {
      const body = await req.json();
      if (!body.url) return error('URL required');
      const r = (await sql`
        INSERT INTO resources (id, project_id, url, title, category, notes, added_by)
        VALUES (gen_random_uuid(), ${pid}, ${body.url}, ${body.title || ''}, ${body.category || 'other'}, ${body.notes || ''}, ${user.id})
        RETURNING *`)[0];
      await sql`INSERT INTO activity_logs (id, user_id, project_id, activity_type, metadata) VALUES (gen_random_uuid(), ${user.id}, ${pid}, 'resource_added', ${JSON.stringify({ resource_id: r.id })})`;
      return json({ success: true, data: r }, 201);
    }
  }

  // resources/:id (DELETE)
  const resourceDelMatch = path.match(/^resources\/([^/]+)$/);
  if (resourceDelMatch && method === 'DELETE') {
    await sql`DELETE FROM resources WHERE id = ${resourceDelMatch[1]}`;
    return json({ success: true, data: { deleted: true } });
  }

  // projects/:id/members
  const membersMatch = path.match(/^projects\/([^/]+)\/members$/);
  if (membersMatch) {
    const pid = membersMatch[1];
    if (method === 'GET') {
      const members = await sql`SELECT pm.*, u.name, u.avatar_url, u.email FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = ${pid}`;
      return json({ success: true, data: members });
    }
    if (method === 'POST') {
      const body = await req.json();
      await sql`INSERT INTO project_members (project_id, user_id, role) VALUES (${pid}, ${body.user_id}, ${body.role || 'viewer'}) ON CONFLICT (project_id, user_id) DO UPDATE SET role = ${body.role || 'viewer'} RETURNING *`;
      await sql`INSERT INTO activity_logs (id, user_id, project_id, activity_type, metadata) VALUES (gen_random_uuid(), ${user.id}, ${pid}, 'member_added', ${JSON.stringify({ new_user_id: body.user_id })})`;
      return json({ success: true, data: { added: true } }, 201);
    }
  }

  // projects/:id/members/:userId
  const memberDelMatch = path.match(/^projects\/([^/]+)\/members\/([^/]+)$/);
  if (memberDelMatch) {
    const [_, pid, uid] = memberDelMatch;
    if (method === 'PATCH') {
      const body = await req.json();
      await sql`UPDATE project_members SET role = ${body.role} WHERE project_id = ${pid} AND user_id = ${uid}`;
      return json({ success: true, data: { updated: true } });
    }
    if (method === 'DELETE') {
      await sql`DELETE FROM project_members WHERE project_id = ${pid} AND user_id = ${uid}`;
      return json({ success: true, data: { removed: true } });
    }
  }

  // projects/:id/link-repo
  const linkRepoMatch = path.match(/^projects\/([^/]+)\/link-repo$/);
  if (linkRepoMatch && method === 'POST') {
    const pid = linkRepoMatch[1];
    const body = await req.json();
    await sql`INSERT INTO linked_repos (id, project_id, user_id, github_repo_full_name) VALUES (gen_random_uuid(), ${pid}, ${user.id}, ${body.repo}) ON CONFLICT (project_id) DO UPDATE SET github_repo_full_name = ${body.repo}`;
    return json({ success: true, data: { linked: true } });
  }

  // projects/:id/repo-status
  const repoStatusMatch = path.match(/^projects\/([^/]+)\/repo-status$/);
  if (repoStatusMatch && method === 'GET') {
    const linked = (await sql`SELECT * FROM linked_repos WHERE project_id = ${repoStatusMatch[1]}`)[0];
    return json({ success: true, data: linked || null });
  }

  // friends
  if (path === 'friends' && method === 'GET') {
    const friends = await sql`
      SELECT CASE WHEN f.user_id_1 = ${user.id} THEN f.user_id_2 ELSE f.user_id_1 END as friend_id,
        u.name, u.avatar_url, u.email, f.status, f.created_at
      FROM friendships f JOIN users u ON u.id = CASE WHEN f.user_id_1 = ${user.id} THEN f.user_id_2 ELSE f.user_id_1 END
      WHERE (f.user_id_1 = ${user.id} OR f.user_id_2 = ${user.id}) AND f.status = 'accepted'`;
    return json({ success: true, data: friends });
  }

  if (path === 'friends/request' && method === 'POST') {
    const body = await req.json();
    await sql`INSERT INTO friendships (user_id_1, user_id_2, status, action_user_id) VALUES (${user.id}, ${body.user_id}, 'pending', ${user.id}) ON CONFLICT DO NOTHING`;
    return json({ success: true, data: { sent: true } });
  }

  if (path === 'friends/requests' && method === 'GET') {
    const requests = await sql`SELECT f.*, u.name, u.avatar_url, u.email FROM friendships f JOIN users u ON u.id = f.action_user_id WHERE f.user_id_2 = ${user.id} AND f.status = 'pending'`;
    return json({ success: true, data: requests });
  }

  if (path === 'friends/accept' && method === 'POST') {
    const body = await req.json();
    await sql`UPDATE friendships SET status = 'accepted' WHERE ((user_id_1 = ${body.user_id} AND user_id_2 = ${user.id}) OR (user_id_1 = ${user.id} AND user_id_2 = ${body.user_id})) AND status = 'pending'`;
    return json({ success: true, data: { accepted: true } });
  }

  // streaks
  if (path === 'streaks' && method === 'GET') {
    const streaks = await sql`SELECT al.project_id, COUNT(DISTINCT DATE(al.logged_at)) as total_active_days, MAX(DATE(al.logged_at)) as last_activity_date FROM activity_logs al WHERE al.user_id = ${user.id} GROUP BY al.project_id`;
    return json({ success: true, data: streaks });
  }

  // notifications
  if (path === 'notifications' && method === 'GET') {
    const notifs = await sql`SELECT * FROM notifications WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT 50`;
    return json({ success: true, data: notifs });
  }

  if (path === 'notifications/read-all' && method === 'PATCH') {
    await sql`UPDATE notifications SET read = true WHERE user_id = ${user.id}`;
    return json({ success: true, data: { read: true } });
  }

  // health
  if (path === 'health' && method === 'GET') {
    return json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
  }

  return error('Not found', 404);
}
