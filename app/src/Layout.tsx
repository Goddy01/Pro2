import { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Zap, Menu, X, Twitter, Youtube, Instagram, Podcast } from 'lucide-react';

const marqueeFeeds = [
  { source: 'NFL.com', url: 'https://www.nfl.com/?format=rss' },
  { source: 'ESPN NFL', url: 'https://www.espn.com/espn/rss/nfl/news' },
  { source: 'CBS Sports NFL', url: 'https://www.cbssports.com/rss/headlines/nfl' },
  { source: 'Reuters Sports', url: 'https://www.reutersagency.com/feed/?best-topics=sports&post_type=best' },
];

const marqueeKeywords = ['super bowl', 'nfl draft', 'draft', 'combine', 'scouting combine', 'hall of fame'];

const fallbackMarqueeFeeds = [
  { source: 'ESPN Top Headlines', url: 'https://www.espn.com/espn/rss/news' },
  { source: 'Yahoo Sports', url: 'https://sports.yahoo.com/rss/' },
  { source: 'Sports Illustrated', url: 'https://www.si.com/rss/si_topstories.rss' },
];

const navItems = [
  { label: 'Articles', href: '/#stories' },
  { label: 'Watch', href: '/#watch' },
  { label: 'Listen', href: '/#listen' },
  { label: 'Events', href: '/#events' },
  { label: 'Media', href: '/#media' },
  { label: 'Team', to: '/team' },
  { label: 'About', href: '/#about' },
  { label: 'Contact', href: '/#contact' },
];

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [marqueeItems, setMarqueeItems] = useState<{ title: string; source: string }[]>([]);
  const [marqueeReady, setMarqueeReady] = useState(false);

  const marqueeDisplayItems = (() => {
    const items = marqueeItems.length > 0 ? [...marqueeItems] : [];
    if (items.length === 0) return [];
    while (items.length < 10) {
      items.push(items[items.length % marqueeItems.length]);
    }
    return items.slice(0, 10);
  })();
  const marqueeLoopItems = [...marqueeDisplayItems, ...marqueeDisplayItems];

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
            if (!response.ok) return [];
            const data = await response.json();
            if (!data || !Array.isArray(data.items)) return [];
            return data.items.map((item: { title?: string }) => ({
              title: item.title ?? '',
              source: feed.source,
            }));
          })
        );
        const merged = responses.flat().map((item) => ({ ...item, title: item.title.trim() })).filter((item) => item.title.length > 0);
        if (merged.length === 0) return [];
        const keywordRegex = new RegExp(marqueeKeywords.join('|'), 'i');
        const filtered = merged.filter((item) => keywordRegex.test(item.title));
        return (filtered.length > 0 ? filtered : merged).slice(0, 10);
      };
      try {
        const primaryItems = await fetchFeeds(marqueeFeeds);
        const fallbackItems = primaryItems.length === 0 ? await fetchFeeds(fallbackMarqueeFeeds) : [];
        const combined = primaryItems.length > 0 ? primaryItems : fallbackItems;
        const unique = Array.from(new Map(combined.map((item) => [item.title.toLowerCase(), item])).values());
        setMarqueeItems(unique);
        setMarqueeReady(true);
      } catch {
        const fallbackItems = await fetchFeeds(fallbackMarqueeFeeds);
        setMarqueeItems(fallbackItems);
        setMarqueeReady(true);
      }
    };
    fetchMarqueeItems();
    const refreshId = setInterval(fetchMarqueeItems, 5 * 60 * 1000);
    return () => {
      clearInterval(refreshId);
      controller.abort();
    };
  }, []);

  return (
    <div className="relative">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-forest/95 backdrop-blur-md border-b border-offwhite/5">
        <div className="px-6 lg:px-12 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo-180.png" alt="Sideline Sports & Entertainment logo" className="w-10 h-10 object-contain" />
            <span className="text-lime font-editorial font-black text-2xl italic">Sideline Sports & Entertainment</span>
          </Link>
          <div className="hidden lg:flex items-center gap-10">
            {navItems.map((item) =>
              'to' in item ? (
                <Link
                  key={item.label}
                  to={item.to as string}
                  className="text-offwhite/60 hover:text-lime text-sm font-medium tracking-wide transition-colors duration-300"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-offwhite/60 hover:text-lime text-sm font-medium tracking-wide transition-colors duration-300"
                >
                  {item.label}
                </a>
              )
            )}
          </div>
          <div className="flex items-center gap-4">
            <a href="/#subscribe" className="hidden sm:inline-flex btn-premium text-xs py-3 px-6">
              Subscribe
            </a>
            <button className="lg:hidden text-offwhite" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden bg-forest border-t border-offwhite/10 px-6 py-8">
            <div className="flex flex-col gap-6">
              {navItems.map((item) =>
                'to' in item ? (
                  <Link key={item.label} to={item.to as string} className="text-offwhite text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                    {item.label}
                  </Link>
                ) : (
                  <a key={item.label} href={item.href} className="text-offwhite text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                    {item.label}
                  </a>
                )
              )}
            </div>
          </div>
        )}
      </nav>

      <div className="fixed top-[73px] left-0 right-0 z-40 bg-lime py-2 overflow-hidden">
        <div className="flex whitespace-nowrap">
          <div className={`ticker-item flex gap-12 text-forest text-xs font-semibold uppercase tracking-wide ${marqueeReady ? 'ticker-animate' : 'ticker-pending'}`}>
            {marqueeLoopItems.map((item, index) => (
              <span key={`${item.title}-${index}`} className="flex items-center gap-2">
                <Zap className="w-3 h-3" />
                <span>{item.title}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <main className="pt-[145px]">
        <Outlet />
      </main>

      <footer id="contact" className="section-premium pt-24 pb-12 border-t border-offwhite/5">
        <div className="w-full px-6 lg:px-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img src="/logo-180.png" alt="Sideline Sports & Entertainment logo" className="w-12 h-12 object-contain" />
                <span className="text-lime font-editorial font-black text-3xl italic">Sideline Sports & Entertainment</span>
              </div>
              <p className="text-offwhite/50 text-sm max-w-md mb-6">
                Original reporting, in-depth analysis, and compelling storytelling, built for fans who want more than the box score.
              </p>
              <div className="flex items-center gap-4">
                {[
                  { icon: Twitter, label: 'X' },
                  { icon: Youtube, label: 'YouTube' },
                  { icon: Instagram, label: 'Instagram' },
                  { icon: Podcast, label: 'TikTok' },
                ].map((social, i) => (
                  <a key={i} href="#" className="w-10 h-10 border border-offwhite/20 flex items-center justify-center text-offwhite/50 hover:text-lime hover:border-lime transition-all" aria-label={social.label}>
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-offwhite font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                {['Latest Stories', 'Podcast', 'Video', 'Events', 'About Us', 'Careers'].map((link, i) => (
                  <li key={i}>
                    <a href="/#" className="text-offwhite/50 hover:text-lime text-sm transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-offwhite font-semibold mb-6">Categories</h4>
              <ul className="space-y-3">
                {['Football', 'Basketball', 'Baseball', 'Recruiting', 'Culture', 'Analysis'].map((cat, i) => (
                  <li key={i}>
                    <a href="/#" className="text-offwhite/50 hover:text-lime text-sm transition-colors">{cat}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="divider-subtle mb-8" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-offwhite/30 text-sm">© 2026 Sideline Sports & Entertainment. All rights reserved.</p>
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
