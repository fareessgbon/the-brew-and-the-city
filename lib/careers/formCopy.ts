// The application form asks a few questions that only make sense for a
// specific company and city — "based in Calgary," "travel for café
// shoots." A role that isn't Brew and the City's café intern shouldn't
// inherit that copy by default, so each role can override it here. An
// undecorated role falls back to the original café-specific copy, which
// keeps that posting's form byte-identical to before this file existed.

export interface Choice {
  label: string;
  value: string;
}

export interface ApplicationFormCopy {
  // null omits the question entirely — right for a remote, not-city-bound role.
  basedIn: { legend: string; options: Choice[] } | null;
  canTravel: { legend: string; options: Choice[] } | null;
  interestsLegend: string;
  interestOptions: string[];
  brandContentLegend: string;
  brandContentOptions: Choice[];
  toolsLegend: string;
  toolOptions: string[];
  onCameraOptions: Choice[];
  availabilityPlaceholder: string;
  pitchLabel: string;
  pitchPlaceholder: string;
}

const choices = (...labels: string[]): Choice[] => labels.map((label) => ({ label, value: label }));

const DEFAULT_COPY: ApplicationFormCopy = {
  basedIn: {
    legend: 'Are you currently based in Calgary?',
    options: [
      { label: 'Yes', value: 'Calgary' },
      { label: 'No', value: 'Outside Calgary' },
    ],
  },
  canTravel: {
    legend: 'Are you able to travel around Calgary for café visits and content shoots?',
    options: choices('Yes', 'No'),
  },
  interestsLegend: 'What interests you most about this role? (Select up to 3)',
  interestOptions: [
    'Content creation',
    'Video editing',
    'Social media strategy',
    'Photography',
    'Community building',
    'Working with local cafés',
    'Startup experience',
  ],
  brandContentLegend: 'Have you created content for a brand before?',
  brandContentOptions: choices(
    'Yes, professionally',
    'Yes, for my own project/business',
    'Yes, for school or volunteer work',
    "No, but I'm actively learning",
  ),
  toolsLegend: 'Which tools are you comfortable using? (Select all that apply)',
  toolOptions: ['CapCut', 'Canva', 'Adobe', 'Figma', 'Lightroom', 'Other'],
  onCameraOptions: choices('Yes', 'Somewhat', 'No'),
  availabilityPlaceholder: 'Roughly how many hours a week, and when you could start',
  pitchLabel: 'Pitch us one post',
  pitchPlaceholder: "One piece of content you'd make for a Calgary café, in a sentence or two. A rough idea is fine.",
};

const HUSH_JEWELS_COPY: ApplicationFormCopy = {
  // Remote and Canada-wide — there's no city to be based in or travel around.
  basedIn: null,
  canTravel: null,
  interestsLegend: 'What are you most excited about? (Select up to 3)',
  interestOptions: [
    'Creating TikToks & Reels',
    'Being on camera',
    'Coming up with creative ideas',
    'Styling & photographing jewelry',
    'Editing videos',
    'Social media',
    'Creating promotional content',
    "Growing a brand's online presence",
    'Working with fashion & jewelry',
    'Trying new trends',
  ],
  brandContentLegend: 'Have you created content before?',
  brandContentOptions: choices(
    'Yes, for a brand or business',
    'Yes, for my own project or business',
    'Yes, for school, clubs, or other projects',
    'Mostly for fun / personal social media',
    "Not yet, but I'd love to",
  ),
  toolsLegend: 'Which tools are you comfortable using? (Select all that apply)',
  toolOptions: ['CapCut', 'Canva', 'Instagram', 'TikTok', 'Adobe', 'Lightroom', 'Figma', 'Other'],
  onCameraOptions: choices('Yes — absolutely', "Yes — I'm comfortable with it", "Somewhat — I'm willing to try", 'No'),
  availabilityPlaceholder: "When you could start, and roughly how many hours a week you're looking for",
  pitchLabel: 'Give us one Hush Jewels content idea',
  pitchPlaceholder:
    'Imagine you have a piece of Hush Jewels jewelry in your hand — what would you make with it? A TikTok, Reel, "Jewelry of the Day," styling video, promotion, trend, or anything you come up with.',
};

const OVERRIDES: Record<string, ApplicationFormCopy> = {
  'hush-jewels-marketing-social-media-intern': HUSH_JEWELS_COPY,
};

export function getFormCopy(roleSlug: string): ApplicationFormCopy {
  return OVERRIDES[roleSlug] ?? DEFAULT_COPY;
}
