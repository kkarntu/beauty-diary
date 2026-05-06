# Beauty Diary

Women-oriented blog / diary application. Next.js 15 + NestJS 11 + PostgreSQL, deployed on Vercel + Render + Neon.

## Quick start

**Prerequisites:** Node 22+, pnpm 9+, Docker Desktop.

```bash
# 1. Install dependencies (single install for the whole monorepo)
pnpm install

# 2. Start local infra: Postgres + LocalStack S3 + Mailpit
pnpm infra:up

# 3. Copy env templates
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 4. Run database migrations
pnpm db:migrate

# 5. Run both apps in dev (api: 23001, web: 23000)
pnpm dev
```

Open <http://localhost:23000>. Mailpit UI: <http://localhost:8025>. LocalStack: <http://localhost:4569>.

## Workspace layout

```
apps/web         Next.js 15 (App Router, Tailwind v4, shadcn/ui)
apps/api         NestJS 11 (TypeORM, CQRS, custom JWT, Socket.IO)
packages/shared  Zod schemas + TypeScript types shared by both apps
infra/           docker-compose, render Blueprint, LocalStack init
```

## Common commands

| Command            | What it does                                      |
| ------------------ | ------------------------------------------------- |
| `pnpm dev`         | Run api + web in parallel                         |
| `pnpm test`        | Run unit + integration tests across the workspace |
| `pnpm typecheck`   | TypeScript check across all workspaces            |
| `pnpm lint`        | ESLint across all workspaces                      |
| `pnpm db:migrate`  | Apply TypeORM migrations                          |
| `pnpm db:generate` | Generate a new migration from entity diff         |
| `pnpm infra:reset` | Wipe local DB / S3 and restart                    |
