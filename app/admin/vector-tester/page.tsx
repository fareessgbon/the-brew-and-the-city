import { VectorTesterClient } from './VectorTesterClient';

export default function VectorTesterPage() {
  return (
    <section style={{ padding: '48px 0' }}>
      <div className="wrap">
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Vector tester</h1>
        <p style={{ color: 'var(--whisk)', fontSize: 14, marginBottom: 24 }}>
          Live against lib/matching/calculateMatch() and the real cafés table — nothing mocked.
        </p>
        <VectorTesterClient />
      </div>
    </section>
  );
}
