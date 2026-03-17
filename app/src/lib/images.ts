const CLOUDINARY_HOST = 'res.cloudinary.com';

function isCloudinaryUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.host === CLOUDINARY_HOST;
  } catch {
    return false;
  }
}

/**
 * Returns an optimized Cloudinary URL when possible.
 * Falls back to original URL when not Cloudinary.
 */
export function optimizeImageUrl(
  url: string | null | undefined,
  opts: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!url) return '';
  const src = String(url);
  if (!isCloudinaryUrl(src)) return src;

  const { width, height, quality } = opts;
  const q = typeof quality === 'number' ? Math.max(1, Math.min(100, quality)) : 'auto';

  const transforms: string[] = ['f_auto', `q_${q}`];
  if (typeof width === 'number' && width > 0) transforms.push(`w_${Math.round(width)}`);
  if (typeof height === 'number' && height > 0) transforms.push(`h_${Math.round(height)}`, 'c_fill');

  // Insert transforms after '/upload/'
  return src.replace('/upload/', `/upload/${transforms.join(',')}/`);
}

