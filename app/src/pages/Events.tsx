import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiUrl } from '../lib/api';
import '../App.css';

gsap.registerPlugin(ScrollTrigger);

const EVENTS_PER_PAGE = 6;

type EventItem = { id: string; title: string; description: string; images: string[] };

export default function Events() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const q = searchQuery.trim();
    const url = q ? apiUrl(`/api/events?q=${encodeURIComponent(q)}`) : apiUrl('/api/events');
    const t = setTimeout(() => {
      setLoading(true);
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          setEvents(Array.isArray(data) ? data : []);
          setCurrentPage(1);
        })
        .catch(() => {
          setEvents([]);
          setCurrentPage(1);
        })
        .finally(() => setLoading(false));
    }, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const list: EventItem[] = events;
  const q = searchQuery.trim();
  const totalPages = Math.max(1, Math.ceil(list.length / EVENTS_PER_PAGE));
  const pageIndex = Math.min(Math.max(1, currentPage), totalPages);
  const start = (pageIndex - 1) * EVENTS_PER_PAGE;
  const paginatedList = list.slice(start, start + EVENTS_PER_PAGE);

  const gridWrapClass =
    paginatedList.length === 1
      ? 'lg:max-w-xl mx-auto'
      : paginatedList.length === 2
        ? 'lg:max-w-3xl mx-auto'
        : '';

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
  }, [paginatedList.length, pageIndex]);

  return (
    <div ref={mainRef} className="relative">
      <section className="section-premium py-24">
        <div className="w-full px-6 lg:px-12 max-w-7xl mx-auto">
          <div className="reveal-section mb-16 text-center">
            <span className="label-mono text-lime mb-4 block">Event Galleries</span>
            <h2 className="headline-section text-offwhite text-4xl lg:text-5xl mb-4">
              Event Galleries
            </h2>
            <p className="body-large text-offwhite/60 max-w-2xl mx-auto">
              Photo galleries from the events we've covered — from community initiatives to Super Bowl exclusives.
            </p>
            <div className="mt-8 max-w-md mx-auto">
              <label htmlFor="events-search" className="sr-only">Search events</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-offwhite/50" aria-hidden />
                <input
                  id="events-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or description…"
                  className="w-full pl-10 pr-4 py-3 bg-offwhite/5 border border-offwhite/20 text-offwhite placeholder:text-offwhite/50 focus:outline-none focus:border-lime"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-offwhite/60 text-center py-12">Loading…</p>
          ) : list.length === 0 ? (
            <p className="text-offwhite/60 text-center py-12">
              {q ? 'No events match your search.' : 'No event galleries yet.'}
            </p>
          ) : (
            <>
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 ${gridWrapClass}`}>
                {paginatedList.map((event) => {
                  const imgs = event.images || [];
                  const previewImg = imgs[0] || '';
                  return (
                    <Link
                      key={event.id}
                      to={`/coverage/event/${event.id}`}
                      className="stagger-card group block"
                    >
                      <article className="h-full flex flex-col bg-offwhite/5 border border-offwhite/10 overflow-hidden rounded-lg hover:border-offwhite/20 transition-colors">
                        <div className="aspect-[4/3] overflow-hidden bg-offwhite/10 shrink-0">
                          <img
                            src={previewImg}
                            alt=""
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        <div className="p-5 lg:p-6 flex flex-col flex-1">
                          <h3 className="headline-article text-offwhite text-lg lg:text-xl mb-2 group-hover:text-lime transition-colors line-clamp-2">
                            {event.title}
                          </h3>
                          <p className="text-offwhite/60 text-sm mb-4 line-clamp-3 flex-1">
                            {event.description}
                          </p>
                          <span className="inline-flex items-center gap-2 text-lime text-sm font-medium mt-auto">
                            View gallery
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="reveal-section flex flex-wrap items-center justify-center gap-2 mt-12">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={pageIndex === 1}
                    className="p-2.5 rounded border border-offwhite/20 text-offwhite disabled:opacity-40 disabled:cursor-not-allowed hover:bg-offwhite/10 transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-[2.5rem] px-3 py-2 text-sm font-semibold rounded transition-colors ${
                          pageIndex === page
                            ? 'bg-lime text-forest'
                            : 'text-offwhite/80 hover:bg-offwhite/10 hover:text-offwhite'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={pageIndex === totalPages}
                    className="p-2.5 rounded border border-offwhite/20 text-offwhite disabled:opacity-40 disabled:cursor-not-allowed hover:bg-offwhite/10 transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
