/**
 * Legacy helpers for old encoded article URLs (e.g. /stories/MQ).
 * New articles use title-based slugs at /articles/:slug.
 */

const SALT = 0x2a7f;

export function encodeArticleId(id: number): string {
  const n = (id + SALT) * 31;
  return n.toString(36);
}

export function decodeArticleId(hash: string): number | null {
  const parsed = parseInt(hash, 36);
  if (Number.isNaN(parsed)) return null;
  const n = Math.round(parsed / 31 - SALT);
  return n >= 1 ? n : null;
}
