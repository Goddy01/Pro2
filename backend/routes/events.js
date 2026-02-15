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
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    let rows;
    if (q) {
      const pattern = `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
      const { rows: r } = await db.query(
        `SELECT e.id, e.slug, e.title, e.description,
          (SELECT json_agg(ei.image_url ORDER BY ei.sort_order) FROM event_images ei WHERE ei.event_id = e.id) AS images
         FROM events e
         WHERE e.title ILIKE $1 OR COALESCE(e.description, '') ILIKE $1
         ORDER BY e.created_at DESC`,
        [pattern]
      );
      rows = r;
    } else {
      const { rows: r } = await db.query(
        `SELECT e.id, e.slug, e.title, e.description,
          (SELECT json_agg(ei.image_url ORDER BY ei.sort_order) FROM event_images ei WHERE ei.event_id = e.id) AS images
         FROM events e ORDER BY e.created_at DESC`
      );
      rows = r;
    }
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

// Stored columns: events.slug, events.title, events.description; event_images.event_id, event_images.image_url, event_images.sort_order
router.post('/', authMiddleware, upload.array('images', 50), async (req, res) => {
  try {
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const safeSlug = (typeof req.body?.slug === 'string' ? req.body.slug.trim() || title : title).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!safeSlug) return res.status(400).json({ error: 'Slug could not be generated from title' });
    if (!req.files?.length) return res.status(400).json({ error: 'At least one image is required' });
    if (!hasCloudinaryConfig()) return res.status(503).json({ error: 'Image upload is not configured.' });

    const { rows: eventRows } = await db.query(
      'INSERT INTO events (slug, title, description) VALUES ($1, $2, $3) ON CONFLICT (slug) DO UPDATE SET title = $2, description = $3 RETURNING id',
      [safeSlug, title, description]
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

router.put('/:slug', authMiddleware, upload.array('images', 50), async (req, res) => {
  try {
    const slug = (req.params.slug || '').trim();
    if (!slug) return res.status(400).json({ error: 'Slug is required' });
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const { rows: existing } = await db.query('SELECT id FROM events WHERE slug = $1', [slug]);
    if (!existing.length) return res.status(404).json({ error: 'Event not found' });
    const eventId = existing[0].id;

    await db.query('UPDATE events SET title = $1, description = $2 WHERE id = $3', [title, description, eventId]);

    if (req.files?.length) {
      if (!hasCloudinaryConfig()) return res.status(503).json({ error: 'Image upload is not configured.' });
      const maxOrder = await db.query('SELECT COALESCE(MAX(sort_order), -1) AS m FROM event_images WHERE event_id = $1', [eventId]);
      let nextOrder = (maxOrder.rows[0]?.m ?? -1) + 1;
      for (const file of req.files) {
        const result = await uploadImageBuffer(file.buffer, 'sideline-events', { upload_preset: 'Sideline.Events' });
        await db.query('INSERT INTO event_images (event_id, image_url, sort_order) VALUES ($1, $2, $3)', [eventId, result.secure_url, nextOrder++]);
      }
    }

    const { rows: full } = await db.query(
      `SELECT e.slug AS id, e.title, e.description,
        (SELECT json_agg(ei.image_url ORDER BY ei.sort_order) FROM event_images ei WHERE ei.event_id = e.id) AS images
       FROM events e WHERE e.id = $1`,
      [eventId]
    );
    res.json(full[0]);
  } catch (err) {
    console.error('Events update error:', err);
    res.status(500).json({ error: err.message || 'Failed to update event' });
  }
});

router.delete('/:slug', authMiddleware, async (req, res) => {
  try {
    const slug = (req.params.slug || '').trim();
    if (!slug) return res.status(400).json({ error: 'Slug is required' });
    const { rowCount } = await db.query('DELETE FROM events WHERE slug = $1', [slug]);
    if (rowCount === 0) return res.status(404).json({ error: 'Event not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
