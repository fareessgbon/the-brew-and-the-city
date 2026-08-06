import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updateCafe, addMenuItem, deleteMenuItem } from '@/app/admin/actions';
import { CafeForm } from '../CafeForm';

export default async function EditCafePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cafe } = await supabase.from('cafes').select('*').eq('id', id).maybeSingle();
  if (!cafe) notFound();

  const [{ data: menuItems }, { data: attributes }] = await Promise.all([
    supabase.from('menu_items').select('*').eq('cafe_id', id).order('created_at'),
    supabase.from('cafe_attributes').select('*').eq('cafe_id', id).maybeSingle(),
  ]);

  return (
    <section style={{ padding: '48px 0' }}>
      <div className="wrap">
        <h1 style={{ fontSize: 30, marginBottom: 24 }}>Edit {cafe.name}</h1>
        <CafeForm cafe={cafe} attributes={attributes ?? undefined} action={updateCafe.bind(null, id)} submitLabel="Save changes" />

        <div className="label" style={{ margin: '40px 0 10px' }}>
          Menu items
        </div>
        <div style={{ marginBottom: 16 }}>
          {(menuItems ?? []).map((item) => (
            <div
              key={item.id}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--paper-2)' }}
            >
              <div>
                <strong>{item.name}</strong>
                {item.category ? <span style={{ color: 'var(--whisk)', fontSize: 12.5 }}> · {item.category}</span> : null}
                {item.price_cents != null ? <span style={{ color: 'var(--whisk)', fontSize: 12.5 }}> · ${(item.price_cents / 100).toFixed(2)}</span> : null}
                {item.description ? <div style={{ fontSize: 13, color: 'var(--ink)' }}>{item.description}</div> : null}
              </div>
              <form action={deleteMenuItem.bind(null, item.id, id)}>
                <button type="submit" className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: 12 }}>
                  Remove
                </button>
              </form>
            </div>
          ))}
          {(menuItems ?? []).length === 0 ? <p style={{ color: 'var(--whisk)', fontSize: 14 }}>No menu items yet.</p> : null}
        </div>

        <form action={addMenuItem.bind(null, id)} className="cafe-signup-form" style={{ maxWidth: 560 }}>
          <div className="field-row">
            <div>
              <label htmlFor="menu-name">Item name</label>
              <input type="text" id="menu-name" name="name" required />
            </div>
            <div>
              <label htmlFor="menu-category">Category</label>
              <select id="menu-category" name="category" defaultValue="coffee">
                <option value="coffee">Coffee</option>
                <option value="matcha">Matcha</option>
                <option value="tea">Tea</option>
                <option value="food">Food</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="field-row">
            <div>
              <label htmlFor="menu-price">Price ($)</label>
              <input type="number" step="0.01" min="0" id="menu-price" name="price" />
            </div>
            <div>
              <label htmlFor="menu-description">Description</label>
              <input type="text" id="menu-description" name="description" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            Add menu item
          </button>
        </form>
      </div>
    </section>
  );
}
