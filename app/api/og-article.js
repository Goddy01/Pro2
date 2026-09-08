/**
 * Manual OG preview for an article (humans + debugging).
 * Example: /api/og-article?slug=maryland-football-breakout
 *
 * Social crawlers are handled by ../middleware.js so they receive OG HTML
 * at the real /articles/:slug URL.
 */
const SITE_NAME = 'Sideline Sports & Entertainment';
const DEFAULT_OG = 'https://sideline-se.com/media/favicon-logo.jpg';
const API_BASE = (
  process.env.VITE_API_URL ||
  process.env.API_URL ||
  'https://sideline-se-be.up.railway.app'
).replace(/\/$/, '');

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function excerptFromHtml(html, maxLen = 160) {
  const text = String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length <= maxLen ? text : `${text.slice(0, maxLen)}…`;
}

function ogImageUrl(image) {
  if (!image) return DEFAULT_OG;
  const src = String(image);
  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
    if (/\/upload\/[^/]*\bf_/.test(src)) return src;
    return src.replace('/upload/', '/upload/f_jpg,q_80,w_1200,h_630,c_fill,g_north/');
  }
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  return `https://sideline-se.com${src.startsWith('/') ? src : `/${src}`}`;
}

export default async function handler(req, res) {
  try {
    const slug = typeof req.query?.slug === 'string' ? req.query.slug.trim() : '';
    if (!slug) {
      res.status(400).json({ error: 'Missing slug query param' });
      return;
    }

    const apiRes = await fetch(`${API_BASE}/api/articles/${encodeURIComponent(slug)}`);
    if (!apiRes.ok) {
      res.status(apiRes.status).json({ error: 'Article not found' });
      return;
    }
    const article = await apiRes.json();
    const pageUrl = `https://sideline-se.com/articles/${article.slug || slug}`;
    const description = excerptFromHtml(article.content) || SITE_NAME;
    const image = ogImageUrl(article.image);
    const title = article.title || SITE_NAME;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)} | ${escapeHtml(SITE_NAME)}</title>
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(pageUrl)}" />
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(pageUrl)}">${escapeHtml(title)}</a>…</p>
</body>
</html>`);
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Failed to build OG preview' });
  }
}
