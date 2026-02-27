import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiUrl } from '../lib/api';
import SEO from '../components/SEO';
import '../App.css';

gsap.registerPlugin(ScrollTrigger);

const INITIAL_VISIBLE = 12;
const LOAD_MORE_STEP = 12;
const LCP_IMAGE_COUNT = 3;
const CATEGORIES_PER_PAGE = 9;

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
  const [categoryPage, setCategoryPage] = useState(1);
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

  const categoryTotalPages = Math.max(1, Math.ceil(categories.length / CATEGORIES_PER_PAGE));
  const categorySafePage = Math.min(categoryPage, categoryTotalPages);
  const categoryStart = (categorySafePage - 1) * CATEGORIES_PER_PAGE;
  const pageCategories = categories.slice(categoryStart, categoryStart + CATEGORIES_PER_PAGE);

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
        <SEO
          title="Media Gallery"
          description="Browse photos and media from Sideline Sports & Entertainment events, games, and coverage."
          canonicalPath="/gallery"
        />
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
                  {pageCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/gallery/${cat.slug}`}
                      className="overflow-hidden card-editorial gallery-category-card group block focus:outline-none focus-visible:ring-2 focus-visible:ring-lime"
                    >
                      <div className="relative aspect-[3/4] min-h-[240px] overflow-hidden">
                        <img
                          src={cat.coverImageUrl || '/team.jpg'}
                          alt=""
                          className="block w-full h-full object-cover object-center img-editorial transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-forest/85 via-forest/20 to-transparent pointer-events-none" />
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
                {categories.length > CATEGORIES_PER_PAGE && (
                  <div className="reveal-section mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-offwhite/10 pt-8">
                    <p className="text-offwhite/60 text-sm">
                      Showing {categoryStart + 1}–{Math.min(categoryStart + CATEGORIES_PER_PAGE, categories.length)} of {categories.length} categories
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCategoryPage((p) => Math.max(1, p - 1))}
                        disabled={categorySafePage <= 1}
                        className="p-2 text-offwhite/70 hover:text-lime disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-lime"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-offwhite/90 text-sm min-w-[7rem] text-center">
                        Page {categorySafePage} of {categoryTotalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCategoryPage((p) => Math.min(categoryTotalPages, p + 1))}
                        disabled={categorySafePage >= categoryTotalPages}
                        className="p-2 text-offwhite/70 hover:text-lime disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-lime"
                        aria-label="Next page"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
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
      <SEO
        title={isAllView ? 'All Photos' : (categories.find((c) => c.slug === categorySlug)?.name ?? 'Gallery')}
        description={isAllView ? 'All event photos and media from Sideline Sports & Entertainment.' : `Photos and media: ${categories.find((c) => c.slug === categorySlug)?.name ?? categorySlug}.`}
        canonicalPath={categorySlug ? `/gallery/${categorySlug}` : '/gallery'}
      />
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
