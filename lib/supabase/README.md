# Supabase — not yet connected

There is no live Supabase project behind this app yet. `lib/data/cafes.ts` is
a hardcoded placeholder standing in for the `cafes` table until one exists.

## Why it's not set up already

Setting this up needs either Docker (for a local Supabase stack) or a
Supabase account (for a hosted project) — the dev environment this was built
in has neither, and doesn't have the admin/sudo access Docker's installer
needs. Node.js was installed as a user-local binary (no sudo required);
Docker couldn't be.

## Option A — local Supabase via Docker (recommended for development)

```bash
brew install supabase/tap/supabase   # or see supabase.com/docs/guides/cli
supabase init
supabase start
```

`supabase start` prints a local API URL, anon key, and service-role key.
Put them in `.env.local` (copy `.env.local.example`), then apply the schema:

```bash
supabase db reset   # runs everything in supabase/migrations/
```

## Option B — hosted Supabase project

1. Create a free project at supabase.com (requires an account — this is a
   step only you can do; nothing here can create it for you).
2. Project Settings → API for the URL, anon key, and service-role key →
   `.env.local`.
3. Run `supabase/migrations/0001_init.sql` against it — either via the SQL
   editor in the dashboard, or `supabase link` + `supabase db push` with the
   CLI installed locally.

## Once either is live

- Regenerate `lib/supabase/types.ts`: `supabase gen types typescript --local > lib/supabase/types.ts`
- Replace `lib/data/cafes.ts`'s export with a query against the `cafes` table.
- Swap the `formsubmit.co` calls in `components/SignupForm.tsx` and
  `components/CafeApplicationForm.tsx` for real inserts (`taste_profiles` /
  `partner_applications`) — both are marked with `TODO(supabase)` comments.
- Wire up Supabase Auth (magic links) for `/login` and replace the
  `mm_member` localStorage record with a real session.
