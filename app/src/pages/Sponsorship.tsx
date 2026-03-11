import { useEffect, useRef, useState, type FormEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { X } from 'lucide-react';
import { apiUrl } from '../lib/api';
import SEO from '../components/SEO';
import '../App.css';

gsap.registerPlugin(ScrollTrigger);

const inputClass =
  'w-full px-4 py-3 bg-forest/50 border border-offwhite/20 text-offwhite placeholder:text-offwhite/40 focus:outline-none focus:border-lime rounded transition-colors';
const labelClass = 'text-offwhite text-sm font-medium mb-2 block';

type DiscoveryQuestion = {
  id: number;
  question_text: string;
  is_required: boolean;
  question_type?: string;
  options?: string[] | null;
};

export default function Sponsorship() {
  const mainRef = useRef<HTMLDivElement>(null);
  const successMessageRef = useRef<HTMLDivElement>(null);
  const [discoveryQuestions, setDiscoveryQuestions] = useState<DiscoveryQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.reveal-section').forEach((section) => {
        gsap.fromTo(
          section,
          { y: 80, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, mainRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl('/api/sponsorship-discovery-questions'))
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setDiscoveryQuestions(
            data.map((q) => ({
              id: q.id,
              question_text: q.question_text,
              is_required: !!q.is_required,
              question_type: q.question_type || 'short_text',
              options: Array.isArray(q.options) ? q.options : null,
            }))
          );
        }
      })
      .catch(() => {
        // silently ignore – page still works without questions
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (submitStatus === 'success' && successMessageRef.current) {
      successMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [submitStatus]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError('');
    setSubmitStatus('loading');
    try {
      const payloadAnswers = discoveryQuestions.map((q) => ({
        questionId: q.id,
        answer: (answers[q.id] ?? '').trim(),
      }));
      const res = await fetch(apiUrl('/api/sponsorship-discovery-submissions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payloadAnswers }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.error || 'Something went wrong. Please try again.');
        setSubmitStatus('error');
        return;
      }
      setSubmitStatus('success');
      setAnswers({});
    } catch {
      setSubmitError('Could not connect. Please try again.');
      setSubmitStatus('error');
    }
  }

  return (
    <div ref={mainRef} className="relative">
      <SEO
        title="Sponsorship"
        description="Custom sponsorship packages tailored to your brand's goals, audience, and activation needs. Contact us for a custom proposal."
        canonicalPath="/sponsorship"
      />
      <section className="section-premium py-24">
        <div className="w-full px-6 lg:px-12 max-w-6xl mx-auto">
          <div className="reveal-section text-center mb-16">
            <span className="label-mono text-lime mb-4 block">Sponsorship</span>
            <h1 className="headline-section text-offwhite text-4xl lg:text-5xl mb-4">
              Custom Sponsorship Packages Available
            </h1>
            <p className="body-large text-offwhite/80 max-w-2xl mx-auto mb-4">
              Tailored to your brand's goals, audience, and activation needs.
            </p>
            <p className="body-large text-offwhite/60 max-w-2xl mx-auto mb-6">
              Contact us for a custom proposal.
            </p>
            <div className="h-px w-24 mx-auto bg-offwhite/20" aria-hidden />
          </div>

          <div className="reveal-section max-w-xl mx-auto">
            <h2 className="headline-section text-offwhite text-2xl lg:text-3xl mb-2 text-center">
              Get in touch
            </h2>
            <p className="text-offwhite/60 text-sm text-center mb-8">
              {formOpen
                ? "We'll get back to you with a custom proposal."
                : "Tell us about your goals and we'll put together a tailored package."}
            </p>

            {!formOpen ? (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setFormOpen(true)}
                  className="bg-lime text-forest font-display font-bold uppercase tracking-[0.2em] py-4 px-8 rounded-none border-0 transition-colors hover:bg-lime/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-forest"
                  style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}
                >
                  Contact us for a custom proposal
                </button>
              </div>
            ) : discoveryQuestions.length === 0 ? (
              <p className="text-offwhite/70 text-center py-8">
                No questions are configured. Please check back later.
              </p>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="absolute top-2 right-2 p-2 text-offwhite/60 hover:text-offwhite rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-forest z-10"
                  aria-label="Close form"
                >
                  <X className="w-5 h-5" />
                </button>
            {submitStatus === 'success' && (
              <div
                ref={successMessageRef}
                className="mb-6 p-4 rounded bg-green-600/25 border border-green-500/50 text-green-200 text-center text-sm font-medium"
                role="status"
                aria-live="polite"
              >
                Thanks! We’ve received your inquiry and will be in touch soon.
              </div>
            )}
            {submitStatus === 'error' && submitError && (
              <div className="mb-6 p-4 rounded bg-red-500/20 border border-red-500/40 text-red-300 text-center text-sm">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 p-6 lg:p-8 bg-offwhite/5 border border-offwhite/10 rounded-sm">
              {discoveryQuestions.map((q, idx) => {
                const value = answers[q.id] ?? '';
                const type = q.question_type || 'short_text';
                return (
                  <label key={q.id} className="block">
                    <span className={labelClass}>
                      {idx + 1}. {q.question_text} {q.is_required && <span className="text-lime">*</span>}
                    </span>
                    {type === 'short_text' && (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        className={inputClass}
                        placeholder={q.is_required ? 'Required' : 'Optional'}
                        maxLength={4000}
                        required={q.is_required}
                      />
                    )}
                    {type === 'long_text' && (
                      <textarea
                        value={value}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        className={`${inputClass} min-h-[80px] resize-y`}
                        placeholder={q.is_required ? 'Required' : 'Optional'}
                        rows={3}
                        maxLength={4000}
                        required={q.is_required}
                      />
                    )}
                    {type === 'dropdown' && (
                      <select
                        value={value}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        className={inputClass}
                        required={q.is_required}
                      >
                        <option value="">Select…</option>
                        {(Array.isArray(q.options) ? q.options : []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}
                  </label>
                );
              })}
              <button
                type="submit"
                disabled={submitStatus === 'loading'}
                className="w-full bg-lime text-forest font-display font-bold uppercase tracking-[0.2em] py-4 px-8 rounded-none border-0 transition-colors hover:bg-lime/90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-forest"
                style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}
              >
                {submitStatus === 'loading' ? 'Sending…' : 'Submit inquiry'}
              </button>
            </form>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
