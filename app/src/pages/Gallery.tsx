import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronLeft } from 'lucide-react';
import { apiUrl } from '../lib/api';
import '../App.css';

gsap.registerPlugin(ScrollTrigger);

const INITIAL_VISIBLE = 12;
const LOAD_MORE_STEP = 12;
const LCP_IMAGE_COUNT = 3;

const DEFAULT_ALT = 'Sideline Sports & Entertainment';

type GalleryCategory = {
  id: number;
  name: string;
  slug: string;
  coverImageUrl: string | null;
  sortOrder: number;
  imageCount: number;
};

export default function Gallery() {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const mainRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [images, setImages] = useState<{ src: string; alt: string }[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const gridTriggerCreated = useRef(false);
  const prevVisibleRef = useRef(INITIAL_VISIBLE);

  const isCategoryView = categorySlug != null && categorySlug !== '';
  const isAllView = categorySlug === 'all';

  // Fetch categories: on gallery landing, or when viewing a category (to show name in title)
  useEffect(() => {
    fetch(apiUrl('/api/gallery/categories'))
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(
            data.map((c: { id: number; name: string; slug: string; coverImageUrl?: string | null; sortOrder?: number; imageCount?: number }) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              coverImageUrl: c.coverImageUrl ?? null,
              sortOrder: c.sortOrder ?? 0,
              imageCount: c.imageCount ?? 0,
            }))
          );
        } else setCategories([]);
      })
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false));
  }, []);

  // Fetch images when viewing a category or "all"
  useEffect(() => {
    if (!isCategoryView) return;
    const url = isAllView ? apiUrl('/api/gallery') : apiUrl(`/api/gallery?category=${encodeURIComponent(categorySlug!)}`);
    queueMicrotask(() => setImagesLoading(true));
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data)
          ? data.map((x: { src: string; alt?: string }) => ({ src: x.src, alt: x.alt || DEFAULT_ALT }))
          : [];
        setImages(list);
        setVisibleCount(INITIAL_VISIBLE);
        prevVisibleRef.current = INITIAL_VISIBLE;
      })
      .catch(() => setImages([]))
      .finally(() => setImagesLoading(false));
  }, [isCategoryView, isAllView, categorySlug]);

  const galleryImages = useMemo(() => images, [images]);
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
  }, [visibleCount, galleryImages.length]);

  // Category cards view (gallery landing)
  if (!isCategoryView) {
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

            {categoriesLoading ? (
              <div className="reveal-section text-center text-offwhite/60 py-12">Loading…</div>
            ) : categories.length === 0 ? (
              <div className="reveal-section text-center text-offwhite/60 py-12">
                No gallery categories yet. Add categories and photos in the admin.
              </div>
            ) : (
              <>
                <div className="reveal-section grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
                  <Link
                    to="/gallery/all"
                    className="overflow-hidden card-editorial group block focus:outline-none focus-visible:ring-2 focus-visible:ring-lime"
                  >
                    <div className="relative aspect-[3/4] min-h-[240px] bg-offwhite/10">
                      <div className="absolute inset-0 flex items-center justify-center text-offwhite/80 text-lg font-medium">
                        All photos
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-forest/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-4 bg-forest/30 border border-offwhite/5 border-t-0">
                      <span className="label-mono text-lime text-xs">Browse all</span>
                      <h3 className="headline-article text-offwhite text-xl mt-1 group-hover:text-lime transition-colors">
                        All photos
                      </h3>
                    </div>
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/gallery/${cat.slug}`}
                      className="overflow-hidden card-editorial group block focus:outline-none focus-visible:ring-2 focus-visible:ring-lime"
                    >
                      <div className="relative aspect-[3/4] min-h-[240px]">
                        <img
                          src={cat.coverImageUrl || '/team.jpg'}
                          alt=""
                          className="w-full h-full object-cover object-center img-editorial transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-forest/85 via-forest/20 to-transparent" />
                      </div>
                      <div className="p-4 bg-forest/30 border border-offwhite/5 border-t-0">
                        <span className="label-mono text-lime text-xs">{cat.imageCount} photo{cat.imageCount !== 1 ? 's' : ''}</span>
                        <h3 className="headline-article text-offwhite text-xl mt-1 group-hover:text-lime transition-colors">
                          {cat.name}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    );
  }

  // Image grid view (category or "all")
  const title = isAllView ? 'All photos' : (categories.find((c) => c.slug === categorySlug)?.name ?? categorySlug ?? 'Gallery');

  return (
    <div ref={mainRef} className="relative">
      <section className="section-premium py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section mb-8">
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm mb-6"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to gallery
            </Link>
            <h2 className="headline-section text-offwhite text-3xl lg:text-4xl">
              {title}
            </h2>
          </div>

          {imagesLoading ? (
            <div className="reveal-section text-center text-offwhite/60 py-12">Loading…</div>
          ) : galleryImages.length === 0 ? (
            <div className="reveal-section text-center text-offwhite/60 py-12">No photos in this category yet.</div>
          ) : (
            <>
              <div
                className="reveal-section grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10"
                data-gallery-grid
              >
                {galleryImages.slice(0, visibleCount).map((image, i) => (
                  <figure key={`${image.src}-${i}`} className="overflow-hidden card-editorial group">
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
            </>
          )}
        </div>
      </section>
    </div>
  );
}
