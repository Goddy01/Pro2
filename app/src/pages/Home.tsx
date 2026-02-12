import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Play, ArrowRight, Youtube, Podcast, 
  Headphones, Clock, 
  Calendar, User, Bookmark, Share2,
  Star, ArrowUpRight
} from 'lucide-react';
import '../App.css';

gsap.registerPlugin(ScrollTrigger);

const PODCAST_LINKS = [
  { href: 'https://www.youtube.com/@sidelinesports3840', icon: Youtube, label: 'YouTube' },
  { href: 'https://open.spotify.com/show/35pw2rvjZ1xEagLJS72Gpf', icon: Podcast, label: 'Spotify' },
  { href: 'https://podcasts.apple.com/us/podcast/sideline-sports/id1565070611', icon: Podcast, label: 'Apple Podcasts' },
];

export default function Home() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [showPodcastPlatforms, setShowPodcastPlatforms] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

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
    { id: 4, title: 'Preview Show Ep. 12: Playoffs, Predictions, and Guest Takes', category: 'Podcast', excerpt: 'This week, we\'re joined by former Pro Bowl linebacker Marcus Williams to break down the playoff picture. We discuss the teams that surprised us, the ones that disappointed, and make our bold predictions for the road to the championship. Plus, we answer listener questions about the biggest storylines heading into the postseason.', author: 'Sideline Sports & Entertainment Team', image: '/grid_4.jpg', date: 'January 10, 2026', readTime: '45 min listen' },
    { id: 5, title: 'Photo Essay: Under the Lights — Moments From the Night Game', category: 'Events', excerpt: 'There\'s something magical about night games. The stadium lights cutting through the darkness, the breath visible in the cold air, the roar of the crowd echoing into the night. Our photography team spent the entire game capturing the moments that define why we love this sport — the tension, the joy, the heartbreak, and the triumph.', author: 'Sarah Chen', authorRole: 'Photo Editor', image: '/grid_5.jpg', date: 'January 8, 2026', readTime: '6 min read' },
    { id: 6, title: 'By the Numbers: What the Defense Stats Actually Say', category: 'Analysis', excerpt: 'Traditional statistics tell one story, but advanced analytics reveal another. We dove deep into the data — pressure rates, coverage grades, tackling efficiency, and more — to understand why this defense has been so effective. The numbers might surprise you, and they definitely challenge some conventional wisdom.', author: 'David Park', authorRole: 'Analytics Director', image: '/grid_6.jpg', date: 'January 5, 2026', readTime: '10 min read' },
  ];

  const podcastEpisodes = [
    {
      id: 1,
      title: 'Micah Parsons Trade Drama & Jon Shearer’s Top 10 Hall of Fame Picks',
      description: 'We break down the developing situation surrounding Micah Parsons requesting a trade out of Dallas and what it could mean for the Cowboys moving forward. Jon Shearer also joins the show to reveal and defend his Top 10 Hall of Fame selections, sparking plenty of debate and strong opinions.',
      duration: '01:02:28',
      guests: ['JB Ellis ', 'Jon Shearer', 'Dave DesRochers'],
    },
    {
      id: 2,
      title: 'Live from Radio Row: Super Bowl LIX Recap & Eagles Dominate 40–22',
      description: 'Broadcasting from Radio Row in New Orleans, we recap the atmosphere, major storylines, and defining moments from Super Bowl LIX. The Philadelphia Eagles secured a 40 to 22 victory over the Kansas City Chiefs, and we analyze how the game unfolded and what it means for both teams.',
      duration: '59:02',
      guests: ['JB Ellis ', 'Jon Shearer', 'Dave DesRochers']
    },
    {
      id: 3,
      title: 'CFP Semifinals Recap and National Championship Breakdown Miami vs Indiana',
      description: 'We revisit the biggest moments from the College Football Playoff semifinals and provide a full breakdown of the national championship matchup between Miami and Indiana. Key matchups, game changing factors, and predictions are all covered ahead of kickoff.',
      duration: '59:57',
      guests: ['JB Ellis','Jon Shearer', 'Dave DesRochers']
    }
  ];

  const testimonials = [
    {
      quote: 'Sideline Sports & Entertainment has become essential reading for me. The depth of analysis, the quality of writing, and the unique perspectives set it apart from everything else in sports media.',
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
                  Listen to Podcast
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

      {/* Section 3: More Stories You'll Love */}
      <section className="section-light-premium py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="reveal-section mb-12">
            <span className="label-mono text-forest/60 mb-4 block">Latest</span>
            <h2 className="headline-section text-forest text-4xl mb-6">
              More Stories You'll Love
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {articleCards.map((card) => (
              <article key={card.id} className="stagger-card group cursor-pointer">
                <div className="bg-offwhite border border-forest/10 overflow-hidden hover:shadow-2xl transition-shadow duration-500">
                  <div className="relative overflow-hidden h-[220px]">
                    <img src={card.image} alt={card.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
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
            ))}
          </div>

          <div className="reveal-section text-center">
            <a href="/stories" className="btn-premium inline-flex items-center gap-2">
              Read More Stories
              <ArrowUpRight className="w-4 h-4" />
            </a>
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
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-offwhite/40 text-xs">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {episode.duration}</span>
                          {episode.guests?.length ? (
                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {episode.guests.join(', ')}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-offwhite/60 text-sm mb-3">Listen to more podcasts</p>
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
                <h3 className="text-offwhite font-editorial font-semibold text-xl mt-8 mb-3">Mission statement</h3>
                <p>
                  Sideline Sports is committed to delivering authentic coverage of sports and entertainment rooted in credibility, insight, and passion. We prioritize substance over sensationalism, informed analysis over empty headlines, and meaningful storytelling over click-driven noise. Our mission is to be a trusted source for fans who want real conversations about the games, the culture, and the moments that shape both industries.
                </p>
                <p>
                  Sideline Sports has accepted the challenge to fill the void in sports and entertainment coverage. We deliver authentic, informed reporting, thoughtful analysis, and meaningful storytelling — free from hype, clickbait, or political noise. Our mission is to be a trusted destination for fans who want real insight, real conversations, and real coverage of the moments and personalities that shape sports and entertainment.
                </p>
              </div>
            </div>
            <div className="relative overflow-hidden max-h-[380px] lg:max-h-[420px]">
              <img 
                src="/team.jpg" 
                alt="Team celebration" 
                className="w-full h-full object-cover object-center img-editorial"
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
            {['Sideline Sports & Entertainment', 'Gauntlet Media', 'Philly Voice', 'SportsRadio WIP', 'Fox29', 'ESPN'].map((partner, i) => (
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
    </div>
  );
}
