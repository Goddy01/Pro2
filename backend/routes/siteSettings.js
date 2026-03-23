import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { hasCloudinaryConfig, uploadImageBuffer } from '../lib/cloudinary.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/i;
    const ext = path.extname(file.originalname).slice(1);
    if (allowed.test(ext) || allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

async function getOrCreateSettingsRow() {
  const { rows } = await db.query(
    'SELECT id, home_hero_background_url, updated_at FROM site_settings ORDER BY id ASC LIMIT 1'
  );
  if (rows.length) return rows[0];

  const { rows: created } = await db.query(
    'INSERT INTO site_settings (home_hero_background_url) VALUES (NULL) RETURNING id, home_hero_background_url, updated_at'
  );
  return created[0];
}

router.get('/public', async (req, res) => {
  try {
    const row = await getOrCreateSettingsRow();
    res.json({
      homeHeroBackgroundUrl: row.home_hero_background_url || null,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load site settings' });
  }
});

router.put('/admin/home-hero-background', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });
    if (!hasCloudinaryConfig()) {
      return res.status(503).json({ error: 'Image upload is not configured. Set CLOUDINARY_* env vars.' });
    }

    const uploaded = await uploadImageBuffer(req.file.buffer, 'sideline-site', {
      upload_preset: process.env.CLOUDINARY_SITE_UPLOAD_PRESET || undefined,
    });
    const imageUrl = uploaded?.secure_url || null;
    if (!imageUrl) return res.status(500).json({ error: 'Upload failed to return image URL' });

    const current = await getOrCreateSettingsRow();
    const { rows } = await db.query(
      `UPDATE site_settings
       SET home_hero_background_url = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, home_hero_background_url, updated_at`,
      [imageUrl, current.id]
    );

    res.json({
      message: 'Home hero background updated',
      homeHeroBackgroundUrl: rows[0]?.home_hero_background_url || imageUrl,
      updatedAt: rows[0]?.updated_at || new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update home hero background' });
  }
});

router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Image is too large (max 15MB).' });
  }
  if (err.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
