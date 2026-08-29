const CLOUDINARY_HOST = 'res.cloudinary.com';

/** Soft target so uploads stay under common Cloudinary plan caps (Free 10MB / Plus 20MB). */
export const GALLERY_UPLOAD_TARGET_BYTES = 8 * 1024 * 1024;
export const GALLERY_UPLOAD_MAX_EDGE = 4000;

function isCloudinaryUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.host === CLOUDINARY_HOST;
  } catch {
    return false;
  }
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image file'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Image compression failed'))),
      type,
      quality
    );
  });
}

/**
 * Downscale / recompress large images before upload so they fit Cloudinary plan limits
 * and avoid proxy timeouts on big payloads.
 */
export async function compressImageForUpload(
  file: File,
  opts: { maxEdge?: number; targetBytes?: number } = {}
): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;

  const maxEdge = opts.maxEdge ?? GALLERY_UPLOAD_MAX_EDGE;
  const targetBytes = opts.targetBytes ?? GALLERY_UPLOAD_TARGET_BYTES;

  // Already small enough — skip work
  if (file.size <= targetBytes) {
    try {
      const img = await loadImageFromFile(file);
      if (img.naturalWidth <= maxEdge && img.naturalHeight <= maxEdge) return file;
    } catch {
      return file;
    }
  }

  const img = await loadImageFromFile(file);
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  const outType = 'image/jpeg';
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
  let quality = 0.88;
  let blob = await canvasToBlob(canvas, outType, quality);

  while (blob.size > targetBytes && quality > 0.55) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, outType, quality);
  }

  // Prefer original if compression did not help (e.g. already optimized JPEG)
  if (blob.size >= file.size) return file;

  return new File([blob], `${baseName}.jpg`, { type: outType, lastModified: Date.now() });
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

