import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Instagram } from 'lucide-react';
import './../App.css';

gsap.registerPlugin(ScrollTrigger);

function IconXLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconTikTok({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

const teamMembers = [
  {
    name: 'J.B. Ellis',
    role: 'Founder and CEO',
    bio: 'J.B. Ellis is an American sports media personality, host, and interviewer known for his energetic style and passion for competition. A leading voice on Sideline Sports & Entertainment, he co-hosts Sideline Sports and leads original programs including Cubfidential and J & J Sports Express. Ellis has covered six Super Bowls and is credentialed with the NFL, NBA, and MLB, providing firsthand insight from major sporting events. He previously created and hosted The PROgram on the Bleav Network.',
    image: '/JB-ELLIS.jpg',
    socials: { instagram: 'https://www.instagram.com/sidelinesports_j.b.ellis' },
  },
  {
    name: 'Jon Shearer',
    role: 'Co Founder & Multimedia Journalist, Photographer ',
    bio: "With over a decade in sports media, Jon Shearer has covered six Super Bowls while building a reputation for factual hot takes and high-impact storytelling. As a professional sports photographer, he doesn't just analyze the moments—he captures them. Jon is dedicated to community-focused charitable work and elevating the culture of sports.",
    image: '/JON-SHEARER.jpg',
    socials: { instagram: 'https://www.instagram.com/jonshearer_media' },
  },
  {
    name: 'Jay Nelson',
    role: 'Sports Personality & Media Executive',
    bio: 'Will Peralta is a Multimedia Photographer for Sideline Sports & Entertainment, covering professional sports and entertainment events. He has photographed the NBA, NFL, MLB, and major artists, focusing on capturing authentic moments that reflect the atmosphere and story of each client and event.',
    image: '/JAY.jpg',
    socials: { instagram: 'https://www.instagram.com/unconv3ntionalking13' },
  },
  {
    name: 'James Tatum',
    role: 'Director of Content & Media Operations',
    bio: 'James Tatum is a multimedia sports journalist and media executive with Sideline Sports & Entertainment, overseeing content strategy, video production, website management, and talent recruitment. A first-generation graduate driven by passion and determination, he has covered major events across the NFL, MLB, and Premier League. From interviewing athletes and executives to delivering in-depth analysis, feature stories, and digital content, James brings energy and insight to every platform, blending on-camera presence with strong writing and leadership skills to build an authentic, impactful sports media brand.',
    image: '/JAMES-TATUM.jpg',
    socials: { instagram: 'https://www.instagram.com/jtpov_', x: 'https://x.com/JTP0V' },
  },
  {
    name: 'Will Peralta',
    role: 'Multimedia Photographer',
    bio: 'Will Peralta is a Multimedia Photographer for Sideline Sports & Entertainment, covering professional sports and entertainment events. He has photographed the NBA, NFL, MLB, and major artists, focusing on capturing authentic moments that reflect the atmosphere and story of each client and event.',
    image: '/WILL-PERALTA.jpg',
    socials: { instagram: 'https://www.instagram.com/will_media_peralta', tiktok: 'https://www.tiktok.com/@will_media_peralta?_r=1&_t=ZP-93riibpsdF0' },
  },
];

export default function Team() {
  const mainRef = useRef<HTMLDivElement>(null);
  const teamCarouselRef = useRef<HTMLDivElement>(null);
  const bioRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [truncatedIndices, setTruncatedIndices] = useState<Set<number>>(new Set());

  const measureTruncation = useCallback(() => {
    const next = new Set<number>();
    for (let idx = 0; idx < teamMembers.length; idx++) {
      const el = bioRefs.current[idx];
      if (!el || expandedIndex === idx) continue;
      if (el.scrollHeight > el.clientHeight) next.add(idx);
    }
    setTruncatedIndices((prev) => {
      if (prev.size !== next.size || [...prev].some((i) => !next.has(i))) return next;
      return prev;
    });
  }, [expandedIndex]);

  useEffect(() => {
    const t = setTimeout(measureTruncation, 0);
    return () => clearTimeout(t);
  }, [measureTruncation]);

  useEffect(() => {
    const el = teamCarouselRef.current;
    if (!el) return;
    const run = () => {
      el.scrollLeft = 0;
    };
    const t = setTimeout(run, 50);
    const onResize = () => run();
    window.addEventListener('resize', onResize);
    const onScroll = () => {
      const setWidth = el.scrollWidth / 3;
      if (setWidth <= 0) return;
      if (el.scrollLeft <= 0) el.scrollLeft += setWidth;
      else if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 2) el.scrollLeft -= setWidth;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('scroll', onScroll);
    };
  }, []);

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
            <span className="label-mono text-lime mb-4 block">Team</span>
            <h2 className="headline-section text-offwhite text-4xl lg:text-5xl mb-4">
              Meet the Team
            </h2>
            <p className="body-large text-offwhite/60 max-w-2xl mx-auto">
              The people behind Sideline Sports & Entertainment — journalists, hosts, and creatives
              bringing you stories from the biggest stages in sports and entertainment.
            </p>
          </div>

          <figure className="reveal-section overflow-hidden card-editorial max-w-3xl mx-auto mb-16 md:mb-20">
            <img
              src="/team.jpg"
              alt=""
              className="w-full h-auto object-cover img-editorial max-h-[320px]"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            <figcaption className="mt-4 text-center py-3 px-6 bg-[#1A1A1A] text-offwhite font-bold uppercase tracking-wide text-sm md:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
              Sideline Sports & Entertainment team with Puka Nacua of the Los Angeles Rams
            </figcaption>
          </figure>

          <div className="reveal-section relative -mx-6 lg:-mx-12">
            <button
              type="button"
              onClick={() => {
                const el = teamCarouselRef.current;
                if (el) {
                  const card = el.querySelector('article');
                  const cardWidth = (card?.getBoundingClientRect().width ?? 400) + 40;
                  el.scrollBy({ left: -cardWidth, behavior: 'smooth' });
                }
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-forest border border-offwhite/20 text-offwhite flex items-center justify-center hover:bg-forest/90 hover:text-lime hover:border-lime/50 transition-colors shadow-lg"
              aria-label="Previous"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => {
                const el = teamCarouselRef.current;
                if (el) {
                  const card = el.querySelector('article');
                  const cardWidth = (card?.getBoundingClientRect().width ?? 400) + 40;
                  el.scrollBy({ left: cardWidth, behavior: 'smooth' });
                }
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-forest border border-offwhite/20 text-offwhite flex items-center justify-center hover:bg-forest/90 hover:text-lime hover:border-lime/50 transition-colors shadow-lg"
              aria-label="Next"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div
              ref={teamCarouselRef}
              className="team-carousel overflow-x-auto scroll-smooth snap-x snap-mandatory flex gap-10 px-14 lg:px-16 py-4"
            >
              {[0, 1, 2].map((repeatIndex) =>
                teamMembers.map((member, i) => (
                  <article
                    key={`${repeatIndex}-${i}`}
                    className="stagger-card card-editorial flex-shrink-0 w-[320px] sm:w-[380px] lg:w-[420px] snap-center flex flex-col overflow-hidden group"
                  >
                    <div className="relative overflow-hidden aspect-[3/4]">
                      <img
                        src={member.image}
                        alt=""
                        className="w-full h-full object-cover img-editorial transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-forest/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="p-6 lg:p-8 flex flex-col flex-1 bg-forest/30 border border-offwhite/5 border-t-0">
                      <span className="label-mono text-lime text-xs mb-1">{member.role}</span>
                      <h3 className="headline-article text-offwhite text-xl lg:text-2xl mb-2 group-hover:text-lime transition-colors">
                        {member.name}
                      </h3>
                      {'socials' in member && member.socials && (
                        <div className="flex items-center gap-3 mb-3">
                          {member.socials.instagram && (
                            <a
                              href={member.socials.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-offwhite/60 hover:text-lime transition-colors"
                              aria-label={`${member.name} on Instagram`}
                            >
                              <Instagram className="w-5 h-5" />
                            </a>
                          )}
                          {member.socials.x && (
                            <a
                              href={member.socials.x}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-offwhite/60 hover:text-lime transition-colors"
                              aria-label={`${member.name} on X`}
                            >
                              <IconXLogo className="w-5 h-5" />
                            </a>
                          )}
                          {member.socials.tiktok && (
                            <a
                              href={member.socials.tiktok}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-offwhite/60 hover:text-lime transition-colors"
                              aria-label={`${member.name} on TikTok`}
                            >
                              <IconTikTok className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      )}
                      <p
                        ref={(el) => {
                          bioRefs.current[i] = el;
                        }}
                        className={`body-editorial text-offwhite/70 text-sm lg:text-base flex-1 ${expandedIndex === i ? '' : 'line-clamp-4'}`}
                      >
                        {member.bio}
                      </p>
                      {(truncatedIndices.has(i) || expandedIndex === i) && (
                        <button
                          type="button"
                          onClick={() => setExpandedIndex((prev) => (prev === i ? null : i))}
                          className="mt-3 inline-flex items-center gap-1.5 text-lime text-sm font-medium hover:text-lime/80 transition-colors"
                        >
                          {expandedIndex === i ? (
                            <>
                              Read less
                              <ChevronUp className="w-4 h-4" />
                            </>
                          ) : (
                            <>
                              Read more
                              <ChevronDown className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
