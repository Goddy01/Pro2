import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Play, Pause, ArrowRight, Youtube, Podcast, 
  Headphones, Clock, 
  Calendar, User, Bookmark, Share2,
  Star, ArrowUpRight,
  ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { apiUrl } from '../lib/api';
import { encodeArticleId } from '../lib/articleId';
import '../App.css';

gsap.registerPlugin(ScrollTrigger);

const EVENT_PREVIEW_IMAGES = 1;

const PODCAST_LINKS = [
  { href: 'https://www.youtube.com/@sidelinesports3840', icon: Youtube, label: 'YouTube' },
  { href: 'https://open.spotify.com/show/35pw2rvjZ1xEagLJS72Gpf', icon: Podcast, label: 'Spotify' },
  { href: 'https://podcasts.apple.com/us/podcast/sideline-sports/id1565070611', icon: Podcast, label: 'Apple Podcasts' },
];

type WatchVideo = { title: string; videoId: string | null; videoUrl?: string; duration: string };
const FALLBACK_WATCH: WatchVideo[] = [
  { title: 'Sideline Sports', videoId: '0HZWARKVflQ', duration: 'Video' },
  { title: 'Super Bowl LX Recap Live from San Francisco', videoId: 'mz4Aktj4Zxw', duration: 'Shorts' },
  { title: 'Mike Trout Postgame Interview | Los Angeles Angels', videoId: 'ssBAzJHiUws', duration: 'Shorts' },
  { title: 'Exclusive Interview with Kenny Einhorn: 20+ Years as Eagles Statistician | Super Bowl LII Champion', videoId: 'ymupY14vvCs', duration: 'Video' },
];

type ArticleFromApi = { id: number; title: string; image: string; content: string; category: string; author: string; created_at: string };
function articleExcerpt(html: string, maxLen = 200) {
  const text = (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length <= maxLen ? text : text.slice(0, maxLen) + '…';
}
function articleReadTime(html: string) {
  const text = (html || '').replace(/<[^>]*>/g, '');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}
function formatArticleDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'long' });
  } catch {
    return iso;
  }
}

export default function Home() {
  const [watchVideos, setWatchVideos] = useState<WatchVideo[]>([]);
  const [podcastEpisodesFromApi, setPodcastEpisodesFromApi] = useState<{ title: string; description: string; duration: string; guests?: string[]; audioUrl?: string }[]>([]);
  const [activePodcastIndex, setActivePodcastIndex] = useState<number | null>(null);
  const podcastAudioRef = useRef<HTMLAudioElement>(null);
  const [articlesFromApi, setArticlesFromApi] = useState<ArticleFromApi[]>([]);
  const [eventsFromApi, setEventsFromApi] = useState<{ id: string; title: string; description: string; images: string[] }[]>([]);
  const [newsletterCount, setNewsletterCount] = useState<number>(0);
  const [showPodcastPlatforms, setShowPodcastPlatforms] = useState(false);
  const [testimonialForm, setTestimonialForm] = useState({
    name: '',
    company: '',
    role: '',
    message: '',
    stars: 0,
  });
  const [testimonialSubmitted, setTestimonialSubmitted] = useState(false);
  const [testimonialErrors, setTestimonialErrors] = useState<Record<string, string>>({});
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const watchCarouselRef = useRef<HTMLDivElement>(null);
  const testimonialsCarouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(apiUrl('/api/podcast'))
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPodcastEpisodesFromApi(data.map((e: { title: string; description?: string; duration_label?: string; guests?: string; audio_url?: string }) => ({
            title: e.title,
            description: e.description || '',
            duration: e.duration_label || '',
            guests: e.guests ? e.guests.split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
            audioUrl: e.audio_url || undefined,
          })));
        }
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    fetch(apiUrl('/api/watch'))
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setWatchVideos(data.map((v: { title: string; videoId?: string | null; videoUrl?: string; duration?: string }) => ({
            title: v.title,
            videoId: v.videoId || null,
            videoUrl: v.videoUrl,
            duration: v.duration || 'Video',
          })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(apiUrl('/api/articles'))
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setArticlesFromApi(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(apiUrl('/api/events'))
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEventsFromApi(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(apiUrl('/api/newsletter-signups/count'))
      .then((r) => r.json())
      .then((data) => setNewsletterCount(typeof data?.count === 'number' ? data.count : 0))
      .catch(() => {});
  }, []);

  const featuredArticles = articlesFromApi.slice(0, 3).map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category || 'Features',
    excerpt: articleExcerpt(a.content),
    author: a.author,
    authorRole: '' as string,
    image: a.image,
    date: formatArticleDate(a.created_at),
    readTime: articleReadTime(a.content),
  }));
  const articleCards = articlesFromApi.slice(3, 5).map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category || 'Features',
    excerpt: articleExcerpt(a.content),
    author: a.author,
    image: a.image,
    date: formatArticleDate(a.created_at),
    readTime: articleReadTime(a.content),
  }));

  const staticPodcastEpisodes = [
    {
      id: 1,
      title: 'Micah Parsons Trade Drama & Jon Shearer’s Top 10 Hall of Fame Picks',
      description: 'We break down the developing situation surrounding Micah Parsons requesting a trade out of Dallas and what it could mean for the Cowboys moving forward. Jon Shearer also joins the show to reveal and defend his Top 10 Hall of Fame selections, sparking plenty of debate and strong opinions.',
      duration: '01:02:28',
      guests: ['JB Ellis ', 'Jon Shearer', 'Dave DesRochers'],
      audioUrl: '/audio-podcasts/audio-podcast-1.m4a',
    },
    {
      id: 2,
      title: 'Live from Radio Row: Super Bowl LIX Recap & Eagles Dominate 40–22',
      description: 'Broadcasting from Radio Row in New Orleans, we recap the atmosphere, major storylines, and defining moments from Super Bowl LIX. The Philadelphia Eagles secured a 40 to 22 victory over the Kansas City Chiefs, and we analyze how the game unfolded and what it means for both teams.',
      duration: '59:02',
      guests: ['JB Ellis ', 'Jon Shearer', 'Dave DesRochers'],
      audioUrl: '/audio-podcasts/audio-podcast-2.m4a',
    },
    {
      id: 3,
      title: 'CFP Semifinals Recap and National Championship Breakdown Miami vs Indiana',
      description: 'We revisit the biggest moments from the College Football Playoff semifinals and provide a full breakdown of the national championship matchup between Miami and Indiana. Key matchups, game changing factors, and predictions are all covered ahead of kickoff.',
      duration: '59:57',
      guests: ['JB Ellis','Jon Shearer', 'Dave DesRochers'],
      audioUrl: '/audio-podcasts/audio-podcast-3.m4a',
    },
  ];
  const podcastEpisodes = podcastEpisodesFromApi.length > 0
    ? podcastEpisodesFromApi
    : staticPodcastEpisodes;

  const podcastEpisodesWithAudio = podcastEpisodes.map((ep, i) => ({
    ...ep,
    audioUrl: (ep as { audioUrl?: string }).audioUrl ?? (i < 3 ? `/audio-podcasts/audio-podcast-${i + 1}.m4a` : undefined),
  }));

  const handlePodcastPlay = (index: number) => {
    const episode = podcastEpisodesWithAudio[index];
    const url = episode?.audioUrl;
    const audio = podcastAudioRef.current;
    if (!url || !audio) return;
    const isCurrentlyPlaying = activePodcastIndex === index && !audio.paused;
    if (isCurrentlyPlaying) {
      audio.pause();
      setActivePodcastIndex(null);
      return;
    }
    if (audio.src !== url && !audio.src.endsWith(url)) {
      audio.src = url;
    }
    audio.play().catch(() => {});
    setActivePodcastIndex(index);
  };

  const testimonials = [
    { author: 'Momcilo Velickovic', role: 'Attorney at Law & Basketball Agent', quote: 'Sideline Sports & Entertainment delivers high-quality podcasts that are both engaging and educational. Their topics are insightful, and the overall experience makes it easy to recommend collaborating or being featured on their platform.' },
    { author: 'Sean Russi', role: 'NFL/MLB Agent specializing in Player Acquisition and Contract Negotiation', quote: 'Sideline Sports & Entertainment consistently demonstrates strong preparation and professionalism. Their team does thorough research before interviews and engages with clients at a high level, making every interaction seamless and impressive.' },
    { author: 'Geoff Magliocchetti', role: 'Beat Writer / Columnist / Reporter at NJ.com', quote: 'Working with Sideline Sports & Entertainment was a great experience. Their podcast conversations are engaging, well-structured, and driven by thoughtful questions that lead to meaningful and insightful discussions.' },
    { author: 'David Brody', role: 'Trusted Voice Coach to Rising & Pro Sportscasters', quote: 'Sideline Sports & Entertainment shows exceptional passion for growth and continuous improvement. Their team is highly coachable, collaborative, and brings strong value to any platform they are part of.' },
    { author: 'Randy Hardenbrook', role: 'Podcast Co-Host', quote: 'Among the many podcast teams I\'ve worked with, Sideline Sports & Entertainment stands out as one of the most professional and well-organized. The quality of their shows and execution is top-tier.' },
    { author: 'Jay A Field III', role: 'Managing Partner & CIO, Rocfield Capital | eXp Realty', quote: 'Sideline Sports & Entertainment produces high-quality podcasts featuring professional athletes and industry insights. Their content is engaging, well-curated, and highly valuable for sports audiences.' },
    { author: 'Scott Morganroth', role: 'Content Hunter & Author, "Lessons From The Microphone"', quote: 'Sideline Sports & Entertainment demonstrates true professionalism in sports journalism. Their team is knowledgeable, well-spoken, dependable, and continuously evolving, making them a strong asset in the media space.' },
    { author: 'Erik Little QKA', role: 'Director, RIA Services at The Boon Group', quote: 'Sideline Sports & Entertainment combines strong knowledge of sports and business with an ability to create enjoyable, engaging experiences. Their team brings people together and makes every collaboration both productive and fun.' },
    { author: 'David Brunner', role: 'Owner / CEO at DBTV Television Network | TV/Sports Talent Agent', quote: 'When building our television network, we looked for talented and passionate partners, and Sideline Sports & Entertainment stood out. Their sports knowledge, broadcasting skills, and innovative ideas make them a valuable addition to any network.' },
    { author: 'Gabriel Santiago', role: 'Sports Media Professional', quote: 'Sideline Sports & Entertainment delivers content that is both thorough and engaging. Their deep understanding of key markets, combined with insightful analysis, positions them as a strong voice in the industry.' },
    { author: 'Scott Ferrall', role: 'PROPHETABLE.tv', quote: 'Working with Sideline Sports & Entertainment has been a great experience. Their team is always prepared, asks insightful questions, and consistently delivers engaging and entertaining content.' },
  ];

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

  // Infinite watch carousel: start at middle set, jump at boundaries
  useEffect(() => {
    const el = watchCarouselRef.current;
    if (!el) return;

    const run = () => {
      const setWidth = el.scrollWidth / 3;
      if (setWidth <= 0) return;
      el.scrollLeft = setWidth;
    };

    const t = setTimeout(run, 50);
    const onResize = () => run();
    window.addEventListener('resize', onResize);

    const onScroll = () => {
      const setWidth = el.scrollWidth / 3;
      if (setWidth <= 0) return;
      if (el.scrollLeft <= 0) {
        el.scrollLeft += setWidth;
      } else if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 2) {
        el.scrollLeft -= setWidth;
      }
    };

    el.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    const el = testimonialsCarouselRef.current;
    if (!el) return;
    const run = () => {
      const setWidth = el.scrollWidth / 3;
      if (setWidth <= 0) return;
      el.scrollLeft = setWidth;
    };
    const t = setTimeout(run, 50);
    const onResize = () => run();
    window.addEventListener('resize', onResize);
    const onScroll = () => {
      const setWidth = el.scrollWidth / 3;
      if (setWidth <= 0) return;
      if (el.scrollLeft <= 0) el.scrollLeft += setWidth;
      else if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 2) el.scrollLeft -= setWidth;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('scroll', onScroll);
    };
  }, []);

  const handleTestimonialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!testimonialForm.name.trim()) errors.name = 'Name is required';
    if (!testimonialForm.message.trim()) errors.message = 'Message is required';
    if (testimonialForm.stars < 1 || testimonialForm.stars > 5) errors.stars = 'Please select a rating (1–5 stars)';
    setTestimonialErrors(errors);
    if (Object.keys(errors).length > 0) return;
    // TODO: send to backend
    setTestimonialSubmitted(true);
    setTestimonialForm({ name: '', company: '', role: '', message: '', stars: 0 });
  };

  return (
    <div ref={mainRef} className="relative">
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
            <span className="label-mono text-lime text-lg mb-6 block">Sports & Entertainment Journalism Reimagined</span>
            
            <h1 className="hero-headline headline-hero text-offwhite text-5xl sm:text-6xl lg:text-7xl xl:text-8xl mb-8">
              Stories Worth<br />
              <span className="text-lime">Talking About</span>
            </h1>

            <p className="hero-subheadline body-large text-offwhite/70 max-w-2xl mx-auto mb-10">
              Original reporting, in-depth analysis, and compelling storytelling, built for fans 
              who want more than the box score. From Philadelphia to Chicago, Washington DC, and 
              Houston, we bring you closer to the games, the players, and the moments that matter.
            </p>

            <div className="hero-cta-group flex flex-col items-center gap-4 mb-12">
              <div className="flex flex-wrap justify-center gap-4">
                <a href="#stories" className="btn-premium">
                  Explore Latest Articles
                  <ArrowRight className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setShowPodcastPlatforms((v) => !v)}
                  className="btn-outline-premium inline-flex items-center gap-2"
                >
                  <Headphones className="w-4 h-4" />
                  Explore Shows
                </button>
              </div>
              {showPodcastPlatforms && (
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  {PODCAST_LINKS.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline-premium"
                    >
                      <link.icon className="w-4 h-4" />
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="hero-stats flex flex-wrap justify-center gap-8 lg:gap-16">
              {[
                {
                  value: articlesFromApi.length >= 5 ? `${articlesFromApi.length}+` : articlesFromApi.length > 0 ? 'Growing' : 'New',
                  label: 'Stories Published',
                },
                {
                  value: eventsFromApi.length >= 3 ? `${eventsFromApi.length}` : 'Growing',
                  label: 'Events Covered',
                },
                {
                  value: newsletterCount >= 10 ? `${newsletterCount}` : newsletterCount > 0 ? 'Growing' : 'Join us',
                  label: 'Newsletter Signups',
                },
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
            <Link to="/stories" className="btn-outline-premium mt-6 lg:mt-0 self-start">
              View All Articles
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Main Featured Article */}
          {featuredArticles.length > 0 && (
            <div className="reveal-section mb-12">
              <Link to={`/stories/${encodeArticleId(featuredArticles[0].id)}`} className="block">
                <article className="card-editorial grid lg:grid-cols-2 gap-0 overflow-hidden group cursor-pointer">
                  <div className="relative overflow-hidden h-[400px] lg:h-[500px]">
                    <img 
                      src={featuredArticles[0].image} 
                      alt=""
                      className="w-full h-full object-cover object-top img-editorial"
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
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
                        {featuredArticles[0].authorRole && <p className="text-offwhite/50 text-xs">{featuredArticles[0].authorRole}</p>}
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
                        <span className="p-2 text-offwhite/40"><Bookmark className="w-5 h-5" /></span>
                        <span className="p-2 text-offwhite/40"><Share2 className="w-5 h-5" /></span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            </div>
          )}

          {/* Secondary Featured Articles */}
          {featuredArticles.length > 1 && (
            <div className="grid lg:grid-cols-2 gap-8">
              {featuredArticles.slice(1, 3).map((article) => (
                <Link key={article.id} to={`/stories/${encodeArticleId(article.id)}`} className="block">
                  <article className="stagger-card card-editorial overflow-hidden group cursor-pointer">
                    <div className="relative overflow-hidden h-[250px]">
                      <img 
                        src={article.image} 
                        alt=""
                        className="w-full h-full object-cover img-editorial"
                        loading="lazy"
                        decoding="async"
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
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section 3: More Stories You'll Love */}
      <section className="section-light-premium py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section mb-12">
            <span className="label-mono text-forest/60 mb-4 block">Latest</span>
            <h2 className="headline-section text-forest text-4xl mb-6">
              More Stories You'll Love
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 mb-12 w-full">
            {articleCards.map((card) => (
              <Link key={card.id} to={`/stories/${encodeArticleId(card.id)}`} className="stagger-card group block">
                <article className="cursor-pointer h-full">
                  <div className="bg-offwhite border border-forest/10 overflow-hidden hover:shadow-2xl transition-shadow duration-500 h-full">
                    <div className="relative overflow-hidden h-[260px] lg:h-[280px]">
                      <img src={card.image} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" decoding="async" />
                      <div className="absolute top-4 left-4">
                        <span className="bg-lime text-forest text-[10px] font-bold uppercase tracking-wider px-2 py-1">{card.category}</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-editorial font-semibold text-forest text-lg mb-3 group-hover:text-forest/70 transition-colors line-clamp-2">{card.title}</h3>
                      <p className="text-forest/60 text-sm mb-4 line-clamp-3">{card.excerpt}</p>
                      <div className="flex items-center justify-between text-forest/40 text-xs">
                        <span>{card.author}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {card.readTime}</span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          <div className="reveal-section text-center">
            <Link to="/stories" className="btn-premium inline-flex items-center gap-2">
              Read More Stories
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Section 4: Podcast */}
      <section id="listen" className="section-premium py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="label-mono text-lime mb-4 block">Listen</span>
              <p className="body-large text-offwhite/60 mb-8">
                Weekly takes, guest interviews, and what to watch next. Join us every Wednesday 
                as we break down the biggest stories in sports with the people who know them best. 
                Former players, coaches, journalists, and insiders — all in one place.
              </p>
              
              <audio
                ref={podcastAudioRef}
                preload="metadata"
                onEnded={() => setActivePodcastIndex(null)}
                aria-hidden
              />
              <div className="space-y-4 mb-8">
                {podcastEpisodesWithAudio.map((episode, i) => {
                  const hasAudio = !!episode.audioUrl;
                  const isPlaying = activePodcastIndex === i;
                  return (
                    <div key={i} className="card-editorial p-5 group hover:border-lime/30">
                      <div className="flex items-start gap-4">
                        {hasAudio ? (
                          <button
                            type="button"
                            onClick={() => handlePodcastPlay(i)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0 ${isPlaying ? 'bg-lime text-forest' : 'bg-lime/10 text-offwhite group-hover:bg-lime group-hover:text-forest'}`}
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                          >
                            {isPlaying ? (
                              <Pause className="w-5 h-5" />
                            ) : (
                              <Play className="w-5 h-5 ml-0.5" />
                            )}
                          </button>
                        ) : (
                          <div className="w-12 h-12 bg-offwhite/10 rounded-full flex items-center justify-center shrink-0" aria-hidden>
                            <Play className="w-5 h-5 ml-0.5 text-offwhite/40" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-offwhite font-semibold mb-1 group-hover:text-lime transition-colors">
                            {episode.title}
                          </h4>
                          <p className="text-offwhite/50 text-sm mb-2 line-clamp-2">{episode.description}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-offwhite/40 text-xs">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {episode.duration}</span>
                            {episode.guests?.length ? (
                              <span className="flex items-center gap-1"><User className="w-3 h-3" /> {episode.guests.join(', ')}</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-offwhite/60 text-sm mb-3">Listen to our shows on </p>
              <div className="flex flex-wrap gap-3">
                <a 
                  href="https://www.youtube.com/@sidelinesports3840" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-outline-premium"
                >
                  <Youtube className="w-4 h-4" />
                  YouTube
                </a>
                <a 
                  href="https://open.spotify.com/show/35pw2rvjZ1xEagLJS72Gpf" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-outline-premium"
                >
                  <Podcast className="w-4 h-4" />
                  Spotify
                </a>
                <a 
                  href="https://podcasts.apple.com/us/podcast/sideline-sports/id1565070611" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-outline-premium"
                >
                  <Podcast className="w-4 h-4" />
                  Apple Podcasts
                </a>
              </div>
            </div>

            <div className="relative max-w-md lg:max-w-lg xl:max-w-xl mx-auto">
              <div className="aspect-square overflow-hidden">
                <img 
                  src="/podcast_cover.jpg" 
                  alt="" 
                  className="w-full h-full object-cover object-center scale-125 img-editorial"
                  loading="lazy"
                  decoding="async"
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

      {/* Section 5: Video Content - Carousel */}
      <section id="watch" className="section-premium py-24 overflow-hidden">
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section mb-12 flex items-end justify-between gap-4">
            <div>
              <span className="label-mono text-lime mb-4 block">Watch</span>
              <h2 className="headline-section text-offwhite text-4xl lg:text-5xl">
                INTERVIEWS & SHOWS
              </h2>
            </div>
            <a
              href="/listen-watch"
              className="btn-secondary group hidden lg:flex items-center gap-2 shrink-0"
            >
              View More
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="reveal-section relative -mx-6 lg:-mx-12">
            <button
              type="button"
              onClick={() => {
                const el = watchCarouselRef.current;
                if (el) el.scrollBy({ left: -((el.querySelector('a')?.getBoundingClientRect().width ?? 320) + 32), behavior: 'smooth' });
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-forest border border-offwhite/20 text-offwhite flex items-center justify-center hover:bg-forest/90 hover:text-lime hover:border-lime/50 transition-colors shadow-lg"
              aria-label="Previous videos"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => {
                const el = watchCarouselRef.current;
                if (el) el.scrollBy({ left: (el.querySelector('a')?.getBoundingClientRect().width ?? 320) + 32, behavior: 'smooth' });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-forest border border-offwhite/20 text-offwhite flex items-center justify-center hover:bg-forest/90 hover:text-lime hover:border-lime/50 transition-colors shadow-lg"
              aria-label="Next videos"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div
              ref={watchCarouselRef}
              className="watch-carousel overflow-x-auto scroll-smooth snap-x snap-mandatory flex gap-10 px-12 lg:px-16 py-2"
            >
              {[0, 1, 2].map((repeatIndex) =>
                (watchVideos.length ? watchVideos : FALLBACK_WATCH).map((video, i) => {
                  const isYoutube = !!video.videoId;
                  const href = isYoutube ? `https://www.youtube.com/watch?v=${video.videoId}` : (video.videoUrl || '#');
                  const thumb = isYoutube ? `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg` : (video.videoUrl || '');
                  return (
                    <a
                      key={`${repeatIndex}-${i}`}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group cursor-pointer flex-shrink-0 w-[360px] sm:w-[380px] lg:w-[540px] snap-center"
                    >
                      <div className="relative overflow-hidden mb-4">
                        <div className="aspect-video bg-offwhite/10 relative rounded overflow-hidden">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-offwhite/10 flex items-center justify-center">
                              <Play className="w-12 h-12 text-offwhite/50" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-transparent to-transparent" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 bg-offwhite/90 rounded-full flex items-center justify-center group-hover:bg-lime transition-colors">
                              <Play className="w-8 h-8 text-forest ml-1" fill="currentColor" />
                            </div>
                          </div>
                          <div className="absolute top-4 right-4">
                            <span className="bg-forest/90 text-offwhite text-[10px] font-bold uppercase tracking-wider px-2 py-1">
                              {video.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                      <h3 className="headline-article text-offwhite text-lg lg:text-xl group-hover:text-lime transition-colors line-clamp-2">
                        {video.title}
                      </h3>
                    </a>
                  );
                })
              )}
            </div>
          </div>

          <div className="reveal-section lg:hidden text-center mt-8">
            <a
              href="https://www.youtube.com/@sidelinesports3840"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary group inline-flex items-center gap-2"
            >
              View More
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Section 6: Event Coverage */}
      <section id="events" className="section-light-premium py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section mb-12">
            <span className="label-mono text-forest/60 mb-4 block">On The Scene</span>
            <h2 className="headline-section text-forest text-4xl lg:text-5xl mb-4">
              Coverage
            </h2>
            <p className="body-large text-forest/60 max-w-2xl">
              Photos, updates, and post-game analysis from the biggest nights. 
              We're there so you don't miss a moment.
            </p>
          </div>

          <div className="reveal-section grid lg:grid-cols-2 gap-8 items-stretch">
            <div className="relative overflow-hidden group cursor-pointer h-[280px] sm:h-[320px] lg:h-full min-h-0">
              <img 
                src="/coverage.jpg" 
                alt="" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                style={{ objectPosition: 'center 35%' }}
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-8 left-8 right-8">
                <span className="bg-lime text-forest text-[10px] font-bold uppercase tracking-wider px-2 py-1 mb-4 inline-block">
                  Baseball
                </span>
                {/* <h3 className="font-editorial font-bold text-offwhite text-2xl mb-2">
                  The Night They Made History
                </h3> */}
              </div>
            </div>

            <div className="space-y-6">
              {[
                { type: 'NBA Drafts', description: 'In-depth coverage capturing the excitement and anticipation of NBA and WNBA drafts, spotlighting future stars.' },
                { type: 'Super Bowl', description: 'On-the-ground coverage from the biggest game in sports — Radio Row, game day, and the moments that define the season.' },
                { type: 'Hall of Fame', description: 'Exclusive interviews and photo galleries from Pro Football and MLB Hall of Fame ceremonies honoring legends.' },
                { type: 'Soccer Events', description: 'Live coverage of US Soccer matches and Premier League preseason tours, capturing the passion on and off the field.' },
              ].map((event, i) => (
                <div key={i} className="bg-offwhite border border-forest/10 p-6 group cursor-pointer hover:border-forest/30 transition-colors">
                  <span className="text-lime text-sm font-bold uppercase tracking-wider">{event.type}</span>
                  <p className="text-forest/90 text-sm lg:text-base mt-3 leading-relaxed">{event.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="reveal-section mt-10 flex justify-center">
            <Link
              to="/coverage"
              className="btn-premium inline-flex items-center gap-2"
            >
              View Coverages
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Events */}
          <div className="reveal-section mt-24 pt-16 border-t border-forest/10">
            <span className="label-mono text-forest/60 mb-2 block">Event Galleries</span>
            <h2 className="headline-section text-forest text-3xl lg:text-4xl mb-10">
              Event Galleries
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {eventsFromApi.slice(0, 2).map((event) => {
                const previewImages = (event.images || []).slice(0, EVENT_PREVIEW_IMAGES);
                return (
                  <div
                    key={event.id}
                    className="stagger-card flex flex-col bg-offwhite border border-forest/10 overflow-hidden"
                  >
                    <div className="p-6 lg:p-8">
                      <h3 className="headline-article text-forest text-xl lg:text-2xl mb-2">
                        {event.title}
                      </h3>
                      <p className="body-large text-forest/60 mb-6">
                        {event.description}
                      </p>
                      <div className="w-full mx-auto h-[28rem] sm:h-[32rem] overflow-hidden rounded-sm bg-forest/5 group mb-6">
                            <img
                              src={previewImages[0] || ''}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              style={{ objectPosition: event.id === 'rmh' ? 'top' : 'center' }}
                              loading="lazy"
                              decoding="async"
                            />
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
            <div className="reveal-section mt-10 flex justify-center">
              <Link to="/events" className="btn-premium inline-flex items-center gap-2">
                View all event galleries
                <ArrowRight className="w-4 h-4" />
              </Link>
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
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest/85 via-forest/10 to-transparent" />
                  <figcaption className="absolute bottom-4 left-4 right-4 text-offwhite text-base lg:text-lg font-display font-bold uppercase tracking-[0.2em]">
                    {image.caption}
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
          <div className="reveal-section mt-10 flex justify-center">
            <Link
              to="/gallery"
              className="btn-premium inline-flex items-center gap-2"
            >
              View More
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Section 8: Stats & Impact */}
      {/* <section className="stats-section section-premium py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section text-center mb-16">
            <span className="label-mono text-lime mb-4 block">By The Numbers</span>
            <h2 className="headline-section text-offwhite text-4xl lg:text-5xl">
              Our Impact
            </h2>
          </div>

          <div className="reveal-section grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                display: articlesFromApi.length >= 5 ? `${articlesFromApi.length}+` : articlesFromApi.length > 0 ? 'Growing' : 'New',
                label: 'Stories Published',
                desc: 'In-depth articles, analysis, and features',
              },
              {
                display: eventsFromApi.length >= 3 ? `${eventsFromApi.length}` : eventsFromApi.length > 0 ? 'Growing' : 'Growing',
                label: 'Events Covered',
                desc: 'From national championships to international tournaments to charity events',
              },
              {
                display: newsletterCount >= 10 ? `${newsletterCount}` : newsletterCount > 0 ? 'Growing' : 'Join us',
                label: 'Newsletter Signups',
                desc: 'Fans staying in the loop',
              },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="divider-accent mx-auto mb-6" />
                <span className="stat-number text-6xl lg:text-7xl font-editorial font-bold text-offwhite">
                  {stat.display}
                </span>
                <h3 className="text-offwhite text-xl font-semibold mt-4 mb-2">{stat.label}</h3>
                <p className="text-offwhite/50 text-sm">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

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
                <h3 className="text-offwhite font-editorial font-semibold text-xl mt-8 mb-3">Mission statement</h3>
                <p>
                  Sideline Sports &amp; Entertainment started as a sports media company and is now expanding into the entertainment space. We are committed to delivering authentic coverage of sports and entertainment rooted in credibility, insight, and passion. We prioritize substance over sensationalism, informed analysis over empty headlines, and meaningful storytelling over click-driven noise. Our mission is to be a trusted source for fans who want real conversations about the games, the culture, and the moments that shape both industries.
                </p>
                <p>
                  Sideline Sports &amp; Entertainment has accepted the challenge to fill the void in sports and entertainment coverage. We deliver authentic, informed reporting, thoughtful analysis, and meaningful storytelling — free from hype, clickbait, or political noise. Our mission is to be a trusted destination for fans who want real insight, real conversations, and real coverage of the moments and personalities that shape sports and entertainment.
                </p>
              </div>
            </div>
            <div className="relative overflow-hidden max-h-[380px] lg:max-h-[420px]">
              <img 
                src="/team.jpg" 
                alt="" 
                className="w-full h-full object-cover object-center img-editorial"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-forest to-transparent h-1/3" />
            </div>
          </div>

          <div className="reveal-section text-center pt-8">
            <a href="/team" className="btn-outline-premium inline-flex items-center gap-2">
              Meet the Team
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Section 10: Testimonials - Endless carousel */}
      <section className="section-light-premium py-24 overflow-hidden">
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section text-center mb-16">
            <span className="label-mono text-forest/60 mb-4 block">What People Say</span>
            <h2 className="headline-section text-forest text-4xl">
              Trusted by Sports Fans<br />Everywhere
            </h2>
          </div>

          <div className="reveal-section relative -mx-6 lg:-mx-12">
            <button
              type="button"
              onClick={() => {
                const el = testimonialsCarouselRef.current;
                if (el) {
                  const card = el.querySelector('[data-testimonial-card]');
                  const w = (card?.getBoundingClientRect().width ?? 380) + 32;
                  el.scrollBy({ left: -w, behavior: 'smooth' });
                }
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-forest border border-forest/30 text-offwhite flex items-center justify-center hover:bg-forest/90 hover:text-lime hover:border-lime/50 transition-colors shadow-lg"
              aria-label="Previous testimonials"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => {
                const el = testimonialsCarouselRef.current;
                if (el) {
                  const card = el.querySelector('[data-testimonial-card]');
                  const w = (card?.getBoundingClientRect().width ?? 380) + 32;
                  el.scrollBy({ left: w, behavior: 'smooth' });
                }
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-forest border border-forest/30 text-offwhite flex items-center justify-center hover:bg-forest/90 hover:text-lime hover:border-lime/50 transition-colors shadow-lg"
              aria-label="Next testimonials"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div
              ref={testimonialsCarouselRef}
              className="testimonials-carousel overflow-x-auto scroll-smooth snap-x snap-mandatory flex gap-8 px-14 lg:px-16 py-4"
            >
              {[0, 1, 2].map((repeatIndex) =>
                testimonials.map((testimonial, i) => (
                  <div
                    key={`${repeatIndex}-${i}`}
                    data-testimonial-card
                    className="flex-shrink-0 w-[320px] sm:w-[360px] lg:w-[400px] snap-center bg-offwhite border border-forest/10 p-8"
                  >
                    <div className="flex gap-1 mb-6">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 text-lime fill-lime" />
                      ))}
                    </div>
                    <p className="text-forest text-base font-normal leading-relaxed mb-6 line-clamp-5">
                      "{testimonial.quote}"
                    </p>
                    <div className="border-t border-forest/10 pt-4">
                      <p className="text-forest font-semibold text-base antialiased" style={{ textShadow: 'none' }}>{testimonial.author}</p>
                      <p className="text-forest/80 text-sm font-medium mt-1 antialiased" style={{ textShadow: 'none' }}>{testimonial.role}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="reveal-section text-center mt-12">
            <button
              type="button"
              onClick={() => {
                setShowTestimonialForm(true);
                setTimeout(() => document.getElementById('write-testimonial')?.scrollIntoView({ behavior: 'smooth' }), 100);
              }}
              className="bg-lime text-offwhite font-display font-bold uppercase tracking-[0.3em] px-8 py-4 rounded-none border-0 hover:bg-lime/90 transition-colors inline-flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(210,34,42,0.4)]"
              style={{ textShadow: '0 0 20px rgba(255,255,255,0.35), 0 1px 1px rgba(255,255,255,0.5)' }}
            >
              Write a testimonial
            </button>
          </div>
        </div>
      </section>

      {showTestimonialForm && (
      /* Section 10b: Write a testimonial */
      <section id="write-testimonial" className="section-light-premium py-24 border-t border-forest/10 relative">
        <button
          type="button"
          onClick={() => setShowTestimonialForm(false)}
          className="absolute top-6 right-6 lg:right-12 p-2 text-forest/70 hover:text-forest hover:bg-forest/10 rounded transition-colors"
          aria-label="Close write testimonial"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section text-center mb-12">
            <span className="label-mono text-forest/60 mb-4 block">Share your experience</span>
            <h2 className="headline-section text-forest text-4xl mb-4 ">
              Write a testimonial
            </h2>
            <p className="body-large text-forest/60 max-w-xl mx-auto">
              Enjoyed working with us? We’d love to hear from you.
            </p>
          </div>

          <div className="reveal-section max-w-2xl mx-auto">
            {testimonialSubmitted ? (
              <div className="bg-offwhite border border-forest/10 p-8 text-center">
                <p className="text-forest font-semibold">Thank you for your testimonial.</p>
                <p className="text-forest/70 text-sm mt-2">We’ll review it and may feature it on our site.</p>
              </div>
            ) : (
              <form onSubmit={handleTestimonialSubmit} className="space-y-6">
                <div>
                  <label htmlFor="testimonial-name" className="block text-forest font-medium text-sm mb-2">
                    Name <span className="text-lime">*</span>
                  </label>
                  <input
                    id="testimonial-name"
                    type="text"
                    required
                    value={testimonialForm.name}
                    onChange={(e) => setTestimonialForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    className="w-full px-4 py-3 bg-offwhite border border-forest/20 text-forest placeholder:text-forest/40 focus:outline-none focus:border-lime transition-colors"
                  />
                  {testimonialErrors.name && (
                    <p className="text-lime text-xs mt-1">{testimonialErrors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="testimonial-company" className="block text-forest font-medium text-sm mb-2">
                    Company
                  </label>
                  <input
                    id="testimonial-company"
                    type="text"
                    value={testimonialForm.company}
                    onChange={(e) => setTestimonialForm((f) => ({ ...f, company: e.target.value }))}
                    placeholder="Company (optional)"
                    className="w-full px-4 py-3 bg-offwhite border border-forest/20 text-forest placeholder:text-forest/40 focus:outline-none focus:border-lime transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="testimonial-role" className="block text-forest font-medium text-sm mb-2">
                    Role
                  </label>
                  <input
                    id="testimonial-role"
                    type="text"
                    value={testimonialForm.role}
                    onChange={(e) => setTestimonialForm((f) => ({ ...f, role: e.target.value }))}
                    placeholder="Your role or title (optional)"
                    className="w-full px-4 py-3 bg-offwhite border border-forest/20 text-forest placeholder:text-forest/40 focus:outline-none focus:border-lime transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="testimonial-message" className="block text-forest font-medium text-sm mb-2">
                    Message <span className="text-lime">*</span>
                  </label>
                  <textarea
                    id="testimonial-message"
                    required
                    rows={5}
                    value={testimonialForm.message}
                    onChange={(e) => setTestimonialForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Your testimonial..."
                    className="w-full px-4 py-3 bg-offwhite border border-forest/20 text-forest placeholder:text-forest/40 focus:outline-none focus:border-lime transition-colors resize-y min-h-[120px]"
                  />
                  {testimonialErrors.message && (
                    <p className="text-lime text-xs mt-1">{testimonialErrors.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-forest font-medium text-sm mb-2">
                    Rating <span className="text-lime">*</span>
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setTestimonialForm((f) => ({ ...f, stars: n }))}
                        className="p-1 focus:outline-none focus:ring-2 focus:ring-lime focus:ring-offset-2 rounded"
                        aria-label={`${n} star${n > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            n <= testimonialForm.stars ? 'text-lime fill-lime' : 'text-forest/30'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {testimonialErrors.stars && (
                    <p className="text-lime text-xs mt-1">{testimonialErrors.stars}</p>
                  )}
                </div>

                <button type="submit" className="w-full sm:w-auto px-8 py-4 bg-lime text-offwhite font-semibold uppercase tracking-wide hover:bg-lime/90 transition-colors">
                  Submit testimonial
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
      )}

      {/* Section 11: Newsletter */}
      {/* <section id="subscribe" className="section-premium py-24">
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
            
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mb-6">
              <a href="https://www.youtube.com/@sidelinesports3840?sub_confirmation=1" target="_blank" rel="noopener noreferrer" className="btn-premium">
                Subscribe on YouTube
              </a>
            </form>
            
            <p className="text-offwhite/40 text-xs">
              Unsubscribe anytime. We respect your privacy and never spam.
            </p>
          </div>
        </div>
      </section> */}

      {/* Section 12: Partners */}
      <section className="section-premium py-16 border-t border-offwhite/5">
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section text-center mb-10">
            <span className="label-mono text-offwhite/40 mb-4 block">Worked With</span>
          </div>
          <div className="reveal-section flex flex-wrap justify-center items-center gap-8 lg:gap-16">
            {['DBTV', 'Real 1100', 'Abigail TV', 'Bleav', 'South Florida Tribune'].map((partner, i) => (
              <span 
                key={i} 
                className="text-[#e7363c] hover:text-offwhite/50 font-display font-bold text-lg lg:text-xl uppercase tracking-[0.2em] transition-colors cursor-pointer"
              >
                {partner}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
