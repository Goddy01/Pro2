import { useEffect } from 'react';
import {
  SITE_URL,
  SITE_NAME,
  SEO_DEFAULT_DESCRIPTION,
  SEO_KEYWORDS,
  SEO_DEFAULT_OG_IMAGE,
} from '../lib/site';

const DATA_SEO = 'data-seo';
const DATA_SEO_LD = 'data-seo-ld';

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

function setMeta(
  head: HTMLHeadElement,
  attr: 'name' | 'property',
  key: string,
  content: string,
) {
  const el = head.querySelector(`meta[${attr}="${key}"][${DATA_SEO}]`) as HTMLMetaElement | null;
  if (el) {
    el.setAttribute('content', content);
  } else {
    const meta = document.createElement('meta');
    meta.setAttribute(attr, key);
    meta.setAttribute('content', content);
    meta.setAttribute(DATA_SEO, '');
    head.appendChild(meta);
  }
}

function setLink(head: HTMLHeadElement, rel: string, href: string) {
  const el = head.querySelector(`link[rel="${rel}"][${DATA_SEO}]`) as HTMLLinkElement | null;
  if (el) {
    el.setAttribute('href', href);
  } else {
    const link = document.createElement('link');
    link.setAttribute('rel', rel);
    link.setAttribute('href', href);
    link.setAttribute(DATA_SEO, '');
    head.appendChild(link);
  }
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
  const scriptsKey = scripts.length ? JSON.stringify(scripts) : '';

  useEffect(() => {
    const head = document.head;
    head.querySelectorAll(`[${DATA_SEO}]`).forEach((n) => n.remove());
    head.querySelectorAll(`[${DATA_SEO_LD}]`).forEach((n) => n.remove());

    document.title = fullTitle;

    setMeta(head, 'name', 'description', description);
    setMeta(head, 'name', 'keywords', SEO_KEYWORDS);

    if (noindex) {
      setMeta(head, 'name', 'robots', 'noindex, nofollow');
    } else {
      setLink(head, 'canonical', canonical);
    }

    setMeta(head, 'property', 'og:type', ogType);
    setMeta(head, 'property', 'og:url', canonical);
    setMeta(head, 'property', 'og:title', fullTitle);
    setMeta(head, 'property', 'og:description', description);
    setMeta(head, 'property', 'og:image', ogImage);
    setMeta(head, 'property', 'og:image:width', '1200');
    setMeta(head, 'property', 'og:image:height', '630');
    setMeta(head, 'property', 'og:site_name', SITE_NAME);
    setMeta(head, 'property', 'og:locale', 'en_US');

    if (ogType === 'article') {
      if (articlePublishedTime) setMeta(head, 'property', 'article:published_time', articlePublishedTime);
      if (articleModifiedTime) setMeta(head, 'property', 'article:modified_time', articleModifiedTime);
      if (articleAuthor) setMeta(head, 'property', 'article:author', articleAuthor);
      if (articleSection) setMeta(head, 'property', 'article:section', articleSection);
    }

    setMeta(head, 'name', 'twitter:card', 'summary_large_image');
    setMeta(head, 'name', 'twitter:url', canonical);
    setMeta(head, 'name', 'twitter:title', fullTitle);
    setMeta(head, 'name', 'twitter:description', description);
    setMeta(head, 'name', 'twitter:image', ogImage);

    const ldContainer = document.createDocumentFragment();
    scripts.forEach((script) => {
      const el = document.createElement('script');
      el.type = 'application/ld+json';
      el.setAttribute(DATA_SEO_LD, '');
      el.textContent = JSON.stringify(script);
      ldContainer.appendChild(el);
    });
    head.appendChild(ldContainer);

    return () => {
      head.querySelectorAll(`[${DATA_SEO}]`).forEach((n) => n.remove());
      head.querySelectorAll(`[${DATA_SEO_LD}]`).forEach((n) => n.remove());
    };
  }, [
    fullTitle,
    description,
    canonical,
    noindex,
    ogType,
    ogImage,
    articlePublishedTime,
    articleModifiedTime,
    articleAuthor,
    articleSection,
    scriptsKey,
  ]);

  return null;
}

export default SEO;
