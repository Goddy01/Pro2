import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { apiUrl } from '../lib/api';
import '../App.css';

gsap.registerPlugin(ScrollTrigger);

const INITIAL_VISIBLE = 12;
const LOAD_MORE_STEP = 12;
const LCP_IMAGE_COUNT = 3; // first N images get high fetch priority

const DEFAULT_ALT = 'Sideline Sports & Entertainment';

/** All images in app/public/media/ – shown in gallery alongside admin-uploaded images */
const STATIC_MEDIA_IMAGES: { src: string; alt: string }[] = [
  '1.jpg', '2.jpg', '3.jpg',
  '1532646176157624422.jpg', '2359157038716308892.jpg', '2692397244325096066.jpg',
  '2761035603652569794.jpg', '2772238397044479159.jpg', '2899172770795387.jpg',
  '3510623865048350093.jpg', '3825053133675075935.jpg', '4044688110347809626.jpg',
  '4142831271204609322.jpg', '5990357541264182351.jpg', '7054099196915847454.jpg',
  '8236872768832652205.jpg', '8430488630247374580.jpg', '8688937658204051989.jpg',
  '9211792278450370841.jpg',
  'DSC00013-3.jpg', 'DSC00073.jpg', 'DSC04893.jpg', 'DSC07660.jpg', 'DSC08405.jpg',
  'DSC09404.jpg', 'DSC09569-3.jpg',
  '_DSC1198-Enhanced-NR.jpg', '_DSC1723-Enhanced-NR.jpg', '_DSC1887-Enhanced-NR.jpg',
  '_DSC1934-Enhanced-NR.jpg', '_DSC2074-Enhanced-NR.jpg', '_DSC2546-Enhanced-NR.jpg',
  '_DSC2661-Enhanced-NR.jpg', '_DSC2783-Enhanced-NR.jpg', '_DSC3101-Enhanced-NR 2.jpg',
  '_DSC4127-Enhanced-NR.jpg', '_DSC4274-Enhanced-NR.jpg', '_DSC5631-Enhanced-NR.jpg',
  '_DSC5750-Enhanced-NR.jpg', '_DSC8587-Enhanced-NR.jpg',
].map((file) => ({ src: `/media/${file}`, alt: DEFAULT_ALT }));

export default function Gallery() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<{ src: string; alt: string }[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const gridTriggerCreated = useRef(false);
  const prevVisibleRef = useRef(INITIAL_VISIBLE);

  useEffect(() => {
    const ac = new AbortController();
    fetch(apiUrl('/api/gallery'), { signal: ac.signal })
      .then((r) => r.json())
      .then((data) => {
        const fromApi = Array.isArray(data)
          ? data.map((x: { src: string; alt?: string }) => ({ src: x.src, alt: x.alt || DEFAULT_ALT }))
          : [];
        setImages([...fromApi, ...STATIC_MEDIA_IMAGES]);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') setImages(STATIC_MEDIA_IMAGES);
      });
    return () => ac.abort();
  }, []);

  const galleryImages = useMemo(
    () => (images.length > 0 ? images : STATIC_MEDIA_IMAGES),
    [images]
  );
  const canLoadMore = visibleCount < galleryImages.length;

  useEffect(() => {
    const ctx = gsap.context(() => {
      const el = mainRef.current;
      if (!el) return;

      gsap.utils.toArray<HTMLElement>('.reveal-section', el).forEach((section) => {
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

      const grid = el.querySelector<HTMLElement>('[data-gallery-grid]');
      const children = grid ? (Array.from(grid.children) as HTMLElement[]) : [];

      if (grid && !gridTriggerCreated.current && children.length >= INITIAL_VISIBLE) {
        gridTriggerCreated.current = true;
        ScrollTrigger.create({
          trigger: grid,
          start: 'top 88%',
          once: true,
          onEnter: () => {
            const initial = children.slice(0, INITIAL_VISIBLE);
            gsap.fromTo(
              initial,
              { y: 60, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out' }
            );
          },
        });
      }

      if (visibleCount > prevVisibleRef.current && children.length >= visibleCount) {
        const newBatch = children.slice(prevVisibleRef.current, visibleCount);
        gsap.fromTo(
          newBatch,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out' }
        );
        prevVisibleRef.current = visibleCount;
      }
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

          <div
            className="reveal-section grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10"
            data-gallery-grid
          >
            {galleryImages.slice(0, visibleCount).map((image, i) => (
              <figure key={image.src} className="overflow-hidden card-editorial group">
                <div className="relative aspect-[3/4] min-h-[320px]">
                  <img
                    src={image.src}
                    alt={image.alt}
                    loading={i < LCP_IMAGE_COUNT ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={i < LCP_IMAGE_COUNT ? 'high' : undefined}
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
