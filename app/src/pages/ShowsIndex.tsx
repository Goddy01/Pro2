import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { apiUrl } from '../lib/api';
import { optimizeImageUrl } from '../lib/images';
import '../App.css';

type ShowCard = {
  slug: string;
  name: string;
  description: string | null;
  hero_image_url: string | null;
  sort_order: number;
};

export default function ShowsIndex() {
  const [shows, setShows] = useState<ShowCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const SHOWS_PER_PAGE = 9;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(apiUrl('/api/shows'))
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        setShows(Array.isArray(data) ? (data as ShowCard[]) : []);
      })
      .catch(() => {
        if (!cancelled) setShows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(() => {
    const list = [...shows];
    list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.name || '').localeCompare(b.name || ''));
    return list;
  }, [shows]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / SHOWS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * SHOWS_PER_PAGE;
  const paged = sorted.slice(start, start + SHOWS_PER_PAGE);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  return (
    <div className="relative">
      <SEO
        title="Shows"
        description="Explore Sideline Sports & Entertainment shows. Click a show to learn more and browse episodes and videos."
        canonicalPath="/shows"
      />
      <section className="section-premium py-24">
        <div className="w-full px-6 lg:px-12 max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="label-mono text-lime mb-4 block">Shows</span>
            <h1 className="headline-section text-offwhite text-4xl lg:text-5xl mb-4">
              Explore our shows
            </h1>
            <p className="body-large text-offwhite/60 max-w-2xl mx-auto">
              Click a show to see its latest episodes, videos, and where to listen.
            </p>
            <div className="h-px w-24 mx-auto bg-offwhite/20 mt-8" aria-hidden />
          </div>

          {loading ? (
            <p className="text-offwhite/60 text-center py-12">Loading…</p>
          ) : sorted.length === 0 ? (
            <p className="text-offwhite/60 text-center py-12">
              No shows are configured yet. Please check back soon.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paged.map((s) => {
                const img = s.hero_image_url
                  ? optimizeImageUrl(s.hero_image_url, { width: 700, quality: 70 })
                  : '';
                return (
                  <Link key={s.slug} to={`/shows/${s.slug}`} className="block group">
                    <article className="card-editorial overflow-hidden bg-offwhite/5 border border-offwhite/10 hover:border-lime/30 transition-colors">
                      {img ? (
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={img}
                            alt=""
                            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-offwhite/5 border-b border-offwhite/10" aria-hidden />
                      )}
                      <div className="p-6">
                        <h2 className="text-offwhite font-display font-bold text-xl mb-2 group-hover:text-lime transition-colors">
                          {s.name}
                        </h2>
                        {s.description ? (
                          <p className="text-offwhite/60 text-sm line-clamp-3">{s.description}</p>
                        ) : (
                          <p className="text-offwhite/50 text-sm">Learn more about this show.</p>
                        )}
                        <div className="mt-5">
                          <span className="btn-outline-premium inline-flex items-center gap-2">
                            View show
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="px-4 py-2 border border-offwhite/30 text-offwhite disabled:opacity-40 disabled:cursor-not-allowed hover:border-lime hover:text-lime transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-offwhite/70 text-sm">
                    Page {safePage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="px-4 py-2 border border-offwhite/30 text-offwhite disabled:opacity-40 disabled:cursor-not-allowed hover:border-lime hover:text-lime transition-colors"
                  >
                    Next
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

