import { createCafe } from '@/app/admin/actions';
import { CafeForm } from '../CafeForm';

export default function NewCafePage() {
  return (
    <section style={{ padding: '48px 0' }}>
      <div className="wrap">
        <h1 style={{ fontSize: 30, marginBottom: 24 }}>New café</h1>
        <CafeForm action={createCafe} submitLabel="Create café" />
      </div>
    </section>
  );
}
