# @beauty-diary/api

NestJS backend for Beauty Diary. Clean Architecture + CQRS + TypeORM + custom JWT auth.

## Quick start

From the **monorepo root**:

```bash
pnpm install
pnpm infra:up                    # Postgres + LocalStack S3 + Mailpit
cp apps/api/.env.example apps/api/.env  # then fill secrets
pnpm db:migrate
pnpm dev:api
```

API is at <http://localhost:23001/health>.

## Layout

```
src/
├── common/           # filters, guards, decorators, errors
├── config/           # typed env loader (Zod-validated)
├── database/         # TypeORM datasource, migration runner
├── migrations/       # forward-only TypeORM migrations
├── modules/          # one folder per feature (auth, users, posts, …)
│   └── health/       # /health endpoint
├── app.module.ts
└── main.ts
```

Each feature module follows Clean Architecture layering (domain / application / infrastructure / presentation). See `docs/RULES.md` § 2.1 in the repo root for the exact contract.

## Common commands (run from repo root)

| Command                                     | Purpose                             |
| ------------------------------------------- | ----------------------------------- |
| `pnpm dev:api`                              | Watch-mode dev server (port 23001)  |
| `pnpm --filter=@beauty-diary/api build`     | Compile to `dist/`                  |
| `pnpm --filter=@beauty-diary/api test`      | Unit tests                          |
| `pnpm --filter=@beauty-diary/api test:int`  | Integration tests (Testcontainers)  |
| `pnpm --filter=@beauty-diary/api test:e2e`  | E2E tests                           |
| `pnpm db:generate -- src/migrations/<Name>` | Generate migration from entity diff |
| `pnpm db:migrate`                           | Apply pending migrations            |
| `pnpm db:revert`                            | Revert the last migration           |

See `docs/TESTING.md` for the testing layer split and recipes.
