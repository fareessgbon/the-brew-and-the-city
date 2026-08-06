# Supabase setup

This app reads and writes a real Supabase project — Postgres schema, Auth,
and Storage. To run it locally you need your own project (local via Docker
or hosted) and its credentials in `.env.local`.

## Option A — local Supabase via Docker (recommended for development)

```bash
brew install supabase/tap/supabase   # or see supabase.com/docs/guides/cli
supabase init
supabase start
```

`supabase start` prints a local API URL, anon key, and service-role key.
Put them in `.env.local` (copy `.env.local.example`), then apply the schema:

```bash
supabase db reset   # runs everything in supabase/migrations/, in order
```

## Option B — hosted Supabase project

1. Create a free project at supabase.com.
2. Project Settings → API for the URL, anon key, and service-role key →
   `.env.local`.
3. Apply every file in `supabase/migrations/` in order — either via the SQL
   editor in the dashboard, `supabase link` + `supabase db push` with the CLI
   installed locally, or `scripts/run-migration.mjs` (a Docker-free fallback
   that applies them directly over a raw Postgres connection — see its
   header comment for usage).

## Once either is live

- `ADMIN_EMAILS` (comma-separated, in `.env.local`) controls who can reach
  `/admin` — see `lib/admin.ts`.
- `scripts/seed-cafes.mjs` is an optional, hand-run bootstrap for a handful
  of placeholder café rows — useful for a fresh project, not something to
  keep running once real cafés exist.
- If the schema changes, regenerate `lib/supabase/types.ts` with
  `supabase gen types typescript --local > lib/supabase/types.ts`. That file
  is otherwise hand-authored (see its own header comment) to work around a
  Supabase type-inference issue with cross-referenced Row/Insert/Update
  types — a regenerated file overwrites it entirely, which is expected.
