'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import {
  Flame,
  MoreHorizontal,
  Clock,
  Github,
  Trash2,
  ExternalLink,
  Edit3,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ProjectCard({ project, onUpdate }: { project: any; onUpdate: () => void }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const progress = project.task_progress || 0;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.deleteProject(project.id);
      toast.success('Project deleted');
      onUpdate();
    } catch {
      toast.error('Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card hover className="p-5 group" onClick={() => router.push(`/projects/${project.id}`)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{project.icon || '📁'}</span>
          <div>
            <h3 className="text-h6 font-medium text-text-primary group-hover:text-accent transition-colors">
              {project.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={project.status} />
              {project.visibility === 'public' && (
                <Badge variant="default" size="sm">Public</Badge>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all"
          disabled={deleting}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-sm text-text-secondary mb-3 line-clamp-2">{project.description}</p>
      )}

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-dark-300">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            {getTimeAgo(project.updated_at || project.created_at)}
          </div>
          {project.member_count > 0 && (
            <div className="flex items-center gap-1">
              👥 {project.member_count}
            </div>
          )}
          {project.linked_repo && (
            <Github size={12} className="text-text-muted" />
          )}
        </div>
      </div>
    </Card>
  );
}
