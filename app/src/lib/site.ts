/**
 * Public site URL (production domain).
 * Set VITE_SITE_URL when building (e.g. https://sideline-se.com).
 */
export const SITE_URL =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL
    ? String(import.meta.env.VITE_SITE_URL).replace(/\/$/, '')
    : 'https://sideline-se.com';
