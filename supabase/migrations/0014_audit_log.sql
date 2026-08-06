-- Records important administrative changes (café create/update/delete, CSV
-- import, menu item changes, partner application decisions, backup receipt
-- reviews, receipt purges). Same access pattern as analytics_events /
-- error_logs (migration 0007): no public policies, written and read
-- exclusively via the service-role client from admin Server Actions and the
-- /admin/audit page, which is itself gated by requireAdmin().
create table if not exists public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  admin_email  text not null,
  action       text not null,
  summary      text not null,
  detail       jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;
