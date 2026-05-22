'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { Plus, Check, Trash2, GripVertical, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface TaskListProps {
  projectId: string;
  tasks: any[];
  onUpdate: () => void;
}

export default function TaskList({ projectId, tasks, onUpdate }: TaskListProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'p2',
    due_date: '',
  });

  // Separate root tasks from subtasks
  const rootTasks = tasks.filter((t) => !t.parent_task_id);
  const subtasksMap = new Map<string, any[]>();
  tasks
    .filter((t) => t.parent_task_id)
    .forEach((t) => {
      const existing = subtasksMap.get(t.parent_task_id) || [];
      existing.push(t);
      subtasksMap.set(t.parent_task_id, existing);
    });

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    try {
      await api.createTask(projectId, {
        title: form.title,
        description: form.description,
        priority: form.priority,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      });
      setCreateOpen(false);
      setForm({ title: '', description: '', priority: 'p2', due_date: '' });
      toast.success('Task created');
      onUpdate();
    } catch {
      toast.error('Failed to create task');
    }
  };

  const handleToggleStatus = async (task: any) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.updateTask(task.id, { status: newStatus });
      onUpdate();
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTask(id);
      toast.success('Task deleted');
      onUpdate();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedTasks);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedTasks(next);
  };

  const priorityOrder = { p0: 0, p1: 1, p2: 2, p3: 3 };
  const sortedTasks = [...rootTasks].sort((a, b) => {
    const pa = priorityOrder[a.priority as keyof typeof priorityOrder] || 2;
    const pb = priorityOrder[b.priority as keyof typeof priorityOrder] || 2;
    if (pa !== pb) return pa - pb;
    return (a.position || 0) - (b.position || 0);
  });

  const TaskRow = ({ task, isSub = false }: { task: any; isSub?: boolean }) => {
    const hasSubtasks = subtasksMap.has(task.id) && subtasksMap.get(task.id)!.length > 0;
    const isExpanded = expandedTasks.has(task.id);
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

    return (
      <div>
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group ${
            task.status === 'completed'
              ? 'opacity-60'
              : 'hover:bg-dark-700/50'
          } ${isSub ? 'ml-8 border-l-2 border-dark-300' : ''}`}
        >
          {/* Drag handle */}
          {!isSub && (
            <GripVertical size={14} className="text-text-muted opacity-0 group-hover:opacity-100 cursor-grab" />
          )}

          {/* Expand subtasks */}
          {hasSubtasks && (
            <button onClick={() => toggleExpand(task.id)} className="text-text-muted hover:text-text-primary">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
          {!hasSubtasks && !isSub && <div className="w-4" />}

          {/* Checkbox */}
          <button
            onClick={() => handleToggleStatus(task)}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
              task.status === 'completed'
                ? 'bg-accent border-accent'
                : 'border-dark-300 hover:border-accent'
            }`}
          >
            {task.status === 'completed' && <Check size={12} className="text-dark-800" />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-sm ${
                  task.status === 'completed' ? 'line-through text-text-muted' : 'text-text-primary'
                }`}
              >
                {task.title}
              </span>
              <StatusBadge status={task.priority} />
            </div>
            {task.description && (
              <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{task.description}</p>
            )}
          </div>

          {/* Due date */}
          {task.due_date && (
            <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-danger' : 'text-text-muted'}`}>
              <Clock size={12} />
              {new Date(task.due_date).toLocaleDateString()}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleDelete(task.id)}
              className="p-1 text-text-muted hover:text-danger rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Subtasks */}
        {hasSubtasks && isExpanded && (
          <div className="space-y-0.5 mt-0.5">
            {subtasksMap.get(task.id)!.map((sub: any) => (
              <TaskRow key={sub.id} task={sub} isSub />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-h6 font-medium text-text-primary">Tasks</h3>
          <span className="text-xs text-text-muted bg-dark-700 px-2 py-0.5 rounded-pill">
            {tasks.filter((t) => t.status === 'completed').length}/{tasks.length}
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={14} />
          Add Task
        </Button>
      </div>

      {/* Task List */}
      {sortedTasks.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <p className="text-sm">No tasks yet. Create your first task!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {sortedTasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Task">
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="What needs to be done?"
            autoFocus
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Add details..."
          />
          <div className="flex gap-4">
            <Select
              label="Priority"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              options={[
                { value: 'p0', label: 'P0 - Critical' },
                { value: 'p1', label: 'P1 - High' },
                { value: 'p2', label: 'P2 - Medium' },
                { value: 'p3', label: 'P3 - Low' },
              ]}
            />
            <Input
              label="Due Date"
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Task</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
