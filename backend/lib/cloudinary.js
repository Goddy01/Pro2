import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * @param {Buffer} buffer
 * @param {string} [folder='sideline']
 * @param {{ upload_preset?: string }} [options]
 */
function formatCloudinaryError(err) {
  if (!err) return new Error('Upload failed');
  const msg = String(err.message || err.error?.message || 'Upload failed');
  const httpCode = err.http_code || err.error?.http_code;
  const lower = msg.toLowerCase();
  if (
    httpCode === 400 &&
    (lower.includes('file size') || lower.includes('too large') || lower.includes('maximum'))
  ) {
    const e = new Error(
      'Image exceeds Cloudinary’s plan size limit (Free 10MB / Plus 20MB / Advanced 40MB). Compress the image or upgrade the plan.'
    );
    e.code = 'CLOUDINARY_FILE_TOO_LARGE';
    e.status = 413;
    return e;
  }
  const e = new Error(msg);
  e.code = err.http_code ? `CLOUDINARY_${err.http_code}` : err.code;
  e.status = typeof httpCode === 'number' ? httpCode : 500;
  return e;
}

export function uploadImageBuffer(buffer, folder = 'sideline', options = {}) {
  const uploadOptions = { folder, resource_type: 'image' };
  if (options.upload_preset) uploadOptions.upload_preset = options.upload_preset;
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (err, result) => {
        if (err) reject(formatCloudinaryError(err));
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export function uploadVideoBuffer(buffer, folder = 'sideline-podcast') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'video' },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export function uploadAudioBuffer(buffer, folder = 'sideline-podcast') {
  return uploadVideoBuffer(buffer, folder);
}

export function hasCloudinaryConfig() {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}
