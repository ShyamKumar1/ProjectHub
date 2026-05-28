'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import { api } from '@/lib/api';
import ProjectCard from '@/components/projects/ProjectCard';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Plus, FolderKanban, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { createProjectOpen, setCreateProjectOpen } = useUIStore();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // New project form
  const [form, setForm] = useState({ name: '', description: '', icon: '📁', status: 'idea', visibility: 'private' });
  const [creating, setCreating] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await api.getProjects();
      setProjects(res.data || []);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await api.createProject(form);
      setCreateProjectOpen(false);
      setForm({ name: '', description: '', icon: '📁', status: 'idea', visibility: 'private' });
      fetchProjects();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const filtered = projects.filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusCounts = {
    all: projects.length,
    idea: projects.filter((p) => p.status === 'idea').length,
    in_progress: projects.filter((p) => p.status === 'in_progress').length,
    completed: projects.filter((p) => p.status === 'completed').length,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h3 font-medium text-text-primary">
          Welcome back, {user?.name?.split(' ')[0] || 'Maker'} 👋
        </h1>
        <p className="text-text-secondary mt-1">Track, build, and collaborate on your projects.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Projects', value: projects.length, colorClass: 'text-accent' },
          { label: 'In Progress', value: statusCounts.in_progress, colorClass: 'text-info' },
          { label: 'Ideas', value: statusCounts.idea, colorClass: 'text-warning' },
          { label: 'Completed', value: statusCounts.completed, colorClass: 'text-success' },
        ].map((stat) => (
          <div key={stat.label} className="bg-dark-800/60 backdrop-blur-sm border border-dark-300 rounded-xl p-4">
            <p className="text-sm text-text-muted">{stat.label}</p>
            <p className={`text-h3 font-medium mt-1 ${stat.colorClass}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-700 border border-dark-300 rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'idea', 'in_progress', 'completed'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === s
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'bg-dark-700 text-text-muted border border-dark-300 hover:text-text-primary'
              }`}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-dark-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FolderKanban size={48} className="mx-auto text-text-muted mb-4" />
          <h3 className="text-h6 text-text-secondary mb-2">No projects yet</h3>
          <p className="text-sm text-text-muted mb-6">
            {search ? 'No projects match your search' : 'Create your first project to get started'}
          </p>
          {!search && (
            <Button onClick={() => setCreateProjectOpen(true)}>
              <Plus size={16} />
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <ProjectCard project={project} onUpdate={fetchProjects} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        open={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        title="Create New Project"
      >
        <div className="space-y-4">
          <Input
            label="Project Name"
            placeholder="Enter project name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
          />
          <Textarea
            label="Description"
            placeholder="Brief description of the project"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex gap-4">
            <Input
              label="Icon (emoji)"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              className="w-24"
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={[
                { value: 'idea', label: 'Idea' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
            <Select
              label="Visibility"
              value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value })}
              options={[
                { value: 'private', label: 'Private' },
                { value: 'friends', label: 'Friends' },
                { value: 'public', label: 'Public' },
              ]}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setCreateProjectOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={creating}>
              Create Project
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
