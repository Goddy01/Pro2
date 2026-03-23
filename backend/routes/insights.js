import { Router } from 'express';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const ALLOWED_DAYS = new Set([7, 30, 90]);
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatYMDUTC(d) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function parseDateHourMs(dateHourValue) {
  // Expected format: YYYYMMDDHH (10 digits) for GA4 Data API dimension `dateHour`.
  if (!/^\d{10}$/.test(String(dateHourValue || ''))) return null;
  const s = String(dateHourValue);
  const year = Number(s.slice(0, 4));
  const month = Number(s.slice(4, 6)) - 1;
  const day = Number(s.slice(6, 8));
  const hour = Number(s.slice(8, 10));
  // Use UTC to match how GA typically formats dateHour values.
  return Date.UTC(year, month, day, hour);
}

function getPropertyName() {
  const raw = (process.env.GA4_PROPERTY_ID || '').trim();
  if (!raw) return '';
  return raw.startsWith('properties/') ? raw : `properties/${raw}`;
}

function createClient() {
  const clientEmail = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim();
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY || '';
  const privateKeyB64 = (process.env.GOOGLE_PRIVATE_KEY_BASE64 || '').trim();

  let privateKey = '';
  if (privateKeyB64) {
    try {
      privateKey = Buffer.from(privateKeyB64, 'base64').toString('utf8');
    } catch {
      privateKey = '';
    }
  } else {
    privateKey = privateKeyRaw.trim();
    if (
      (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))
    ) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
  }

  // Normalize both PEM inputs (base64 or raw .env) to match expected PEM formatting.
  privateKey = privateKey.trim();
  if (
    (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
    (privateKey.startsWith("'") && privateKey.endsWith("'"))
  ) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');

  if (!privateKey || !privateKey.includes('BEGIN PRIVATE KEY') || !privateKey.includes('END PRIVATE KEY')) {
    return res.status(500).json({
      error:
        'Google private key does not look like a valid PEM. Ensure you copied the full private_key from the service account JSON (no redaction) and that GOOGLE_PRIVATE_KEY_BASE64 / GOOGLE_PRIVATE_KEY is not truncated.',
    });
  }

  if (clientEmail && privateKey) {
    return new BetaAnalyticsDataClient({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
    });
  }

  return new BetaAnalyticsDataClient();
}

function metricValueByIndex(metricValues, idx) {
  const raw = metricValues?.[idx]?.value ?? '0';
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.round(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}m ${String(secs).padStart(2, '0')}s`;
}

router.get('/overview', authMiddleware, async (req, res) => {
  const property = getPropertyName();
  if (!property) {
    return res.status(500).json({ error: 'GA4_PROPERTY_ID is not configured' });
  }

  const debug = String(req.query.debug || '').toLowerCase() === '1';

  const rangeParam = String(req.query.range || req.query.window || '').toLowerCase();
  const now = new Date();
  const endMs = now.getTime();
  const startMs = endMs - THIRTY_MINUTES_MS;

  const requestedDays = Number(req.query.days);
  const days = ALLOWED_DAYS.has(requestedDays) ? requestedDays : 30;

  const isThirtyMinutes = rangeParam === '30m';
  const range = isThirtyMinutes ? '30m' : days;
  const rangeLabel = isThirtyMinutes ? 'Last 30m (approx)' : `Last ${days}d`;

  const dateRanges = isThirtyMinutes
    ? [{ startDate: formatYMDUTC(new Date(startMs)), endDate: formatYMDUTC(now) }]
    : [{ startDate: `${days}daysAgo`, endDate: 'today' }];

  try {
    const client = createClient();

    let summary = {
      totalUsers: 0,
      newUsers: 0,
      sessions: 0,
      pageViews: 0,
      avgSessionDurationSeconds: 0,
      avgSessionDurationLabel: formatDuration(0),
      engagementRate: 0,
      bounceRate: 0,
      keyEvents: 0,
    };

    let topChannels = [];
    let topPages = [];
    let topCountries = [];
    let trend = [];

    let summaryRequest;
    let channelsRequest = null;
    let pagesRequest;
    let countriesRequest;
    let trendRequest;
    let summaryReportForDebug = null;

    if (isThirtyMinutes) {
      // Approximate 30m using GA4 `dateHour` buckets and filtering to the last ~30 minutes.
      // Data API does not provide true minute-level realtime.
      summaryRequest = {
        property,
        dateRanges,
        dimensions: [{ name: 'dateHour' }],
        metrics: [
          { name: 'activeUsers' }, // 0
          { name: 'newUsers' }, // 1
          { name: 'sessions' }, // 2
          { name: 'screenPageViews' }, // 3
          { name: 'averageSessionDuration' }, // 4
          { name: 'engagementRate' }, // 5
          { name: 'bounceRate' }, // 6
          { name: 'keyEvents' }, // 7
        ],
        limit: 200,
      };

      const [summaryReport] = await client.runReport(summaryRequest);
      summaryReportForDebug = summaryReport;
      const rows = summaryReport.rows || [];
      const rowsInRange = rows.filter((r) => {
        const dateHour = r.dimensionValues?.[0]?.value;
        const hourMs = parseDateHourMs(dateHour);
        if (hourMs == null) return false;
        // Include the hour bucket if it overlaps the requested 30m window.
        return hourMs < endMs && hourMs + 60 * 60 * 1000 > startMs;
      });

      let totalActiveUsers = 0;
      let totalNewUsers = 0;
      let totalSessions = 0;
      let totalPageViews = 0;
      let weightedAvgSessionDuration = 0;
      let weightedEngagementRate = 0;
      let weightedBounceRate = 0;
      let totalKeyEvents = 0;

      for (const r of rowsInRange) {
        const mv = r.metricValues || [];
        const activeUsers = metricValueByIndex(mv, 0);
        const newUsers = metricValueByIndex(mv, 1);
        const sessions = metricValueByIndex(mv, 2);
        const pageViews = metricValueByIndex(mv, 3);
        const avgSessionDurationSeconds = metricValueByIndex(mv, 4);
        const engagementRate = metricValueByIndex(mv, 5);
        const bounceRate = metricValueByIndex(mv, 6);
        const keyEvents = metricValueByIndex(mv, 7);

        totalActiveUsers += activeUsers;
        totalNewUsers += newUsers;
        totalSessions += sessions;
        totalPageViews += pageViews;
        weightedAvgSessionDuration += avgSessionDurationSeconds * sessions;
        weightedEngagementRate += engagementRate * sessions;
        weightedBounceRate += bounceRate * sessions;
        totalKeyEvents += keyEvents;
      }

      const avgSessionDurationSeconds = totalSessions > 0 ? weightedAvgSessionDuration / totalSessions : 0;
      const engagementRate = totalSessions > 0 ? weightedEngagementRate / totalSessions : 0;
      const bounceRate = totalSessions > 0 ? weightedBounceRate / totalSessions : 0;

      summary = {
        totalUsers: totalActiveUsers,
        newUsers: totalNewUsers,
        sessions: totalSessions,
        pageViews: totalPageViews,
        avgSessionDurationSeconds,
        avgSessionDurationLabel: formatDuration(avgSessionDurationSeconds),
        engagementRate,
        bounceRate,
        keyEvents: totalKeyEvents,
      };

      // Trend: sessions by hour bucket.
      trend = rowsInRange
        .map((r) => {
          const dateHour = r.dimensionValues?.[0]?.value || '';
          return {
            date: dateHour,
            sessions: metricValueByIndex(r.metricValues || [], 2),
            totalUsers: metricValueByIndex(r.metricValues || [], 0),
          };
        })
        .filter((p) => p.date)
        .sort((a, b) => a.date.localeCompare(b.date));

      // Countries (top by active users) within the last 30m window.
      countriesRequest = {
        property,
        dateRanges,
        dimensions: [{ name: 'country' }, { name: 'dateHour' }],
        metrics: [{ name: 'activeUsers' }],
        limit: 500,
      };
      const [countriesReport] = await client.runReport(countriesRequest);
      const countryMap = new Map();
      for (const r of countriesReport.rows || []) {
        const country = r.dimensionValues?.[0]?.value || 'Unassigned';
        const dateHour = r.dimensionValues?.[1]?.value || '';
        const hourMs = parseDateHourMs(dateHour);
        if (hourMs == null) continue;
        if (!(hourMs < endMs && hourMs + 60 * 60 * 1000 > startMs)) continue;
        const users = metricValueByIndex(r.metricValues || [], 0);
        countryMap.set(country, (countryMap.get(country) || 0) + users);
      }
      topCountries = Array.from(countryMap.entries())
        .map(([country, users]) => ({ country, users }))
        .sort((a, b) => b.users - a.users)
        .slice(0, 5);

      // Pages (top by screen page views) within the last 30m window.
      pagesRequest = {
        property,
        dateRanges,
        dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }, { name: 'dateHour' }],
        metrics: [{ name: 'screenPageViews' }],
        limit: 1000,
      };
      const [pagesReport] = await client.runReport(pagesRequest);
      const pageMap = new Map();
      for (const r of pagesReport.rows || []) {
        const title = r.dimensionValues?.[0]?.value || '';
        const path = r.dimensionValues?.[1]?.value || '/';
        const dateHour = r.dimensionValues?.[2]?.value || '';
        const hourMs = parseDateHourMs(dateHour);
        if (hourMs == null) continue;
        if (!(hourMs < endMs && hourMs + 60 * 60 * 1000 > startMs)) continue;
        const views = metricValueByIndex(r.metricValues || [], 0);
        const key = `${title}|||${path}`;
        pageMap.set(key, (pageMap.get(key) || 0) + views);
      }
      topPages = Array.from(pageMap.entries())
        .map(([key, views]) => {
          const [title, path] = key.split('|||');
          return { title, path, views };
        })
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);
    } else {
      // Daily/weekly view (exact for the chosen range).
      const requestedSummaryRequest = {
        property,
        dateRanges,
        metrics: [
          { name: 'totalUsers' },
          { name: 'newUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'engagementRate' },
          { name: 'bounceRate' },
          { name: 'keyEvents' },
        ],
      };
      summaryRequest = requestedSummaryRequest;

      const [summaryReport] = await client.runReport(requestedSummaryRequest);
      summaryReportForDebug = summaryReport;
      const summaryRow = summaryReport.rows?.[0] || null;
      const summaryMetricValues = summaryRow?.metricValues || [];

      summary = {
        // Metrics are requested in a fixed order above; map by index to avoid header-name mismatches.
        totalUsers: metricValueByIndex(summaryMetricValues, 0),
        newUsers: metricValueByIndex(summaryMetricValues, 1),
        sessions: metricValueByIndex(summaryMetricValues, 2),
        pageViews: metricValueByIndex(summaryMetricValues, 3),
        avgSessionDurationSeconds: metricValueByIndex(summaryMetricValues, 4),
        avgSessionDurationLabel: formatDuration(metricValueByIndex(summaryMetricValues, 4)),
        engagementRate: metricValueByIndex(summaryMetricValues, 5),
        bounceRate: metricValueByIndex(summaryMetricValues, 6),
        keyEvents: metricValueByIndex(summaryMetricValues, 7),
      };

      const requestedChannelsRequest = {
        property,
        dateRanges,
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 5,
      };
      channelsRequest = requestedChannelsRequest;
      const [channelsReport] = await client.runReport(requestedChannelsRequest);
      topChannels = (channelsReport.rows || []).map((row) => ({
        channel: row.dimensionValues?.[0]?.value || 'Unassigned',
        sessions: Number(row.metricValues?.[0]?.value || '0'),
      }));

      pagesRequest = {
        property,
        dateRanges,
        dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 5,
      };
      const [pagesReport] = await client.runReport(pagesRequest);
      topPages = (pagesReport.rows || []).map((row) => ({
        title: row.dimensionValues?.[0]?.value || '',
        path: row.dimensionValues?.[1]?.value || '/',
        views: Number(row.metricValues?.[0]?.value || '0'),
      }));

      trendRequest = {
        property,
        dateRanges,
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
        limit: 1000,
      };
      const [trendReport] = await client.runReport(trendRequest);
      trend = (trendReport.rows || [])
        .map((row) => {
          const date = row.dimensionValues?.[0]?.value || '';
          const metricValues = row.metricValues || [];
          return {
            date,
            sessions: metricValueByIndex(metricValues, 0),
            totalUsers: metricValueByIndex(metricValues, 1),
          };
        })
        .filter((r) => r.date);

      countriesRequest = {
        property,
        dateRanges,
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'totalUsers' }],
        orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
        limit: 5,
      };
      const [countriesReport] = await client.runReport(countriesRequest);
      topCountries = (countriesReport.rows || []).map((row) => ({
        country: row.dimensionValues?.[0]?.value || 'Unassigned',
        users: Number(row.metricValues?.[0]?.value || '0'),
      }));
    }

    const payload = {
      days,
      range,
      rangeLabel,
      property,
      dateRanges,
      summary,
      topChannels,
      topPages,
      topCountries,
      trend,
      fetchedAt: new Date().toISOString(),
    };

    if (debug) {
      payload.debug = {
        summaryRequest,
        summaryMetricHeaders: summaryReportForDebug?.metricHeaders || [],
        summaryMetricValues: (summaryReportForDebug?.rows || []).map((r) => r.metricValues || []),
        channelsRequest: channelsRequest,
        pagesRequest: pagesRequest,
        countriesRequest: countriesRequest,
        trendRequest: trendRequest,
      };
    }

    return res.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load Google Analytics data';
    if (
      /DECODER routines|PEM routines|private key|key format/i.test(message)
    ) {
      return res.status(500).json({
        error:
          'Google service-account private key is invalid or improperly formatted. Check GOOGLE_PRIVATE_KEY and escaped newline formatting.',
      });
    }
    return res.status(500).json({ error: message });
  }
});

export default router;
