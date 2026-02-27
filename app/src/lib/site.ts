/**
 * Public site URL (production domain).
 * Set VITE_SITE_URL when building (e.g. https://sideline-se.com).
 */
export const SITE_URL =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL
    ? String(import.meta.env.VITE_SITE_URL).replace(/\/$/, '')
    : 'https://sideline-se.com';

/** Default site name for titles and OG */
export const SITE_NAME = 'Sideline Sports & Entertainment';

/** Default meta description (homepage and fallback) */
export const SEO_DEFAULT_DESCRIPTION =
  'Original reporting, in-depth analysis, and compelling storytelling. Sports and entertainment journalism reimagined.';

/** High-value SEO keywords for meta and content signals */
export const SEO_KEYWORDS = [
  'sports journalism',
  'sports media',
  'sports entertainment',
  'NFL coverage',
  'NBA analysis',
  'sports podcast',
  'sideline sports and entertainment',
  'sideline sports and entertainment news',
  'sideline sports and entertainment reporting',
  'sideline sports and entertainment entertainment news',
].join(', ');

/** Default OG/Twitter image path (relative); full URL built with SITE_URL */
export const SEO_DEFAULT_OG_IMAGE = '/media/favicon-logo.jpg';

/** Fallback image if default OG image is missing */
export const SEO_FALLBACK_OG_IMAGE = '/media/favicon-logo.jpg';

/** Build Organization + WebSite JSON-LD for rich results and knowledge panel */
export function getDefaultStructuredData(): object[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/media/favicon-logo.jpg`,
      description: SEO_DEFAULT_DESCRIPTION,
      sameAs: [
        'https://x.com/sidelinesport1',
        'https://www.instagram.com/sidelinesport1',
        'https://www.youtube.com/@sidelinesports3840',
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      description: SEO_DEFAULT_DESCRIPTION,
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/listen-watch?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
  ];
}
