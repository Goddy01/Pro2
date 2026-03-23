import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiUrl, authenticatedFetch } from '../lib/api';
import '../App.css';

type DateRangeDays = 7 | 30 | 90;

type InsightsResponse = {
  days: number;
  summary: {
    totalUsers: number;
    newUsers: number;
    sessions: number;
    pageViews: number;
    avgSessionDurationSeconds: number;
    avgSessionDurationLabel: string;
    engagementRate: number;
    bounceRate: number;
    keyEvents: number;
  };
  topChannels: Array<{ channel: string; sessions: number }>;
  topPages: Array<{ path: string; views: number }>;
  fetchedAt: string;
};

function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(Math.round(n));
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export default function AdminInsights() {
  const { token, isAuthenticated } = useAuth();
  const debug = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('debug') === '1';
  const [days, setDays] = useState<DateRangeDays>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  function handleSelectDays(nextDays: DateRangeDays) {
    if (nextDays === days) return;
    setLoading(true);
    setError('');
    setDays(nextDays);
  }

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const url = apiUrl(`/api/insights/overview?days=${days}${debug ? '&debug=1' : ''}`);
    authenticatedFetch(url, {}, token)
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error((payload as { error?: string }).error || 'Failed to load insights');
        }
        if (!cancelled) {
          if (debug && (payload as any).debug) setDebugInfo((payload as any).debug);
          setData(payload as InsightsResponse);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Could not connect to server';
          setError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, days]);

  if (!isAuthenticated) return <Navigate to="/superuser" replace />;

  const cards = data
    ? [
        { label: 'Users', value: formatNumber(data.summary.totalUsers) },
        { label: 'New users', value: formatNumber(data.summary.newUsers) },
        { label: 'Sessions', value: formatNumber(data.summary.sessions) },
        { label: 'Page views', value: formatNumber(data.summary.pageViews) },
        { label: 'Avg session', value: data.summary.avgSessionDurationLabel },
        { label: 'Engagement rate', value: formatPercent(data.summary.engagementRate) },
        { label: 'Bounce rate', value: formatPercent(data.summary.bounceRate) },
        { label: 'Key events', value: formatNumber(data.summary.keyEvents) },
      ]
    : [];

  return (
    <div className="min-h-screen bg-forest px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <Link to="/admin" className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
          <div className="flex items-center gap-2">
            {[7, 30, 90].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleSelectDays(value as DateRangeDays)}
                className={`px-3 py-2 text-sm border transition-colors ${
                  days === value
                    ? 'bg-lime text-forest border-lime'
                    : 'border-offwhite/25 text-offwhite/80 hover:text-lime hover:border-lime'
                }`}
              >
                Last {value}d
              </button>
            ))}
          </div>
        </div>

        <h1 className="text-offwhite font-editorial font-bold text-2xl mb-2">Client Insights</h1>
        <p className="text-offwhite/60 text-sm mb-6">Simple traffic overview powered by Google Analytics.</p>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {loading ? (
          <p className="text-offwhite/70 inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading insights...
          </p>
        ) : !data ? (
          <p className="text-offwhite/70">No analytics data yet.</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {cards.map((card) => (
                <article key={card.label} className="border border-offwhite/20 bg-offwhite/5 rounded p-4">
                  <p className="text-offwhite/60 text-xs uppercase tracking-wide mb-1">{card.label}</p>
                  <p className="text-offwhite text-2xl font-semibold">{card.value}</p>
                </article>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="border border-offwhite/20 bg-offwhite/5 rounded p-5">
                <h2 className="text-offwhite font-semibold mb-3">Top traffic channels</h2>
                {data.topChannels.length === 0 ? (
                  <p className="text-offwhite/60 text-sm">No channel data.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.topChannels.map((item) => (
                      <li key={item.channel} className="flex items-center justify-between text-sm">
                        <span className="text-offwhite/80">{item.channel}</span>
                        <span className="text-lime font-semibold">{formatNumber(item.sessions)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="border border-offwhite/20 bg-offwhite/5 rounded p-5">
                <h2 className="text-offwhite font-semibold mb-3">Top pages</h2>
                {data.topPages.length === 0 ? (
                  <p className="text-offwhite/60 text-sm">No page data.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.topPages.map((item) => (
                      <li key={item.path} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-offwhite/80 truncate">{item.path}</span>
                        <span className="text-lime font-semibold shrink-0">{formatNumber(item.views)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <p className="text-offwhite/50 text-xs mt-6">
              Last updated: {new Date(data.fetchedAt).toLocaleString()}
            </p>

            {debug && debugInfo && (
              <details className="mt-6 border border-offwhite/20 bg-offwhite/5 rounded p-4">
                <summary className="cursor-pointer text-offwhite/70 text-sm mb-2">Debug (raw GA4 response)</summary>
                <pre className="text-offwhite/80 text-xs whitespace-pre-wrap overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            )}
          </>
        )}
      </div>
    </div>
  );
}
