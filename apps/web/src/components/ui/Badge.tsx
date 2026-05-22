'use client';

import clsx from 'clsx';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', size = 'sm', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-pill',
        {
          // Variants
          'bg-dark-700 text-text-secondary': variant === 'default',
          'bg-accent/15 text-accent': variant === 'success',
          'bg-warning/15 text-warning': variant === 'warning',
          'bg-danger/15 text-danger': variant === 'danger',
          'bg-info/15 text-info': variant === 'info',
          // Sizes
          'text-xs px-2 py-0.5': size === 'sm',
          'text-sm px-3 py-1': size === 'md',
        },
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    idea: { label: 'Idea', variant: 'default' },
    in_progress: { label: 'In Progress', variant: 'info' },
    completed: { label: 'Completed', variant: 'success' },
    archived: { label: 'Archived', variant: 'warning' },
    pending: { label: 'Pending', variant: 'default' },
    cancelled: { label: 'Cancelled', variant: 'danger' },
    p0: { label: 'P0', variant: 'danger' },
    p1: { label: 'P1', variant: 'warning' },
    p2: { label: 'P2', variant: 'info' },
    p3: { label: 'P3', variant: 'default' },
    viewer: { label: 'Viewer', variant: 'default' },
    editor: { label: 'Editor', variant: 'info' },
    admin: { label: 'Admin', variant: 'success' },
  };

  const c = config[status] || { label: status, variant: 'default' as const };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}
