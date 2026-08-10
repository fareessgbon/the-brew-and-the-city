// The open-roles list behind /careers, /careers/[the role page] and the
// application form. One object per role, in one place, because the same
// facts appear on all three pages plus the confirmation email — a title
// that says "intern" on the listing and "internship" on the form is the
// kind of drift a shared source avoids.
//
// Prose lives here as strings rather than JSX so the apply route can read
// a role's title server-side without importing a page component. Roles are
// matched by slug; an unknown slug 404s rather than rendering an empty
// posting.

export interface RoleSection {
  heading: string;
  items: string[];
}

export interface Role {
  slug: string;
  title: string;
  // The honest one-liner: what the job actually is, said the way you'd say
  // it to a friend. Leads on both the listing card and the posting, ahead
  // of the formal intro — a job title tells someone almost nothing, and
  // this is the line that makes them keep reading.
  hook: string;
  // The straight version of the same thing, for search results and link
  // previews, where a joke with no page around it just reads as noise.
  blurb: string;
  // The three facts a candidate scans for before reading anything else.
  // `compensation` is deliberately not optional: an unpaid role that
  // doesn't say so on the card is the one omission that wastes a
  // candidate's time.
  location: string;
  commitment: string;
  compensation: string;
  // The same three facts again, in prose, for the terms block on the role
  // page. Written per role rather than assembled from the fields above,
  // because "unpaid" deserves a sentence rather than a chip.
  terms: string;
  intro: string[];
  // Grouped rather than one flat list. A twenty-item bullet list is read as
  // "a lot" and not much else; the same items under four headings let
  // someone find the part of the job they're actually good at.
  responsibilities: RoleSection[];
  lookingForIntro: string;
  lookingFor: RoleSection[];
  closing: string;
}

export const ROLES: Role[] = [
  {
    slug: 'marketing-social-media-intern',
    title: 'Marketing & Social Media Intern',
    hook: 'Honestly? The job is to go to cafés, drink coffee and matcha, and make content about it.',
    blurb:
      'Help build the voice, look and following of a Calgary café-discovery platform from its very first post.',
    location: 'Calgary — hybrid',
    commitment: 'Flexible, ongoing',
    compensation: 'Unpaid internship',
    terms:
      'Flexible — we’re happy to work around your school schedule and availability, and there’s no fixed end date. You’ll need to be in Calgary, since some of the work happens at cafés, but most of it is remote. This is currently an unpaid internship, and we’d rather say that here than after you’ve written an application.',
    intro: [
      'Brew and the City is a new discovery platform helping people find independent cafés, and helping local cafés get discovered. We’re starting in Calgary and building a community around the cafés, people and places that make a city worth exploring.',
      'We’re looking for a creative Marketing & Social Media Intern to help us bring Brew and the City to life online. You’ll work closely with the founder to help build and promote the brand.',
    ],
    responsibilities: [
      {
        heading: 'Content',
        items: [
          'Edit short-form video for Instagram Reels and TikTok in CapCut',
          'Design static posts, stories and graphics in Canva, on-brand and consistent',
          'Write the captions and copy that go out with them',
          'Help build the visual identity and voice of the brand — it barely exists yet',
        ],
      },
      {
        heading: 'On location',
        items: [
          'Shoot photo and video at Calgary cafés — the drinks, the light, the corner table',
          'Create promotional content for partner cafés and for launch campaigns',
          'Appear on camera when a piece calls for it',
        ],
      },
      {
        heading: 'Community',
        items: [
          'Manage the posting calendar — what goes up, and when',
          'Monitor and reply to comments and DMs across our channels',
          'Research Calgary cafés, local creators and potential collaborations',
          'Spot trends worth using while they’re still trends',
        ],
      },
      {
        heading: 'Keeping track',
        items: [
          'Track what performs, and say plainly what’s working and what isn’t',
          'Keep content, assets and the calendar organized and current',
          'Bring your own ideas — you’ll have real creative ownership here',
        ],
      },
    ],
    lookingForIntro:
      'You don’t need years of marketing experience. We’re looking for someone creative, curious and excited to build something from the ground up.',
    lookingFor: [
      {
        heading: 'Logistics',
        items: [
          'Based in Calgary',
          'A flexible schedule — we work around school and whatever else you have on',
          'Able to get around the city for shoots at cafés',
        ],
      },
      {
        heading: 'Mindset and work style',
        items: [
          'A self-starter who can take an idea and run with it without being told how',
          'Resourceful — you look things up before you ask',
          'Comfortable pre-launch, where the plan changes and not everything is decided yet',
          'Open to feedback and quick to apply it',
          'Willing to post something that might not work, and to say so when it doesn’t',
        ],
      },
      {
        heading: 'Skills and tools',
        items: [
          'Editing short-form video in CapCut into something genuinely social-ready',
          'Designing in Canva to a consistent, on-brand look',
          'Instagram and TikTok as a maker, not just a viewer',
          'Writing captions that sound like a person wrote them',
          'Comfortable on camera, or willing to get there',
          'A real grasp of what’s working on social right now, and why',
        ],
      },
    ],
    closing:
      'If you’re someone who sees a café and immediately thinks “that would make such a good TikTok,” we’d love to hear from you.',
  },
];

export function getRole(slug: string): Role | undefined {
  return ROLES.find((role) => role.slug === slug);
}
