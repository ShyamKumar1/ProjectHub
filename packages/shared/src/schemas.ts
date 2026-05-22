import { z } from 'zod';
import {
  ProjectStatus,
  Visibility,
  TaskPriority,
  TaskStatus,
  ProjectRole,
  ActivityType,
  ResourceCategory,
} from './enums';

// ─── Users ───────────────────────────────────────────────

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  avatar_url: z.string().url().nullable(),
  google_id: z.string().nullable(),
  github_id: z.string().nullable(),
  timezone: z.string().default('UTC'),
  streak_preferences: z
    .object({
      freeze_weekends: z.boolean().default(false),
      remind_at_hour: z.number().min(0).max(23).default(9),
    })
    .default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;

export const UpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  timezone: z.string().optional(),
  streak_preferences: z
    .object({
      freeze_weekends: z.boolean().optional(),
      remind_at_hour: z.number().min(0).max(23).optional(),
    })
    .optional(),
});
export type UpdateUser = z.infer<typeof UpdateUserSchema>;

// ─── Projects ────────────────────────────────────────────

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
  icon: z.string().emoji().default('📁'),
  status: ProjectStatus.default('idea'),
  visibility: Visibility.default('private'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
  icon: z.string().emoji().default('📁'),
  status: ProjectStatus.default('idea'),
  visibility: Visibility.default('private'),
});
export type CreateProject = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  icon: z.string().emoji().optional(),
  status: ProjectStatus.optional(),
  visibility: Visibility.optional(),
});
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;

// ─── Project Members ─────────────────────────────────────

export const ProjectMemberSchema = z.object({
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: ProjectRole,
  joined_at: z.string().datetime(),
  user: UserSchema.pick({ id: true, name: true, avatar_url: true, email: true }).optional(),
});
export type ProjectMember = z.infer<typeof ProjectMemberSchema>;

export const AddMemberSchema = z.object({
  user_id: z.string().uuid(),
  role: ProjectRole.default('viewer'),
});
export type AddMember = z.infer<typeof AddMemberSchema>;

// ─── Tasks ───────────────────────────────────────────────

export const TaskSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  parent_task_id: z.string().uuid().nullable(),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).default(''),
  due_date: z.string().datetime().nullable(),
  priority: TaskPriority.default('p2'),
  position: z.number().default(0),
  estimated_hours: z.number().min(0).nullable(),
  status: TaskStatus.default('pending'),
  assignee_id: z.string().uuid().nullable(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  subtasks: z.lazy(() => z.any()).optional() as any,
  assignee: UserSchema.pick({ id: true, name: true, avatar_url: true }).optional(),
});
export type Task = Omit<z.infer<typeof TaskSchema>, 'subtasks'> & { subtasks?: Task[] };

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).default(''),
  due_date: z.string().datetime().nullable().default(null),
  priority: TaskPriority.default('p2'),
  parent_task_id: z.string().uuid().nullable().default(null),
  estimated_hours: z.number().min(0).nullable().default(null),
  assignee_id: z.string().uuid().nullable().default(null),
});
export type CreateTask = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  due_date: z.string().datetime().nullable().optional(),
  priority: TaskPriority.optional(),
  position: z.number().optional(),
  status: TaskStatus.optional(),
  estimated_hours: z.number().min(0).nullable().optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  parent_task_id: z.string().uuid().nullable().optional(),
});
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;

// ─── Activity / Streaks ──────────────────────────────────

export const ActivityLogSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  project_id: z.string().uuid(),
  activity_type: ActivityType,
  metadata: z.record(z.unknown()).default({}),
  logged_at: z.string().datetime(),
});
export type ActivityLog = z.infer<typeof ActivityLogSchema>;

export const CreateActivitySchema = z.object({
  activity_type: ActivityType,
  metadata: z.record(z.unknown()).default({}),
  hours: z.number().min(0).max(24).optional(),
});
export type CreateActivity = z.infer<typeof CreateActivitySchema>;

export const StreakInfoSchema = z.object({
  project_id: z.string().uuid(),
  current_streak: z.number().min(0),
  longest_streak: z.number().min(0),
  last_activity_date: z.string().nullable(),
  is_active: z.boolean(),
});
export type StreakInfo = z.infer<typeof StreakInfoSchema>;

// ─── Resources ───────────────────────────────────────────

export const ResourceSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  url: z.string().url(),
  title: z.string().max(500).default(''),
  description: z.string().max(2000).default(''),
  favicon_url: z.string().url().nullable(),
  og_image_url: z.string().url().nullable(),
  category: ResourceCategory.default('other'),
  notes: z.string().max(2000).default(''),
  added_by: z.string().uuid(),
  created_at: z.string().datetime(),
});
export type Resource = z.infer<typeof ResourceSchema>;

export const CreateResourceSchema = z.object({
  url: z.string().url(),
  category: ResourceCategory.default('other'),
  notes: z.string().max(2000).default(''),
});
export type CreateResource = z.infer<typeof CreateResourceSchema>;

// ─── Friends ─────────────────────────────────────────────

export const FriendshipSchema = z.object({
  user_id_1: z.string().uuid(),
  user_id_2: z.string().uuid(),
  status: z.enum(['pending', 'accepted', 'blocked']),
  action_user_id: z.string().uuid(),
  created_at: z.string().datetime(),
  friend: UserSchema.pick({ id: true, name: true, avatar_url: true, email: true }).optional(),
});
export type Friendship = z.infer<typeof FriendshipSchema>;

export const SendFriendRequestSchema = z.object({
  user_id: z.string().uuid(),
});
export type SendFriendRequest = z.infer<typeof SendFriendRequestSchema>;

// ─── GitHub Integration ──────────────────────────────────

export const LinkedRepoSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  github_repo_full_name: z.string(),
  last_fetched_at: z.string().datetime().nullable(),
  repo_data: z
    .object({
      description: z.string().nullable(),
      language: z.string().nullable(),
      stars: z.number(),
      forks: z.number(),
      open_issues: z.number(),
      open_prs: z.number(),
      pushed_at: z.string().nullable(),
    })
    .nullable(),
});
export type LinkedRepo = z.infer<typeof LinkedRepoSchema>;

export const LinkRepoSchema = z.object({
  repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/, 'Must be owner/repo format'),
});
export type LinkRepo = z.infer<typeof LinkRepoSchema>;

// ─── Notifications ───────────────────────────────────────

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: z.enum(['friend_request', 'task_assigned', 'member_added', 'project_update']),
  title: z.string(),
  body: z.string().default(''),
  metadata: z.record(z.unknown()).default({}),
  read: z.boolean().default(false),
  created_at: z.string().datetime(),
});
export type Notification = z.infer<typeof NotificationSchema>;

// ─── Contribution Graph Data ─────────────────────────────

export const ContributionDaySchema = z.object({
  date: z.string(), // YYYY-MM-DD
  count: z.number().min(0),
  level: z.number().min(0).max(4),
});
export type ContributionDay = z.infer<typeof ContributionDaySchema>;

export const ContributionGraphSchema = z.object({
  project_id: z.string().uuid(),
  weeks: z.array(z.array(ContributionDaySchema)),
  total: z.number(),
});
export type ContributionGraph = z.infer<typeof ContributionGraphSchema>;

// ─── API Response Wrappers ───────────────────────────────

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    next_cursor: z.string().nullable(),
    total: z.number().optional(),
  });

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    error: z.string().optional(),
  });

// ─── Auth ────────────────────────────────────────────────

export const SessionSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    avatar_url: z.string().nullable(),
    timezone: z.string(),
  }),
  expires: z.string().datetime(),
});
export type Session = z.infer<typeof SessionSchema>;
