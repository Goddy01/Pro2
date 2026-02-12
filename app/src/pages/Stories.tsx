import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import '../App.css';

gsap.registerPlugin(ScrollTrigger);

const filters = ['All', 'Features', 'Podcast', 'Events'];

const articleCards = [
  {
    id: 4,
    title: 'Preview Show Ep. 12: Playoffs, Predictions, and Guest Takes',
    category: 'Podcast',
    excerpt: "This week, we're joined by former Pro Bowl linebacker Marcus Williams to break down the playoff picture. We discuss the teams that surprised us, the ones that disappointed, and make our bold predictions for the road to the championship. Plus, we answer listener questions about the biggest storylines heading into the postseason.",
    author: 'Sideline Sports & Entertainment Team',
    image: '/grid_4.jpg',
    date: 'January 10, 2026',
    readTime: '45 min listen',
  },
  {
    id: 5,
    title: 'Photo Essay: Under the Lights — Moments From the Night Game',
    category: 'Events',
    excerpt: "There's something magical about night games. The stadium lights cutting through the darkness, the breath visible in the cold air, the roar of the crowd echoing into the night. Our photography team spent the entire game capturing the moments that define why we love this sport — the tension, the joy, the heartbreak, and the triumph.",
    author: 'Sarah Chen',
    authorRole: 'Photo Editor',
    image: '/grid_5.jpg',
    date: 'January 8, 2026',
    readTime: '6 min read',
  },
  {
    id: 6,
    title: 'By the Numbers: What the Defense Stats Actually Say',
    category: 'Analysis',
    excerpt: "Traditional statistics tell one story, but advanced analytics reveal another. We dove deep into the data — pressure rates, coverage grades, tackling efficiency, and more — to understand why this defense has been so effective. The numbers might surprise you, and they definitely challenge some conventional wisdom.",
    author: 'David Park',
    authorRole: 'Analytics Director',
    image: '/grid_6.jpg',
    date: 'January 5, 2026',
    readTime: '10 min read',
  },
  {
    id: 7,
    title: 'The Rookie Report: Breaking Down Week 1 Standouts',
    category: 'Features',
    excerpt: 'From first-round picks to undrafted free agents, Week 1 delivered some unforgettable rookie performances. We break down the film, analyze the stats, and speak with coaches who saw these players develop throughout training camp.',
    author: 'Jordan Thomas',
    authorRole: 'Senior NFL Analyst',
    image: '/grid_1.jpg',
    date: 'January 4, 2026',
    readTime: '14 min read',
  },
  {
    id: 8,
    title: 'Film Room: How the Offense Exploited the Secondary',
    category: 'Video',
    excerpt: 'In this week\'s film breakdown, we examine how the offensive coordinator identified and exploited weaknesses in the opposing secondary. Using All-22 footage, we show you the exact plays that changed the game.',
    author: 'Maya Rodriguez',
    authorRole: 'Staff Writer',
    image: '/grid_2.jpg',
    date: 'January 3, 2026',
    readTime: '9 min read',
  },
  {
    id: 9,
    title: 'Trade Deadline Special: Winners, Losers, and What\'s Next',
    category: 'Analysis',
    excerpt: 'The trade deadline reshaped multiple franchises. We analyze every major move, from blockbuster deals to under-the-radar acquisitions, and predict how these changes will impact the playoff race.',
    author: 'David Park',
    authorRole: 'Analytics Director',
    image: '/grid_3.jpg',
    date: 'January 2, 2026',
    readTime: '11 min read',
  },
  {
    id: 10,
    title: 'Inside the Locker Room: Post-Game Reactions',
    category: 'Features',
    excerpt: 'Raw emotion, unfiltered quotes, and the moments you didn\'t see on television. Our team was granted exclusive access to capture the immediate aftermath of one of the season\'s most dramatic finishes.',
    author: 'Sarah Chen',
    authorRole: 'Photo Editor',
    image: '/grid_4.jpg',
    date: 'December 30, 2025',
    readTime: '7 min read',
  },
  {
    id: 11,
    title: 'The Evolution of the Passing Game',
    category: 'Analysis',
    excerpt: 'How has the modern passing attack evolved over the past decade? We dive into the data, speak with quarterbacks and coordinators, and examine the strategic shifts that have revolutionized offensive football.',
    author: 'Jordan Thomas',
    authorRole: 'Senior NFL Analyst',
    image: '/grid_5.jpg',
    date: 'December 28, 2025',
    readTime: '16 min read',
  },
  {
    id: 12,
    title: 'Draft Day Memories: Stories from the Green Room',
    category: 'Features',
    excerpt: 'The anticipation, the nerves, the life-changing moment when your name is called. We spoke with five players about their draft day experiences, from the first round to the final picks.',
    author: 'Maya Rodriguez',
    authorRole: 'Staff Writer',
    image: '/grid_6.jpg',
    date: 'December 26, 2025',
    readTime: '12 min read',
  },
  {
    id: 13,
    title: 'Practice Report: What We Learned This Week',
    category: 'Video',
    excerpt: 'From injury updates to position battles, our practice observations provide insights into what to expect on game day. Plus, exclusive interviews with players and coaches.',
    author: 'Sideline Sports & Entertainment Team',
    image: '/grid_1.jpg',
    date: 'December 24, 2025',
    readTime: '5 min read',
  },
  {
    id: 14,
    title: 'The Culture Shift: How This Team Built a Winning Foundation',
    category: 'Features',
    excerpt: 'It wasn\'t always this way. Through interviews with players, coaches, and front office personnel, we trace the transformation of a franchise from perennial disappointment to championship contender.',
    author: 'Sarah Chen',
    authorRole: 'Photo Editor',
    image: '/grid_2.jpg',
    date: 'December 22, 2025',
    readTime: '18 min read',
  },
  {
    id: 15,
    title: 'Advanced Metrics: Understanding Player Value',
    category: 'Analysis',
    excerpt: 'Beyond traditional stats, advanced metrics reveal player contributions that don\'t show up in box scores. We break down the formulas, explain the methodology, and show you which players are undervalued.',
    author: 'David Park',
    authorRole: 'Analytics Director',
    image: '/grid_3.jpg',
    date: 'December 20, 2025',
    readTime: '13 min read',
  },
  {
    id: 16,
    title: 'The Road to Recovery: An Athlete\'s Journey Back',
    category: 'Features',
    excerpt: 'After a devastating injury threatened to end his career, one player\'s determination and the support of his team led to an inspiring comeback. This is his story.',
    author: 'Jordan Thomas',
    authorRole: 'Senior NFL Analyst',
    image: '/grid_4.jpg',
    date: 'December 18, 2025',
    readTime: '15 min read',
  },
];

const STORIES_PER_PAGE = 6; // 2 rows × 3 columns on large screens

export default function Stories() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {paginatedArticles.map((card) => (
              <article key={card.id} className="stagger-card group cursor-pointer">
                <div className="bg-offwhite border border-forest/10 overflow-hidden hover:shadow-2xl transition-shadow duration-500">
                  <div className="relative overflow-hidden h-[220px]">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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
            ))}
          </div>

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
