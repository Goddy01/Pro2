import { useEffect, useRef, useState, type FormEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Trophy, Award, Medal, Star, Check, ChevronDown, X } from 'lucide-react';
import { apiUrl } from '../lib/api';
import '../App.css';

gsap.registerPlugin(ScrollTrigger);

const PACKAGES = [
  {
    id: 'platinum',
    icon: Trophy,
    name: 'Platinum Sponsor',
    price: 2000,
    tagline: 'Maximum visibility and category exclusivity.',
    accent: 'from-lime/40 via-lime/20 to-transparent',
    features: [
      'Business name featured in the show title: "Sideline Sports presented by [Your Business Name]"',
      'Three (3) 30-second commercial spots per episode',
      'Exclusive 20-minute in-show guest interview',
      'First priority for on-location appearances at live events',
      'Premium brand integration throughout the show',
    ],
  },
  {
    id: 'gold',
    icon: Award,
    name: 'Gold Sponsor',
    price: 1500,
    tagline: 'Strong brand placement with recurring feature mentions.',
    accent: 'from-amber-400/30 via-amber-400/10 to-transparent',
    features: [
      'Segment naming rights: "Quick Hits brought to you by [Your Business Name]"',
      'Two (2) 30-second commercial spots per episode',
      '10-minute guest interview opportunity',
      'Second priority for live event appearances',
    ],
  },
  {
    id: 'silver',
    icon: Medal,
    name: 'Silver Sponsor',
    price: 1000,
    tagline: 'Consistent exposure with on-air engagement.',
    accent: 'from-offwhite/20 via-offwhite/5 to-transparent',
    features: [
      'Two (2) 30-second commercial spots per episode',
      '5-minute guest interview opportunity',
      'Third priority for live event appearances',
    ],
  },
  {
    id: 'bronze',
    icon: Star,
    name: 'Bronze Sponsor',
    price: 750,
    tagline: 'Affordable brand visibility with direct audience reach.',
    accent: 'from-amber-700/30 via-amber-700/10 to-transparent',
    features: [
      'Business name featured on bottom ticker during show',
      'One (1) 30-second commercial spot per episode',
      'Fourth priority for live event appearances',
    ],
  },
];

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const inputClass =
  'w-full px-4 py-3 bg-forest/50 border border-offwhite/20 text-offwhite placeholder:text-offwhite/40 focus:outline-none focus:border-lime rounded transition-colors';
const labelClass = 'text-offwhite text-sm font-medium mb-2 block';

export default function Sponsorship() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tier, setTier] = useState('');
  const [message, setMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [tierDropdownOpen, setTierDropdownOpen] = useState(false);
  const tierDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tierDropdownRef.current && !tierDropdownRef.current.contains(e.target as Node)) {
        setTierDropdownOpen(false);
      }
    }
    if (tierDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [tierDropdownOpen]);

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
      gsap.utils.toArray<HTMLElement>('.sponsor-card').forEach((card, i) => {
        gsap.fromTo(
          card,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            delay: i * 0.08,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 90%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, mainRef);
    return () => ctx.revert();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError('');
    setSubmitStatus('loading');
    try {
      const res = await fetch(apiUrl('/api/sponsorship-inquiries'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          business_name: businessName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          tier: tier || undefined,
          message: message.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.error || 'Something went wrong. Please try again.');
        setSubmitStatus('error');
        return;
      }
      setSubmitStatus('success');
      setName('');
      setBusinessName('');
      setEmail('');
      setPhone('');
      setTier('');
      setMessage('');
    } catch {
      setSubmitError('Could not connect. Please try again.');
      setSubmitStatus('error');
    }
  }

  return (
    <div ref={mainRef} className="relative">
      <section className="section-premium py-24">
        <div className="w-full px-6 lg:px-12 max-w-6xl mx-auto">
          <div className="reveal-section text-center mb-16">
            <span className="label-mono text-lime mb-4 block">Sponsorship</span>
            <h1 className="headline-section text-offwhite text-4xl lg:text-5xl mb-4">
              Sideline Sports Sponsorship Packages
            </h1>
            <p className="body-large text-offwhite/60 max-w-2xl mx-auto mb-6">
              Partner with Sideline Sports and connect your brand with a passionate, sports-driven audience. Our sponsorship tiers are designed to maximize visibility, engagement, and brand recognition across every episode and live event.
            </p>
            <div className="h-px w-24 mx-auto bg-offwhite/20" aria-hidden />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 mb-20">
            {PACKAGES.map((pkg) => {
              const Icon = pkg.icon;
              return (
                <article
                  key={pkg.id}
                  className="sponsor-card group relative overflow-hidden flex flex-col rounded-sm border border-offwhite/15 bg-gradient-to-b from-offwhite/5 to-transparent shadow-lg hover:shadow-xl hover:border-offwhite/25 transition-all duration-300"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${pkg.accent}`} />
                  <div className="p-6 lg:p-8 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <span className="flex items-center justify-center w-14 h-14 rounded-xl bg-offwhite/10 text-lime group-hover:bg-lime/20 transition-colors shrink-0">
                        <Icon className="w-7 h-7" />
                      </span>
                      <p className="text-2xl lg:text-3xl font-display font-bold text-lime tracking-tight">
                        {formatPrice(pkg.price)}
                      </p>
                    </div>
                    <h2 className="headline-article text-offwhite text-xl lg:text-2xl mb-1">
                      {pkg.name}
                    </h2>
                    <ul className="space-y-3 mb-5 flex-1">
                      {pkg.features.map((feature, i) => (
                        <li key={i} className="flex gap-3 text-offwhite/85 text-sm lg:text-base">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-lime/20 text-lime shrink-0 mt-0.5">
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-offwhite/50 text-sm italic border-t border-offwhite/10 pt-4 mt-auto">
                      {pkg.tagline}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="reveal-section max-w-xl mx-auto">
            <h2 className="headline-section text-offwhite text-2xl lg:text-3xl mb-2 text-center">
              Partner with us
            </h2>
            <p className="text-offwhite/60 text-sm text-center mb-8">
              {formOpen
                ? "We'll get back to you to discuss your sponsorship."
                : 'Ready to get started? Fill out the form and we’ll be in touch.'}
            </p>

            {!formOpen ? (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setFormOpen(true)}
                  className="bg-lime text-forest font-display font-bold uppercase tracking-[0.2em] py-4 px-8 rounded-none border-0 transition-colors hover:bg-lime/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-forest"
                  style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}
                >
                  Fill the form
                </button>
              </div>
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
              <div className="mb-6 p-4 rounded bg-lime/20 border border-lime/40 text-lime text-center text-sm">
                Thanks! We’ve received your inquiry and will be in touch soon.
              </div>
            )}
            {submitStatus === 'error' && submitError && (
              <div className="mb-6 p-4 rounded bg-red-500/20 border border-red-500/40 text-red-300 text-center text-sm">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 p-6 lg:p-8 bg-offwhite/5 border border-offwhite/10 rounded-sm">
              <label className="block">
                <span className={labelClass}>Your name *</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Full name"
                  required
                  maxLength={200}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Business name *</span>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className={inputClass}
                  placeholder="Company or brand name"
                  required
                  maxLength={300}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Email *</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@company.com"
                  required
                  maxLength={254}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Phone *</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  placeholder="(555) 123-4567"
                  required
                  maxLength={30}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Sponsorship tier *</span>
                <div ref={tierDropdownRef} className="relative">
                  <input type="hidden" name="tier" value={tier} required />
                  <button
                    type="button"
                    onClick={() => setTierDropdownOpen((o) => !o)}
                    className={`${inputClass} flex items-center justify-between gap-3 text-left cursor-pointer`}
                    aria-haspopup="listbox"
                    aria-expanded={tierDropdownOpen}
                  >
                    {tier ? (
                      (() => {
                        const pkg = PACKAGES.find((p) => p.id === tier);
                        if (!pkg) return <span>Select a tier</span>;
                        const Icon = pkg.icon;
                        return (
                          <span className="flex items-center gap-3">
                            <span className={`flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-r ${pkg.accent} text-lime shrink-0`}>
                              <Icon className="w-4 h-4" />
                            </span>
                            <span>
                              <span className="font-medium">{pkg.name}</span>
                              <span className="text-offwhite/60 ml-2">{formatPrice(pkg.price)}</span>
                            </span>
                          </span>
                        );
                      })()
                    ) : (
                      <span className="text-offwhite/40">Select a tier</span>
                    )}
                    <ChevronDown className={`w-5 h-5 shrink-0 text-offwhite/60 transition-transform ${tierDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {tierDropdownOpen && (
                    <ul
                      className="absolute z-10 left-0 right-0 mt-1 py-1 rounded border border-offwhite/20 bg-forest shadow-xl shadow-black/30 max-h-[280px] overflow-y-auto"
                      role="listbox"
                    >
                      {PACKAGES.map((p) => {
                        const Icon = p.icon;
                        const selected = tier === p.id;
                        return (
                          <li
                            key={p.id}
                            role="option"
                            aria-selected={selected}
                            onClick={() => {
                              setTier(p.id);
                              setTierDropdownOpen(false);
                            }}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-l-2 border-transparent ${
                              selected
                                ? 'bg-lime/15 border-lime text-lime'
                                : 'hover:bg-offwhite/10 text-offwhite border-offwhite/10 hover:border-offwhite/30'
                            }`}
                          >
                            <span className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r ${p.accent} text-lime shrink-0`}>
                              <Icon className="w-5 h-5" />
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{p.name}</p>
                              <p className="text-offwhite/60 text-sm">{formatPrice(p.price)}</p>
                            </div>
                            {selected && <Check className="w-4 h-4 shrink-0 text-lime" strokeWidth={3} />}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </label>
              <label className="block">
                <span className={labelClass}>Message (optional)</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                  className={`${inputClass} min-h-[100px] resize-y`}
                  placeholder="Tell us about your goals or questions..."
                  rows={4}
                  maxLength={2000}
                />
                <p className="text-offwhite/40 text-xs mt-1">{message.length} / 2000</p>
              </label>
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
