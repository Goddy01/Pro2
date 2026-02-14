import { useEffect, useState, type FormEvent } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Zap, Menu, X, Youtube, Instagram } from 'lucide-react';
import { apiUrl } from './lib/api';

function IconXLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconTikTok({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { href: 'https://x.com/sidelinesports', icon: IconXLogo, label: 'X' },
  { href: 'https://www.instagram.com/sidelinesport1', icon: Instagram, label: 'Instagram' },
  { href: 'https://www.tiktok.com/@sidelinesports?_r=1&_t=ZP-93rbPS1Y3Be', icon: IconTikTok, label: 'TikTok' },
  { href: 'https://www.youtube.com/@sidelinesports3840?si=E5TmSrVYn-l-qBWh', icon: Youtube, label: 'YouTube' },
];

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
  { label: 'Articles', to: '/stories' },
  { label: 'Listen & Watch', to: '/listen-watch' },
  { label: 'About', href: '/#about' },
  { label: 'Work with Us', to: '/work-with-us' },
  { label: 'Team', to: '/team' },
  { label: 'Media', to: '/gallery' },
  { label: 'Coverage', to: '/coverage' },
  { label: 'Events', to: '/events' },
];

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [marqueeItems, setMarqueeItems] = useState<{ title: string; source: string }[]>([]);
  const [marqueeReady, setMarqueeReady] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupCell, setSignupCell] = useState('');
  const [signupStatus, setSignupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [signupMessage, setSignupMessage] = useState('');

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

  async function handleNewsletterSignup(e: FormEvent) {
    e.preventDefault();
    setSignupStatus('loading');
    setSignupMessage('');
    try {
      const res = await fetch(apiUrl('/api/newsletter-signups'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: signupName.trim(), email: signupEmail.trim(), cell: signupCell.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSignupStatus('error');
        setSignupMessage(data.error || 'Something went wrong.');
        return;
      }
      setSignupStatus('success');
      setSignupMessage('Thanks! You’re signed up for the latest Sideline Sports news.');
      setSignupName('');
      setSignupEmail('');
      setSignupCell('');
    } catch {
      setSignupStatus('error');
      setSignupMessage('Could not sign up. Please try again.');
    }
  }

  return (
    <div className="relative">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-forest/95 backdrop-blur-md border-b border-offwhite/5">
        <div className="px-6 lg:px-12 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo-180.png" alt="Sideline Sports & Entertainment logo" className="w-10 h-10 object-contain" decoding="async" width={40} height={40} />
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
            <a href="#signup" className="hidden sm:inline-flex btn-premium text-xs py-3 px-6">
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
              <a href="#signup" className="text-offwhite text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                Subscribe
              </a>
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

      <main className="pt-[110px]">
        <Outlet />
      </main>

      <footer id="contact" className="section-premium pt-24 pb-12 border-t border-offwhite/5">
        <div className="w-full px-6 lg:px-12">
          <div id="signup" className="max-w-2xl mb-16 scroll-mt-28">
            <h3 className="text-offwhite font-display font-bold text-xl mb-2">Sign up for more information</h3>
            <p className="text-offwhite/60 text-sm mb-4">
              Get the latest Sideline Sports news and information. We’ll compile a list of everyone interested.
            </p>
            <form onSubmit={handleNewsletterSignup} className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <input
                type="text"
                placeholder="Name"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                required
                className="flex-1 min-w-[160px] px-4 py-3 bg-offwhite/5 border border-offwhite/20 text-offwhite placeholder:text-offwhite/40 focus:outline-none focus:border-lime"
              />
              <input
                type="email"
                placeholder="Email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
                className="flex-1 min-w-[160px] px-4 py-3 bg-offwhite/5 border border-offwhite/20 text-offwhite placeholder:text-offwhite/40 focus:outline-none focus:border-lime"
              />
              <input
                type="tel"
                placeholder="Cell"
                value={signupCell}
                onChange={(e) => setSignupCell(e.target.value)}
                required
                className="flex-1 min-w-[140px] px-4 py-3 bg-offwhite/5 border border-offwhite/20 text-offwhite placeholder:text-offwhite/40 focus:outline-none focus:border-lime"
              />
              <button
                type="submit"
                disabled={signupStatus === 'loading'}
                className="px-6 py-3 bg-lime text-forest font-display font-bold uppercase tracking-wide hover:bg-lime/90 disabled:opacity-60 transition-colors"
              >
                {signupStatus === 'loading' ? 'Signing up…' : 'Sign up'}
              </button>
            </form>
            {signupStatus === 'success' && <p className="mt-3 text-lime text-sm">{signupMessage}</p>}
            {signupStatus === 'error' && <p className="mt-3 text-red-400 text-sm">{signupMessage}</p>}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img src="/logo-180.png" alt="Sideline Sports & Entertainment logo" className="w-12 h-12 object-contain" decoding="async" width={48} height={48} />
                <span className="text-lime font-editorial font-black text-3xl italic">Sideline Sports & Entertainment</span>
              </div>
              <p className="text-offwhite/50 text-sm max-w-md mb-6">
                Original reporting, in-depth analysis, and compelling storytelling, built for fans who want more than the box score.
              </p>
              <div className="flex items-center gap-4">
                {SOCIAL_LINKS.map((social, i) => (
                  <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-offwhite/20 flex items-center justify-center text-offwhite/50 hover:text-lime hover:border-lime transition-all" aria-label={social.label}>
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
