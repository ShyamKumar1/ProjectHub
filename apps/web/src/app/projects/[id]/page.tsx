'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import ContributionGraph from '@/components/projects/ContributionGraph';
import TaskList from '@/components/tasks/TaskList';
import KanbanBoard from '@/components/tasks/KanbanBoard';
import { Input, Textarea, Select } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
  ArrowLeft,
  Edit3,
  Link2,
  Users,
  Activity,
  Flame,
  Clock,
  Github,
  Plus,
  Trash2,
  ExternalLink,
  FolderKanban,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [taskView, setTaskView] = useState<'list' | 'kanban'>('list');

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', icon: '', status: '', visibility: '' });

  // Resource modal
  const [resourceOpen, setResourceOpen] = useState(false);
  const [resourceForm, setResourceForm] = useState({ url: '', category: 'other', notes: '' });

  // Add member modal
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');

  // GitHub link
  const [repoInput, setRepoInput] = useState('');
  const [repoOpen, setRepoOpen] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const res = await api.getProject(projectId);
      setProject(res.data);
    } catch {
      toast.error('Failed to load project');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleEdit = async () => {
    try {
      await api.updateProject(projectId, editForm);
      setEditOpen(false);
      toast.success('Project updated');
      fetchProject();
    } catch {
      toast.error('Failed to update project');
    }
  };

  const handleAddResource = async () => {
    if (!resourceForm.url) return;
    try {
      await api.addResource(projectId, resourceForm);
      setResourceOpen(false);
      setResourceForm({ url: '', category: 'other', notes: '' });
      toast.success('Resource added');
      fetchProject();
    } catch {
      toast.error('Failed to add resource');
    }
  };

  const handleDeleteResource = async (id: string) => {
    try {
      await api.deleteResource(id);
      toast.success('Resource deleted');
      fetchProject();
    } catch {
      toast.error('Failed to delete resource');
    }
  };

  const handleLinkRepo = async () => {
    if (!repoInput.match(/^[\w.-]+\/[\w.-]+$/)) {
      toast.error('Format: owner/repo');
      return;
    }
    try {
      await api.linkRepo(projectId, repoInput);
      setRepoOpen(false);
      setRepoInput('');
      toast.success('Repository linked');
      fetchProject();
    } catch {
      toast.error('Failed to link repository');
    }
  };

  const handleAddMember = async () => {
    try {
      const users = await api.searchUsers(memberEmail);
      if (!users.data?.length) {
        toast.error('User not found');
        return;
      }
      await api.addMemberToProject(projectId, users.data[0].id);
      setMemberOpen(false);
      setMemberEmail('');
      toast.success('Member added');
      fetchProject();
    } catch {
      toast.error('Failed to add member');
    }
  };

  const openEdit = () => {
    setEditForm({
      name: project.name,
      description: project.description || '',
      icon: project.icon || '📁',
      status: project.status,
      visibility: project.visibility,
    });
    setEditOpen(true);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-dark-700 rounded" />
        <div className="h-32 bg-dark-700 rounded-xl" />
        <div className="h-64 bg-dark-700 rounded-xl" />
      </div>
    );
  }

  if (!project) return null;

  const tabs = [
    { id: 'tasks', label: 'Tasks', icon: FolderKanban },
    { id: 'resources', label: 'Resources', icon: Link2 },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'members', label: 'Members', icon: Users },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Back & Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="w-8 h-8 rounded-lg bg-dark-700 border border-dark-300 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{project.icon || '📁'}</span>
            <div>
              <h1 className="text-h4 font-medium text-text-primary">{project.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <StatusBadge status={project.status} />
                <span className="text-xs text-text-muted">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={openEdit}>
          <Edit3 size={14} />
          Edit
        </Button>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-sm text-text-secondary mb-6 max-w-2xl">{project.description}</p>
      )}

      {/* GitHub Link */}
      {project.linked_repo && (
        <div className="flex items-center gap-2 px-4 py-2 mb-6 rounded-lg bg-dark-700/50 border border-dark-300 w-fit">
          <Github size={14} className="text-text-muted" />
          <span className="text-sm text-text-secondary">{project.linked_repo.github_repo_full_name}</span>
        </div>
      )}

      {/* Contribution Graph */}
      <Card className="p-5 mb-6">
        <ContributionGraph projectId={projectId} />
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-dark-700 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-accent/10 text-accent'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          {activeTab === 'tasks' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTaskView('list')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      taskView === 'list' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-dark-700 text-text-muted border border-dark-300 hover:text-text-primary'
                    }`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setTaskView('kanban')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      taskView === 'kanban' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-dark-700 text-text-muted border border-dark-300 hover:text-text-primary'
                    }`}
                  >
                    Kanban
                  </button>
                </div>
              </div>
              {taskView === 'list' ? (
                <TaskList
                  projectId={projectId}
                  tasks={project.tasks || []}
                  onUpdate={fetchProject}
                />
              ) : (
                <KanbanBoard
                  projectId={projectId}
                  tasks={project.tasks || []}
                  onUpdate={fetchProject}
                />
              )}
            </div>
          )}

          {activeTab === 'resources' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-h6 font-medium text-text-primary">Resources & Links</h3>
                <Button variant="primary" size="sm" onClick={() => setResourceOpen(true)}>
                  <Plus size={14} />
                  Add Link
                </Button>
              </div>
              {(!project.resources || project.resources.length === 0) ? (
                <div className="text-center py-12 text-text-muted">
                  <Link2 size={32} className="mx-auto mb-2" />
                  <p className="text-sm">No resources yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {project.resources.map((r: any) => (
                    <Card key={r.id} variant="bordered" className="p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded bg-dark-700 flex items-center justify-center shrink-0">
                        {r.favicon_url ? (
                          <img src={r.favicon_url} alt="" className="w-4 h-4" />
                        ) : (
                          <Link2 size={14} className="text-text-muted" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-text-primary hover:text-accent transition-colors flex items-center gap-1"
                        >
                          {r.title || r.url}
                          <ExternalLink size={12} className="shrink-0" />
                        </a>
                        {r.description && (
                          <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{r.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <StatusBadge status={r.category} />
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteResource(r.id)}
                        className="text-text-muted hover:text-danger transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <h3 className="text-h6 font-medium text-text-primary mb-4">Activity Feed</h3>
              {(!project.activity || project.activity.length === 0) ? (
                <div className="text-center py-12 text-text-muted">
                  <Activity size={32} className="mx-auto mb-2" />
                  <p className="text-sm">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {project.activity.map((a: any) => (
                    <Card key={a.id} variant="bordered" className="p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        {a.activity_type === 'task_completed' ? '✅' :
                         a.activity_type === 'resource_added' ? '🔗' :
                         a.activity_type === 'project_created' ? '🚀' :
                         a.activity_type === 'member_added' ? '👥' : '📝'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-text-primary capitalize">
                          {a.activity_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-text-muted">
                          {new Date(a.logged_at).toLocaleString()}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-h6 font-medium text-text-primary">Team Members</h3>
                <Button variant="primary" size="sm" onClick={() => setMemberOpen(true)}>
                  <Plus size={14} />
                  Add Member
                </Button>
              </div>
              {(!project.members || project.members.length === 0) ? (
                <div className="text-center py-12 text-text-muted">
                  <Users size={32} className="mx-auto mb-2" />
                  <p className="text-sm">No members yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {project.members.map((m: any) => (
                    <Card key={m.user_id} variant="bordered" className="p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent">
                        {m.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-text-primary">{m.name}</p>
                        <p className="text-xs text-text-muted">{m.email}</p>
                      </div>
                      <StatusBadge status={m.role} />
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card className="p-4">
            <h4 className="text-sm font-medium text-text-primary mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => setResourceOpen(true)}>
                <Link2 size={14} /> Add Resource
              </Button>
              <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => setMemberOpen(true)}>
                <Users size={14} /> Add Member
              </Button>
              <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => setRepoOpen(true)}>
                <Github size={14} /> Link Repo
              </Button>
            </div>
          </Card>

          {/* Streak Info */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame size={18} className="text-accent" />
              <h4 className="text-sm font-medium text-text-primary">Streak</h4>
            </div>
            <p className="text-xs text-text-muted">Log activity to build your streak</p>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Project">
        <div className="space-y-4">
          <Input label="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <Textarea label="Description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          <div className="flex gap-4">
            <Input label="Icon" value={editForm.icon} onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })} />
            <Select label="Status" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              options={[
                { value: 'idea', label: 'Idea' }, { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' }, { value: 'archived', label: 'Archived' },
              ]}
            />
            <Select label="Visibility" value={editForm.visibility} onChange={(e) => setEditForm({ ...editForm, visibility: e.target.value })}
              options={[{ value: 'private', label: 'Private' }, { value: 'friends', label: 'Friends' }, { value: 'public', label: 'Public' }]}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* Resource Modal */}
      <Modal open={resourceOpen} onClose={() => setResourceOpen(false)} title="Add Resource">
        <div className="space-y-4">
          <Input label="URL" placeholder="https://..." value={resourceForm.url} onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })} />
          <Select label="Category" value={resourceForm.category} onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
            options={[
              { value: 'tutorial', label: 'Tutorial' }, { value: 'documentation', label: 'Documentation' },
              { value: 'tool', label: 'Tool' }, { value: 'inspiration', label: 'Inspiration' },
              { value: 'library', label: 'Library' }, { value: 'other', label: 'Other' },
            ]}
          />
          <Textarea label="Notes (optional)" value={resourceForm.notes} onChange={(e) => setResourceForm({ ...resourceForm, notes: e.target.value })} />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setResourceOpen(false)}>Cancel</Button>
            <Button onClick={handleAddResource}>Add Resource</Button>
          </div>
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal open={memberOpen} onClose={() => setMemberOpen(false)} title="Add Member">
        <div className="space-y-4">
          <Input label="Search by email or name" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} placeholder="Enter email..." />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setMemberOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMember}>Add Member</Button>
          </div>
        </div>
      </Modal>

      {/* Link Repo Modal */}
      <Modal open={repoOpen} onClose={() => setRepoOpen(false)} title="Link GitHub Repository">
        <div className="space-y-4">
          <Input label="Repository" value={repoInput} onChange={(e) => setRepoInput(e.target.value)} placeholder="owner/repo-name" />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setRepoOpen(false)}>Cancel</Button>
            <Button onClick={handleLinkRepo}>Link Repo</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
