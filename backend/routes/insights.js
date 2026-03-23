import { Router } from 'express';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const ALLOWED_DAYS = new Set([1, 7, 30, 90]);
const TOP_PAGES_LIMIT = 25;
const TOP_COUNTRIES_LIMIT = 5;

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
    throw new Error(
      'Google private key does not look like a valid PEM. Ensure GOOGLE_PRIVATE_KEY_BASE64 / GOOGLE_PRIVATE_KEY is not truncated.'
    );
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

function resolveDays(req) {
  const daysParam = Number(req.query.days);
  if (ALLOWED_DAYS.has(daysParam)) return daysParam;

  const rangeParam = String(req.query.range || req.query.window || '').toLowerCase();
  const aliasMap = {
    '1d': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1m': 30,
    '3m': 90,
  };

  return aliasMap[rangeParam] && ALLOWED_DAYS.has(aliasMap[rangeParam]) ? aliasMap[rangeParam] : 30;
}

router.get('/overview', authMiddleware, async (req, res) => {
  const property = getPropertyName();
  if (!property) {
    return res.status(500).json({ error: 'GA4_PROPERTY_ID is not configured' });
  }

  const debug = String(req.query.debug || '').toLowerCase() === '1';
  const days = resolveDays(req);
  const rangeLabelMap = {
    1: 'Last 1d',
    7: 'Last 7d',
    30: 'Last 1m',
    90: 'Last 3m',
  };
  const range = `${days}d`;
  const rangeLabel = rangeLabelMap[days] || `Last ${days}d`;
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: 'today' }];

  try {
    const client = createClient();
    const summaryRequest = {
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

    const [summaryReport] = await client.runReport(summaryRequest);
    const summaryRow = summaryReport.rows?.[0] || null;
    const summaryMetricValues = summaryRow?.metricValues || [];

    const summary = {
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

    const channelsRequest = {
      property,
      dateRanges,
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 5,
    };
    const [channelsReport] = await client.runReport(channelsRequest);
    const topChannels = (channelsReport.rows || []).map((row) => ({
      channel: row.dimensionValues?.[0]?.value || 'Unassigned',
      sessions: Number(row.metricValues?.[0]?.value || '0'),
    }));

    const pagesRequest = {
      property,
      dateRanges,
      dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: TOP_PAGES_LIMIT,
    };
    const [pagesReport] = await client.runReport(pagesRequest);
    const topPages = (pagesReport.rows || []).map((row) => ({
      title: row.dimensionValues?.[0]?.value || '',
      path: row.dimensionValues?.[1]?.value || '/',
      views: Number(row.metricValues?.[0]?.value || '0'),
    }));

    const trendRequest = {
      property,
      dateRanges,
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
      limit: 1000,
    };
    const [trendReport] = await client.runReport(trendRequest);
    const trend = (trendReport.rows || [])
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

    const countriesRequest = {
      property,
      dateRanges,
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
      limit: TOP_COUNTRIES_LIMIT,
    };
    const [countriesReport] = await client.runReport(countriesRequest);
    const topCountries = (countriesReport.rows || []).map((row) => ({
      country: row.dimensionValues?.[0]?.value || 'Unassigned',
      users: Number(row.metricValues?.[0]?.value || '0'),
    }));

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
        summaryMetricHeaders: summaryReport.metricHeaders || [],
        summaryMetricValues: (summaryReport.rows || []).map((r) => r.metricValues || []),
        channelsRequest,
        pagesRequest,
        countriesRequest,
        trendRequest,
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
