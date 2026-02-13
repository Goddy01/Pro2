import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { EVENTS } from '../data/events';
import '../App.css';

gsap.registerPlugin(ScrollTrigger);

const PREVIEW_IMAGES = 3;

export default function Events() {
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
        <div className="w-full px-6 lg:px-12 max-w-7xl mx-auto">
          <div className="reveal-section mb-16 text-center">
            <span className="label-mono text-lime mb-4 block">Event Galleries</span>
            <h2 className="headline-section text-offwhite text-4xl lg:text-5xl mb-4">
              Event Coverage Galleries
            </h2>
            <p className="body-large text-offwhite/60 max-w-2xl mx-auto">
              Photo galleries from the events we've covered — from community initiatives to Super Bowl exclusives.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {EVENTS.map((event) => {
              const previewImages = event.images.slice(0, PREVIEW_IMAGES);
              return (
                <div
                  key={event.id}
                  className="stagger-card flex flex-col bg-offwhite/5 border border-offwhite/10 overflow-hidden"
                >
                  <div className="p-6 lg:p-8">
                    <h3 className="headline-article text-offwhite text-xl lg:text-2xl mb-2">
                      {event.title}
                    </h3>
                    <p className="body-large text-offwhite/60 mb-6">
                      {event.description}
                    </p>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {previewImages.map((src, i) => (
                        <div key={i} className="aspect-[4/3] overflow-hidden rounded-sm bg-offwhite/10 group">
                          <img
                            src={src}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      ))}
                    </div>
                    <Link
                      to={`/coverage/event/${event.id}`}
                      className="btn-premium inline-flex items-center gap-2"
                    >
                      View more
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
