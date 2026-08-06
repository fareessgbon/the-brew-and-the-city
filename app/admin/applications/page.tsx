import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { approveApplication, rejectApplication } from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

// partner_applications has no SELECT policy at all — "only admins (service
// role) can read/update them" per migration 0001's own comment — so this
// must use the admin client, not the session-bound one requireAdmin() (in
// the parent layout) already gates this route with. Using the session
// client here silently returned zero rows via RLS, not an error: the page
// rendered "No applications yet." even with real pending rows in the
// table — indistinguishable from actually having none.
export default async function AdminApplicationsPage() {
  const supabase = createAdminClient();
  const { data: applications, error } = await supabase
    .from('partner_applications')
    .select('*')
    .order('created_at', { ascending: false });

  // Approving an application creates the café as 'listed' (see
  // app/admin/actions.ts's approveApplication — deliberately never
  // auto-grants a paying tier). Reward items and receipt upload only
  // render on a café's public page once its tier is above 'listed', so a
  // just-approved café is otherwise invisible as a City Card participant
  // until an admin does that one more step. Surfaced here so it isn't a
  // silent follow-up someone has to remember on their own.
  const linkedCafeIds = (applications ?? []).filter((a) => a.cafe_id).map((a) => a.cafe_id as string);
  const { data: linkedCafes } =
    linkedCafeIds.length > 0 ? await supabase.from('cafes').select('id, partner_status').in('id', linkedCafeIds) : { data: [] };
  const stillListed = new Set((linkedCafes ?? []).filter((c) => c.partner_status === 'listed').map((c) => c.id));

  return (
    <section style={{ padding: '48px 0' }}>
      <div className="wrap">
        <h1 style={{ fontSize: 30, marginBottom: 24 }}>Founding Partner applications</h1>

        {error ? (
          <p style={{ color: 'var(--error, #A8503F)' }}>Failed to load applications: {error.message}</p>
        ) : (applications ?? []).length === 0 ? (
          <p style={{ color: 'var(--whisk)' }}>No applications yet.</p>
        ) : (
          <div>
            {(applications ?? []).map((app) => (
              <div key={app.id} className="match-result" style={{ marginBottom: 12 }}>
                <div className="body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span className="name">{app.cafe_name}</span>
                    <span
                      className="pct"
                      style={{
                        background:
                          app.status === 'approved' ? 'var(--ceremony)' : app.status === 'rejected' ? 'var(--error, #A8503F)' : 'var(--whisk)',
                      }}
                    >
                      {app.status}
                    </span>
                  </div>
                  <div className="why">
                    {app.neighbourhood} · {app.email}
                    {app.instagram ? ` · ${app.instagram}` : ''}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--whisk)', marginTop: 4 }}>
                    Applied {new Date(app.created_at).toLocaleDateString('en-CA')}
                  </div>
                  {app.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <form action={approveApplication.bind(null, app.id)}>
                        <button type="submit" className="btn btn-primary" style={{ padding: '6px 16px', fontSize: 12.5 }}>
                          Approve
                        </button>
                      </form>
                      <form action={rejectApplication.bind(null, app.id)}>
                        <button type="submit" className="btn btn-ghost" style={{ padding: '6px 16px', fontSize: 12.5 }}>
                          Reject
                        </button>
                      </form>
                    </div>
                  ) : null}
                  {app.status === 'approved' && app.cafe_id ? (
                    <div style={{ marginTop: 10 }}>
                      <Link href={`/admin/cafes/${app.cafe_id}`} style={{ fontSize: 12.5 }}>
                        View café →
                      </Link>
                      {stillListed.has(app.cafe_id) ? (
                        <div style={{ fontSize: 12, color: 'var(--error, #A8503F)', marginTop: 4 }}>
                          Still &ldquo;Listed&rdquo; — reward items and receipt upload won&apos;t appear on its page until you set a
                          partner tier on the café&apos;s edit page.
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}