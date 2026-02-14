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

// Stored columns: gallery_images.image_url, gallery_images.caption, gallery_images.sort_order
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image is required' });
    if (!hasCloudinaryConfig()) return res.status(503).json({ error: 'Image upload is not configured. Set CLOUDINARY_* env vars.' });

    const result = await uploadImageBuffer(req.file.buffer, 'sideline-gallery', { upload_preset: 'Sideline.Gallery' });
    const caption = (req.body.caption != null && typeof req.body.caption === 'string') ? req.body.caption.trim() || null : null;
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

router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid gallery image ID' });
    const { rows: existing } = await db.query('SELECT id, image_url FROM gallery_images WHERE id = $1', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Not found' });

    let imageUrl = existing[0].image_url;
    if (req.file && hasCloudinaryConfig()) {
      const result = await uploadImageBuffer(req.file.buffer, 'sideline-gallery', { upload_preset: 'Sideline.Gallery' });
      imageUrl = result.secure_url;
    }
    const caption = (req.body.caption != null && typeof req.body.caption === 'string') ? req.body.caption.trim() || null : null;
    const sortOrder = req.body.sort_order != null ? parseInt(req.body.sort_order, 10) : null;
    if (sortOrder !== null && !Number.isNaN(sortOrder)) {
      const { rows } = await db.query(
        'UPDATE gallery_images SET image_url = $1, caption = $2, sort_order = $3 WHERE id = $4 RETURNING id, image_url, caption, sort_order',
        [imageUrl, caption, sortOrder, id]
      );
      return res.json(rows[0]);
    }
    const { rows } = await db.query(
      'UPDATE gallery_images SET image_url = $1, caption = $2 WHERE id = $3 RETURNING id, image_url, caption, sort_order',
      [imageUrl, caption, id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('Gallery update error:', err);
    res.status(500).json({ error: err.message || 'Update failed' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid gallery image ID' });
    const { rowCount } = await db.query('DELETE FROM gallery_images WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
