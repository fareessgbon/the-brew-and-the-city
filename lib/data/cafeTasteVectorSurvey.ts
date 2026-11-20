// The café-facing taste-vector survey (/make-brew-better/cafe-taste-survey)
// — a café answering these seven questions about itself, in the same
// language and on the same 0–100 scale the admin editor's sliders use
// (lib/data/cafeFields.ts LABELS), so a submission drops straight onto the
// sliders without anyone having to translate it first.
//
// Unlike the visitor quiz (lib/data/full-quiz.ts), these options carry an
// absolute score, not a delta — a café is describing itself once, not
// nudging an accumulating profile answer by answer.
import { DIM_QUESTIONS, DIMS, LABELS, PRICE_BANDS, type Dim, type PriceBand } from '@/lib/data/cafeFields';

export interface TasteSurveyOption {
  label: string;
  score: number;
  /** Only set on the price question's options — lets one answer fill both
   * price_score and the separate price_band field, instead of asking the
   * same real-world fact ("what does a drink cost") two different ways. */
  priceBand?: PriceBand;
}

export interface TasteSurveyQuestion {
  dim: Dim;
  question: string;
  options: TasteSurveyOption[];
}

const OPTIONS_BY_DIM: Record<Dim, TasteSurveyOption[]> = {
  drink: [
    { label: 'Sweet and flavoured', score: 15 },
    { label: 'A lightly sweetened classic', score: 40 },
    { label: 'Mostly unsweetened', score: 65 },
    { label: 'Straight, black, no fuss', score: 90 },
  ],
  energy: [
    { label: 'Silent — most people have headphones on', score: 15 },
    { label: 'A low hum, but mostly quiet', score: 40 },
    { label: 'Busy, but you can still hear yourself', score: 65 },
    { label: 'Loud and packed', score: 90 },
  ],
  pace: [
    { label: 'In and out, under 10 minutes', score: 15 },
    { label: 'About half an hour', score: 40 },
    { label: 'An hour or two', score: 65 },
    { label: 'People camp out all afternoon', score: 90 },
  ],
  aesthetic: [
    { label: 'Stripped-back and industrial', score: 15 },
    { label: 'Minimal, Japandi', score: 40 },
    { label: 'Warm and eclectic', score: 65 },
    { label: 'Fully maximal — records, art, happy clutter', score: 90 },
  ],
  adventure: [
    { label: 'Same fixed menu, always', score: 15 },
    { label: 'A couple of rotating specials', score: 40 },
    { label: 'New seasonal drinks fairly often', score: 65 },
    { label: 'Always something new on the board', score: 90 },
  ],
  // The one dimension where the answer also has to fill a second, separate
  // field (price_band) — see PRICE_BANDS in lib/data/cafeFields.ts. Bands
  // repeat across the last two options (there's no $$$$ tier) so every
  // option still maps to a real, unambiguous band.
  price: [
    { label: 'Under $5', score: 15, priceBand: '$' },
    { label: '$5–7', score: 40, priceBand: '$$' },
    { label: '$7–9', score: 65, priceBand: '$$$' },
    { label: '$9 and up, no one blinks', score: 90, priceBand: '$$$' },
  ],
  food: [
    { label: 'Drinks only', score: 15 },
    { label: 'Maybe a pastry', score: 40 },
    { label: 'A real pastry case', score: 65 },
    { label: 'A full food program', score: 90 },
  ],
};

// Phrased as a question about the café itself, not the visitor-facing
// wording in full-quiz.ts's DIM_QUESTIONS — reusing that constant here
// would read like a visitor quiz aimed at the wrong person.
const QUESTION_TEXT: Record<Dim, string> = {
  drink: 'How would you describe your drinks?',
  energy: "What's the room actually like?",
  pace: 'How long do people typically stay?',
  aesthetic: 'How would you describe the space?',
  adventure: 'Is your menu mostly fixed, or does it rotate?',
  price: 'What does a standard drink cost?',
  food: 'Is food part of it?',
};

export const TASTE_SURVEY_QUESTIONS: TasteSurveyQuestion[] = DIMS.map((dim) => ({
  dim,
  question: QUESTION_TEXT[dim],
  options: OPTIONS_BY_DIM[dim],
}));

// Referenced by the admin review card so "Deep work" / "$9+" style poles
// stay visible as context next to whatever a café actually answered —
// DIM_QUESTIONS and PRICE_BANDS re-exported here only for that; nothing in
// this file needs LABELS for its own logic beyond that display use.
export { DIM_QUESTIONS, LABELS, PRICE_BANDS };

// A raw "65" means nothing on an admin card without its pole — this reads
// back the same way describeVector() in lib/data/cafeFields.ts does for
// the editor's live preview, just for one dim instead of picking the most
// extreme few.
export function describeScore(dim: Dim, score: number): string {
  return `${LABELS[dim][score >= 50 ? 'high' : 'low']} (${score})`;
}

// Builds the "Create a café record from this →" link on a taste-vector
// survey card — unlike cafeCreateHref() in lib/data/cafeFields.ts (which
// only carries name/area/contact from the café-partner survey), this one
// carries the actual scores too, since that's the whole point of this
// survey. Still just prefills /admin/cafes/new — nothing writes to cafes
// until the founder reviews and saves, same rule as every other survey
// bridge in this admin. If the café already has a record, the editor's own
// duplicate-name warning catches it and points at the existing one instead.
export function cafeTasteVectorCreateHref(answers: Record<string, unknown>): string {
  const params = new URLSearchParams();
  const setIfString = (key: string, field: string) => {
    const value = answers[field];
    if (typeof value === 'string' && value.trim()) params.set(key, value.trim());
  };
  setIfString('name', 'cafeName');
  setIfString('neighbourhood', 'neighbourhood');
  setIfString('email', 'email');
  setIfString('website', 'instagramOrWebsite'); // split further below

  const igOrWeb = answers.instagramOrWebsite;
  if (typeof igOrWeb === 'string' && igOrWeb.trim()) {
    const trimmed = igOrWeb.trim();
    if (/^https?:\/\//i.test(trimmed) || /\.[a-z]{2,}(\/|$)/i.test(trimmed)) {
      params.set('website', /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    } else {
      params.delete('website');
      params.set('instagram', trimmed.replace(/^@+/, ''));
    }
  }

  for (const dim of DIMS) {
    const value = answers[`${dim}_score`];
    if (typeof value === 'number' && Number.isFinite(value)) params.set(dim, String(Math.round(value)));
  }

  const priceBand = answers.price_band;
  if (typeof priceBand === 'string' && PRICE_BANDS.includes(priceBand as never)) {
    params.set('priceBand', priceBand);
  }

  const drinkCategories = answers.drinkCategories;
  if (Array.isArray(drinkCategories) && drinkCategories.length > 0) {
    params.set('drinks', drinkCategories.filter((c) => typeof c === 'string').join(','));
  }

  const qs = params.toString();
  return qs ? `/admin/cafes/new?${qs}` : '/admin/cafes/new';
}
