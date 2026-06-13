# EverythingMe

An all-in-one monorepo for personal software projects.

## What lives here

| Purpose | Location | `lessons/` required |
|---|---|---|
| Personal blog | [`apps/blog`](apps/blog) | Optional |
| Re-event the wheel | [`apps/revent-the-wheel/<project>/`](apps/revent-the-wheel) | Yes |
| Studying | [`apps/studying/<project>/`](apps/studying) | Yes |
| Foundation libs | [`libs/foundation/`](libs/foundation) | No |

Every project under `apps/` is grouped by category. Revent and study projects always keep a `lessons/` folder next to their source code.

## Tech stack

- **Monorepo:** Nx + pnpm workspaces
- **Blog app:** TanStack Start, TanStack Router/Query
- **Content:** Fumadocs MDX
- **Auth:** Better Auth
- **Database:** PostgreSQL + Drizzle ORM
- **Shared libs:** `@everythingme/{config,db,auth,ui}`

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL

PostgreSQL runs on port **5433** locally (mapped from container 5432) to avoid conflicts with an existing Postgres on 5432.

```bash
docker compose up -d
```

### 3. Configure environment

```bash
cp .env.example apps/blog/.env
# Edit BETTER_AUTH_SECRET — generate with: openssl rand -base64 32
```

### 4. Run database migrations

```bash
pnpm nx run foundation-db:migrate
```

### 5. Start the blog

```bash
pnpm nx dev blog
```

Open [http://localhost:3000](http://localhost:3000).

## Common commands

```bash
pnpm nx dev blog              # Start blog dev server
pnpm nx build blog            # Production build
pnpm nx graph                 # Visualize project graph
pnpm nx show projects         # List all Nx projects
```

## Adding a new project

### Re-event the wheel

```bash
cp -R apps/revent-the-wheel/example apps/revent-the-wheel/my-project
```

Then scaffold your app inside `apps/revent-the-wheel/my-project/` and document in `lessons/`.

### Studying

```bash
cp -R apps/studying/example apps/studying/my-experiment
```

Build the smallest app that exercises the technology and write lessons as you go.

## Foundation libraries

- `@everythingme/config` — Zod env validation
- `@everythingme/db` — Drizzle client and auth schema
- `@everythingme/auth` — Better Auth instance
- `@everythingme/ui` — Shared shadcn/ui components (`Button`, `Card`, `cn` utility)

Import these from any app in the monorepo. Add more shadcn components to `libs/foundation/ui` with:

```bash
cd libs/foundation/ui && pnpm dlx shadcn@latest add badge
```

Or from the blog app (components land in the shared UI package):

```bash
cd apps/blog && pnpm dlx shadcn@latest add badge
```
