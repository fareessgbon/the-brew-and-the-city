# Brew and the City — pre-launch site

The §0.4 pre-launch site from `BREW-AND-THE-CITY-spec-v3_6.md`: it ships before the real product does, and its jobs
are building awareness, collecting a waitlist and café leads, and running two validation surveys. It is **not** the
real café-matching app — no accounts, no café portal, no reward redemption, no receipt processing.

One deliberate exception: the homepage's taste quiz runs the real matching engine (`lib/matching/`) against real
seeded café data, as a genuine — not faked — preview of what matching will feel like (see git history:
`Restore the real quiz + matching engine to the pre-launch homepage`). It's disclosed on-page via `DemoBanner`
("illustrative placeholders... imply no partnership or endorsement") for exactly this reason. It still ends at the
waitlist, never at an account.

## Site map

| Route | What it is |
| --- | --- |
| `/` | Hero, real taste-match quiz preview (real matching engine + seeded café data), waitlist signup |
| `/for-cafes` | Founding Partner pitch, pricing tiers, FAQ, café survey link |
| `/help-shape-the-app` | Links to both surveys |
| `/help-shape-the-app/cafe-partner-survey` | 7-step café survey |
| `/help-shape-the-app/consumer-survey` | 5-step consumer survey (anonymous) |
| `/privacy`, `/terms` | Cover only what this site actually collects |
| `/admin` | PIN-gated (`ADMIN_PIN`), `noindex`, not linked from nav. Waitlist + survey submissions, status/notes workflow for café leads, CSV export. Founder ops tooling, not the real product's admin console. |

There is no login/signup flow, no user accounts, no café portal, no reward redemption, and no receipt processing —
none of that ships until the real product does.

## Local setup

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase values
npm run dev
```

## Environment variables

See `.env.local.example`. This site shares the full product's Supabase project (deliberate — see the comment in
`supabase/migrations/0021_prelaunch_waitlist_and_surveys.sql`) but only ever touches the `cafes` table (read-only,
for the homepage quiz), `waitlist`, and `survey_responses`.

## Database

Two migrations relevant to this site's own tables:

- `supabase/migrations/0021_prelaunch_waitlist_and_surveys.sql` — `waitlist` and `survey_responses`
- `supabase/migrations/0023_survey_review_workflow.sql`, `0024_survey_soft_delete.sql` — admin status/notes/soft-delete columns on `survey_responses`

Apply with:

```bash
DATABASE_URL='postgresql://...' node scripts/run-migration.mjs
```

`waitlist` and `survey_responses` are insert-only via the service-role client from the public side (no public RLS
policy); writes only happen through `/api/waitlist` and `/api/surveys/*`, which validate and rate-limit every
request. `/admin` and its `/api/admin/*` routes are the only things that read or update `survey_responses` beyond
that insert.

## Checks

```bash
npm run lint
npx tsc --noEmit
npx vitest run
npm run build
```
