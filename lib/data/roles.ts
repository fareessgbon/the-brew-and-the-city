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
  // Named explicitly rather than assumed, since this listing carries roles
  // for more than one company — a card or posting with no company name
  // would read as a Brew and the City role by default, which is wrong for
  // any role that isn't.
  company: string;
  // The honest one-liner: what the job actually is, said the way you'd say
  // it to a friend. Leads on both the listing card and the posting, ahead
  // of the formal intro — a job title tells someone almost nothing, and
  // this is the line that makes them keep reading.
  hook: string;
  // The small, concrete offer that makes the hook's joke land as an actual
  // one. It sits directly under the hook rather than in the terms block at
  // the bottom, because most people never reach the bottom.
  perk: string;
  // The straight version of the same thing, for search results and link
  // previews, where a joke with no page around it just reads as noise.
  blurb: string;
  // The three facts a candidate scans for before reading anything else.
  // `compensation` is deliberately not optional: whatever a role pays, a
  // card that doesn't say costs the candidate a click to find out and
  // reads, fairly, as something being hidden.
  location: string;
  commitment: string;
  compensation: string;
  // The same three facts again, in prose, for the terms block on the role
  // page. Written per role rather than assembled from the fields above,
  // because pay and commitment deserve a sentence rather than a chip.
  terms: string;
  intro: string[];
  // Grouped rather than one flat list. A twenty-item bullet list is read as
  // "a lot" and not much else; the same items under four headings let
  // someone find the part of the job they're actually good at.
  responsibilities: RoleSection[];
  lookingForIntro: string;
  lookingFor: RoleSection[];
  // Optional — what the role offers back, listed on its own rather than
  // folded into the terms block, for postings where that list is long
  // enough to want its own heading.
  benefits?: string[];
  closing: string;
}

export const ROLES: Role[] = [
  {
    slug: 'marketing-social-media-intern',
    title: 'Marketing & Social Media Intern',
    company: 'Brew and the City',
    hook: 'Honestly? The job is to go to cafés, drink coffee and matcha, and make content about it.',
    perk: 'The coffee’s on us, obviously.',
    blurb:
      'Help build the voice, look and following of a Calgary café-discovery platform from its very first post.',
    location: 'Calgary — hybrid',
    commitment: 'Flexible, ongoing',
    compensation: 'Paid position',
    terms:
      'This is a paid, flexible position designed to work alongside school or other commitments. We’re happy to work around your class schedule and availability, and there’s no fixed end date. You’ll need to be in Calgary, since some of the work happens at cafés, but most of it is remote.',
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
          // Matches the application form's own question, which offers Yes,
          // Somewhat and No — the posting shouldn't invite an answer the
          // form no longer takes.
          'Comfortable appearing on camera, at least somewhat',
          'A real grasp of what’s working on social right now, and why',
        ],
      },
    ],
    closing:
      'If you’re someone who sees a café and immediately thinks “that would make such a good TikTok,” we’d love to hear from you.',
  },
  {
    slug: 'hush-jewels-marketing-social-media-intern',
    title: 'Marketing & Social Media Intern',
    company: 'Hush Jewels',
    hook: 'Make people stop scrolling for Hush Jewels.',
    perk: 'And yes — select pieces are yours to keep after the shoot.',
    blurb:
      'Create TikToks, Reels and campaigns that turn Hush Jewels pieces into something people actually want to watch.',
    location: 'Remote — Canada',
    commitment: 'Flexible, ongoing',
    compensation: 'Paid position',
    terms:
      'This is a paid, flexible position designed to work alongside school, another job, or other commitments. We’re flexible about when you work, as long as responsibilities and agreed-upon content get done — there’s no fixed end date. The role is fully remote, open to applicants anywhere in Canada. You’ll receive Hush Jewels pieces for shoots and ship them back when required; select pieces are yours to keep. Start date is as soon as possible.',
    intro: [
      'Hush Jewels is an established jewelry brand building out its presence online. We’re looking for a highly creative, outgoing and confident Marketing & Social Media Intern to help bring the brand to life on social.',
      'This isn’t a role where you’ll simply schedule posts and follow a content calendar. We want someone who can see a piece of jewelry and immediately start thinking of content ideas — someone who enjoys being on camera, understands what makes a TikTok or Reel entertaining, and can turn a simple necklace into a “Jewelry of the Day” video, a styling idea, a trend, a promotion, or an entire campaign.',
      'You’ll work directly with the founder, with a real opportunity to help shape how Hush Jewels looks, sounds and grows online.',
    ],
    responsibilities: [
      {
        heading: 'Content you’ll create',
        items: [
          '“Jewelry of the Day” videos, try-ons and styling content',
          'TikToks, Reels, unboxings and product videos',
          'Close-up product videos showing the details of each piece',
          'Promotional content for sales, new drops and launch campaigns',
          'Gift guides, seasonal content and behind-the-scenes',
          'Lifestyle and product photography',
          'Trend-based content using sounds, formats and ideas that fit Hush',
          'Talking-to-camera content about products, styling, launches and promotions',
          'Your own creative concepts — we’re not looking for someone who only posts a photo of a product',
        ],
      },
      {
        heading: 'On camera',
        items: [
          'Film jewelry try-ons, styling videos and product recommendations',
          'Shoot “Jewelry of the Day” videos and trend-based TikToks',
          'Talk to camera for promotional videos and new collection reveals',
          'Turn quick, spontaneous ideas into content on short notice',
        ],
      },
      {
        heading: 'Social media',
        items: [
          'Plan and maintain the social media content calendar',
          'Publish across Instagram and TikTok, and reply to comments and DMs',
          'Research trends, sounds, formats, creators and competitors — before they’re overused',
          'Develop recurring content series and keep assets organized',
        ],
      },
      {
        heading: 'Marketing and promotions',
        items: [
          'Turn launches, collections, sales and holiday campaigns into content, not just a graphic',
          'Help run gift guides, limited-time offers, giveaways and creator collaborations',
          'Think beyond the graphic — what video would make people care, or want to share this?',
        ],
      },
      {
        heading: 'Your ideas',
        items: [
          'Pitch trends worth trying, new series like a “Jewelry of the Day” format, or your own angle on a launch',
          'Say when something isn’t performing, and try something else',
          'Your ideas can become part of the brand, not just suggestions',
        ],
      },
    ],
    lookingForIntro:
      'You don’t need years of marketing experience or a professional resume. We’re looking for someone extremely creative, confident on camera, and excited to build out an established brand’s social presence from the ground up.',
    lookingFor: [
      {
        heading: 'Mindset and personality',
        items: [
          'Extremely creative, outgoing and expressive',
          'Naturally interested in fashion, jewelry, beauty or lifestyle content',
          'Constantly noticing trends and new content ideas',
          'A self-starter who doesn’t need to be told what to do every step of the way',
          'Open to feedback, quick to apply it, and willing to try something that might not work',
          'Resourceful — figures things out independently',
        ],
      },
      {
        heading: 'Skills and tools',
        items: [
          'Comfortable creating content for TikTok and Instagram, and appearing on camera',
          'CapCut and Canva',
          'A strong visual sense and understanding of what performs on social right now',
        ],
      },
      {
        heading: 'Bonus',
        items: [
          'Experience creating UGC, or running your own TikTok or Instagram',
          'Fashion, beauty, jewelry or lifestyle content experience',
          'Product photography, or experience working with creators or influencers',
          'A portfolio or examples of content you’ve made',
        ],
      },
      {
        heading: 'Logistics',
        items: [
          'Based in Canada, working remotely',
          'Comfortable receiving jewelry for shoots and shipping pieces back when required',
        ],
      },
    ],
    benefits: [
      'A paid position with a growing jewelry brand',
      'Flexible scheduling around school and other commitments',
      'Direct collaboration with the founder, and real creative ownership',
      'Hands-on experience in social media, marketing, branding and content creation',
      'Content and campaigns you can add to your portfolio',
      'The chance to see your ideas actually become part of the business',
      'Jewelry to create content with — and keep, for select pieces',
    ],
    closing:
      'If you love jewelry, love creating content, and aren’t afraid to be on camera, we’d love to hear from you.',
  },
];

export function getRole(slug: string): Role | undefined {
  return ROLES.find((role) => role.slug === slug);
}
