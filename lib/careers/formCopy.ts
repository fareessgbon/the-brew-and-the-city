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
  // Two cities now, so this asks which one rather than yes/no. (A previous
  // edit left "based in Toronto" with two identical "Yes" options — same
  // label and value — which also duplicated a React key.)
  basedIn: {
    legend: 'Which city are you based in?',
    options: [
      { label: 'Calgary', value: 'Calgary' },
      { label: 'Toronto', value: 'Toronto' },
      { label: 'Somewhere else', value: 'Somewhere else' },
    ],
  },
  canTravel: {
    legend: 'Are you able to travel around your city for café visits and content shoots?',
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
  pitchPlaceholder: "One piece of content you'd make for a Calgary or Toronto café, in a sentence or two. A rough idea is fine.",
};

// No overrides currently in use — the last non-default entry (Hush Jewels)
// was removed along with its role. Left as a Record rather than deleted
// outright: getFormCopy's fallback-to-DEFAULT_COPY behavior depends on this
// existing, and the next per-company role just adds a key here again.
const OVERRIDES: Record<string, ApplicationFormCopy> = {};

export function getFormCopy(roleSlug: string): ApplicationFormCopy {
  return OVERRIDES[roleSlug] ?? DEFAULT_COPY;
}
