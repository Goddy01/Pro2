import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { apiUrl, authenticatedFetch } from '../lib/api';
import '../App.css';

type DateRangeDays = 1 | 7 | 30 | 90;
type InsightsRange = DateRangeDays;

type InsightsResponse = {
  range: InsightsRange;
  rangeLabel: string;
  summary: {
    totalUsers: number;
    newUsers: number;
    returningUsers: number;
    sessions: number;
    pageViews: number;
    averageEngagementTimeSeconds: number;
    averageEngagementTimeLabel: string;
    viewsPerUser: number;
  };
  topChannels: Array<{ channel: string; sessions: number }>;
  topReferrers: Array<{ source: string; sessions: number }>;
  newVsReturning: Array<{ segment: string; users: number }>;
  deviceBreakdown: Array<{ device: string; users: number }>;
  topCountries: Array<{ country: string; users: number }>;
  topPages: Array<{ title?: string; path: string; views: number }>;
  trend: Array<{ date: string; sessions: number; totalUsers: number }>;
  fetchedAt: string;
};

function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(Math.round(n));
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatGA4Date(yyyymmdd: string): string {
  // GA4 returns YYYYMMDD for the `date` dimension.
  if (/^\d{8}$/.test(yyyymmdd)) {
    const year = Number(yyyymmdd.slice(0, 4));
    const month = Number(yyyymmdd.slice(4, 6)) - 1;
    const day = Number(yyyymmdd.slice(6, 8));
    const d = new Date(Date.UTC(year, month, day));
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  return yyyymmdd;
}

export default function AdminInsights() {
  const { token, isAuthenticated } = useAuth();
  const debug = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('debug') === '1';
  const [range, setRange] = useState<InsightsRange>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [debugInfo, setDebugInfo] = useState<unknown>(null);

  function handleSelectRange(nextRange: InsightsRange) {
    if (nextRange === range) return;
    setLoading(true);
    setError('');
    setRange(nextRange);
  }

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const url = apiUrl(`/api/insights/overview?days=${range}${debug ? '&debug=1' : ''}`);
    authenticatedFetch(url, {}, token)
      .then(async (res) => {
        const payload: { error?: string; debug?: unknown } = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload.error || 'Failed to load insights');
        }
        if (!cancelled) {
          if (debug && payload.debug) setDebugInfo(payload.debug);
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
  }, [token, range, debug]);

  if (!isAuthenticated) return <Navigate to="/superuser" replace />;

  const cards = data
    ? [
        { label: 'Users', value: formatNumber(data.summary.totalUsers) },
        { label: 'New users', value: formatNumber(data.summary.newUsers) },
        { label: 'Returning users', value: formatNumber(data.summary.returningUsers) },
        { label: 'Sessions', value: formatNumber(data.summary.sessions) },
        { label: 'Page views', value: formatNumber(data.summary.pageViews) },
        { label: 'Avg engagement time', value: data.summary.averageEngagementTimeLabel },
        { label: 'Views per user', value: data.summary.viewsPerUser.toFixed(2) },
        {
          label: 'New user share',
          value:
            data.summary.totalUsers > 0
              ? formatPercent(data.summary.newUsers / data.summary.totalUsers)
              : '0.0%',
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-forest px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
          <Link to="/admin" className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 w-full sm:w-auto">
            {[1, 7, 30, 90].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleSelectRange(value as InsightsRange)}
                className={`px-3 py-2 text-sm border transition-colors whitespace-nowrap shrink-0 ${
                  range === value
                    ? 'bg-lime text-forest border-lime'
                    : 'border-offwhite/25 text-offwhite/80 hover:text-lime hover:border-lime'
                }`}
              >
                {value === 30 ? 'Last 1m' : value === 90 ? 'Last 3m' : `Last ${value}d`}
              </button>
            ))}
          </div>
        </div>

        <h1 className="text-offwhite font-editorial font-bold text-xl sm:text-2xl mb-2">Client Insights</h1>
        {/* <p className="text-offwhite/60 text-sm mb-6">Simple traffic overview powered by Google Analytics.</p> */}

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
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-8">
              {cards.map((card) => (
                <article key={card.label} className="border border-offwhite/20 bg-offwhite/5 rounded p-4">
                  <p className="text-offwhite/60 text-xs uppercase tracking-wide mb-1">{card.label}</p>
                  <p className="text-offwhite text-lg sm:text-2xl font-semibold break-words">{card.value}</p>
                </article>
              ))}
            </div>

            <section className="border border-offwhite/20 bg-offwhite/5 rounded p-4 sm:p-5 mb-6">
              <h2 className="text-offwhite font-semibold text-sm sm:text-base mb-3">Sessions trend ({data.rangeLabel})</h2>
              <div className="h-56 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[...(data.trend || [])]
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((p) => ({ ...p, dateLabel: formatGA4Date(p.date) }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="dateLabel" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.12)' }}
                      labelStyle={{ color: 'white' }}
                      formatter={(v: unknown) => new Intl.NumberFormat().format(Number(v))}
                    />
                    <Line type="monotone" dataKey="sessions" stroke="#A3E635" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <section className="border border-offwhite/20 bg-offwhite/5 rounded p-4 sm:p-5">
                <h2 className="text-offwhite font-semibold text-sm sm:text-base mb-3">Top referrers</h2>
                {data.topReferrers?.length ? (
                  <ul className="space-y-2">
                    {data.topReferrers.map((item) => (
                      <li key={item.source} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-offwhite/80 min-w-0 break-all">{item.source}</span>
                        <span className="text-lime font-semibold shrink-0">{formatNumber(item.sessions)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-offwhite/60 text-sm">No referrer data.</p>
                )}
              </section>

              <section className="border border-offwhite/20 bg-offwhite/5 rounded p-4 sm:p-5">
                <h2 className="text-offwhite font-semibold text-sm sm:text-base mb-3">Top traffic channels</h2>
                {data.topChannels?.length ? (
                  <ul className="space-y-2">
                    {data.topChannels.map((item) => (
                      <li key={item.channel} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-offwhite/80">{item.channel}</span>
                        <span className="text-lime font-semibold shrink-0">{formatNumber(item.sessions)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-offwhite/60 text-sm">No channel data.</p>
                )}
              </section>

              <section className="border border-offwhite/20 bg-offwhite/5 rounded p-4 sm:p-5">
                <h2 className="text-offwhite font-semibold text-sm sm:text-base mb-3">Where visitors are viewing from</h2>
                {data.topCountries.length === 0 ? (
                  <p className="text-offwhite/60 text-sm">No country data.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.topCountries?.length ? (
                      data.topCountries.map((item) => (
                        <li key={item.country} className="flex items-center justify-between text-sm">
                          <span className="text-offwhite/80">{item.country}</span>
                          <span className="text-lime font-semibold">{formatNumber(item.users)}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-offwhite/60 text-sm">No country data.</li>
                    )}
                  </ul>
                )}
              </section>

              <section className="border border-offwhite/20 bg-offwhite/5 rounded p-4 sm:p-5">
                <h2 className="text-offwhite font-semibold text-sm sm:text-base mb-3">New vs Returning</h2>
                {data.newVsReturning?.length ? (
                  <ul className="space-y-2">
                    {data.newVsReturning.map((item) => (
                      <li key={item.segment} className="flex items-center justify-between text-sm">
                        <span className="text-offwhite/80">{item.segment}</span>
                        <span className="text-lime font-semibold">{formatNumber(item.users)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-offwhite/60 text-sm">No new vs returning data.</p>
                )}
              </section>

              <section className="border border-offwhite/20 bg-offwhite/5 rounded p-4 sm:p-5">
                <h2 className="text-offwhite font-semibold text-sm sm:text-base mb-3">Device breakdown</h2>
                {data.deviceBreakdown?.length ? (
                  <ul className="space-y-2">
                    {data.deviceBreakdown.map((item) => (
                      <li key={item.device} className="flex items-center justify-between text-sm">
                        <span className="text-offwhite/80 capitalize">{item.device}</span>
                        <span className="text-lime font-semibold">{formatNumber(item.users)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-offwhite/60 text-sm">No device data.</p>
                )}
              </section>

              <section className="border border-offwhite/20 bg-offwhite/5 rounded p-4 sm:p-5">
                <h2 className="text-offwhite font-semibold text-sm sm:text-base mb-3">Pages visitors viewed (top)</h2>
                {data.topPages.length === 0 ? (
                  <p className="text-offwhite/60 text-sm">No page data.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.topPages.map((item) => {
                      const label = item.title?.trim() ? item.title : item.path;
                      return (
                        <li key={`${item.path}-${item.title || 'page'}`} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-offwhite/80 min-w-0 truncate">{label}</span>
                          <span className="text-lime font-semibold shrink-0">{formatNumber(item.views)}</span>
                        </li>
                      );
                    })}
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
