import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadImageBuffer, hasCloudinaryConfig } from '../lib/cloudinary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const memoryStorage = multer.memoryStorage();
const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/i;
    const ext = path.extname(file.originalname).slice(1);
    if (allowed.test(ext) || allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, image_url, caption, sort_order, created_at FROM gallery_images ORDER BY sort_order ASC, created_at DESC'
    );
    res.json(rows.map((r) => ({ id: r.id, src: r.image_url, alt: r.caption || 'Sideline Sports & Entertainment', caption: r.caption })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image is required' });
    if (!hasCloudinaryConfig()) return res.status(503).json({ error: 'Image upload is not configured. Set CLOUDINARY_* env vars.' });

    const result = await uploadImageBuffer(req.file.buffer, 'sideline-gallery');
    const caption = (req.body.caption || '').trim() || null;
    const { rows } = await db.query(
      'INSERT INTO gallery_images (image_url, caption, sort_order) VALUES ($1, $2, COALESCE((SELECT MAX(sort_order) + 1 FROM gallery_images), 0)) RETURNING id, image_url, caption',
      [result.secure_url, caption]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Gallery upload error:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

export default router;
