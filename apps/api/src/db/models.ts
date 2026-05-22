import { query, queryOne } from './pool';

// ─── Users ───────────────────────────────────────────────

export interface UserRow {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  google_id: string | null;
  github_id: string | null;
  timezone: string;
  streak_preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function findUserByGoogleId(googleId: string): Promise<UserRow | null> {
  return queryOne<UserRow>('SELECT * FROM users WHERE google_id = $1', [googleId]);
}

export async function findUserByGithubId(githubId: string): Promise<UserRow | null> {
  return queryOne<UserRow>('SELECT * FROM users WHERE github_id = $1', [githubId]);
}

export async function findUserById(id: string): Promise<UserRow | null> {
  return queryOne<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  return queryOne<UserRow>('SELECT * FROM users WHERE email = $1', [email]);
}

export async function createUser(data: {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  google_id?: string;
  github_id?: string;
}): Promise<UserRow> {
  const rows = await query<UserRow>(
    `INSERT INTO users (id, email, name, avatar_url, google_id, github_id, timezone)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [data.id, data.email, data.name, data.avatar_url || null, data.google_id || null, data.github_id || null, 'UTC'],
  );
  return rows[0];
}

export async function updateUser(
  id: string,
  data: Partial<{
    name: string;
    timezone: string;
    streak_preferences: Record<string, unknown>;
  }>,
): Promise<UserRow | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) {
    sets.push(`name = $${idx++}`);
    values.push(data.name);
  }
  if (data.timezone !== undefined) {
    sets.push(`timezone = $${idx++}`);
    values.push(data.timezone);
  }
  if (data.streak_preferences !== undefined) {
    sets.push(`streak_preferences = $${idx++}`);
    values.push(JSON.stringify(data.streak_preferences));
  }

  if (sets.length === 0) return findUserById(id);

  values.push(id);
  const rows = await query<UserRow>(
    `UPDATE users SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
    values,
  );
  return rows[0] || null;
}

export async function searchUsers(searchTerm: string, currentUserId: string, limit = 20): Promise<UserRow[]> {
  return query<UserRow>(
    `SELECT id, email, name, avatar_url FROM users
     WHERE (LOWER(name) LIKE $1 OR LOWER(email) LIKE $1)
       AND id != $2
     LIMIT $3`,
    [`%${searchTerm.toLowerCase()}%`, currentUserId, limit],
  );
}

// ─── Projects ────────────────────────────────────────────

export interface ProjectRow {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  icon: string;
  status: string;
  visibility: string;
  created_at: string;
  updated_at: string;
}

export async function createProject(data: {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  icon?: string;
  status?: string;
  visibility?: string;
}): Promise<ProjectRow> {
  const rows = await query<ProjectRow>(
    `INSERT INTO projects (id, owner_id, name, description, icon, status, visibility)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [data.id, data.owner_id, data.name, data.description || '', data.icon || '📁', data.status || 'idea', data.visibility || 'private'],
  );
  return rows[0];
}

export async function getProjectById(id: string): Promise<ProjectRow | null> {
  return queryOne<ProjectRow>('SELECT * FROM projects WHERE id = $1', [id]);
}

export async function getUserProjects(userId: string): Promise<(ProjectRow & { member_count?: number; task_progress?: number })[]> {
  return query<any>(
    `SELECT p.*,
       (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count,
       (SELECT CASE WHEN COUNT(*) > 0
         THEN ROUND(100.0 * SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) / COUNT(*))
         ELSE 0 END
        FROM tasks t WHERE t.project_id = p.id) as task_progress
     FROM projects p
     LEFT JOIN project_members pm ON p.id = pm.project_id
     WHERE p.owner_id = $1 OR pm.user_id = $1
     GROUP BY p.id
     ORDER BY p.updated_at DESC`,
    [userId],
  );
}

export async function updateProject(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    icon: string;
    status: string;
    visibility: string;
  }>,
): Promise<ProjectRow | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) { sets.push(`name = $${idx++}`); values.push(data.name); }
  if (data.description !== undefined) { sets.push(`description = $${idx++}`); values.push(data.description); }
  if (data.icon !== undefined) { sets.push(`icon = $${idx++}`); values.push(data.icon); }
  if (data.status !== undefined) { sets.push(`status = $${idx++}`); values.push(data.status); }
  if (data.visibility !== undefined) { sets.push(`visibility = $${idx++}`); values.push(data.visibility); }

  if (sets.length === 0) return getProjectById(id);

  values.push(id);
  const rows = await query<ProjectRow>(
    `UPDATE projects SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
    values,
  );
  return rows[0] || null;
}

export async function deleteProject(id: string): Promise<boolean> {
  const result = await query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);
  return result.length > 0;
}

// ─── Project Members ─────────────────────────────────────

export interface ProjectMemberRow {
  project_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export async function addMember(projectId: string, userId: string, role = 'viewer'): Promise<ProjectMemberRow> {
  const rows = await query<ProjectMemberRow>(
    `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)
     ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3
     RETURNING *`,
    [projectId, userId, role],
  );
  return rows[0];
}

export async function getProjectMembers(projectId: string): Promise<(ProjectMemberRow & { name: string; avatar_url: string | null; email: string })[]> {
  return query<any>(
    `SELECT pm.*, u.name, u.avatar_url, u.email
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1
     ORDER BY pm.joined_at`,
    [projectId],
  );
}

export async function getUserProjectRole(projectId: string, userId: string): Promise<string | null> {
  const row = await queryOne<{ role: string }>(
    `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId],
  );
  return row?.role || (await isProjectOwner(projectId, userId) ? 'admin' : null);
}

async function isProjectOwner(projectId: string, userId: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>('SELECT id FROM projects WHERE id = $1 AND owner_id = $2', [projectId, userId]);
  return !!row;
}

export async function updateMemberRole(projectId: string, userId: string, role: string): Promise<boolean> {
  const result = await query('UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3', [role, projectId, userId]);
  return result.length > 0;
}

export async function removeMember(projectId: string, userId: string): Promise<boolean> {
  const result = await query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, userId]);
  return result.length > 0;
}

// ─── Tasks ───────────────────────────────────────────────

export interface TaskRow {
  id: string;
  project_id: string;
  parent_task_id: string | null;
  title: string;
  description: string;
  due_date: string | null;
  priority: string;
  position: number;
  estimated_hours: number | null;
  status: string;
  assignee_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export async function createTask(data: {
  id: string;
  project_id: string;
  parent_task_id?: string | null;
  title: string;
  description?: string;
  due_date?: string | null;
  priority?: string;
  estimated_hours?: number | null;
  assignee_id?: string | null;
  created_by: string;
}): Promise<TaskRow> {
  const rows = await query<TaskRow>(
    `INSERT INTO tasks (id, project_id, parent_task_id, title, description, due_date, priority, position, estimated_hours, assignee_id, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, (SELECT COALESCE(MAX(position), 0) + 100 FROM tasks WHERE project_id = $2), $8, $9, $10)
     RETURNING *`,
    [data.id, data.project_id, data.parent_task_id || null, data.title, data.description || '', data.due_date || null, data.priority || 'p2', data.estimated_hours || null, data.assignee_id || null, data.created_by],
  );
  return rows[0];
}

export async function getProjectTasks(projectId: string): Promise<TaskRow[]> {
  return query<TaskRow>(
    `SELECT * FROM tasks WHERE project_id = $1 ORDER BY position ASC`,
    [projectId],
  );
}

export async function getTaskById(id: string): Promise<TaskRow | null> {
  return queryOne<TaskRow>('SELECT * FROM tasks WHERE id = $1', [id]);
}

export async function updateTask(id: string, data: Partial<{
  title: string;
  description: string;
  due_date: string | null;
  priority: string;
  position: number;
  status: string;
  estimated_hours: number | null;
  assignee_id: string | null;
  parent_task_id: string | null;
}>): Promise<TaskRow | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const fields: (keyof typeof data)[] = ['title', 'description', 'due_date', 'priority', 'position', 'status', 'estimated_hours', 'assignee_id', 'parent_task_id'];
  for (const field of fields) {
    if (data[field] !== undefined) {
      sets.push(`${field} = $${idx++}`);
      values.push(data[field] ?? null);
    }
  }

  if (sets.length === 0) return getTaskById(id);

  values.push(id);
  const rows = await query<TaskRow>(
    `UPDATE tasks SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
    values,
  );
  return rows[0] || null;
}

export async function deleteTask(id: string): Promise<boolean> {
  const result = await query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);
  return result.length > 0;
}

// ─── Activity ────────────────────────────────────────────

export interface ActivityRow {
  id: string;
  user_id: string;
  project_id: string;
  activity_type: string;
  metadata: Record<string, unknown>;
  logged_at: string;
}

export async function createActivity(data: {
  id: string;
  user_id: string;
  project_id: string;
  activity_type: string;
  metadata?: Record<string, unknown>;
}): Promise<ActivityRow> {
  const rows = await query<ActivityRow>(
    `INSERT INTO activity_logs (id, user_id, project_id, activity_type, metadata)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.id, data.user_id, data.project_id, data.activity_type, JSON.stringify(data.metadata || {})],
  );
  return rows[0];
}

export async function getProjectActivity(
  projectId: string,
  range?: { start?: string; end?: string },
  limit = 50,
): Promise<ActivityRow[]> {
  let sql = 'SELECT * FROM activity_logs WHERE project_id = $1';
  const params: unknown[] = [projectId];
  let idx = 2;

  if (range?.start) {
    sql += ` AND logged_at >= $${idx++}`;
    params.push(range.start);
  }
  if (range?.end) {
    sql += ` AND logged_at <= $${idx++}`;
    params.push(range.end);
  }

  sql += ' ORDER BY logged_at DESC LIMIT $' + idx;
  params.push(limit);

  return query<ActivityRow>(sql, params);
}

export async function getContributionData(
  projectId: string,
  startDate: string,
  endDate: string,
): Promise<{ date: string; count: number }[]> {
  return query<any>(
    `SELECT DATE(logged_at) as date, COUNT(*)::int as count
     FROM activity_logs
     WHERE project_id = $1
       AND logged_at >= $2
       AND logged_at < $3::date + INTERVAL '1 day'
     GROUP BY DATE(logged_at)
     ORDER BY date`,
    [projectId, startDate, endDate],
  );
}

export async function checkRecentActivity(projectId: string, userId: string, sinceDate: string): Promise<boolean> {
  const row = await queryOne<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM activity_logs
     WHERE project_id = $1 AND user_id = $2 AND logged_at >= $3`,
    [projectId, userId, sinceDate],
  );
  return (row?.count || 0) > 0;
}

// ─── Streaks ─────────────────────────────────────────────

export async function getStreaks(userId: string): Promise<any[]> {
  return query<any>(
    `SELECT
       al.project_id,
       COUNT(DISTINCT DATE(al.logged_at)) as total_active_days,
       MAX(DATE(al.logged_at)) as last_activity_date
     FROM activity_logs al
     WHERE al.user_id = $1
     GROUP BY al.project_id`,
    [userId],
  );
}

// ─── Resources ───────────────────────────────────────────

export interface ResourceRow {
  id: string;
  project_id: string;
  url: string;
  title: string;
  description: string;
  favicon_url: string | null;
  og_image_url: string | null;
  category: string;
  notes: string;
  added_by: string;
  created_at: string;
}

export async function createResource(data: {
  id: string;
  project_id: string;
  url: string;
  title?: string;
  description?: string;
  favicon_url?: string | null;
  og_image_url?: string | null;
  category?: string;
  notes?: string;
  added_by: string;
}): Promise<ResourceRow> {
  const rows = await query<ResourceRow>(
    `INSERT INTO resources (id, project_id, url, title, description, favicon_url, og_image_url, category, notes, added_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [data.id, data.project_id, data.url, data.title || '', data.description || '', data.favicon_url || null, data.og_image_url || null, data.category || 'other', data.notes || '', data.added_by],
  );
  return rows[0];
}

export async function getProjectResources(projectId: string): Promise<ResourceRow[]> {
  return query<ResourceRow>('SELECT * FROM resources WHERE project_id = $1 ORDER BY created_at DESC', [projectId]);
}

export async function deleteResource(id: string): Promise<boolean> {
  const result = await query('DELETE FROM resources WHERE id = $1 RETURNING id', [id]);
  return result.length > 0;
}

// ─── Friends ─────────────────────────────────────────────

export async function sendFriendRequest(userId1: string, userId2: string): Promise<void> {
  await query(
    `INSERT INTO friendships (user_id_1, user_id_2, status, action_user_id)
     VALUES ($1, $2, 'pending', $1)
     ON CONFLICT (user_id_1, user_id_2) DO NOTHING`,
    [userId1, userId2],
  );
}

export async function getFriends(userId: string): Promise<any[]> {
  return query<any>(
    `SELECT
       CASE WHEN f.user_id_1 = $1 THEN f.user_id_2 ELSE f.user_id_1 END as friend_id,
       u.name, u.avatar_url, u.email,
       f.status, f.action_user_id, f.created_at
     FROM friendships f
     JOIN users u ON u.id = CASE WHEN f.user_id_1 = $1 THEN f.user_id_2 ELSE f.user_id_1 END
     WHERE (f.user_id_1 = $1 OR f.user_id_2 = $1)
       AND f.status = 'accepted'`,
    [userId],
  );
}

export async function getPendingRequests(userId: string): Promise<any[]> {
  return query<any>(
    `SELECT f.*, u.name, u.avatar_url, u.email
     FROM friendships f
     JOIN users u ON u.id = f.action_user_id
     WHERE f.user_id_2 = $1 AND f.status = 'pending'`,
    [userId],
  );
}

export async function acceptFriendRequest(userId1: string, userId2: string): Promise<boolean> {
  const result = await query(
    `UPDATE friendships SET status = 'accepted'
     WHERE ((user_id_1 = $1 AND user_id_2 = $2) OR (user_id_1 = $2 AND user_id_2 = $1))
       AND status = 'pending'
     RETURNING *`,
    [userId1, userId2],
  );
  return result.length > 0;
}

export async function blockFriendship(userId1: string, userId2: string): Promise<boolean> {
  const result = await query(
    `UPDATE friendships SET status = 'blocked'
     WHERE ((user_id_1 = $1 AND user_id_2 = $2) OR (user_id_1 = $2 AND user_id_2 = $1))
     RETURNING *`,
    [userId1, userId2],
  );
  return result.length > 0;
}

// ─── Linked Repos ────────────────────────────────────────

export async function linkRepo(data: {
  id: string;
  project_id: string;
  user_id: string;
  github_repo_full_name: string;
}): Promise<void> {
  await query(
    `INSERT INTO linked_repos (id, project_id, user_id, github_repo_full_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (project_id) DO UPDATE SET github_repo_full_name = $4`,
    [data.id, data.project_id, data.user_id, data.github_repo_full_name],
  );
}

export async function getLinkedRepo(projectId: string): Promise<any | null> {
  return queryOne(
    `SELECT * FROM linked_repos WHERE project_id = $1`,
    [projectId],
  );
}

// ─── Notifications ───────────────────────────────────────

export async function createNotification(data: {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await query(
    `INSERT INTO notifications (id, user_id, type, title, body, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [data.id, data.user_id, data.type, data.title, data.body || '', JSON.stringify(data.metadata || {})],
  );
}

export async function getUserNotifications(userId: string): Promise<any[]> {
  return query<any>(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId],
  );
}

export async function markNotificationsRead(userId: string): Promise<void> {
  await query('UPDATE notifications SET read = true WHERE user_id = $1', [userId]);
}
