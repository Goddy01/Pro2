
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { apiUrl } from '../lib/api';
import '../App.css';

gsap.registerPlugin(ScrollTrigger);

const INITIAL_VISIBLE = 12;
const LOAD_MORE_STEP = 12;

const FALLBACK_GALLERY = [
  { src: '/media/1.jpg', alt: 'Sideline Sports & Entertainment' },
  { src: '/media/2.jpg', alt: 'Sideline Sports & Entertainment' },
  { src: '/media/3.jpg', alt: 'Sideline Sports & Entertainment' },
  { src: '/media/DSC04893.jpg', alt: 'Sideline Sports & Entertainment' },
  { src: '/media/DSC07660.jpg', alt: 'Sideline Sports & Entertainment' },
  { src: '/media/DSC08405.jpg', alt: 'Sideline Sports & Entertainment' },
];

export default function Gallery() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<{ src: string; alt: string }[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  useEffect(() => {
    fetch(apiUrl('/api/gallery'))
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setImages(data.map((x: { src: string; alt?: string }) => ({ src: x.src, alt: x.alt || 'Sideline Sports & Entertainment' })));
        } else {
          setImages(FALLBACK_GALLERY);
        }
      })
      .catch(() => setImages(FALLBACK_GALLERY));
  }, []);

  const galleryImages = images.length > 0 ? images : FALLBACK_GALLERY;
  const canLoadMore = visibleCount < galleryImages.length;

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
            delay: (i % 12) * 0.08,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 90%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
      gsap.utils.toArray<HTMLElement>('.gallery-card-late').forEach((card, i) => {
        gsap.fromTo(card, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: i * 0.05, ease: 'power3.out' });
      });
    }, mainRef);
    return () => ctx.revert();
  }, [visibleCount]);

  return (
    <div ref={mainRef} className="relative">
      <section className="section-premium py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section text-center mb-16">
            <span className="label-mono text-lime mb-4 block">Gallery</span>
            <h2 className="headline-section text-offwhite text-4xl lg:text-5xl mb-4">
              Inside the Spotlight
            </h2>
            <p className="body-large text-offwhite/60 max-w-2xl mx-auto">
              A curated look at the moments, faces, and stories that define the season.
            </p>
            <p className="body-large text-offwhite/60 max-w-2xl mx-auto mt-4">
              All shots were taken by Sideline Sports &amp; Entertainment Team.
            </p>
          </div>

          <div className="reveal-section grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
            {galleryImages.slice(0, visibleCount).map((image, i) => (
              <figure
                key={i}
                className={`overflow-hidden card-editorial group ${i < INITIAL_VISIBLE ? 'stagger-card' : 'gallery-card-late'}`}
              >
                <div className="relative aspect-[3/4] min-h-[320px]">
                  <img
                    src={image.src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-center img-editorial transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest/85 via-forest/10 to-transparent" />
                </div>
              </figure>
            ))}
          </div>
          {canLoadMore && (
            <div className="reveal-section flex justify-center mt-12">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => Math.min(c + LOAD_MORE_STEP, galleryImages.length))}
                className="bg-lime text-offwhite hover:bg-lime/90 px-6 py-3 font-display font-bold uppercase tracking-[0.2em] rounded-none border-0 transition-colors"
                style={{ textShadow: '0 0 20px rgba(255,255,255,0.4)' }}
              >
                Load more
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
