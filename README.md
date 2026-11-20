# Brew and the City — pre-launch site

The §0.4 pre-launch site from `BREW-AND-THE-CITY-spec-v3_7.md`: it ships before the real product does, and its jobs
are building awareness, collecting a waitlist and café leads, running three validation surveys, hiring the small
team's first roles, and giving the founder somewhere to seed and manage cafés. It is **not** the real café-matching
app — no user accounts, no café portal, no reward redemption, no receipt processing.

One deliberate exception: the homepage's taste quiz runs the real matching engine (`lib/matching/`) against real
seeded café data, as a genuine — not faked — preview of what matching will feel like (see git history:
`Restore the real quiz + matching engine to the pre-launch homepage`). It's disclosed on-page via `DemoBanner`
("illustrative placeholders... imply no partnership or endorsement") for exactly this reason. It still ends at the
waitlist, never at an account. See spec §0.4 / §12.1a / §0.4c / §0.4d for the full reasoning behind every row below.

## Site map

| Route | What it is |
| --- | --- |
| `/` | Hero, real taste-match quiz preview (real matching engine + seeded café data), waitlist signup |
| `/for-cafes` | Founding Partner pitch, pricing tiers, FAQ, café survey link |
| `/make-brew-better` | Links to all three surveys below |
| `/make-brew-better/cafe-partner-survey` | 7-step café validation survey |
| `/make-brew-better/consumer-survey` | 6-step consumer survey (anonymous) |
| `/make-brew-better/cafe-taste-survey` | 9-step self-report survey — a café describes its own taste vector directly (spec §13.6.3) |
| `/careers`, `/careers/[slug]`, `/careers/[slug]/apply` | Hiring: role listing, per-role posting, application form (resume upload, emailed confirmation). Multi-company capable — each role carries its own contact email and application-form copy (spec §0.4d) |
| `/privacy`, `/terms` | Cover only what this site actually collects |
| `/admin` | PIN-gated (`ADMIN_PIN`), `noindex`, not linked from nav. Waitlist, survey, and job-application submissions; status/notes workflow; CSV export. |
| `/admin/cafes`, `/admin/cafes/[id]`, `/admin/cafes/new` | The café list and editor — create/edit a café's drink categories, all 7 taste-vector sliders, price band, hours, verification. A café-taste-survey submission can prefill a new row here for review rather than writing straight to `cafes`. An early, minimal slice of the real product's §16 admin console (spec §0.4c) — no bulk CSV import, no vector tuner yet. |
| `/admin/consumer/[id]`, `/admin/applications/[id]` | Detail views for a single consumer-survey response or job application, from the admin dashboard |

Founder ops tooling throughout `/admin/*` — not the real product's eventual admin console, and none of it is reachable
without the PIN. There is still no login/signup flow, no *user* accounts, no café portal, no reward redemption, and
no receipt processing — none of that ships until the real product does.

## Local setup

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase values
npm run dev
```

## Environment variables

See `.env.local.example`. This site shares the full product's Supabase project (deliberate — see the comment in
`supabase/migrations/0021_prelaunch_waitlist_and_surveys.sql`) and touches `waitlist`, `survey_responses`, and
`cafes` — the last of these both read (the homepage quiz) and, via `/admin/cafes`, written. `RESEND_API_KEY` sends
survey/waitlist/job-application confirmation and rejection emails (`lib/server/email.ts`); `ADMIN_PIN` gates `/admin`.

## Database

Migrations relevant to this site's own tables:

- `supabase/migrations/0021_prelaunch_waitlist_and_surveys.sql` — `waitlist` and `survey_responses`
- `supabase/migrations/0023_survey_review_workflow.sql`, `0024_survey_soft_delete.sql` — admin status/notes/soft-delete columns on `survey_responses`
- `supabase/migrations/0025_waitlist_name_and_cafes.sql` — optional name + free-text "cafés you already love" on `waitlist`
- `supabase/migrations/0026_job_applications.sql` — adds `job_application` as a fourth `survey_responses.survey` value, reusing the same review workflow rather than a parallel table
- `supabase/migrations/0027_resumes_bucket.sql` — private resume storage for `/careers` applications, read back via short-lived signed URLs
- `supabase/migrations/0028_application_rejection_email.sql` — tracks whether a rejection email has been sent per application
- `supabase/migrations/0029_cafe_taste_vector_survey.sql` — adds `cafe_taste_vector` as a fifth `survey_responses.survey` value (§13.6.3)
- `supabase/migrations/0030_cafe_city.sql` — adds `city` (`calgary` | `toronto`) to `cafes`, backfilled to `calgary` for existing rows, for the Toronto market launch

Apply with:

```bash
DATABASE_URL='postgresql://...' node scripts/run-migration.mjs
```

`waitlist` and `survey_responses` are insert-only via the service-role client from the public side (no public RLS
policy); writes only happen through `/api/waitlist`, `/api/surveys/*`, and `/api/careers/apply`, which validate and
rate-limit every request. `/admin` and its `/api/admin/*` routes are the only things that read or update
`survey_responses` beyond that insert, and the only things that write to `cafes` at all.

## Checks

```bash
npm run lint
npx tsc --noEmit
npx vitest run
npm run build
```
