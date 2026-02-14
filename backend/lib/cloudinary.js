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
export function uploadImageBuffer(buffer, folder = 'sideline', options = {}) {
  const uploadOptions = { folder, resource_type: 'image' };
  if (options.upload_preset) uploadOptions.upload_preset = options.upload_preset;
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (err, result) => {
        if (err) reject(err);
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
