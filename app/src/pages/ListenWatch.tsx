import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { apiUrl } from '../lib/api';
import { optimizeImageUrl } from '../lib/images';
import SEO from '../components/SEO';
import '../App.css';

type ShowCard = {
  slug: string;
  name: string;
  description: string | null;
  hero_image_url: string | null;
  sort_order: number;
};

export default function ListenWatch() {
  const [shows, setShows] = useState<ShowCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const q = searchQuery.trim().toLowerCase();
  const filtered = useMemo(() => {
    const list = [...shows];
    list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.name || '').localeCompare(b.name || ''));
    if (!q) return list;
    return list.filter((s) => {
      const hay = `${s.name || ''} ${s.description || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [shows, q]);

  return (
    <div className="relative">
      <SEO
        title="Listen & Watch"
        description="Explore Sideline Sports & Entertainment shows. Click a show to learn more and browse episodes and videos."
        canonicalPath="/listen-watch"
      />
      <section className="section-premium py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="text-center mb-16">
            <span className="label-mono text-lime mb-4 block">Listen & Watch</span>
            <h1 className="headline-section text-offwhite text-4xl lg:text-5xl mb-4">
              Explore our shows
            </h1>
            <p className="body-large text-offwhite/60 max-w-2xl mx-auto">
              Each show has its own page with episodes, videos, and where to listen.
            </p>
            <div className="mt-8 max-w-md mx-auto">
              <label htmlFor="listen-watch-search" className="sr-only">Search shows</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-offwhite/50" aria-hidden />
                <input
                  id="listen-watch-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search shows…"
                  className="w-full pl-10 pr-4 py-3 bg-offwhite/5 border border-offwhite/20 text-offwhite placeholder:text-offwhite/50 focus:outline-none focus:border-lime"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-offwhite/60 text-center py-12">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-offwhite/60 text-center py-12">
              {q ? 'No shows match your search.' : 'No shows are configured yet. Check back soon.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((s) => {
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
          )}
        </div>
      </section>
    </div>
  );
}
