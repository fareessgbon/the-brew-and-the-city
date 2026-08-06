import { beforeEach, describe, expect, it, vi } from 'vitest';

// logAdminAction's only job is to shape a row and insert it — that requires
// a Supabase client, so unlike this repo's other tests, this one mocks
// @/lib/supabase/server rather than hitting a real database. What's under
// test is the field-mapping contract (every admin mutation is supposed to
// record admin/action/record type/id/previous/new value/timestamp — see
// app/admin/actions.ts's call sites), not Supabase itself.
const insertMock = vi.fn<(row: Record<string, unknown>) => Promise<{ data: null; error: null }>>();
insertMock.mockResolvedValue({ data: null, error: null });
const fromMock = vi.fn(() => ({ insert: insertMock }));

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

const { logAdminAction } = await import('../auditLog');

describe('logAdminAction', () => {
  beforeEach(() => {
    insertMock.mockClear();
    fromMock.mockClear();
  });

  it('writes to the audit_log table', async () => {
    await logAdminAction('admin@example.com', 'cafe.create', 'Created café "Monogram"');
    expect(fromMock).toHaveBeenCalledWith('audit_log');
    expect(insertMock).toHaveBeenCalledTimes(1);
  });

  it('records the admin email, action, and summary as given', async () => {
    await logAdminAction('admin@example.com', 'cafe.create', 'Created café "Monogram"');
    const payload = insertMock.mock.calls[0][0];
    expect(payload).toMatchObject({
      admin_email: 'admin@example.com',
      action: 'cafe.create',
      summary: 'Created café "Monogram"',
    });
  });

  it('defaults every optional field to null rather than undefined when omitted', async () => {
    await logAdminAction('admin@example.com', 'feature_flag.toggle', 'Enabled "matching_feed"');
    const payload = insertMock.mock.calls[0][0];
    expect(payload.detail).toBeNull();
    expect(payload.record_type).toBeNull();
    expect(payload.record_id).toBeNull();
    expect(payload.previous_value).toBeNull();
    expect(payload.new_value).toBeNull();
  });

  it('passes through detail and the full record shape (type, id, previous/new value) when given', async () => {
    await logAdminAction(
      'admin@example.com',
      'reward_item.update',
      'Updated reward item "Iced Matcha"',
      { cafeId: 'cafe-1' },
      {
        recordType: 'reward_item',
        recordId: 'item-1',
        previousValue: { reimbursement_cents: 400 },
        newValue: { reimbursement_cents: 500 },
      },
    );
    const payload = insertMock.mock.calls[0][0];
    expect(payload.detail).toEqual({ cafeId: 'cafe-1' });
    expect(payload.record_type).toBe('reward_item');
    expect(payload.record_id).toBe('item-1');
    expect(payload.previous_value).toEqual({ reimbursement_cents: 400 });
    expect(payload.new_value).toEqual({ reimbursement_cents: 500 });
  });

  it('records an explicit null previousValue (e.g. a create) distinctly from an omitted one', async () => {
    await logAdminAction('admin@example.com', 'reward_item.create', 'Added reward item "Iced Matcha"', undefined, {
      recordType: 'reward_item',
      recordId: 'item-2',
      previousValue: null,
      newValue: { name: 'Iced Matcha' },
    });
    const payload = insertMock.mock.calls[0][0];
    expect(payload.previous_value).toBeNull();
    expect(payload.new_value).toEqual({ name: 'Iced Matcha' });
  });
});
