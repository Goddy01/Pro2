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

function metricValueByName(row, metricHeaders, metricName) {
  const headers = Array.isArray(metricHeaders) ? metricHeaders : [];
  const idx = headers.findIndex((h) => (h.name === metricName || h.metricName === metricName));
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

  const debug = String(req.query.debug || '').toLowerCase() === '1';

  const requestedDays = Number(req.query.days);
  const days = ALLOWED_DAYS.has(requestedDays) ? requestedDays : 30;
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

    const channelsRequest = {
      property,
      dateRanges,
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 5,
    };
    const [channelsReport] = await client.runReport(channelsRequest);

    const pagesRequest = {
      property,
      dateRanges,
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 5,
    };
    const [pagesReport] = await client.runReport(pagesRequest);

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

    const payload = {
      days,
      property,
      dateRanges,
      summary,
      topChannels,
      topPages,
      fetchedAt: new Date().toISOString(),
    };

    if (debug) {
      payload.debug = {
        summaryRequest,
        summaryMetricHeaders: summaryReport.metricHeaders || [],
        summaryMetricValues: (summaryReport.rows || []).map((r) => r.metricValues || []),
        channelsRequest,
        channelsMetricHeaders: channelsReport.metricHeaders || [],
        channelsRows: (channelsReport.rows || []).slice(0, 5).map((r) => ({
          dimension: r.dimensionValues?.[0]?.value || null,
          metric: r.metricValues?.[0]?.value || null,
        })),
        pagesRequest,
        pagesMetricHeaders: pagesReport.metricHeaders || [],
        pagesRows: (pagesReport.rows || []).slice(0, 5).map((r) => ({
          pagePath: r.dimensionValues?.[0]?.value || null,
          views: r.metricValues?.[0]?.value || null,
        })),
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
