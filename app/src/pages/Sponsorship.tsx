import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Trophy, Award, Medal, Star } from 'lucide-react';
import '../App.css';

gsap.registerPlugin(ScrollTrigger);

const PACKAGES = [
  {
    id: 'platinum',
    icon: Trophy,
    name: 'Platinum Sponsor',
    price: 2000,
    tagline: 'Maximum visibility and category exclusivity.',
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

export default function Sponsorship() {
  const mainRef = useRef<HTMLDivElement>(null);

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
            delay: i * 0.1,
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

  return (
    <div ref={mainRef} className="relative">
      <section className="section-premium py-24">
        <div className="w-full px-6 lg:px-12 max-w-5xl mx-auto">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {PACKAGES.map((pkg) => {
              const Icon = pkg.icon;
              return (
                <article
                  key={pkg.id}
                  className="sponsor-card card-editorial overflow-hidden flex flex-col bg-forest/30 border border-offwhite/10 p-6 lg:p-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center justify-center w-12 h-12 rounded-full bg-lime/20 text-lime shrink-0">
                      <Icon className="w-6 h-6" />
                    </span>
                    <div>
                      <h2 className="headline-article text-offwhite text-xl lg:text-2xl">
                        {pkg.name}
                      </h2>
                      <p className="text-lime font-display font-bold text-2xl tracking-tight">
                        {formatPrice(pkg.price)}
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-4 flex-1">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex gap-2 text-offwhite/80 text-sm lg:text-base">
                        <span className="text-lime shrink-0 mt-0.5">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-offwhite/60 text-sm italic border-t border-offwhite/10 pt-4 mt-auto">
                    {pkg.tagline}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="reveal-section mt-16 text-center">
            <p className="text-offwhite/70 mb-6">
              Ready to become a sponsor? Get in touch.
            </p>
            <Link
              to="/work-with-us"
              className="inline-block bg-lime text-forest font-display font-bold uppercase tracking-[0.2em] px-8 py-4 rounded-none border-0 transition-colors hover:bg-lime/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-forest"
              style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
