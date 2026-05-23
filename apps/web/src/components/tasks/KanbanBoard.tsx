'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { Plus, Trash2, Check, Clock, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';

const COLUMNS = [
  { key: 'pending', label: 'Yet to Start', color: 'border-t-dark-300' },
  { key: 'in_progress', label: 'In Progress', color: 'border-t-accent' },
  { key: 'completed', label: 'Completed', color: 'border-t-success' },
  { key: 'cancelled', label: 'Cancelled', color: 'border-t-danger' },
];

interface KanbanBoardProps {
  projectId: string;
  tasks: any[];
  onUpdate: () => void;
}

export default function KanbanBoard({ projectId, tasks, onUpdate }: KanbanBoardProps) {
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const columnTasks: Record<string, any[]> = { pending: [], in_progress: [], completed: [], cancelled: [] };
  tasks.forEach((t) => {
    const col = columnTasks[t.status] || columnTasks.pending;
    col.push(t);
  });

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      toast.success(`Task moved to ${newStatus.replace('_', ' ')}`);
      onUpdate();
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      toast.success('Task deleted');
      onUpdate();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleEdit = async (taskId: string) => {
    if (!editTitle.trim()) { setEditingTask(null); return; }
    try {
      await api.updateTask(taskId, { title: editTitle });
      toast.success('Task updated');
      setEditingTask(null);
      onUpdate();
    } catch {
      toast.error('Failed to update task');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[400px]">
      {COLUMNS.map((col) => (
        <div key={col.key} className="flex flex-col gap-3">
          <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg bg-dark-700/50 border-t-2 ${col.color}`}>
            <h4 className="text-sm font-medium text-text-primary">{col.label}</h4>
            <span className="text-xs text-text-muted bg-dark-600 px-2 py-0.5 rounded-pill">
              {columnTasks[col.key].length}
            </span>
          </div>

          <div className="flex flex-col gap-2 min-h-[200px] p-1">
            {columnTasks[col.key].length === 0 ? (
              <div className="text-center py-8 text-text-muted text-xs">No tasks</div>
            ) : (
              columnTasks[col.key].map((task) => (
                <Card key={task.id} variant="bordered" className="p-3 group hover:border-accent/30 transition-all">
                  {editingTask === task.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEdit(task.id)}
                        className="flex-1 bg-dark-700 border border-dark-300 rounded px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                        autoFocus
                      />
                      <button onClick={() => handleEdit(task.id)} className="text-accent text-xs">Save</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className="flex-1 min-w-0"
                          onDoubleClick={() => { setEditingTask(task.id); setEditTitle(task.title); }}
                        >
                          <p className="text-sm text-text-primary line-clamp-2 cursor-pointer hover:text-accent transition-colors"
                             onClick={() => { setEditingTask(task.id); setEditTitle(task.title); }}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-text-muted mt-1 line-clamp-1">{task.description}</p>
                          )}
                        </div>
                      </div>

                      {task.due_date && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
                          <Clock size={10} />
                          {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      )}

                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-dark-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        <StatusBadge status={task.priority} />
                        <div className="flex-1" />
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-1 text-text-muted hover:text-danger rounded"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      {/* Quick status change buttons */}
                      <div className="flex gap-1 mt-1">
                        {COLUMNS.filter(c => c.key !== task.status).map(c => (
                          <button
                            key={c.key}
                            onClick={() => handleStatusChange(task.id, c.key)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-dark-700 text-text-muted hover:bg-dark-600 transition-colors"
                          >
                            → {c.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
