import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ExternalLink, Youtube, ArrowRight } from 'lucide-react';
import '../App.css';

gsap.registerPlugin(ScrollTrigger);

const COVERAGE_VIDEOS = [
  {
    title: 'Philadelphia Eagles Super Bowl Coverage & Press Conferences #Eagles vs #Chiefs #SuperBowlLIX',
    url: 'https://www.youtube.com/watch?v=lNOAooyqLd8',
    videoId: 'lNOAooyqLd8',
  },
  {
    title: 'Liverpool FC vs Arsenal FC Summer 2024 USA Tour | Premier League Preseason Media Coverage',
    url: 'https://www.youtube.com/watch?v=s3Iq7VGZnv4&feature=youtu.be',
    videoId: 's3Iq7VGZnv4',
  },
  {
    title: 'Interview with NFL Executive & Former Player Troy Vincent | Vincent Country Community Event',
    url: 'https://www.youtube.com/shorts/4fn77lY3eXA',
    videoId: '4fn77lY3eXA',
  },
  {
    title: 'Super Bowl 59 Exclusive: The Impact of Ronald McDonald House | Marnie Schneider & CEO Grace McIntosh',
    url: 'https://www.youtube.com/watch?v=4TPIvNqU03A',
    videoId: '4TPIvNqU03A',
  },
  {
    title: 'James Tatum on Fox 29 Philadelphia | Super Bowl LIX Coverage | Sideline Sports',
    url: 'https://www.youtube.com/watch?v=UyQH93szCR4',
    videoId: 'UyQH93szCR4',
  },
  {
    title: 'One on One Interview with #Eagles Landon Dickerson #SuperBowlLIX',
    url: 'https://www.youtube.com/watch?v=LGrL5-ZVzSA',
    videoId: 'LGrL5-ZVzSA',
  },
  {
    title: "The Linc'd In Podcast: Philadelphia Eagles Announcer Merrill Reese Joins The Conversation",
    url: 'https://www.youtube.com/watch?v=fBdnH5DJwMw',
    videoId: 'fBdnH5DJwMw',
  },
  {
    title: 'Interview Compilation for Super Bowl LVII',
    url: 'https://www.youtube.com/watch?v=ueiIg4FnGBo',
    videoId: 'ueiIg4FnGBo',
  },
  {
    title: 'Patrick Mahomes on facing Eagles in Super Bowl',
    url: 'https://www.youtube.com/watch?v=OMDMurVBZiE',
    videoId: 'OMDMurVBZiE',
  },
];

function getThumbnail(videoId: string | null): string | null {
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/sddefault.jpg`;
}

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

  return (
    <div ref={mainRef} className="relative">
      <section className="section-premium py-24">
        <div className="w-full px-6 lg:px-12 max-w-7xl mx-auto">
          <div className="reveal-section mb-16 text-center">
            <span className="label-mono text-lime mb-4 block">Coverage</span>
            <h2 className="headline-section text-offwhite text-4xl lg:text-5xl mb-4">
              Where We've Been
            </h2>
            <p className="body-large text-offwhite/60 max-w-2xl mx-auto">
              Sideline Sports &amp; Entertainment brings you authentic coverage from the biggest events in sports and entertainment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
            {COVERAGE_VIDEOS.map((item, i) => (
              <article
                key={i}
                className="stagger-card group"
              >
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col h-full bg-offwhite/5 border border-offwhite/10 hover:border-lime/40 transition-colors overflow-hidden"
                >
                  <div className="aspect-video bg-offwhite/10 overflow-hidden">
                    {getThumbnail(item.videoId) ? (
                      <img
                        src={getThumbnail(item.videoId)!}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-offwhite/40">
                        <Youtube className="w-20 h-20" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between p-6">
                    <h3 className="headline-article text-offwhite font-bold text-lg lg:text-xl group-hover:text-lime transition-colors line-clamp-3">
                      {item.title}
                    </h3>
                    <span className="mt-4 inline-flex items-center gap-2 text-lime text-sm font-medium">
                      Watch on YouTube
                      <ExternalLink className="w-4 h-4 shrink-0" />
                    </span>
                  </div>
                </a>
              </article>
            ))}
          </div>
          <div className="reveal-section mt-14 flex justify-center">
            <Link to="/events" className="btn-premium inline-flex items-center gap-2">
              View event galleries
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
