import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Instagram, Youtube } from 'lucide-react';
import { apiUrl } from '../lib/api';
import SEO from '../components/SEO';
import './../App.css';

gsap.registerPlugin(ScrollTrigger);

type TeamMember = {
  id: number;
  name: string;
  role: string;
  bio: string;
  image: string;
  socials: { x?: string; youtube?: string; tiktok?: string; instagram?: string };
};

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

function mapApiMember(row: {
  id: number;
  name: string;
  role: string | null;
  bio: string | null;
  image: string | null;
  social_x: string | null;
  social_youtube: string | null;
  social_tiktok: string | null;
  social_instagram: string | null;
}): TeamMember {
  const socials: TeamMember['socials'] = {};
  if (row.social_x) socials.x = row.social_x;
  if (row.social_youtube) socials.youtube = row.social_youtube;
  if (row.social_tiktok) socials.tiktok = row.social_tiktok;
  if (row.social_instagram) socials.instagram = row.social_instagram;
  return {
    id: row.id,
    name: row.name,
    role: row.role ?? '',
    bio: row.bio ?? '',
    image: row.image ?? '',
    socials,
  };
}

// (static team data moved to DB seed in backend/db.js)

export default function Team() {
  const mainRef = useRef<HTMLDivElement>(null);
  const teamCarouselRef = useRef<HTMLDivElement>(null);
  const bioRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [truncatedIndices, setTruncatedIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl('/api/team'))
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        setTeamMembers(data.map(mapApiMember));
      })
      .catch(() => {
        if (!cancelled) setTeamMembers([]);
      })
      .finally(() => {
        if (!cancelled) setTeamLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

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
  }, [expandedIndex, teamMembers.length]);

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
      <SEO
        title="Team"
        description="Meet the Sideline Sports & Entertainment team. Journalists, hosts, and creators behind our sports and entertainment coverage."
        canonicalPath="/team"
      />
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
              {!teamLoading && teamMembers.length === 0 ? (
                <p className="text-offwhite/60 px-14">No team members yet.</p>
              ) : (
                [0, 1, 2].map((repeatIndex) =>
                teamMembers.map((member, i) => (
                  <article
                    key={`${repeatIndex}-${member.id}`}
                    className="stagger-card card-editorial flex-shrink-0 w-[320px] sm:w-[380px] lg:w-[420px] snap-center flex flex-col overflow-hidden group"
                  >
                    <div className="relative overflow-hidden aspect-[3/4]">
                      <img
                        src={member.image || '/team.jpg'}
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
                      {Object.keys(member.socials).length > 0 && (
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
                          {member.socials.youtube && (
                            <a
                              href={member.socials.youtube}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-offwhite/60 hover:text-lime transition-colors"
                              aria-label={`${member.name} on YouTube`}
                            >
                              <Youtube className="w-5 h-5" />
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
              )
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
