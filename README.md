# Brew and the City — pre-launch site

The §0.4 pre-launch site from `BREW-AND-THE-CITY-spec-v3_6.md`: a static, no-account site that ships before the real
product does. Its only jobs are building awareness and collecting two validation surveys — nothing here is the
actual café-matching app.

## Site map

| Route | What it is |
| --- | --- |
| `/` | Hero + waitlist email signup |
| `/for-cafes` | Founding Partner pitch, FAQ, café survey link |
| `/help-shape-the-app` | Links to both surveys |
| `/help-shape-the-app/cafe-partner-survey` | 5-step café survey |
| `/help-shape-the-app/consumer-survey` | 6-step consumer survey (anonymous) |
| `/privacy`, `/terms` | Cover only what this site actually collects |

There is no login, signup, quiz, matching engine, admin console, or café portal — none of that ships until the real
product does.

## Local setup

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase values
npm run dev
```

## Environment variables

See `.env.local.example`. This site shares the full product's Supabase project (deliberate — see the comment in
`supabase/migrations/0021_prelaunch_waitlist_and_surveys.sql`) but only ever touches two tables: `waitlist` and
`survey_responses`.

## Database

One migration, `supabase/migrations/0021_prelaunch_waitlist_and_surveys.sql` — apply it with:

```bash
DATABASE_URL='postgresql://...' node scripts/run-migration.mjs
```

Both tables are insert-only via the service-role client (no public RLS policy); writes only happen through
`/api/waitlist` and `/api/surveys/*`, which validate and rate-limit every request.

## Checks

```bash
npm run lint
npx tsc --noEmit
npx vitest run
npm run build
```
