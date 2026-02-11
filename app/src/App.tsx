import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Play, ArrowRight, Youtube, Instagram, 
  Twitter, Podcast, 
  Headphones, Clock, 
  Calendar, User, Bookmark, Share2,
  Star, Zap, ArrowUpRight, Menu, X
} from 'lucide-react';
import './App.css';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const filters = ['All', 'Features', 'Video', 'Podcast', 'Events', 'Analysis'];

  const marqueeFeeds = [
    {
      source: 'NFL.com',
      url: 'https://www.nfl.com/?format=rss',
    },
    {
      source: 'ESPN NFL',
      url: 'https://www.espn.com/espn/rss/nfl/news',
    },
    {
      source: 'CBS Sports NFL',
      url: 'https://www.cbssports.com/rss/headlines/nfl',
    },
    {
      source: 'Reuters Sports',
      url: 'https://www.reutersagency.com/feed/?best-topics=sports&post_type=best',
    },
  ];

  const marqueeKeywords = [
    'super bowl',
    'nfl draft',
    'draft',
    'combine',
    'scouting combine',
    'hall of fame',
  ];

  const fallbackMarqueeFeeds = [
    {
      source: 'ESPN Top Headlines',
      url: 'https://www.espn.com/espn/rss/news',
    },
    {
      source: 'Yahoo Sports',
      url: 'https://sports.yahoo.com/rss/',
    },
    {
      source: 'Sports Illustrated',
      url: 'https://www.si.com/rss/si_topstories.rss',
    },
  ];

  const [marqueeItems, setMarqueeItems] = useState<{ title: string; source: string }[]>([]);
  const [marqueeReady, setMarqueeReady] = useState(false);

  const marqueeDisplayItems = (() => {
    const items = marqueeItems.length > 0 ? [...marqueeItems] : [];
    if (items.length === 0) {
      return [];
    }
    while (items.length < 10) {
      items.push(items[items.length % marqueeItems.length]);
    }
    return items.slice(0, 10);
  })();

  const marqueeLoopItems = [...marqueeDisplayItems, ...marqueeDisplayItems];

  const featuredArticles = [
    {
      id: 1,
      title: 'The Trade That Makes Sense: Breaking Down the Fit, the Risk, and the Ceiling',
      category: 'Analysis',
      excerpt: 'When the rumors started swirling about a potential blockbuster trade, most fans dismissed it as offseason speculation. But beneath the surface, the pieces were falling into place. We spent three weeks analyzing film, speaking with sources close to the organization, and examining the salary cap implications to understand why this move could redefine the franchise\'s trajectory.',
      author: 'Jordan Thomas',
      authorRole: 'Senior NBA Analyst',
      image: '/article-1-image.jpg',
      date: 'January 15, 2026',
      readTime: '12 min read',
      featured: true
    },
    {
      id: 2,
      title: 'Inside the Facility: A Day With the Team Behind the Team',
      category: 'Features',
      excerpt: 'At 4:47 AM, while most of the city sleeps, the facility comes alive. Trainers, analysts, and support staff begin their meticulous preparation for another day of professional sports. We were granted unprecedented access to document the invisible army that keeps a championship-caliber organization running.',
      author: 'Maya Rodriguez',
      authorRole: 'Staff Writer',
      image: '/grid_2.jpg',
      date: 'January 14, 2026',
      readTime: '18 min read',
      featured: true
    },
    {
      id: 3,
      title: 'Postgame: Week 4 — Highlights, Quotes, and What\'s Next',
      category: 'Video',
      excerpt: 'The locker room was unusually quiet after the game. Players sat in their stalls, some staring at their phones, others engaging in hushed conversations with position coaches. But when the media entered, the tone shifted. We captured the raw emotion, the unfiltered quotes, and the first signs of what this team might become.',
      author: 'Jordan Thomas',
      authorRole: 'Senior NFL Analyst',
      image: '/grid_3.jpg',
      date: 'January 12, 2026',
      readTime: '8 min read',
      featured: false
    }
  ];

  const articleCards = [
    { 
      id: 4, 
      title: 'Preview Show Ep. 12: Playoffs, Predictions, and Guest Takes', 
      category: 'Podcast', 
      excerpt: 'This week, we\'re joined by former Pro Bowl linebacker Marcus Williams to break down the playoff picture. We discuss the teams that surprised us, the ones that disappointed, and make our bold predictions for the road to the championship. Plus, we answer listener questions about the biggest storylines heading into the postseason.',
      author: 'Sideline Sports Network Team',
      image: '/grid_4.jpg', 
      date: 'January 10, 2026', 
      readTime: '45 min listen'
    },
    { 
      id: 5, 
      title: 'Photo Essay: Under the Lights — Moments From the Night Game', 
      category: 'Events', 
      excerpt: 'There\'s something magical about night games. The stadium lights cutting through the darkness, the breath visible in the cold air, the roar of the crowd echoing into the night. Our photography team spent the entire game capturing the moments that define why we love this sport — the tension, the joy, the heartbreak, and the triumph.',
      author: 'Sarah Chen',
      authorRole: 'Photo Editor',
      image: '/grid_5.jpg', 
      date: 'January 8, 2026', 
      readTime: '6 min read'
    },
    { 
      id: 6, 
      title: 'By the Numbers: What the Defense Stats Actually Say', 
      category: 'Analysis', 
      excerpt: 'Traditional statistics tell one story, but advanced analytics reveal another. We dove deep into the data — pressure rates, coverage grades, tackling efficiency, and more — to understand why this defense has been so effective. The numbers might surprise you, and they definitely challenge some conventional wisdom.',
      author: 'David Park',
      authorRole: 'Analytics Director',
      image: '/grid_6.jpg', 
      date: 'January 5, 2026', 
      readTime: '10 min read'
    },
  ];

  const podcastEpisodes = [
    {
      id: 1,
      title: 'The Preview Show: Championship Week Breakdown',
      description: 'We break down both championship games with former players, coaches, and our panel of analysts. Who has the edge? What matchups will decide the games? And what can we expect on the biggest stage?',
      duration: '1:12:34',
      guests: ['Marcus Williams', 'Coach Tony Dungy'],
      date: 'Jan 18, 2026'
    },
    {
      id: 2,
      title: 'Recruiting Insider: National Signing Day Special',
      description: 'National Signing Day is here, and we\'ve got the inside scoop on the biggest commitments, the surprises, and what it all means for next season. Our recruiting analysts break down every major program\'s class.',
      duration: '58:21',
      guests: ['Mike Farrell', 'Adam Gorney'],
      date: 'Jan 15, 2026'
    },
    {
      id: 3,
      title: 'Film Room: Breaking Down the Play That Changed Everything',
      description: 'One play. That\'s all it took. We go frame by frame through the most important play of the season, analyzing the pre-snap reads, the execution, and why it worked. Essential viewing for any serious fan.',
      duration: '42:15',
      guests: ['Greg Cosell'],
      date: 'Jan 12, 2026'
    }
  ];

  const teamMembers = [
    {
      name: 'Jordan Thomas',
      role: 'Founder & Editor-in-Chief',
      bio: 'Former sports journalist with over 15 years covering the NFL, NBA, and college sports. Previously wrote for ESPN, The Athletic, and Sports Illustrated.',
      image: '/about_portrait.jpg'
    },
    {
      name: 'Maya Rodriguez',
      role: 'Senior Writer',
      bio: 'Award-winning journalist specializing in long-form features and investigative reporting. Pulitzer Prize nominee for her series on athlete activism.',
      image: '/podcast_cover.jpg'
    },
    {
      name: 'David Park',
      role: 'Analytics Director',
      bio: 'Former data scientist with a passion for sports analytics. Brings a numbers-driven approach to understanding the games we love.',
      image: '/stats_action.jpg'
    }
  ];

  const testimonials = [
    {
      quote: 'Sideline Sports Network has become essential reading for me. The depth of analysis, the quality of writing, and the unique perspectives set it apart from everything else in sports media.',
      author: 'Michael Smith',
      role: 'ESPN Host'
    },
    {
      quote: 'Finally, sports journalism that respects the intelligence of its audience. These aren\'t just game recaps — they\'re stories that matter.',
      author: 'Sarah Koenig',
      role: 'Journalist'
    },
    {
      quote: 'The attention to detail is remarkable. Whether it\'s a breaking news story or a deep dive feature, you know it\'s going to be thorough and well-researched.',
      author: 'Bill Simmons',
      role: 'The Ringer'
    }
  ];

  const filteredArticles = activeFilter === 'All' 
    ? articleCards 
    : articleCards.filter(card => card.category === activeFilter);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance animation
      const heroTl = gsap.timeline();
      
      heroTl.fromTo('.hero-headline', 
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' }
      )
      .fromTo('.hero-subheadline',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
        '-=0.7'
      )
      .fromTo('.hero-cta-group',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
        '-=0.5'
      )
      .fromTo('.hero-stats',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' },
        '-=0.3'
      );

      // Section reveal animations
      gsap.utils.toArray<HTMLElement>('.reveal-section').forEach((section) => {
        gsap.fromTo(section,
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
            }
          }
        );
      });

      // Card stagger animations
      gsap.utils.toArray<HTMLElement>('.stagger-card').forEach((card, i) => {
        gsap.fromTo(card,
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
            }
          }
        );
      });

      // Stats counter animation
      ScrollTrigger.create({
        trigger: '.stats-section',
        start: 'top 75%',
        onEnter: () => {
          gsap.to('.stat-number', {
            innerText: (i: number) => [120, 48, 2][i],
            duration: 2.5,
            snap: { innerText: 1 },
            ease: 'power2.out',
          });
        },
        once: true,
      });

    }, mainRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchMarqueeItems = async () => {
      const fetchFeeds = async (feeds: { source: string; url: string }[]) => {
        const responses = await Promise.all(
          feeds.map(async (feed) => {
            const response = await fetch(
              `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`,
              { signal: controller.signal }
            );
            if (!response.ok) {
              return [];
            }
            const data = await response.json();
            if (!data || !Array.isArray(data.items)) {
              return [];
            }
            return data.items.map((item: { title?: string }) => ({
              title: item.title ?? '',
              source: feed.source,
            }));
          })
        );

        const merged = responses
          .flat()
          .map((item) => ({
            ...item,
            title: item.title.trim(),
          }))
          .filter((item) => item.title.length > 0);

        if (merged.length === 0) {
          return [];
        }

        const keywordRegex = new RegExp(marqueeKeywords.join('|'), 'i');
        const filtered = merged.filter((item) => keywordRegex.test(item.title));

        return (filtered.length > 0 ? filtered : merged).slice(0, 10);
      };

      try {
        const primaryItems = await fetchFeeds(marqueeFeeds);
        const fallbackItems = primaryItems.length === 0 ? await fetchFeeds(fallbackMarqueeFeeds) : [];
        const combined = primaryItems.length > 0 ? primaryItems : fallbackItems;
        const unique = Array.from(
          new Map(combined.map((item) => [item.title.toLowerCase(), item])).values()
        );

        setMarqueeItems(unique);
        setMarqueeReady(true);
      } catch (error) {
        if (!controller.signal.aborted) {
          const fallbackItems = await fetchFeeds(fallbackMarqueeFeeds);
          setMarqueeItems(fallbackItems);
          setMarqueeReady(true);
        }
      }
    };

    fetchMarqueeItems();
    const refreshId = setInterval(fetchMarqueeItems, 5 * 60 * 1000);

    return () => {
      clearInterval(refreshId);
      controller.abort();
    };
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
        setSubscribed(false);
      }, 4000);
    }
  };

  return (
    <div ref={mainRef} className="relative">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-forest/95 backdrop-blur-md border-b border-offwhite/5">
        <div className="px-6 lg:px-12 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="/logo-180.png"
              alt="Sideline Sports Network logo"
              className="w-10 h-10 object-contain"
            />
            <span className="text-lime font-editorial font-black text-2xl italic">Sideline Sports Network</span>
            {/* <span className="text-offwhite font-sans font-semibold text-sm uppercase tracking-[0.2em]"></span> */}
          </div>
          
          <div className="hidden lg:flex items-center gap-10">
            {['Articles', 'Watch', 'Listen', 'Events', 'Media', 'Team', 'About', 'Contact'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className="text-offwhite/60 hover:text-lime text-sm font-medium tracking-wide transition-colors duration-300"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <a href="#subscribe" className="hidden sm:inline-flex btn-premium text-xs py-3 px-6">
              Subscribe
            </a>
            <button 
              className="lg:hidden text-offwhite"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-forest border-t border-offwhite/10 px-6 py-8">
            <div className="flex flex-col gap-6">
              {['Articles', 'Watch', 'Listen', 'Events', 'Media', 'Team', 'About', 'Contact'].map((item) => (
                <a 
                  key={item} 
                  href={`#${item.toLowerCase()}`}
                  className="text-offwhite text-lg font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Breaking News Ticker */}
      <div className="fixed top-[73px] left-0 right-0 z-40 bg-lime py-2 overflow-hidden">
        <div className="flex whitespace-nowrap">
          <div
            className={`ticker-item flex gap-12 text-forest text-xs font-semibold uppercase tracking-wide ${
              marqueeReady ? 'ticker-animate' : 'ticker-pending'
            }`}
          >
            {marqueeLoopItems.map((item, index) => (
              <span key={`${item.title}-${index}`} className="flex items-center gap-2">
                <Zap className="w-3 h-3" />
                <span>{item.title}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Section 1: Hero. */}
      <section className="section-premium min-h-screen flex items-center relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1537882111161-c3379a777c8b?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
          }}
        />
        <div className="absolute inset-0 bg-forest/80" />
        <div className="w-full px-6 lg:px-12 pt-20 lg:pt-28 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <span className="label-mono text-lime text-lg mb-6 block">Sports Journalism Reimagined</span>
            
            <h1 className="hero-headline headline-hero text-offwhite text-5xl sm:text-6xl lg:text-7xl xl:text-8xl mb-8">
              Stories Worth<br />
              <span className="text-lime">Talking About</span>
            </h1>

            <p className="hero-subheadline body-large text-offwhite/70 max-w-2xl mx-auto mb-10">
              Original reporting, in-depth analysis, and compelling storytelling, built for fans 
              who want more than the box score. From Philadelphia to Chicago, Washington DC, and 
              Houston, we bring you closer to the games, the players, and the moments that matter.
            </p>

            <div className="hero-cta-group flex flex-wrap justify-center gap-4 mb-12">
              <a href="#stories" className="btn-premium">
                Explore Latest Articles
                <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#listen" className="btn-outline-premium">
                <Headphones className="w-4 h-4" />
                Listen to Podcast
              </a>
            </div>

            <div className="hero-stats flex flex-wrap justify-center gap-8 lg:gap-16">
              {[
                { value: '120+', label: 'Stories Published' },
                { value: '48', label: 'Events Covered' },
                { value: '2M+', label: 'Monthly Readers' },
              ].map((stat, i) => (
                <div key={i}>
                  <span className="text-3xl lg:text-4xl font-editorial font-bold text-lime">{stat.value}</span>
                  <p className="text-offwhite/50 text-sm mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Featured Stories */}
      <section id="stories" className="section-premium py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section flex flex-col lg:flex-row lg:items-end lg:justify-between mb-16">
            <div>
              <span className="label-mono text-lime mb-4 block">Featured</span>
              <h2 className="headline-section text-offwhite text-4xl lg:text-5xl">
                This Week's Best<br />Stories
              </h2>
            </div>
            <a href="#" className="btn-outline-premium mt-6 lg:mt-0 self-start">
              View All Articles
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          {/* Main Featured Article */}
          <div className="reveal-section mb-12">
            <article className="card-editorial grid lg:grid-cols-2 gap-0 overflow-hidden group cursor-pointer">
              <div className="relative overflow-hidden h-[400px] lg:h-[500px]">
                <img 
                  src={featuredArticles[0].image} 
                  alt={featuredArticles[0].title}
                  className="w-full h-full object-cover img-editorial"
                />
                <div className="absolute top-6 left-6">
                  <span className="tag-premium">{featuredArticles[0].category}</span>
                </div>
              </div>
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-full bg-offwhite/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-offwhite/60" />
                  </div>
                  <div>
                    <p className="text-offwhite text-sm font-medium">{featuredArticles[0].author}</p>
                    <p className="text-offwhite/50 text-xs">{featuredArticles[0].authorRole}</p>
                  </div>
                </div>
                
                <h3 className="headline-article text-offwhite text-2xl lg:text-3xl mb-4 group-hover:text-lime transition-colors">
                  {featuredArticles[0].title}
                </h3>
                
                <p className="body-editorial text-offwhite/60 mb-6">
                  {featuredArticles[0].excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-offwhite/40 text-sm">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {featuredArticles[0].date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {featuredArticles[0].readTime}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="p-2 text-offwhite/40 hover:text-lime transition-colors"><Bookmark className="w-5 h-5" /></button>
                    <button className="p-2 text-offwhite/40 hover:text-lime transition-colors"><Share2 className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* Secondary Featured Articles */}
          <div className="grid lg:grid-cols-2 gap-8">
            {featuredArticles.slice(1, 3).map((article) => (
              <article key={article.id} className="stagger-card card-editorial overflow-hidden group cursor-pointer">
                <div className="relative overflow-hidden h-[250px]">
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="w-full h-full object-cover img-editorial"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="tag-premium text-[10px]">{article.category}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="headline-article text-offwhite text-xl mb-3 group-hover:text-lime transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-offwhite/50 text-sm mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-offwhite/40 text-xs">
                    <span>{article.author}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.readTime}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Latest Stories Grid */}
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
                  onClick={() => setActiveFilter(filter)}
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((card) => (
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
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {card.readTime}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Podcast */}
      <section id="listen" className="section-premium py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="label-mono text-lime mb-4 block">Listen</span>
              <h2 className="headline-section text-offwhite text-4xl lg:text-5xl mb-6">
                The Preview Show
              </h2>
              <p className="body-large text-offwhite/60 mb-8">
                Weekly takes, guest interviews, and what to watch next. Join us every Wednesday 
                as we break down the biggest stories in sports with the people who know them best. 
                Former players, coaches, journalists, and insiders — all in one place.
              </p>
              
              <div className="space-y-4 mb-8">
                {podcastEpisodes.map((episode, i) => (
                  <div key={i} className="card-editorial p-5 group cursor-pointer hover:border-lime/30">
                    <div className="flex items-start gap-4">
                      <button className="w-12 h-12 bg-lime/10 rounded-full flex items-center justify-center group-hover:bg-lime group-hover:text-forest transition-all">
                        <Play className="w-5 h-5 ml-0.5" />
                      </button>
                      <div className="flex-1">
                        <h4 className="text-offwhite font-semibold mb-1 group-hover:text-lime transition-colors">
                          {episode.title}
                        </h4>
                        <p className="text-offwhite/50 text-sm mb-2 line-clamp-2">{episode.description}</p>
                        <div className="flex items-center gap-4 text-offwhite/40 text-xs">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {episode.duration}</span>
                          <span>{episode.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <a href="#" className="btn-outline-premium">
                <Podcast className="w-4 h-4" />
                Subscribe on Your Favorite App
              </a>
            </div>

            <div className="relative">
              <div className="aspect-square overflow-hidden">
                <img 
                  src="/podcast_cover.jpg" 
                  alt="Podcast" 
                  className="w-full h-full object-cover img-editorial"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-lime p-6">
                <p className="text-forest font-editorial font-bold text-3xl">150+</p>
                <p className="text-forest/70 text-sm">Episodes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Video Content */}
      <section id="watch" className="section-premium py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section mb-12">
            <span className="label-mono text-lime mb-4 block">Watch</span>
            <h2 className="headline-section text-offwhite text-4xl lg:text-5xl">
              Behind the Playbook
            </h2>
          </div>

          <div className="reveal-section grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 relative group cursor-pointer overflow-hidden">
              <div className="aspect-video">
                <img 
                  src="/media_video.jpg" 
                  alt="Video content" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-forest/20 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="w-20 h-20 bg-lime rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <Play className="w-8 h-8 text-forest fill-forest ml-1" />
                </button>
              </div>
              <div className="absolute bottom-8 left-8 right-8">
                <span className="tag-premium mb-4">Film Breakdown</span>
                <h3 className="headline-article text-offwhite text-2xl lg:text-3xl">
                  Inside the Film Room: How the Defense Changed Everything
                </h3>
              </div>
            </div>

            <div className="space-y-6">
              {[
                { title: 'Locker Room Access: Post-Game Emotions', duration: '8:24' },
                { title: 'Player Interview: The Mindset of a Champion', duration: '12:45' },
                { title: 'Practice Report: Week 4 Observations', duration: '6:18' },
              ].map((video, i) => (
                <div key={i} className="card-editorial p-4 group cursor-pointer flex gap-4">
                  <div className="w-24 h-16 bg-offwhite/10 flex-shrink-0 flex items-center justify-center">
                    <Play className="w-6 h-6 text-offwhite/40 group-hover:text-lime transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-offwhite text-sm font-medium mb-1 group-hover:text-lime transition-colors line-clamp-2">
                      {video.title}
                    </h4>
                    <span className="text-offwhite/40 text-xs">{video.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Event Coverage */}
      <section id="events" className="section-light-premium py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section mb-12">
            <span className="label-mono text-forest/60 mb-4 block">On The Scene</span>
            <h2 className="headline-section text-forest text-4xl lg:text-5xl mb-4">
              Event Coverage
            </h2>
            <p className="body-large text-forest/60 max-w-2xl">
              Photos, updates, and post-game analysis from the biggest nights. 
              We're there so you don't miss a moment.
            </p>
          </div>

          <div className="reveal-section grid lg:grid-cols-2 gap-8">
            <div className="relative overflow-hidden group cursor-pointer">
              <div className="aspect-[4/3]">
                <img 
                  src="/event_coverage.jpg" 
                  alt="Event coverage" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <span className="bg-lime text-forest text-[10px] font-bold uppercase tracking-wider px-2 py-1 mb-4 inline-block">
                  Championship Game
                </span>
                <h3 className="font-editorial font-bold text-offwhite text-2xl mb-2">
                  The Night They Made History
                </h3>
                <p className="text-offwhite/70 text-sm">
                  47 photos from an unforgettable championship night
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {[
                { title: 'Playoff Preview: What to Watch in Round 2', date: 'Jan 16, 2026', type: 'Preview' },
                { title: 'Signing Day Central: Live Updates', date: 'Jan 15, 2026', type: 'Live Coverage' },
                { title: 'All-Star Weekend: Behind the Scenes', date: 'Jan 12, 2026', type: 'Feature' },
              ].map((event, i) => (
                <div key={i} className="bg-offwhite border border-forest/10 p-6 group cursor-pointer hover:border-forest/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-lime text-[10px] font-bold uppercase tracking-wider">{event.type}</span>
                      <h4 className="font-editorial font-semibold text-forest text-lg mt-2 group-hover:text-forest/70 transition-colors">
                        {event.title}
                      </h4>
                      <p className="text-forest/50 text-sm mt-2">{event.date}</p>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-forest/30 group-hover:text-lime transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Media */}
      <section id="media" className="section-premium py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section text-center mb-12">
            <span className="label-mono text-lime mb-4 block">Media</span>
            <h2 className="headline-section text-offwhite text-4xl lg:text-5xl mb-4">
              Inside the Spotlight
            </h2>
            <p className="body-large text-offwhite/60 max-w-2xl mx-auto">
              A curated look at the moments, faces, and stories that define the season.
            </p>
          </div>

          <div className="reveal-section grid md:grid-cols-3 gap-6 lg:gap-10">
            {[
              { src: '/media/1.jpg', alt: 'Media moment 1', caption: 'Bad Bunny' },
              { src: '/media/2.jpg', alt: 'Media moment 2', caption: 'Christian Gonzalez' },
              { src: '/media/3.jpg', alt: 'Media moment 3', caption: 'Jaxon Smith-Njigba' },
            ].map((image, i) => (
              <figure key={i} className="overflow-hidden card-editorial group">
                <div className="relative aspect-[3/4]">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest/85 via-forest/10 to-transparent" />
                  <figcaption className="absolute bottom-4 left-4 right-4 text-offwhite text-base lg:text-lg font-display font-bold uppercase tracking-[0.2em]">
                    {image.caption}
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Section 8: Stats & Impact */}
      <section className="stats-section section-premium py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section text-center mb-16">
            <span className="label-mono text-lime mb-4 block">By The Numbers</span>
            <h2 className="headline-section text-offwhite text-4xl lg:text-5xl">
              Our Impact
            </h2>
          </div>

          <div className="reveal-section grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              { value: 0, suffix: '+', label: 'Stories Published', desc: 'In-depth articles, analysis, and features' },
              { value: 0, suffix: '', label: 'Events Covered', desc: 'From local games to national championships' },
              { value: 0, suffix: 'M+', label: 'Monthly Readers', desc: 'Fans who trust our reporting' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="divider-accent mx-auto mb-6" />
                <span className="stat-number text-6xl lg:text-7xl font-editorial font-bold text-offwhite">
                  {stat.value}
                </span>
                <span className="text-6xl lg:text-7xl font-editorial font-bold text-lime">{stat.suffix}</span>
                <h3 className="text-offwhite text-xl font-semibold mt-4 mb-2">{stat.label}</h3>
                <p className="text-offwhite/50 text-sm">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 9: About / Team */}
      <section id="about" className="section-premium py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section grid lg:grid-cols-2 gap-12 lg:gap-20 mb-20">
            <div>
              <span className="label-mono text-lime mb-4 block">About</span>
              <h2 className="headline-section text-offwhite text-4xl lg:text-5xl mb-6">
                Built for Fans.<br />Rooted in the Details.
              </h2>
              <div className="space-y-4 body-editorial text-offwhite/60">
                <p>
                  Sideline Sports Network was founded on a simple belief: sports fans deserve better. 
                  Better reporting. Better analysis. Better stories. In a world of hot takes and 
                  clickbait, we chose a different path — one paved with rigorous journalism, 
                  thoughtful commentary, and an unwavering commitment to our readers.
                </p>
                <p>
                  With teams in Philadelphia, Chicago, Washington DC, and Houston, we've built a 
                  roster of experienced journalists, former athletes, and passionate fans who 
                  understand that sports are about more than wins and losses. They're about 
                  community, culture, and the human stories that unfold on and off the field.
                </p>
                <p>
                  From breaking news to long-form features, from film breakdowns to podcast 
                  conversations, we cover the sports world with the depth and nuance it deserves. 
                  No fluff. No filler. Just stories worth talking about.
                </p>
              </div>
            </div>
            <div className="relative">
              <img 
                src="/topics_celebration.jpg" 
                alt="Team celebration" 
                className="w-full h-full object-cover img-editorial"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-forest to-transparent h-1/3" />
            </div>
          </div>

          {/* Team Section */}
          <div className="reveal-section">
            <h3 className="headline-section text-offwhite text-3xl mb-12">Meet the Team</h3>
            <div className="grid md:grid-cols-3 gap-8">
              {teamMembers.map((member, i) => (
                <div key={i} className="card-editorial p-6 text-center group">
                  <div className="w-24 h-24 mx-auto mb-4 overflow-hidden rounded-full">
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="text-offwhite font-semibold text-lg">{member.name}</h4>
                  <p className="text-lime text-sm mb-3">{member.role}</p>
                  <p className="text-offwhite/50 text-sm">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 10: Testimonials */}
      <section className="section-light-premium py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section text-center mb-16">
            <span className="label-mono text-forest/60 mb-4 block">What People Say</span>
            <h2 className="headline-section text-forest text-4xl">
              Trusted by Sports Fans<br />Everywhere
            </h2>
          </div>

          <div className="reveal-section grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="bg-offwhite border border-forest/10 p-8">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-lime fill-lime" />
                  ))}
                </div>
                <p className="font-editorial text-forest text-lg italic mb-6">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="text-forest font-semibold">{testimonial.author}</p>
                  <p className="text-forest/50 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 11: Newsletter */}
      <section id="subscribe" className="section-premium py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section card-editorial p-8 lg:p-16 text-center max-w-4xl mx-auto">
            <span className="label-mono text-lime mb-4 block">Newsletter</span>
            <h2 className="headline-section text-offwhite text-3xl lg:text-4xl mb-4">
              Get the Drop First
            </h2>
            <p className="body-large text-offwhite/60 mb-8 max-w-xl mx-auto">
              One email a week. No noise. Just the stories, drops, and events you care about. 
              Join over 50,000 subscribers who start their week with us.
            </p>
            
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mb-6">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-5 py-4 bg-offwhite/5 border border-offwhite/20 text-offwhite placeholder:text-offwhite/30 focus:outline-none focus:border-lime transition-colors"
              />
              <button type="submit" className="btn-premium">
                {subscribed ? 'Subscribed!' : 'Subscribe'}
              </button>
            </form>
            
            <p className="text-offwhite/40 text-xs">
              Unsubscribe anytime. We respect your privacy and never spam.
            </p>
          </div>
        </div>
      </section>

      {/* Section 12: Partners */}
      <section className="section-premium py-16 border-t border-offwhite/5">
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section text-center mb-10">
            <span className="label-mono text-offwhite/40 mb-4 block">Featured In</span>
          </div>
          <div className="reveal-section flex flex-wrap justify-center items-center gap-8 lg:gap-16">
            {['Sideline Sports', 'Gauntlet Media', 'Philly Voice', 'SportsRadio WIP', 'Fox29', 'ESPN'].map((partner, i) => (
              <span 
                key={i} 
                className="text-offwhite/20 hover:text-offwhite/50 font-display font-bold text-lg lg:text-xl uppercase tracking-wide transition-colors cursor-pointer"
              >
                {partner}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Section 13: Footer */}
      <footer id="contact" className="section-premium pt-24 pb-12 border-t border-offwhite/5">
        <div className="w-full px-6 lg:px-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img
                  src="/logo-180.png"
                  alt="Sideline Sports Network logo"
                  className="w-12 h-12 object-contain"
                />
                <span className="text-lime font-editorial font-black text-3xl italic">Sideline</span>
                <span className="text-offwhite font-sans font-semibold text-sm uppercase tracking-[0.2em]">Sports Network</span>
              </div>
              <p className="text-offwhite/50 text-sm max-w-md mb-6">
                Original reporting, in-depth analysis, and compelling storytelling, built for fans 
                who want more than the box score.
              </p>
              <div className="flex items-center gap-4">
                {[
                  { icon: Twitter, label: 'X' },
                  { icon: Youtube, label: 'YouTube' },
                  { icon: Instagram, label: 'Instagram' },
                  { icon: Podcast, label: 'TikTok' },
                ].map((social, i) => (
                  <a 
                    key={i}
                    href="#"
                    className="w-10 h-10 border border-offwhite/20 flex items-center justify-center text-offwhite/50 hover:text-lime hover:border-lime transition-all"
                    aria-label={social.label}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-offwhite font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                {['Latest Stories', 'Podcast', 'Video', 'Events', 'About Us', 'Careers'].map((link, i) => (
                  <li key={i}>
                    <a href="#" className="text-offwhite/50 hover:text-lime text-sm transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-offwhite font-semibold mb-6">Categories</h4>
              <ul className="space-y-3">
                {['Football', 'Basketball', 'Baseball', 'Recruiting', 'Culture', 'Analysis'].map((cat, i) => (
                  <li key={i}>
                    <a href="#" className="text-offwhite/50 hover:text-lime text-sm transition-colors">{cat}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="divider-subtle mb-8" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-offwhite/30 text-sm">
              © 2026 Sideline Sports Network. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((link, i) => (
                <a key={i} href="#" className="text-offwhite/30 hover:text-offwhite/50 text-sm transition-colors">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
