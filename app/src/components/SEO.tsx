import { Helmet } from 'react-helmet-async';
import {
  SITE_URL,
  SITE_NAME,
  SEO_DEFAULT_DESCRIPTION,
  SEO_KEYWORDS,
  SEO_DEFAULT_OG_IMAGE,
} from '../lib/site';

export type SEOProps = {
  /** Page title (e.g. "Stories | Sideline Sports & Entertainment") */
  title?: string;
  /** Meta description; keep under ~160 chars for search snippets */
  description?: string;
  /** Canonical path (e.g. "/stories/123"); full URL is SITE_URL + path */
  canonicalPath?: string;
  /** OG/Twitter image URL (absolute) or path (relative to origin). If not set, uses default. */
  image?: string;
  /** If true, set robots noindex,nofollow (e.g. for admin or duplicate pages) */
  noindex?: boolean;
  /** JSON-LD script(s). Can be one object or array of objects. */
  jsonLd?: object | object[];
  /** Optional OG type (default "website"; use "article" for story pages) */
  ogType?: 'website' | 'article';
  /** Article published time (ISO string); use with ogType="article" */
  articlePublishedTime?: string;
  /** Article modified time (ISO string); use with ogType="article" */
  articleModifiedTime?: string;
  /** Article author name; use with ogType="article" */
  articleAuthor?: string;
  /** Article section/category; use with ogType="article" */
  articleSection?: string;
};

function absoluteUrl(path: string): string {
  const base = SITE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

function imageUrl(image: string | undefined): string {
  if (!image) return absoluteUrl(SEO_DEFAULT_OG_IMAGE);
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  return absoluteUrl(image.startsWith('/') ? image : `/${image}`);
}

export function SEO({
  title,
  description = SEO_DEFAULT_DESCRIPTION,
  canonicalPath,
  image,
  noindex = false,
  jsonLd,
  ogType = 'website',
  articlePublishedTime,
  articleModifiedTime,
  articleAuthor,
  articleSection,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const canonical = canonicalPath ? absoluteUrl(canonicalPath) : SITE_URL + '/';
  const ogImage = imageUrl(image);

  const scripts: object[] = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={SEO_KEYWORDS} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <link rel="canonical" href={canonical} />
      )}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      {ogType === 'article' && (
        <>
          {articlePublishedTime && <meta property="article:published_time" content={articlePublishedTime} />}
          {articleModifiedTime && <meta property="article:modified_time" content={articleModifiedTime} />}
          {articleAuthor && <meta property="article:author" content={articleAuthor} />}
          {articleSection && <meta property="article:section" content={articleSection} />}
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD */}
      {scripts.map((script, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(script) }}
        />
      ))}
    </Helmet>
  );
}

export default SEO;
