# AGENTS.md

EverythingMe is an Nx + pnpm monorepo. The only runnable product is the blog app
(`apps/blog`, TanStack Start + Better Auth + Drizzle/PostgreSQL). See `README.md`
for the canonical setup, run, build, and test commands.

## Cursor Cloud specific instructions

The update script runs `pnpm install` on startup. Everything below is not handled
automatically and is needed to actually run/test the blog end to end.

### PostgreSQL (required service)
- Postgres 16 is installed natively (no Docker in this environment) as cluster
  `16/main`, configured to listen on port **5433** to match
  `DATABASE_URL` in `.env.example`. Role/password/db are all `everythingme`.
- The cluster does **not** auto-start on a fresh boot. Start it each session with:
  `sudo pg_ctlcluster 16 main start` (check with `pg_lsclusters`).
- The install + data live in the VM snapshot, so the role, `everythingme`
  database, applied migrations, and any created users persist across sessions.
  Do not run `docker compose up` here — it will fail (Docker is not installed).

### Environment file (required)
- The blog reads env from `apps/blog/.env`, which Vite auto-loads into
  `process.env` at dev/build runtime — you do **not** need to export the vars for
  `pnpm nx dev blog`. `.env*` is gitignored, so it is not committed.
- If missing, recreate it: `cp .env.example apps/blog/.env` and set
  `BETTER_AUTH_SECRET` to a string of at least 32 chars
  (`openssl rand -base64 32`), or the app throws at startup (Zod validation).

### Migrations gotcha
- `libs/foundation/db/drizzle.config.ts` reads `process.env.DATABASE_URL`
  directly and does **not** load any `.env` file. Run migrations with the var
  exported, e.g.:
  `DATABASE_URL=postgresql://everythingme:everythingme@localhost:5433/everythingme pnpm nx run foundation-db:migrate`

### Lint / test / build notes
- `pnpm nx dev blog` serves on http://localhost:3000 (`/` redirects to
  `/technical`). Auth is API-only (no login UI); sign up via
  `POST /api/auth/sign-up/email`.
- `pnpm nx test blog` runs Vitest (currently no test files exist → exits 0).
- `pnpm nx build blog` builds via Vite/Nitro.
- There is **no lint target configured** despite the CI job being named
  "Lint, test, and build"; no ESLint/Biome/Prettier config exists.
