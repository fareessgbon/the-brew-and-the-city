import { createAdminClient } from '@/lib/supabase/server';
import { FlagToggle } from './FlagToggle';
import type { FeatureFlagKey } from '@/lib/supabase/types';

const FLAG_INFO: Record<FeatureFlagKey, { label: string; description: string; wired: boolean }> = {
  matching_feed: {
    label: 'Matching feed',
    description: "Gates /today, /discover, and /map's ranked recommendations. Disabled falls back to the same plain, unranked café list a signed-out visitor already sees.",
    wired: true,
  },
  receipt_uploads: {
    label: 'Receipt uploads',
    description: 'Gates POST /api/visits — a member submitting a receipt photo for review.',
    wired: true,
  },
  ocr_processing: {
    label: 'OCR processing',
    description: 'Reserved for a future automatic receipt-reading step. No OCR pipeline exists yet, so this flag isn’t read anywhere yet.',
    wired: false,
  },
  automatic_receipt_approval: {
    label: 'Automatic receipt approval',
    description: 'Reserved for a future automatic-approval step. Every approval today is a human decision (café portal or admin backup review), so this flag isn’t read anywhere yet.',
    wired: false,
  },
  cafe_review_queue: {
    label: 'Café review queue',
    description: "Gates POST /api/portal/visits/[visitId] — a café approving or rejecting a receipt in its own portal. Admin backup review at /admin/visits is unaffected.",
    wired: true,
  },
  reward_activation: {
    label: 'Reward activation',
    description: 'Gates POST /api/rewards/activate — turning a ready City Card reward into a live, time-limited redeemable code.',
    wired: true,
  },
  reward_redemption: {
    label: 'Reward redemption',
    description: 'Gates POST /api/portal/redeem — a café redeeming a member’s activated code.',
    wired: true,
  },
  notifications: {
    label: 'Notifications',
    description: 'Reserved for a future notification system. None exists yet, so this flag isn’t read anywhere yet.',
    wired: false,
  },
};

const FLAG_ORDER: FeatureFlagKey[] = [
  'matching_feed',
  'receipt_uploads',
  'ocr_processing',
  'automatic_receipt_approval',
  'cafe_review_queue',
  'reward_activation',
  'reward_redemption',
  'notifications',
];

export default async function FeatureFlagsPage() {
  const supabase = createAdminClient();
  const { data: flags, error } = await supabase.from('feature_flags').select('*');
  const byKey = new Map((flags ?? []).map((f) => [f.key, f]));

  return (
    <section style={{ padding: '48px 0' }}>
      <div className="wrap">
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Feature flags</h1>
        <p style={{ color: 'var(--whisk)', fontSize: 14, marginBottom: 24 }}>
          Checked in the actual request-handling code (see each flag&apos;s description), not just hidden in the interface. Flags
          marked <em>reserved</em> exist for a future pipeline that isn&apos;t built yet — toggling them today does nothing.
        </p>

        {error ? (
          <p style={{ color: 'var(--error, #A8503F)' }}>Failed to load feature flags: {error.message}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {FLAG_ORDER.map((key) => {
              const flag = byKey.get(key);
              const info = FLAG_INFO[key];
              return (
                <div key={key} className="ratio-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>{info.label}</span>
                      {!info.wired ? (
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--whisk)', border: '1px solid var(--whisk-10)', borderRadius: 4, padding: '1px 6px' }}>
                          reserved
                        </span>
                      ) : null}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--whisk)', margin: '4px 0 0' }}>{info.description}</p>
                    {flag?.updated_by ? (
                      <p style={{ fontSize: 11.5, color: 'var(--whisk)', margin: '4px 0 0' }}>
                        Last changed by {flag.updated_by} on {new Date(flag.updated_at).toLocaleString('en-CA')}
                      </p>
                    ) : null}
                  </div>
                  <FlagToggle flagKey={key} enabled={flag?.enabled ?? true} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
