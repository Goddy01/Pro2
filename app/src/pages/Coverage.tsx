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
    description: 'From the green room to the first pick, we capture the drama, the decisions, and the next generation of stars.',
    image: '/topics_celebration.jpg',
  },
  {
    title: 'Hall of Fame',
    description: 'Ceremonies, speeches, and the legends who shaped the game. Our coverage brings you inside the most prestigious honors in sports.',
    image: '/grid_1.jpg',
  },
  {
    title: 'Soccer Events',
    description: 'Domestic leagues, international matches, and the global game. Sideline Sports covers soccer at every level.',
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
              Sideline Sports brings you authentic coverage from the biggest events in sports and entertainment.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
            {coverages.map((item, i) => (
              <article
                key={i}
                className="stagger-card card-editorial overflow-hidden group"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover img-editorial transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-forest/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                    <h3 className="headline-article text-offwhite text-2xl lg:text-3xl mb-2 group-hover:text-lime transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-offwhite/80 text-sm lg:text-base">
                      {item.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
