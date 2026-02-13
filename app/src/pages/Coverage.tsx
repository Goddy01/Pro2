import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../App.css';

gsap.registerPlugin(ScrollTrigger);

const coverages = [
  {
    title: 'Super Bowl',
    description: 'On-the-ground coverage from the biggest game in sports — Radio Row, game day, and the moments that define the season.',
    image: '/event_coverage.jpg',
  },
  {
    title: 'NBA Drafts',
    description: 'In-depth coverage capturing the excitement and anticipation of NBA and WNBA drafts, spotlighting future stars.',
    image: '/topics_celebration.jpg',
  },
  {
    title: 'Hall of Fame',
    description: 'Exclusive interviews and photo galleries from Pro Football and MLB Hall of Fame ceremonies honoring legends. ',
    image: '/grid_1.jpg',
  },
  {
    title: 'Soccer Events',
    description: 'Live coverage of US Soccer matches and Premier League preseason tours, capturing the passion on and off the field.',
    image: '/grid_2.jpg',
  },
];

export default function Coverage() {
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
      gsap.utils.toArray<HTMLElement>('.stagger-card').forEach((card, i) => {
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
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section mb-16 text-center">
            <span className="label-mono text-lime mb-4 block">Coverage</span>
            <h2 className="headline-section text-offwhite text-4xl lg:text-5xl mb-4">
              Where We've Been
            </h2>
            <p className="body-large text-offwhite/60 max-w-2xl mx-auto">
              Sideline Sports &amp; Entertainment brings you authentic coverage from the biggest events in sports and entertainment.
            </p>
          </div>

          <div className="max-w-3xl">
            {coverages.map((item, i) => (
              <article
                key={i}
                className="stagger-card py-8 first:pt-0"
              >
                {i > 0 && (
                  <hr className="border-offwhite/10 mb-8" aria-hidden />
                )}
                <h3 className="headline-article text-lime font-bold text-xl lg:text-2xl uppercase tracking-wide mb-4">
                  {item.title}
                </h3>
                <p className="text-offwhite/80 text-sm lg:text-base leading-relaxed">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
