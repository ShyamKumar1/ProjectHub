const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiResult<T> {
  success: boolean;
  data: T;
  error?: string;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('auth_token', token);
      else localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<ApiResult<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || `Request failed: ${res.status}`);
    }
    return json;
  }

  get<T>(path: string) { return this.request<T>('GET', path); }
  post<T>(path: string, body?: unknown) { return this.request<T>('POST', path, body); }
  patch<T>(path: string, body?: unknown) { return this.request<T>('PATCH', path, body); }
  del<T>(path: string) { return this.request<T>('DELETE', path); }

  // ─── Auth ──────────────────────────────────────────────
  async loginWithGoogle(accessToken: string) {
    const res = await this.post<{ token: string; user: any }>('/api/v1/auth/google', { access_token: accessToken });
    if (res.data.token) this.setToken(res.data.token);
    return res;
  }

  async loginWithGithub(code: string) {
    const res = await this.post<{ token: string; user: any }>('/api/v1/auth/github', { code });
    if (res.data.token) this.setToken(res.data.token);
    return res;
  }

  async getSession() {
    try {
      const res = await this.get<{ user: any; expires: string }>('/api/v1/auth/session');
      return res.data;
    } catch {
      return null;
    }
  }

  async logout() {
    await this.post('/api/v1/auth/logout');
    this.setToken(null);
  }

  // ─── Users ──────────────────────────────────────────────
  getProfile() { return this.get<any>('/api/v1/users/me'); }
  updateProfile(data: any) { return this.patch<any>('/api/v1/users/me', data); }
  searchUsers(q: string) { return this.get<any[]>(`/api/v1/users/search?q=${encodeURIComponent(q)}`); }

  // ─── Projects ───────────────────────────────────────────
  getProjects() { return this.get<any[]>('/api/v1/projects'); }
  getProject(id: string) { return this.get<any>(`/api/v1/projects/${id}`); }
  createProject(data: any) { return this.post<any>('/api/v1/projects', data); }
  updateProject(id: string, data: any) { return this.patch<any>(`/api/v1/projects/${id}`, data); }
  deleteProject(id: string) { return this.del<any>(`/api/v1/projects/${id}`); }

  // ─── Tasks ──────────────────────────────────────────────
  getTasks(projectId: string) { return this.get<any[]>(`/api/v1/projects/${projectId}/tasks`); }
  createTask(projectId: string, data: any) { return this.post<any>(`/api/v1/projects/${projectId}/tasks`, data); }
  updateTask(taskId: string, data: any) { return this.patch<any>(`/api/v1/tasks/${taskId}`, data); }
  deleteTask(taskId: string) { return this.del<any>(`/api/v1/tasks/${taskId}`); }

  // ─── Activity ───────────────────────────────────────────
  getActivity(projectId: string, params?: { start?: string; end?: string }) {
    const q = new URLSearchParams();
    if (params?.start) q.set('start', params.start);
    if (params?.end) q.set('end', params.end);
    return this.get<any[]>(`/api/v1/projects/${projectId}/activity${q.toString() ? '?' + q : ''}`);
  }
  logActivity(projectId: string, data: any) { return this.post<any>(`/api/v1/projects/${projectId}/activity`, data); }
  getContributionGraph(projectId: string) { return this.get<any>(`/api/v1/projects/${projectId}/contribution-graph`); }
  getStreaks() { return this.get<any[]>('/api/v1/streaks'); }

  // ─── Resources ──────────────────────────────────────────
  getResources(projectId: string) { return this.get<any[]>(`/api/v1/projects/${projectId}/resources`); }
  addResource(projectId: string, data: any) { return this.post<any>(`/api/v1/projects/${projectId}/resources`, data); }
  deleteResource(resourceId: string) { return this.del<any>(`/api/v1/resources/${resourceId}`); }

  // ─── Collaboration ──────────────────────────────────────
  getFriends() { return this.get<any[]>('/api/v1/friends'); }
  getFriendRequests() { return this.get<any[]>('/api/v1/friends/requests'); }
  sendFriendRequest(userId: string) { return this.post<any>('/api/v1/friends/request', { user_id: userId }); }
  acceptFriendRequest(userId: string) { return this.post<any>('/api/v1/friends/accept', { user_id: userId }); }
  addMemberToProject(projectId: string, userId: string, role?: string) {
    return this.post<any>(`/api/v1/projects/${projectId}/members`, { user_id: userId, role });
  }

  // ─── GitHub ─────────────────────────────────────────────
  linkRepo(projectId: string, repo: string) { return this.post<any>(`/api/v1/projects/${projectId}/link-repo`, { repo }); }
  getRepoStatus(projectId: string) { return this.get<any>(`/api/v1/projects/${projectId}/repo-status`); }

  // ─── Notifications ──────────────────────────────────────
  getNotifications() { return this.get<any[]>('/api/v1/notifications'); }
  markNotificationsRead() { return this.patch<any>('/api/v1/notifications/read-all'); }
}

export const api = new ApiClient();
