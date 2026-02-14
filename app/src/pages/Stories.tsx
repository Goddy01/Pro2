import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiUrl } from '../lib/api';
import { encodeArticleId } from '../lib/articleId';
import '../App.css';

gsap.registerPlugin(ScrollTrigger);

type ArticleFromApi = { id: number; title: string; image: string; content: string; category: string; author: string; created_at: string };

function articleExcerpt(html: string, maxLen = 200) {
  const text = (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length <= maxLen ? text : text.slice(0, maxLen) + '…';
}
function articleReadTime(html: string) {
  const text = (html || '').replace(/<[^>]*>/g, '');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

const STORIES_PER_PAGE = 6;

export default function Stories() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [articlesFromApi, setArticlesFromApi] = useState<ArticleFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch(apiUrl('/api/articles'))
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setArticlesFromApi(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const articleCards = articlesFromApi.map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category || 'Features',
    excerpt: articleExcerpt(a.content),
    author: a.author,
    image: a.image,
    readTime: articleReadTime(a.content),
  }));

  const filters = ['All', ...Array.from(new Set(articleCards.map((c) => c.category).filter(Boolean))).sort()];

  const filteredArticles =
    activeFilter === 'All'
      ? articleCards
      : articleCards.filter((card) => card.category === activeFilter);

  const totalPages = Math.ceil(filteredArticles.length / STORIES_PER_PAGE);
  const startIndex = (currentPage - 1) * STORIES_PER_PAGE;
  const paginatedArticles = filteredArticles.slice(startIndex, startIndex + STORIES_PER_PAGE);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

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
  }, [activeFilter, currentPage]);

  return (
    <div ref={mainRef} className="relative">
      <section className="section-light-premium py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section mb-12">
            <span className="label-mono text-forest/60 mb-4 block">Latest</span>
            <h2 className="headline-section text-forest text-4xl mb-6">
              More Stories You'll Love
            </h2>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-3">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wide transition-all duration-300 ${
                    activeFilter === filter
                      ? 'bg-forest text-offwhite'
                      : 'bg-forest/10 text-forest hover:bg-forest/20'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Article Grid */}
          {loading ? (
            <p className="text-forest/60 py-12">Loading stories…</p>
          ) : filteredArticles.length === 0 ? (
            <p className="text-forest/60 py-12">No stories yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {paginatedArticles.map((card) => (
                <Link key={card.id} to={`/stories/${encodeArticleId(card.id)}`} className="stagger-card group block">
                  <article className="cursor-pointer h-full">
                    <div className="bg-offwhite border border-forest/10 overflow-hidden hover:shadow-2xl transition-shadow duration-500 h-full">
                      <div className="relative overflow-hidden h-[220px]">
                        <img
                          src={card.image}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="bg-lime text-forest text-[10px] font-bold uppercase tracking-wider px-2 py-1">
                            {card.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-editorial font-semibold text-forest text-lg mb-3 group-hover:text-forest/70 transition-colors line-clamp-2">
                          {card.title}
                        </h3>
                        <p className="text-forest/60 text-sm mb-4 line-clamp-3">
                          {card.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-forest/40 text-xs">
                          <span>{card.author}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {card.readTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="reveal-section flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-forest/20 text-forest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-forest/10 transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 text-sm font-semibold transition-colors ${
                      currentPage === page
                        ? 'bg-forest text-offwhite'
                        : 'bg-forest/10 text-forest hover:bg-forest/20'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-forest/20 text-forest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-forest/10 transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
