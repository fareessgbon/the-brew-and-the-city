'use client';

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { SurveyMultiSelect } from './SurveyMultiSelect';
import { RESUME_ACCEPT, formatBytes, validateResume } from '@/lib/careers/resume';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// From the posting's own "bonus" list plus the tools the role names
// outright. "None of these yet" is a real option, not a courtesy one — the
// posting says you don't need years of experience, so the form shouldn't
// quietly imply otherwise by making this list feel like a checklist to
// pass.
const TOOL_OPTIONS = [
  'Canva',
  'Figma',
  'CapCut',
  'Adobe (Photoshop, Illustrator, Premiere…)',
  'Lightroom or mobile photo editing',
  'Photography',
  'Video editing',
  'None of these yet',
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
  const [portfolio, setPortfolio] = useState('');
  const [tools, setTools] = useState<string[]>([]);
  const [availability, setAvailability] = useState('');
  const [pitch, setPitch] = useState('');
  const [whyYou, setWhyYou] = useState('');
  const [acknowledgedUnpaid, setAcknowledgedUnpaid] = useState(false);
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
    if (!resumeFile) return fail('Please attach your resume — PDF, DOC or DOCX, up to 5 MB.', 'resume');
    if (!portfolio.trim()) {
      return fail('Please share at least one link to work you’ve made — an account you run counts.', 'portfolio');
    }
    if (!acknowledgedUnpaid) {
      return fail('Please confirm you’ve read that this internship is unpaid.', 'acknowledgedUnpaid');
    }
    setError('');

    const payload = {
      roleSlug,
      roleTitle,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      basedIn: basedIn.trim(),
      portfolio: portfolio.trim(),
      tools,
      availability: availability.trim(),
      pitch: pitch.trim(),
      whyYou: whyYou.trim(),
      acknowledgedUnpaid,
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
        <div>
          <label htmlFor="basedIn">Where are you based?</label>
          <input
            type="text"
            id="basedIn"
            name="basedIn"
            autoComplete="address-level2"
            placeholder="Calgary"
            value={basedIn}
            onChange={(e) => setBasedIn(e.target.value)}
          />
        </div>
      </div>

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

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13.5, marginBottom: 8 }}>What do you already use? (Pick any)</div>
        <SurveyMultiSelect name="tools" options={TOOL_OPTIONS} selected={tools} onChange={setTools} />
      </div>

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

      {/* Required, and stated in the first person rather than as fine print.
          The role page says this too — an unpaid role is the one term
          nobody should be able to reach the end of a form without having
          read. */}
      <label
        htmlFor="acknowledgedUnpaid"
        // .cafe-signup-form label is mono/uppercase/tracked — right for a
        // field caption, wrong for a sentence someone has to read and agree
        // to, so this one opts back out of all four properties.
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          letterSpacing: 'normal',
          textTransform: 'none',
          color: 'var(--ink)',
          marginBottom: 16,
        }}
      >
        <input
          type="checkbox"
          id="acknowledgedUnpaid"
          name="acknowledgedUnpaid"
          checked={acknowledgedUnpaid}
          onChange={(e) => setAcknowledgedUnpaid(e.target.checked)}
          style={{ width: 'auto', marginTop: 3 }}
        />
        <span>I&apos;ve read that this internship is currently unpaid.</span>
      </label>

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
