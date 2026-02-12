import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './../App.css';

gsap.registerPlugin(ScrollTrigger);

const teamMembers = [
  {
    name: 'J.B. Ellis',
    role: 'Founder and CEO',
    bio: 'J.B. Ellis is an American sports media personality, host, and interviewer known for his energetic style and passion for competition. A leading voice on Sideline Sports & Entertainment, he co-hosts Sideline Sports and leads original programs including Cubfidential and J & J Sports Express. Ellis has covered six Super Bowls and is credentialed with the NFL, NBA, and MLB, providing firsthand insight from major sporting events. He previously created and hosted The PROgram on the Bleav Network.',
    image: '/JB-ELLIS.jpg',
  },
  {
    name: 'Jon Shearer',
    role: 'Co Founder & Multimedia Journalist, Photographer ',
    bio: "With over a decade in sports media, Jon Shearer has covered six Super Bowls while building a reputation for factual hot takes and high-impact storytelling. As a professional sports photographer, he doesn't just analyze the moments—he captures them. Jon is dedicated to community-focused charitable work and elevating the culture of sports.",
    image: '/JON-SHEARER.jpg',
  },
  {
    name: 'James Tatum',
    role: 'Director of Content & Media Operations',
    bio: 'James Tatum is a multimedia sports journalist and media executive with Sideline Sports, overseeing content strategy, video production, website management, and talent recruitment. A first-generation graduate driven by passion and determination, he has covered major events across the NFL, MLB, and Premier League. From interviewing athletes and executives to delivering in-depth analysis, feature stories, and digital content, James brings energy and insight to every platform, blending on-camera presence with strong writing and leadership skills to build an authentic, impactful sports media brand.',
    image: '/JAMES-TATUM.jpg',
  },
  {
    name: 'Will Peralta',
    role: 'Multimedia Photographer, Sideline Sports',
    bio: 'Will Peralta is a Multimedia Photographer for Sideline Sports, covering professional sports and entertainment events. He has photographed the NBA, NFL, MLB, and major artists, focusing on capturing authentic moments that reflect the atmosphere and story of each client and event.',
    image: '/WILL-PERALTA.jpg',
  },
];

export default function Team() {
  const mainRef = useRef<HTMLDivElement>(null);
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

          <figure className="reveal-section overflow-hidden card-editorial max-w-3xl mx-auto mb-48 md:mb-24">
            <img
              src="/team.jpg"
              alt="Sideline Sports & Entertainment team with Puka Nacua"
              className="w-full h-auto object-cover img-editorial max-h-[320px]"
            />
            <figcaption className="mt-4 text-center py-3 px-6 bg-[#1A1A1A] text-offwhite font-bold uppercase tracking-wide text-sm md:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
              Sideline Sports & Entertainment team with Puka Nacua of the Los Angeles Rams
            </figcaption>
          </figure>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-10 pt-20 md:pt-0">
            {teamMembers.map((member, i) => (
              <article
                key={i}
                className="stagger-card card-editorial overflow-hidden group flex flex-col md:flex-row gap-0"
              >
                <div className="relative w-full md:w-80 flex-shrink-0 overflow-hidden aspect-[4/5] md:aspect-square">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover img-editorial transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-6 lg:p-8 flex flex-col justify-center">
                  <span className="label-mono text-lime text-xs mb-2">{member.role}</span>
                  <h3 className="headline-article text-offwhite text-2xl mb-4 group-hover:text-lime transition-colors">
                    {member.name}
                  </h3>
                  <p
                    ref={(el) => {
                      bioRefs.current[i] = el;
                    }}
                    className={`body-editorial text-offwhite/60 ${expandedIndex === i ? '' : 'line-clamp-5'}`}
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
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
