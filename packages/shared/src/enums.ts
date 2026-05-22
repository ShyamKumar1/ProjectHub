import { z } from 'zod';

// ─── Enums ───────────────────────────────────────────────

export const ProjectStatus = z.enum(['idea', 'in_progress', 'completed', 'archived']);
export type ProjectStatus = z.infer<typeof ProjectStatus>;

export const Visibility = z.enum(['private', 'friends', 'public']);
export type Visibility = z.infer<typeof Visibility>;

export const TaskPriority = z.enum(['p0', 'p1', 'p2', 'p3']);
export type TaskPriority = z.infer<typeof TaskPriority>;

export const TaskStatus = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const ProjectRole = z.enum(['viewer', 'editor', 'admin']);
export type ProjectRole = z.infer<typeof ProjectRole>;

export const ActivityType = z.enum([
  'task_completed',
  'resource_added',
  'time_logged',
  'commit_pushed',
  'project_created',
  'member_added',
]);
export type ActivityType = z.infer<typeof ActivityType>;

export const FriendshipStatus = z.enum(['pending', 'accepted', 'blocked']);
export type FriendshipStatus = z.infer<typeof FriendshipStatus>;

export const ResourceCategory = z.enum([
  'tutorial',
  'documentation',
  'tool',
  'inspiration',
  'library',
  'other',
]);
export type ResourceCategory = z.infer<typeof ResourceCategory>;
