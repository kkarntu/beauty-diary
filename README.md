# Beauty Diary

Women-oriented blog / diary application. Users register (with email-OTP verification), publish posts, comment, like, favorite, follow authors, and receive in-app + email notifications in real time.

**Stack:** Next.js 15 (App Router) + NestJS 11 + PostgreSQL 16 + Socket.IO + Cloudflare R2.
**Deployed to:** Vercel (web) · Render (api) · Neon (DB) · Cloudflare R2 (images) · Brevo (email HTTP API).

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

# 4. Apply database migrations
pnpm db:migrate

# 5. Run both apps in dev (api: 23001, web: 23000)
pnpm dev
```

Open <http://localhost:23000>. Mailpit UI: <http://localhost:8025>. LocalStack: <http://localhost:4569>.

### Optional: auto-seed an admin account

Add to `apps/api/.env` before first start:

```
ADMIN_SEED_EMAIL=admin@beauty-diary.local
ADMIN_SEED_PASSWORD=admin12345
ADMIN_SEED_NICKNAME=admin
```

The api creates the admin on bootstrap if no admin exists yet, or promotes an existing user with that email. Sign in with those credentials → "Admin panel" appears in the avatar menu.

## Workspace layout

```
apps/web         Next.js 15 — App Router, Tailwind v4, shadcn/ui, TanStack Query, Socket.IO client
apps/api         NestJS 11 — TypeORM, CQRS (commands/queries), custom JWT auth, Socket.IO gateway, email outbox
packages/shared  Zod DTO schemas + TypeScript types shared by both apps
infra/           docker-compose (Postgres + LocalStack + Mailpit), Render Blueprint, LocalStack init
```

## Common commands

| Command            | What it does                                         |
| ------------------ | ---------------------------------------------------- |
| `pnpm dev`         | Run api + web in parallel                            |
| `pnpm test`        | Run unit + integration tests across the workspace    |
| `pnpm typecheck`   | TypeScript check across all workspaces               |
| `pnpm lint`        | ESLint across all workspaces                         |
| `pnpm build`       | Build shared, api, and web for production            |
| `pnpm db:migrate`  | Apply TypeORM migrations to local DB                 |
| `pnpm db:revert`   | Revert the last migration                            |
| `pnpm db:generate` | Generate a new migration from entity diff            |
| `pnpm infra:up`    | Start docker-compose containers (Postgres, S3, mail) |
| `pnpm infra:reset` | Wipe local DB / S3 volumes and restart               |
| `pnpm format`      | Run Prettier across the repo                         |

## Email in development vs production

- **Local dev:** SMTP → Mailpit (`localhost:1025`). View captured emails at <http://localhost:8025>.
- **Production:** HTTP API → Brevo (`MAIL_DRIVER=brevo` + `BREVO_API_KEY`). Render's free tier blocks outbound SMTP, so an HTTP provider is required.

The `MAIL_DRIVER` env var switches between drivers (`smtp` or `brevo`).

All outbound mail flows through the **outbox table** — handlers enqueue, a 30-second cron processor sends with exponential backoff retries (1m → 5m → 15m → 1h → 6h, then `failed`). Failed rows are inspectable + retryable in `/admin/email-outbox`.

## Production deployment overview

| Service            | Provider          | What's deployed                                     |
| ------------------ | ----------------- | --------------------------------------------------- |
| Web (Next.js)      | Vercel            | Auto-build from `main`. Proxies `/api`, `/socket.io` to Render. |
| API (NestJS)       | Render (free Web) | Auto-build from `main`. Migrations run on start.    |
| Database           | Neon (Postgres)   | Connection string in `DATABASE_URL`.                |
| Object storage     | Cloudflare R2     | Public bucket for cover images / avatars.           |
| Email              | Brevo HTTP API    | `MAIL_DRIVER=brevo` on Render.                      |

The web app proxies `/api/*` and `/socket.io/*` through Next.js rewrites so cookies are first-party (avoids cross-origin cookie limits between Vercel and Render).

