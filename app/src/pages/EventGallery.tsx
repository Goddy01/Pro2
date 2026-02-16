import { useEffect, useRef, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { apiUrl } from '../lib/api';
import '../App.css';

gsap.registerPlugin(ScrollTrigger);

const INITIAL_IMAGE_COUNT = 3;

type EventData = { id: string; title: string; description: string; images: string[] };

export default function EventGallery() {
  const { eventId } = useParams<{ eventId: string }>();
  const mainRef = useRef<HTMLDivElement>(null);
  const [showAll, setShowAll] = useState(false);
  const [event, setEvent] = useState<EventData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(apiUrl(`/api/events/${eventId}`))
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((data) => {
        const images = Array.isArray(data.images) ? data.images : data.images ? [data.images] : [];
        setEvent({
          id: data.id ?? eventId,
          title: data.title ?? '',
          description: data.description ?? '',
          images,
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    if (!event || !mainRef.current) return;
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
      gsap.utils.toArray<HTMLElement>('.event-image-card').forEach((card, i) => {
        gsap.fromTo(
          card,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            delay: i * 0.06,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 92%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, mainRef);
    return () => ctx.revert();
  }, [event, showAll]);

  if (notFound) return <Navigate to="/events" replace />;
  if (loading || !event) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-offwhite/60">Loading event…</p>
      </div>
    );
  }

  const images = Array.isArray(event.images) ? event.images : [];
  const imagesToShow = showAll ? images : images.slice(0, INITIAL_IMAGE_COUNT);
  const hasMore = images.length > INITIAL_IMAGE_COUNT;

  return (
    <div ref={mainRef} className="relative">
      <section className="section-premium py-24">
        <div className="w-full px-6 lg:px-12 max-w-7xl mx-auto">
          <div className="reveal-section mb-10">
            <Link
              to="/coverage"
              className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm font-medium mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Coverage
            </Link>
            <span className="label-mono text-lime mb-2 block">Event Gallery</span>
            <h1 className="headline-section text-offwhite text-3xl lg:text-4xl mb-4">
              {event.title}
            </h1>
            <p className="body-large text-offwhite/60 max-w-2xl">
              {event.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {imagesToShow.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className="event-image-card overflow-hidden rounded-sm border border-offwhite/10 bg-offwhite/5 aspect-[4/3] min-h-[280px] group"
              >
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="reveal-section mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                className="btn-premium inline-flex items-center gap-2"
              >
                {showAll ? (
                  <>
                    Show less
                    <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    View more
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
