'use client';

import { useState } from 'react';

const FAQ: { question: string; answer: string }[] = [
  {
    question: 'Do I need a new POS system?',
    answer: 'No. Redemption happens through the Café Portal on any device with a browser — a phone, a tablet, the till’s own screen. Nothing touches your existing POS.',
  },
  {
    question: 'How does my team confirm a redemption?',
    answer: 'Staff scans the member’s QR code in the Portal, or types the 4-character fallback code if scanning isn’t convenient. Confirmed in under five seconds.',
  },
  {
    question: 'Does my café have to track monthly use?',
    answer: 'No — the Portal does it automatically. Your weekly counter shows redemptions, first-time visitors, and reimbursement owed without any manual tracking.',
  },
  {
    question: 'How often can a member redeem at my café?',
    answer: 'Once per City Card, and a card requires 5 visits — at least 3 at different eligible cafés across the network, since a card can’t be filled at one spot alone.',
  },
  {
    question: 'Why is there a monthly cap?',
    answer: 'So the most this can ever cost you is a number you chose in advance. You set it; you can lower it or raise it any month.',
  },
  {
    question: 'Can I choose the item?',
    answer: 'Yes — you submit your eligible-item list in the Café Portal, up to 5 items at a time. Keep it, change it, or pause redemptions entirely with no effect on your Match % or map visibility.',
  },
  {
    question: 'Can I choose the days and times it’s available?',
    answer: 'Yes. Most partners protect their morning rush and open redemption during a slower afternoon block.',
  },
  {
    question: 'What happens if the QR code doesn’t scan?',
    answer: 'Staff types the 4-character fallback code instead. Every redemption has both paths from the start.',
  },
  {
    question: 'Can I leave the program?',
    answer: 'Any time, with 30 days’ notice on the active partner tier. You keep a free Listed profile unless you ask to be removed entirely.',
  },
  {
    question: 'Can more than one location join?',
    answer: 'Yes — each address is its own Founding Partner slot, but one agreement and one portal login covers your whole group.',
  },
  {
    question: 'Do I have to give anything away for free?',
    answer: 'Only if you opt into reward redemption, and even then only the specific items you chose, capped at the limit you set. Listed and Partner status never require it.',
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div style={{ marginBottom: 24 }}>
      {FAQ.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.question} style={{ borderBottom: '1px solid var(--whisk-10)' }}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                background: 'none',
                border: 'none',
                textAlign: 'left',
                padding: '16px 0',
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              {item.question}
              <span style={{ color: 'var(--whisk)', fontSize: 18, flexShrink: 0 }}>{open ? '−' : '+'}</span>
            </button>
            {open ? <p style={{ fontSize: 14, color: 'var(--whisk)', margin: '0 0 16px', maxWidth: '68ch' }}>{item.answer}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
