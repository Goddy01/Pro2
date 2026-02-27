import { useState, useEffect, type FormEvent } from 'react';
import { sanitizeName, sanitizePhone, sanitizeEmail, sanitizeIntroduction, MAX_INTRO } from '../lib/sanitize';
import { apiUrl } from '../lib/api';
import SEO from '../components/SEO';
import '../App.css';

const inputClass =
  'w-full px-4 py-3 bg-forest/50 border border-offwhite/20 text-offwhite placeholder:text-offwhite/40 focus:outline-none focus:border-lime rounded transition-colors';
const labelClass = 'text-offwhite text-sm font-medium mb-2 block';

const RATE_LIMIT_KEY = 'work-with-us-rate';
const RATE_LIMIT_MAX_SUBMISSIONS = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const COOLDOWN_MS = 60 * 1000; // 1 minute before allowing another submit

function getRateLimit(): { count: number; resetAt: number } {
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) return { count: 0, resetAt: 0 };
    const data = JSON.parse(raw) as { count: number; resetAt: number };
    if (Date.now() >= data.resetAt) return { count: 0, resetAt: 0 };
    return data;
  } catch {
    return { count: 0, resetAt: 0 };
  }
}

function recordSubmission(): void {
  const now = Date.now();
  const current = getRateLimit();
  const resetAt = current.resetAt > now ? current.resetAt : now + RATE_LIMIT_WINDOW_MS;
  const count = current.resetAt > now ? current.count + 1 : 1;
  sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ count, resetAt }));
}

export default function WorkWithUs() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [intro, setIntro] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [rateLimitError, setRateLimitError] = useState('');

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (cooldownUntil <= 0) return;
    const t = setInterval(() => {
      const tNow = Date.now();
      setNow(tNow);
      if (tNow >= cooldownUntil) setCooldownUntil(0);
    }, 1000);
    return () => clearInterval(t);
  }, [cooldownUntil]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setRateLimitError('');

    const rate = getRateLimit();
    if (rate.count >= RATE_LIMIT_MAX_SUBMISSIONS) {
      setRateLimitError(`Maximum ${RATE_LIMIT_MAX_SUBMISSIONS} submissions per hour. Please try again later.`);
      return;
    }
    if (Date.now() < cooldownUntil) {
      setRateLimitError('Please wait before submitting again.');
      return;
    }

    const nameResult = sanitizeName(name);
    const phoneResult = sanitizePhone(phone);
    const emailResult = sanitizeEmail(email);
    const introResult = sanitizeIntroduction(intro);

    const newErrors: Record<string, string> = {};
    if (nameResult.error) newErrors.name = nameResult.error;
    if (phoneResult.error) newErrors.phone = phoneResult.error;
    if (emailResult.error) newErrors.email = emailResult.error;
    if (introResult.error) newErrors.intro = introResult.error;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const payload = {
      name: nameResult.value,
      phone: phoneResult.value,
      email: emailResult.value,
      introduction: introResult.value,
    };
    try {
      const res = await fetch(apiUrl('/api/work-with-us'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRateLimitError(data.error || 'Submission failed. Please try again.');
        setLoading(false);
        return;
      }
      const t = Date.now();
      recordSubmission();
      setNow(t);
      setCooldownUntil(t + COOLDOWN_MS);
      setSubmitted(true);
      setName('');
      setPhone('');
      setEmail('');
      setIntro('');
    } catch {
      setRateLimitError('Could not connect. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    const cooldownRemaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
    const canSubmitAgain = cooldownRemaining <= 0;
    const rate = getRateLimit();
    const atLimit = rate.count >= RATE_LIMIT_MAX_SUBMISSIONS;

    return (
      <div className="section-premium min-h-[60vh] flex items-center justify-center px-6">
        <div className="w-full max-w-lg text-center">
          <h1 className="text-lime font-editorial font-black text-3xl italic mb-4">Thank you</h1>
          <p className="text-offwhite/80 text-lg mb-6">
            We've received your interest in working with Sideline Sports & Entertainment. We'll be in touch soon.
          </p>
          {!canSubmitAgain && (
            <p className="text-offwhite/50 text-sm mb-4">You can submit again in {cooldownRemaining} seconds.</p>
          )}
          {atLimit && (
            <p className="text-amber-400/90 text-sm mb-4">
              Submission limit reached. Try again in an hour.
            </p>
          )}
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            disabled={!canSubmitAgain || atLimit}
            className="btn-premium py-3 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit another response
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="section-premium px-6">
      <SEO
        title="Work With Us"
        description="Join Sideline Sports & Entertainment. Careers and opportunities in sports media and entertainment."
        canonicalPath="/work-with-us"
      />
      <div className="max-w-2xl mx-auto py-12 mt-4">
        <h1 className="text-lime font-editorial font-black text-3xl md:text-4xl italic mb-2">
          Work with us
        </h1>
        <p className="text-offwhite/70 text-sm md:text-base mb-10">
          Tell us about yourself and why you'd like to join Sideline Sports & Entertainment.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-offwhite/5 border border-offwhite/10 p-6 md:p-8 rounded-sm"
        >
          <div className="space-y-6">
            <label className="block">
              <span className={labelClass}>Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Your full name"
                autoComplete="name"
                maxLength={200}
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </label>

            <label className="block">
              <span className={labelClass}>Phone number</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="e.g. 555-123-4567"
                autoComplete="tel"
                maxLength={30}
              />
              {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
            </label>

            <label className="block">
              <span className={labelClass}>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={254}
              />
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </label>

            <label className="block">
              <span className={labelClass}>
                Brief introduction (why you are interested in working with Sideline Sports & Entertainment)
              </span>
              <textarea
                value={intro}
                onChange={(e) => setIntro(e.target.value.slice(0, MAX_INTRO))}
                className={`${inputClass} min-h-[160px] resize-y`}
                placeholder="Tell us about yourself, your background, and what draws you to our team..."
                maxLength={MAX_INTRO}
                rows={6}
              />
              <p className="text-offwhite/40 text-xs mt-1">{intro.length} / {MAX_INTRO}</p>
              {errors.intro && <p className="text-red-400 text-sm mt-1">{errors.intro}</p>}
            </label>
          </div>

          {rateLimitError && (
            <p className="text-amber-400/90 text-sm mb-4">{rateLimitError}</p>
          )}

          <button
            type="submit"
            disabled={loading || (now < cooldownUntil)}
            className="mt-8 w-full btn-premium py-4 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
