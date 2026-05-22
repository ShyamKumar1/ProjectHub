
---

# Project Dashboard & Collaboration Hub – SRS Document

**Version:** 1.0  
**Target Audience:** AI Development Agent

## 1. Introduction
### 1.1 Purpose
Build a full-stack web application named **“ProjectHub”** that serves as a central dashboard for a developer/maker to track all personal and collaborative projects. The app will manage project metadata, daily streaks, to-do lists, resource collections, contribution graphs, and friend collaboration – eliminating fragmented note-taking and forgotten repos.

### 1.2 Design & UX Guidelines
The client will supply a separate design file/style guide (Figma/Sketch) containing exact colors, typography, spacing, animations, and component states. **The AI agent must implement the UI pixel-perfectly** according to that guide, using responsive breakpoints (mobile, tablet, desktop). Dark mode is mandatory with a toggle in the user profile.

## 2. System Overview & Architecture
### 2.1 High-Level Architecture
- **Frontend:** React 18+ with TypeScript, Next.js 14 (App Router) for SSR/SSG where beneficial, Tailwind CSS for styling, Framer Motion for micro-interactions.
- **State Management:** Server state with React Query (TanStack Query), client state with Zustand.
- **Backend:** Node.js with Express or Fastify, fully typed with TypeScript. Separate REST API.
- **Database:** PostgreSQL (primary), Redis (caching, sessions, rate limiting, real-time pub/sub).
- **Real-time:** Socket.io for live project updates, task assignments, and friend activity.
- **Authentication:** NextAuth.js (Auth.js) with Google OAuth provider. GitHub OAuth as secondary provider for repo integration. JWT for API authentication, stored in HTTP-only cookies.
- **File Storage:** AWS S3 (or MinIO for self-hosted) for user avatars and resource attachments.

### 2.2 Deployment
- Dockerized containers. CI/CD pipeline (GitHub Actions) building, linting, testing, deploying to a cloud platform (Vercel for frontend, AWS ECS or Railway for backend). All environment variables strictly typed and validated with Zod on startup.

## 3. Functional Requirements
### 3.1 User Authentication & Profile
- **Google OAuth:** Primary login. Users must have an account to access any data.
- **GitHub OAuth:** Optional linking for repository tracking feature.
- **Registration/Login:** No email/password; OAuth only to minimize security surface.
- **Session management:** Secure, HTTP-only cookies. Token refresh rotation.
- **User profile:** Display name, avatar, timezone setting (auto-detected, editable), streak preferences.

### 3.2 Project Management
- **CRUD Projects:** Name, description, emoji/icon, status (Idea, In Progress, Completed, Archived), visibility (Private, Friends, Public).
- **Dashboard Grid:** A responsive card grid of all projects. Each card shows: project name, status badge, streak flame (if active), last activity timestamp, progress bar from to-do completion, and quick actions.
- **Single Project Dashboard:** A deep-dive view. Contains:
  - **Hero header** with project title, status toggle, timer (optional focus mode).
  - **Contribution Graph** (GitHub-style) reflecting daily activity units (logs/manual entries).
  - **To-Do List** with drag-and-drop ordering, subtasks, due dates.
  - **Resources & Links** with thumbnail preview, categorization, and search.
  - **Collaboration Panel** (friends list, assigned tasks, contribution summary).
  - **Activity Feed** chronological log of all changes.

### 3.3 Streak System
- A streak is the number of consecutive days the user performed any “activity” in a project (activity defined as: completed a task, added a resource, logged time, pushed a commit if GH integrated).
- Each day at midnight (user’s timezone), the system checks if an activity was registered yesterday. If no, streak resets to 0. If yes, streak increments. Maximum streak freeze (weekend pause) is a user preference.
- Streak is displayed as a flame icon with number on the project card and dashboard.

### 3.4 To-Do Lists Per Project
- Hierarchical: a task can have subtasks (max depth 3).
- Task attributes: title, description, due date, priority (P0-P3), label/tag, assigned friend (if collaboration enabled), estimated hours, completion status.
- Ordering: manual drag-and-drop (persisted via `position` index). Sorting options: due date, priority, creation.
- Filtering: by status, assignee, priority, label.
- Streak integration: completing a task counts as an activity for the day.

### 3.5 Resources & Useful Links
- For each project, a list of URL bookmarks.
- Automatic metadata fetch (Open Graph) to show title, description, favicon.
- Manual categorization (tutorial, documentation, tool, inspiration, etc.).
- Search and tag filter.
- Ability to add notes to each link.

### 3.6 GitHub-Style Contribution Graph
- **Manual mode:** User clicks a day tile to log “I worked on this project”, optionally specifying hours.
- **Auto mode (if GitHub OAuth linked):** Fetch commit events from GitHub API for repos associated with this project. Map commit count to color intensity.
- Graph layout: 52 weeks x 7 days, color scale from light to dark green. Tooltip on hover showing date and activity count.
- The graph aggregates all activity sources.

### 3.7 Collaboration & Friends
- **Friends System:** Search users by email/username, send friend request, accept/decline, block. Friendship is reciprocal.
- **Add Friends to Project:** Project owner invites friends from their friend list. Invited users get a role: Viewer, Editor, Admin.
- **Task Assignment:** Editors/Admins can assign to-do items to project members. Assignee receives notification.
- **Progress Tracking:** Each friend’s completed tasks / total assigned shown. Activity feed filtered by user.
- **Permission Enforcement:** Backend middleware validates role on every collaborative mutation.

### 3.8 GitHub Repository Tracking
- After linking GitHub OAuth, user can associate a repository (owner/repo) with a project.
- Dashboard periodically polls (or uses webhook) to show: repo existence, last pushed date, open issues/PR count, top language.
- Visual indicator on project card: a GitHub icon with “pushed 2 days ago” or “no repo” warning. This directly addresses “forgot if I created a repo” – the dashboard tells you.

### 3.9 Search & Global Filtering
- Global search bar across all projects, tasks, and resources.
- Dashboard filters: by project status, by team member, by “needs action” (overdue tasks).

## 4. Non-Functional Requirements
### 4.1 Performance
- API responses under 200ms for 95th percentile on core endpoints (with Redis caching of frequent queries).
- Contribution graph data aggregated via materialized views or precomputed daily buckets; never scanned raw logs on request.
- Frontend: Lighthouse performance score > 90. Code splitting, image lazy loading, optimized bundle.

### 4.2 Time & Space Complexity
- All database queries must use indexes and avoid full table scans. Use `EXPLAIN ANALYZE` to verify.
- Pagination (cursor-based) for infinite scroll lists.
- Real-time events broadcast only to relevant rooms (project rooms), not globally.

### 4.3 Security
- Input validation and sanitization (server-side) using Zod.
- CSRF protection with SameSite cookies.
- Rate limiting on auth and API endpoints (express-rate-limit backed by Redis).
- All secrets stored in environment variables, never hardcoded.
- Prepared statements/parameterized queries; no raw SQL interpolation.
- File uploads: virus scanning, size limits, content-type whitelisting.

### 4.4 Scalability
- Stateless backend, horizontally scalable.
- Database connection pooling.
- Redis cluster for session store and cache.

### 4.5 Code Quality
- **No AI slop:** Avoid unnecessary `any` types, boilerplate, duplicate code. Use meaningful variable names, consistent file structure, and adhere to SOLID principles.
- **DRY & reusable components:** UI components built with composition; API service layer abstracted.
- **Testing:** Unit tests for business logic (Jest), integration tests for API (Supertest), E2E smoke tests (Playwright).
- **Linting & Formatting:** ESLint, Prettier, Husky pre-commit hooks.

## 5. Database Schema (Conceptual Overview)
The DB must be normalized, using UUIDs as primary keys.

**Users Table**
- id (UUID), email, name, avatar_url, google_id, github_id (nullable), timezone, created_at, streak_preferences JSONB.

**Projects Table**
- id, owner_id (FK users), name, description, icon, status (ENUM), visibility (ENUM), created_at, updated_at.

**Project Members**
- project_id, user_id, role (ENUM), joined_at. Composite PK.

**Tasks Table**
- id, project_id, parent_task_id (self-referential, nullable), title, description, due_date, priority (ENUM), position (float), estimated_hours, status (ENUM), assignee_id (nullable, FK users), created_by (FK users), created_at, updated_at.

**Activity Logs** (for contribution graph & streaks)
- id, user_id, project_id, activity_type (ENUM: task_completed, resource_added, time_logged, commit_pushed), metadata JSONB, logged_at (timestamp with time zone).

**Resources Table**
- id, project_id, url, title, description, favicon_url, category (ENUM), added_by (FK users), created_at.

**Friendships Table**
- user_id_1, user_id_2, status (pending, accepted, blocked), action_user_id (who initiated), created_at.

**Linked Repos Table** (if GitHub integration)
- id, project_id, user_id, github_repo_full_name, last_fetched_at.

*All tables indexed on foreign keys and frequently queried columns (user_id, project_id, logged_at, status).*

## 6. API Endpoints (Representative List)
All endpoints prefixed with `/api/v1`. Authenticated via Bearer token or cookie.

### Auth
- `GET /api/v1/auth/session` – current user
- `POST /api/v1/auth/logout`

### Users
- `GET /api/v1/users/me` – profile
- `PATCH /api/v1/users/me` – update timezone, preferences
- `GET /api/v1/users/search?q=...` – search for friends

### Projects
- `GET /api/v1/projects` – list user’s projects (filter, sort)
- `POST /api/v1/projects` – create
- `GET /api/v1/projects/:id` – detailed dashboard data
- `PATCH /api/v1/projects/:id` – update
- `DELETE /api/v1/projects/:id`

### Collaboration
- `POST /api/v1/projects/:id/members` – invite friend
- `PATCH /api/v1/projects/:id/members/:userId` – change role
- `DELETE /api/v1/projects/:id/members/:userId` – remove

### Tasks
- `GET /api/v1/projects/:id/tasks` – all tasks (flat or tree)
- `POST /api/v1/projects/:id/tasks` – create
- `PATCH /api/v1/tasks/:taskId` – update (reorder handled via position)
- `DELETE /api/v1/tasks/:taskId`

### Activity & Streaks
- `GET /api/v1/projects/:id/activity?range=...` – contribution data
- `POST /api/v1/projects/:id/activity` – manual log
- `GET /api/v1/streaks` – all project streaks for user

### Resources
- `GET /api/v1/projects/:id/resources`
- `POST /api/v1/projects/:id/resources` (auto-fetch metadata)
- `DELETE /api/v1/resources/:resourceId`

### GitHub Integration (optional)
- `POST /api/v1/projects/:id/link-repo` – body {repo}
- `GET /api/v1/projects/:id/repo-status` – fetched data

### Notifications
- `GET /api/v1/notifications` – recent
- `PATCH /api/v1/notifications/read-all`

## 7. User Interface Requirements
- **Design System**: (Included in landa-design-system.md file)
- **Responsive Grid:** CSS Grid with `auto-fill` and `minmax` for project cards.
- **Dark Mode:** Follows design system, persisted in localStorage, also a toggle.
- **Animations:** Layout shifts, hover effects, streak flames, confetti on streak milestone – all subtle, not blocking interaction.
- **Accessibility:** WCAG AA, proper contrast, keyboard navigation, aria labels.

---

