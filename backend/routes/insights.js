import { Router } from 'express';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const ALLOWED_DAYS = new Set([7, 30, 90]);

function getPropertyName() {
  const raw = (process.env.GA4_PROPERTY_ID || '').trim();
  if (!raw) return '';
  return raw.startsWith('properties/') ? raw : `properties/${raw}`;
}

function createClient() {
  const clientEmail = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim();
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY || '';

  if (clientEmail && privateKeyRaw) {
    return new BetaAnalyticsDataClient({
      credentials: {
        client_email: clientEmail,
        private_key: privateKeyRaw.replace(/\\n/g, '\n'),
      },
    });
  }

  return new BetaAnalyticsDataClient();
}

function metricValueByName(row, metricHeaders, metricName) {
  const idx = metricHeaders.findIndex((h) => h.name === metricName);
  if (idx < 0) return 0;
  const raw = row?.metricValues?.[idx]?.value ?? '0';
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

  const requestedDays = Number(req.query.days);
  const days = ALLOWED_DAYS.has(requestedDays) ? requestedDays : 30;
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: 'today' }];

  try {
    const client = createClient();

    const [summaryReport] = await client.runReport({
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
    });

    const [channelsReport] = await client.runReport({
      property,
      dateRanges,
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 5,
    });

    const [pagesReport] = await client.runReport({
      property,
      dateRanges,
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 5,
    });

    const summaryRow = summaryReport.rows?.[0] || null;
    const metricHeaders = summaryReport.metricHeaders || [];

    const summary = {
      totalUsers: metricValueByName(summaryRow, metricHeaders, 'totalUsers'),
      newUsers: metricValueByName(summaryRow, metricHeaders, 'newUsers'),
      sessions: metricValueByName(summaryRow, metricHeaders, 'sessions'),
      pageViews: metricValueByName(summaryRow, metricHeaders, 'screenPageViews'),
      avgSessionDurationSeconds: metricValueByName(summaryRow, metricHeaders, 'averageSessionDuration'),
      avgSessionDurationLabel: formatDuration(metricValueByName(summaryRow, metricHeaders, 'averageSessionDuration')),
      engagementRate: metricValueByName(summaryRow, metricHeaders, 'engagementRate'),
      bounceRate: metricValueByName(summaryRow, metricHeaders, 'bounceRate'),
      keyEvents: metricValueByName(summaryRow, metricHeaders, 'keyEvents'),
    };

    const topChannels = (channelsReport.rows || []).map((row) => ({
      channel: row.dimensionValues?.[0]?.value || 'Unassigned',
      sessions: Number(row.metricValues?.[0]?.value || '0'),
    }));

    const topPages = (pagesReport.rows || []).map((row) => ({
      path: row.dimensionValues?.[0]?.value || '/',
      views: Number(row.metricValues?.[0]?.value || '0'),
    }));

    return res.json({
      days,
      summary,
      topChannels,
      topPages,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load Google Analytics data';
    return res.status(500).json({ error: message });
  }
});

export default router;
