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
      `SELECT e.id, e.slug, e.title, e.description,
        (SELECT json_agg(ei.image_url ORDER BY ei.sort_order) FROM event_images ei WHERE ei.event_id = e.id) AS images
       FROM events e ORDER BY e.created_at DESC`
    );
    res.json(
      rows.map((r) => ({
        id: r.slug,
        title: r.title,
        description: r.description || '',
        images: Array.isArray(r.images) ? r.images : (r.images ? [r.images] : []),
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT e.id, e.slug, e.title, e.description,
        (SELECT json_agg(ei.image_url ORDER BY ei.sort_order) FROM event_images ei WHERE ei.event_id = e.id) AS images
       FROM events e WHERE e.slug = $1`,
      [req.params.slug]
    );
    const event = rows[0];
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const images = event.images;
    res.json({
      id: event.slug,
      title: event.title,
      description: event.description || '',
      images: Array.isArray(images) ? images : images ? [images] : [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, upload.array('images', 50), async (req, res) => {
  try {
    const { title, description, slug } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    const safeSlug = (slug || title).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!safeSlug) return res.status(400).json({ error: 'Slug could not be generated from title' });
    if (!req.files?.length) return res.status(400).json({ error: 'At least one image is required' });
    if (!hasCloudinaryConfig()) return res.status(503).json({ error: 'Image upload is not configured.' });

    const { rows: eventRows } = await db.query(
      'INSERT INTO events (slug, title, description) VALUES ($1, $2, $3) ON CONFLICT (slug) DO UPDATE SET title = $2, description = $3 RETURNING id',
      [safeSlug, title.trim(), (description || '').trim()]
    );
    const eventId = eventRows[0].id;

    for (let i = 0; i < req.files.length; i++) {
      const result = await uploadImageBuffer(req.files[i].buffer, 'sideline-events', { upload_preset: 'Sideline.Events' });
      await db.query('INSERT INTO event_images (event_id, image_url, sort_order) VALUES ($1, $2, $3)', [
        eventId,
        result.secure_url,
        i,
      ]);
    }

    const { rows: full } = await db.query(
      `SELECT e.slug AS id, e.title, e.description,
        (SELECT json_agg(ei.image_url ORDER BY ei.sort_order) FROM event_images ei WHERE ei.event_id = e.id) AS images
       FROM events e WHERE e.id = $1`,
      [eventId]
    );
    res.status(201).json(full[0]);
  } catch (err) {
    console.error('Events create error:', err);
    res.status(500).json({ error: err.message || 'Failed to create event' });
  }
});

export default router;
