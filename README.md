# ProjectHub

> A full-stack project dashboard and collaboration hub built with Next.js, Fastify, PostgreSQL, and Redis.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Next.js 14    │────▶│   Fastify API   │────▶│  PostgreSQL  │
│  (App Router)   │     │   (TypeScript)  │     │              │
│                 │     │                 │     │    Redis     │
│  Tailwind CSS   │     │  Zod Validation │     └──────────────┘
│  Framer Motion  │     │  JWT Auth       │
│  TanStack Query │     │  Socket.io      │
│  Zustand        │     └─────────────────┘
└─────────────────┘
```

## Tech Stack

- **Frontend:** React 18, Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **State:** TanStack Query (server state), Zustand (client state)
- **Backend:** Fastify, TypeScript, Zod validation
- **Database:** PostgreSQL, Redis (caching/sessions)
- **Auth:** JWT with HTTP-only cookies, Google OAuth, GitHub OAuth
- **Real-time:** Socket.io
- **Design System:** Landa (dark theme, teal accents)

## Features

### ✅ Implemented

- **Authentication** — Google OAuth, GitHub OAuth, JWT session management
- **Dashboard** — Project grid with search, filter by status, stats overview
- **Project CRUD** — Create, edit, delete projects with status & visibility
- **Task Management** — Create, complete, delete tasks with priority & due dates
- **Contribution Graph** — GitHub-style activity heatmap with manual logging
- **Resources & Links** — Bookmark URLs with auto OG metadata fetch
- **Collaboration** — Friend system (search, request, accept), project members with roles
- **Activity Feed** — Chronological log of all project changes
- **GitHub Integration** — Link repos to projects, view repo status
- **Notifications** — Friend requests, member invites, task assignments
- **Settings** — Dark mode toggle, timezone config, streak preferences
- **Streak System** — Consecutive day tracking with visual flame indicators

### Design System (Landa)

Dark-themed UI with:
- **Primary:** #09bc8a (teal), #69ecbf (light teal)
- **Background:** #010907 (deep dark)
- **Text:** #f4f7f5 (off-white)
- **Font:** Inter (primary), Geist Mono (monospace), Clash Display (headings)
- **Spacing:** 1px base unit, custom scale
- **Radius:** 5px–999px scale
- **Transitions:** `color 0.45s cubic-bezier(0.44, 0, 0.56, 1)`

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker (optional, for DB/Redis)

### 1. Start Infrastructure

```bash
docker compose up -d
```

Or run PostgreSQL and Redis locally.

### 2. Apply Database Schema

```bash
cd apps/api
cp .env.example .env   # Edit with your credentials
npm run migrate        # Runs schema.sql
```

### 3. Configure OAuth

Create OAuth apps:
- **Google:** https://console.cloud.google.com → APIs & Services → Credentials
- **GitHub:** https://github.com/settings/developers

Set callback URLs to:
- `http://localhost:3000/api/auth/google/callback`
- `http://localhost:3000/api/auth/github/callback`

Add client IDs/secrets to `apps/api/.env` and `apps/web/.env.local`.

### 4. Run Development

```bash
# Root — starts both frontend and backend
npm run dev

# Or individually:
cd apps/api && npm run dev   # http://localhost:4000
cd apps/web && npm run dev   # http://localhost:3000
```

### 5. Open

Navigate to **http://localhost:3000** and sign in with Google or GitHub.

## Project Structure

```
ProjectHub/
├── apps/
│   ├── web/                     # Next.js 14 frontend
│   │   └── src/
│   │       ├── app/             # App Router pages
│   │       │   ├── dashboard/   # Main dashboard
│   │       │   ├── projects/    # Project detail
│   │       │   ├── login/       # Auth page
│   │       │   ├── friends/     # Friend management
│   │       │   ├── notifications/
│   │       │   └── settings/    # User preferences
│   │       ├── components/
│   │       │   ├── ui/          # Button, Card, Badge, Modal, Input
│   │       │   ├── layout/      # Sidebar, Navbar
│   │       │   ├── projects/    # ProjectCard, ContributionGraph
│   │       │   └── tasks/       # TaskList
│   │       ├── lib/             # API client
│   │       └── store/           # Zustand stores
│   └── api/                     # Fastify backend
│       └── src/
│           ├── routes/          # API route handlers
│           ├── middleware/       # Auth middleware
│           ├── db/              # Pool, models, schema
│           └── index.ts         # Server entry
├── packages/
│   ├── shared/                  # Types, Zod schemas, enums
│   └── tsconfig/                # Shared TS configs
├── docker-compose.yml
└── turbo.json
```

## API Endpoints

All endpoints: `GET/POST/PATCH/DELETE /api/v1/...`

| Domain | Endpoints |
|--------|-----------|
| **Auth** | `/auth/google`, `/auth/github`, `/auth/session`, `/auth/logout` |
| **Users** | `/users/me`, `/users/search` |
| **Projects** | `/projects`, `/projects/:id` |
| **Tasks** | `/projects/:id/tasks`, `/tasks/:taskId` |
| **Activity** | `/projects/:id/activity`, `/projects/:id/contribution-graph`, `/streaks` |
| **Resources** | `/projects/:id/resources`, `/resources/:id` |
| **Collaboration** | `/friends/*`, `/projects/:id/members` |
| **GitHub** | `/projects/:id/link-repo`, `/projects/:id/repo-status` |
| **Notifications** | `/notifications`, `/notifications/read-all` |

## License

MIT
