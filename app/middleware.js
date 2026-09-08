/**
 * Vercel Edge Middleware: social crawlers get article Open Graph HTML with the
 * real article image. Humans still get the SPA (React).
 *
 * Why: Facebook/iMessage/Slack/X fetch the raw HTML and do not run React, so
 * client-side SEO.tsx never runs for them — they only saw the logo in index.html.
 */
import { next } from '@vercel/edge';

export const config = {
  matcher: ['/articles/:slug', '/stories/:slug'],
};

const BOT_UA =
  /bot|crawl|slurp|spider|facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|discordbot|whatsapp|telegrambot|skypeuripreview|applebot|redditbot|embedly|quora link preview|pinterest|vkshare|w3c_validator|iframely|bingpreview|google-inspectiontool|outbrain|yahoo! slurp/i;

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

/** Prefer a 1200×630 JPEG for OG (Cloudinary); otherwise use as-is. */
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

function articleOgHtml({ title, description, image, url, published }) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const img = escapeHtml(image);
  const u = escapeHtml(url);
  const fullTitle = escapeHtml(`${title} | ${SITE_NAME}`);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${fullTitle}</title>
  <meta name="description" content="${d}" />
  <link rel="canonical" href="${u}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
  <meta property="og:url" content="${u}" />
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:image" content="${img}" />
  <meta property="og:image:secure_url" content="${img}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${t}" />
  ${published ? `<meta property="article:published_time" content="${escapeHtml(published)}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${u}" />
  <meta name="twitter:title" content="${t}" />
  <meta name="twitter:description" content="${d}" />
  <meta name="twitter:image" content="${img}" />
</head>
<body>
  <p>${t}</p>
  <p>${d}</p>
  <img src="${img}" alt="${t}" width="1200" height="630" />
  <p><a href="${u}">Read the article</a></p>
</body>
</html>`;
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!BOT_UA.test(ua)) {
    return next();
  }

  try {
    const reqUrl = new URL(request.url);
    const parts = reqUrl.pathname.split('/').filter(Boolean);
    const slug = parts[1] ? decodeURIComponent(parts[1]) : '';
    if (!slug) return next();

    const apiRes = await fetch(`${API_BASE}/api/articles/${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!apiRes.ok) return next();

    const article = await apiRes.json();
    if (!article?.title) return next();

    const canonicalSlug = article.slug || slug;
    const pageUrl = `https://sideline-se.com/articles/${canonicalSlug}`;
    const description = excerptFromHtml(article.content);
    const image = ogImageUrl(article.image);

    return new Response(
      articleOgHtml({
        title: article.title,
        description: description || SITE_NAME,
        image,
        url: pageUrl,
        published: article.created_at,
      }),
      {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'public, s-maxage=300, stale-while-revalidate=86400',
        },
      }
    );
  } catch {
    return next();
  }
}
