/**
 * Encode/decode article ID for URL so the numeric ID is not visible (e.g. /stories/MQ instead of /stories/1).
 * Reversible encoding only – we still call the API with the numeric id.
 */

const SALT = 0x2a7f; // arbitrary offset so small numbers don't encode to trivial strings

export function encodeArticleId(id: number): string {
  const n = (id + SALT) * 31;
  return n.toString(36);
}

export function decodeArticleId(hash: string): number | null {
  const parsed = parseInt(hash, 36);
  if (Number.isNaN(parsed)) return null;
  const n = Math.round((parsed / 31) - SALT);
  return n >= 1 ? n : null;
}
