'use client';

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { SurveyMultiSelect } from './SurveyMultiSelect';
import { RESUME_ACCEPT, formatBytes, validateResume } from '@/lib/careers/resume';

type Status = 'idle' | 'sending' | 'sent' | 'error';

type Choice = { label: string; value: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Deliberately loose: a resume lives on Drive, Notion, LinkedIn, a personal
// site or a shortener, and the only thing they reliably share is a dot and
// no spaces. The protocol is optional here and added server-side.
const LINK_RE = /^(https?:\/\/)?[^\s/]+\.[^\s]{2,}$/i;

// Most of these read the same whether they're the stored answer or the word
// on screen, so the two are the same string unless there's a reason.
const choices = (...labels: string[]): Choice[] => labels.map((label) => ({ label, value: label }));

// Was a free-text "Where are you based?". The only thing we actually do
// with the answer is work out whether someone can get to Calgary cafés, so
// a yes/no answers it faster and scans cleanly in admin. The stored value
// is the place, not the word the applicant clicked — admin prints it after
// a "Based in" label, where "Yes" would say nothing.
const BASED_IN_OPTIONS: Choice[] = [
  { label: 'Yes', value: 'Calgary' },
  { label: 'No', value: 'Outside Calgary' },
];

const TRAVEL_OPTIONS = choices('Yes', 'No');

// Capped at three, like the surveys' "choose up to N" questions: seven ticks
// would tell us nothing, and being made to drop the fourth is what turns
// this into an answer about what they'd rather be doing.
const INTEREST_OPTIONS = [
  'Content creation',
  'Video editing',
  'Social media strategy',
  'Photography',
  'Community building',
  'Working with local cafés',
  'Startup experience',
];
const MAX_INTERESTS = 3;

// "No" is a full option with its own wording rather than a bare no: the
// posting says you don't need years of experience, and a list that made the
// only honest answer sound like a failure would quietly say otherwise.
const BRAND_CONTENT_OPTIONS = choices(
  'Yes, professionally',
  'Yes, for my own project/business',
  'Yes, for school or volunteer work',
  "No, but I'm actively learning",
);

const ON_CAMERA_OPTIONS = choices('Yes', 'Somewhat', 'No');

// What .cafe-signup-form gives a <label>, applied by hand — the form's CSS
// dresses labels only, and every grouped question here captions itself with
// a <legend> instead.
const LEGEND_STYLE = {
  padding: 0,
  marginBottom: 8,
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--whisk)',
} as const;

// The tools the role actually names, plus "Other" — nothing here is a
// requirement, and the question is answerable by selecting nothing at all,
// so there's no "none of these" row to pick.
const TOOL_OPTIONS = [
  'CapCut',
  'Canva',
  // One row rather than Premiere/Photoshop/Illustrator separately: which
  // three Adobe apps someone ticks doesn't change the shortlist, and three
  // near-identical rows made the list read as an experience checklist.
  'Adobe',
  'Figma',
  'Lightroom',
  'Other',
];

// One page, not a wizard like the two surveys. A survey is something we
// asked someone to do for us and can afford to meter out a step at a time;
// an application is something they want, and hiding how long it is behind
// "Step 1 of 7" is the wrong trade — they should be able to see the whole
// thing, and how short it is, before starting.
export function JobApplicationForm({ roleSlug, roleTitle }: { roleSlug: string; roleTitle: string }) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [basedIn, setBasedIn] = useState('');
  const [canTravel, setCanTravel] = useState('');
  const [resumeLink, setResumeLink] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [brandContent, setBrandContent] = useState('');
  const [tools, setTools] = useState<string[]>([]);
  const [onCamera, setOnCamera] = useState('');
  const [availability, setAvailability] = useState('');
  const [pitch, setPitch] = useState('');
  const [whyYou, setWhyYou] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // Rejects the file at pick time rather than at submit — the applicant is
  // looking at the file picker right now, which is the only moment they can
  // fix it without re-reading the form.
  function handleResumeChange(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    if (!picked) {
      setResumeFile(null);
      return;
    }
    const problem = validateResume(picked);
    if (problem) {
      setError(problem);
      setResumeFile(null);
      // Clear the input too, or the browser keeps showing the rejected
      // file's name next to an error saying it wasn't accepted.
      if (resumeInputRef.current) resumeInputRef.current.value = '';
      return;
    }
    setError('');
    setResumeFile(picked);
  }

  function clearResume() {
    setResumeFile(null);
    if (resumeInputRef.current) resumeInputRef.current.value = '';
  }

  // The message renders next to the submit button, at the bottom of a form
  // taller than the viewport — naming the bad field there is no help if the
  // field itself is three screens up, so focus moves to it as well. noValidate
  // means the browser isn't doing this for us.
  function fail(message: string, fieldId: string) {
    setError(message);
    const field = document.getElementById(fieldId);
    field?.focus();
    field?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!fullName.trim()) return fail('Please tell us your name.', 'fullName');
    if (!EMAIL_RE.test(email.trim())) return fail('A valid email is required — it’s how we reply.', 'email');
    // Neither half of the resume question is required on its own; the pair
    // is. The error points at the link box rather than the file input,
    // which is visually hidden and can't be scrolled to.
    if (!resumeFile && !resumeLink.trim()) {
      return fail('Please attach your resume or paste a link to it — either one is enough.', 'resumeLink');
    }
    if (resumeLink.trim() && !LINK_RE.test(resumeLink.trim())) {
      return fail('That resume link doesn’t look like a web address — check it, or attach the file instead.', 'resumeLink');
    }
    if (!portfolio.trim()) {
      return fail('Please share at least one link to work you’ve made — an account you run counts.', 'portfolio');
    }
    setError('');

    const payload = {
      roleSlug,
      roleTitle,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      basedIn,
      canTravel,
      resumeLink: resumeLink.trim(),
      portfolio: portfolio.trim(),
      interests,
      brandContent,
      tools,
      onCamera,
      availability: availability.trim(),
      pitch: pitch.trim(),
      whyYou: whyYou.trim(),
    };

    // FormData, not JSON, so the resume travels with the answers in one
    // request. No Content-Type header is set on purpose — the browser has
    // to add its own multipart boundary, and setting it by hand breaks the
    // body parse on the server.
    const form = new FormData();
    form.set('payload', JSON.stringify(payload));
    if (resumeFile) form.set('resume', resumeFile);

    setStatus('sending');
    try {
      const res = await fetch('/api/careers/apply', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setStatus('sent');
      setMessage(payload.email);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  if (status === 'sent') {
    return (
      <div className="ratio-box">
        <div className="form-success" style={{ marginTop: 0 }}>
          That&apos;s in — thanks for applying.
        </div>
        <p style={{ fontSize: 14.5, color: 'var(--ink)', margin: '10px 0 0' }}>
          We read every application ourselves; there&apos;s no filter in between. Watch <strong>{message}</strong>{' '}
          for a reply — and if you thought of something after hitting send, just email{' '}
          <a href="mailto:hello@brewandthecity.com">hello@brewandthecity.com</a>{' '}
          and we&apos;ll add it to your application.
        </p>
      </div>
    );
  }

  return (
    <form className="cafe-signup-form" onSubmit={handleSubmit} noValidate style={{ maxWidth: 640, background: 'var(--porcelain)' }}>
      <div className="field-row">
        <div>
          <label htmlFor="fullName">Your name</label>
          <input type="text" id="fullName" name="fullName" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
      </div>

      <div className="field-row">
        <div>
          <label htmlFor="phone">Phone (optional)</label>
          <input type="tel" id="phone" name="phone" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      <ChoiceField
        name="basedIn"
        legend="Are you currently based in Calgary?"
        options={BASED_IN_OPTIONS}
        value={basedIn}
        onChange={setBasedIn}
        inline
      />

      <ChoiceField
        name="canTravel"
        legend="Are you able to travel around Calgary for café visits and content shoots?"
        options={TRAVEL_OPTIONS}
        value={canTravel}
        onChange={setCanTravel}
        inline
      />

      <div style={{ marginBottom: 12 }}>
        <label htmlFor="resume">Resume</label>
        {/* The real <input type="file"> is visually hidden rather than
            styled — its native control can't be restyled consistently
            across browsers, and the label is already a valid click target
            for it, so nothing is lost by hiding it. Keyboard focus still
            lands on the input; :focus-within draws the ring on the box. */}
        <div className="resume-field" onClick={() => resumeInputRef.current?.click()}>
          <input
            ref={resumeInputRef}
            type="file"
            id="resume"
            name="resume"
            accept={RESUME_ACCEPT}
            onChange={handleResumeChange}
          />
          {resumeFile ? (
            <>
              <span className="resume-file-name" title={resumeFile.name}>
                {resumeFile.name}
              </span>
              <span className="resume-file-size">{formatBytes(resumeFile.size)}</span>
              {/* stopPropagation, or the click bubbles to the box's own
                  handler and immediately reopens the file picker they just
                  cancelled out of. */}
              <button
                type="button"
                className="resume-clear"
                onClick={(e) => {
                  e.stopPropagation();
                  clearResume();
                }}
              >
                Remove
              </button>
            </>
          ) : (
            <>
              <span className="resume-cta" aria-hidden="true">
                Choose a file
              </span>
              <span className="resume-hint">PDF, DOC or DOCX · up to 5 MB</span>
            </>
          )}
        </div>

        {/* The second half of one question, not a new one — plenty of people
            keep their resume on Drive or LinkedIn and would otherwise have
            to export a copy just to apply. Either box satisfies it; the
            label says so, so nobody fills both to be safe. */}
        <label htmlFor="resumeLink" style={{ marginTop: 10 }}>
          Or link to your resume
        </label>
        <input
          type="url"
          id="resumeLink"
          name="resumeLink"
          inputMode="url"
          placeholder="A Drive, Notion, LinkedIn or personal-site link"
          value={resumeLink}
          onChange={(e) => setResumeLink(e.target.value)}
        />
        <div className="cafe-form-note" style={{ marginTop: 6 }}>
          Attach a file or paste a link — whichever you have. One is enough.
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label htmlFor="portfolio">Portfolio or examples of your work</label>
        <textarea
          id="portfolio"
          name="portfolio"
          rows={3}
          required
          placeholder="Links, one per line — a portfolio site, a Canva folder, a Drive link, or an account you run."
          value={portfolio}
          onChange={(e) => setPortfolio(e.target.value)}
        />
        <div className="cafe-form-note" style={{ marginTop: 6 }}>
          Anything you made counts. A TikTok account, a club&apos;s Instagram, posters for a school event — we care
          what you can make, not where it was published.
        </div>
      </div>

      <fieldset style={{ border: 0, margin: '0 0 16px', padding: 0, minWidth: 0 }}>
        <legend style={LEGEND_STYLE}>What interests you most about this role? (Select up to 3)</legend>
        <SurveyMultiSelect
          name="interests"
          options={INTEREST_OPTIONS}
          selected={interests}
          onChange={setInterests}
          max={MAX_INTERESTS}
        />
      </fieldset>

      <ChoiceField
        name="brandContent"
        legend="Have you created content for a brand before?"
        options={BRAND_CONTENT_OPTIONS}
        value={brandContent}
        onChange={setBrandContent}
      />

      {/* A fieldset for the same reason ChoiceField uses one, and with the
          same legend, so this question doesn't read as a different kind of
          question from the five around it just because its answers are
          checkboxes. */}
      <fieldset style={{ border: 0, margin: '0 0 16px', padding: 0, minWidth: 0 }}>
        <legend style={LEGEND_STYLE}>Which tools are you comfortable using? (Select all that apply)</legend>
        <SurveyMultiSelect name="tools" options={TOOL_OPTIONS} selected={tools} onChange={setTools} />
      </fieldset>

      <ChoiceField
        name="onCamera"
        legend="Are you comfortable appearing on camera?"
        options={ON_CAMERA_OPTIONS}
        value={onCamera}
        onChange={setOnCamera}
      />

      <div style={{ marginBottom: 12 }}>
        <label htmlFor="availability">Availability</label>
        <input
          type="text"
          id="availability"
          name="availability"
          placeholder="Roughly how many hours a week, and when you could start"
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label htmlFor="pitch">Pitch us one post</label>
        <textarea
          id="pitch"
          name="pitch"
          rows={3}
          placeholder="One piece of content you'd make for a Calgary café, in a sentence or two. A rough idea is fine."
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="whyYou">Anything else we should know? (optional)</label>
        <textarea id="whyYou" name="whyYou" rows={3} value={whyYou} onChange={(e) => setWhyYou(e.target.value)} />
      </div>

      {/* The unpaid acknowledgement that used to sit here is gone with the
          term it acknowledged — the role is paid now. A tickbox confirming
          you've read a fact that no longer exists is worse than no tickbox:
          it's one more required click, and it would have applicants
          agreeing to the wrong thing. Applications submitted before this
          still carry the flag; the admin view labels those as historical. */}

      {error ? (
        <div style={{ fontSize: 13, color: '#b3402a', marginBottom: 12 }} role="alert">
          {error}
        </div>
      ) : null}

      <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send application'}
      </button>

      <div className="cafe-form-note">
        We only use what you send here to consider you for this role. No account is created, and nothing is shared
        with cafés or anyone else — see our <a href="/privacy">privacy policy</a>.
      </div>
    </form>
  );
}

// fieldset/legend rather than a label, since the question captions a group
// of inputs and not one — the browser reads it out with each option. Both
// are reset to nothing and restyled, as .cafe-signup-form only dresses
// <label>. `inline` is for the two-option questions, where a row of radios
// costs less height than a stack and reads no worse.
function ChoiceField({
  name,
  legend,
  options,
  value,
  onChange,
  inline = false,
}: {
  name: string;
  legend: string;
  options: Choice[];
  value: string;
  onChange: (next: string) => void;
  inline?: boolean;
}) {
  return (
    <fieldset style={{ border: 0, margin: '0 0 16px', padding: 0, minWidth: 0 }}>
      <legend style={LEGEND_STYLE}>{legend}</legend>
      <div style={{ display: 'flex', flexDirection: inline ? 'row' : 'column', gap: inline ? 20 : 8 }}>
        {options.map((option) => (
          <label
            key={option.value}
            // Same opt-out as the unpaid checkbox: the form's label style is
            // mono/uppercase/tracked, which is right for a caption and wrong
            // for a word someone is choosing between.
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 0,
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              letterSpacing: 'normal',
              textTransform: 'none',
              color: 'var(--ink)',
            }}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              style={{ width: 'auto' }}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
