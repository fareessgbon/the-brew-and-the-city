import type { HeroCafe } from '@/components/HeroQuiz';

// Invented cafés for the pre-launch quiz. The homepage used to read real,
// seeded businesses from Supabase, which put real names next to made-up
// match percentages — implying a partnership that doesn't exist. Every name
// here is fictional; swap this for real data once cafés have signed on.
export const DEMO_CAFES: HeroCafe[] = [
  { id: 'demo-1', name: 'Marigold & Moss', slug: 'marigold-and-moss', area: 'Sample listing', city: 'calgary', vector: { drink: 72, energy: 25, aesthetic: 85, pace: 78, adventure: 45, price: 60, food: 55 } },
  { id: 'demo-2', name: 'The Foggy Cup', slug: 'the-foggy-cup', area: 'Sample listing', city: 'toronto', vector: { drink: 40, energy: 30, aesthetic: 55, pace: 85, adventure: 25, price: 35, food: 40 } },
  { id: 'demo-3', name: 'Quill Coffee Bar', slug: 'quill-coffee-bar', area: 'Sample listing', city: 'calgary', vector: { drink: 80, energy: 60, aesthetic: 50, pace: 40, adventure: 70, price: 70, food: 30 } },
  { id: 'demo-4', name: 'Saltbox Espresso', slug: 'saltbox-espresso', area: 'Sample listing', city: 'toronto', vector: { drink: 65, energy: 85, aesthetic: 35, pace: 20, adventure: 55, price: 45, food: 25 } },
  { id: 'demo-5', name: 'Little Ember Café', slug: 'little-ember-cafe', area: 'Sample listing', city: 'calgary', vector: { drink: 30, energy: 45, aesthetic: 70, pace: 60, adventure: 35, price: 40, food: 85 } },
  { id: 'demo-6', name: 'Northwind Roasters', slug: 'northwind-roasters', area: 'Sample listing', city: 'toronto', vector: { drink: 90, energy: 50, aesthetic: 30, pace: 55, adventure: 80, price: 80, food: 20 } },
  { id: 'demo-7', name: 'Paper Moon Café', slug: 'paper-moon-cafe', area: 'Sample listing', city: 'calgary', vector: { drink: 20, energy: 70, aesthetic: 90, pace: 35, adventure: 65, price: 55, food: 70 } },
  { id: 'demo-8', name: 'Juniper Lane Tea Room', slug: 'juniper-lane-tea-room', area: 'Sample listing', city: 'toronto', vector: { drink: 10, energy: 15, aesthetic: 75, pace: 90, adventure: 30, price: 50, food: 65 } },
];
