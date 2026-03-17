import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadImageBuffer, hasCloudinaryConfig } from '../lib/cloudinary.js';

const router = Router();

const MAX_NAME = 200;
const MAX_SLUG = 100;
const MAX_DESC = 8000;

const memoryStorage = multer.memoryStorage();
const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const img = /jpeg|jpg|png|gif|webp/i;
    const ext = path.extname(file.originalname).slice(1);
    const mime = file.mimetype || '';
    if (img.test(ext) || img.test(mime)) return cb(null, true);
    cb(new Error('Invalid file type'));
  },
});

function normalizeSlug(v) {
  if (typeof v !== 'string') return '';
  return v.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, MAX_SLUG);
}
function normalizeName(v) {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, MAX_NAME);
}
function normalizeDescription(v) {
  if (typeof v !== 'string') return null;
  const s = v.trim().slice(0, MAX_DESC);
  return s ? s : null;
}
function normalizeSortOrder(v) {
  const n = typeof v === 'string' ? parseInt(v, 10) : typeof v === 'number' ? v : 0;
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100000, n));
}
function parsePlatformLinks(v) {
  if (!v) return null;
  if (typeof v === 'object') return v;
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  try {
    const parsed = JSON.parse(s);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

// Public: list show cards (no heavy content)
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT slug, name, description, hero_image_url, sort_order
       FROM shows
       ORDER BY sort_order ASC, name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('shows public list error:', err);
    res.status(500).json({ error: 'Failed to load shows' });
  }
});

// Public: show detail
router.get('/:slug', async (req, res) => {
  try {
    // Avoid conflicts with /admin routes
    if (req.params.slug === 'admin') return res.status(404).json({ error: 'Not found' });

    const slug = normalizeSlug(req.params.slug);
    if (!slug) return res.status(400).json({ error: 'Invalid slug' });
    const { rows } = await db.query(
      `SELECT slug, name, description, hero_image_url, platform_links, sort_order
       FROM shows
       WHERE slug = $1`,
      [slug]
    );
    if (!rows.length) return res.status(404).json({ error: 'Show not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('shows public detail error:', err);
    res.status(500).json({ error: 'Failed to load show' });
  }
});

// Admin: list
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, slug, name, description, hero_image_url, platform_links, sort_order, created_at
       FROM shows
       ORDER BY sort_order ASC, name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('shows admin list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: create (supports JSON or multipart with hero_image)
router.post('/admin', authMiddleware, upload.single('hero_image'), async (req, res) => {
  try {
    const body = req.body || {};
    const name = normalizeName(body.name);
    const slug = normalizeSlug(body.slug || body.name);
    const description = normalizeDescription(body.description);
    const sortOrder = normalizeSortOrder(body.sort_order);
    const platformLinks = parsePlatformLinks(body.platform_links);

    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!slug) return res.status(400).json({ error: 'Slug is required' });

    let heroImageUrl = typeof body.hero_image_url === 'string' ? body.hero_image_url.trim() || null : null;
    if (req.file) {
      if (!hasCloudinaryConfig()) {
        return res.status(400).json({ error: 'Cloudinary is not configured on the server' });
      }
      const result = await uploadImageBuffer(req.file.buffer, 'sideline-shows');
      heroImageUrl = result.secure_url;
    }

    const { rows } = await db.query(
      `INSERT INTO shows (slug, name, description, hero_image_url, platform_links, sort_order)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)
       RETURNING id, slug, name, description, hero_image_url, platform_links, sort_order, created_at`,
      [slug, name, description, heroImageUrl, platformLinks ? JSON.stringify(platformLinks) : null, sortOrder]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (String(err?.message || '').includes('duplicate key')) {
      return res.status(409).json({ error: 'A show with that slug already exists' });
    }
    console.error('shows admin create error:', err);
    res.status(500).json({ error: err.message || 'Failed to create show' });
  }
});

// Admin: update (supports JSON or multipart with hero_image)
router.put('/admin/:id', authMiddleware, upload.single('hero_image'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const { rows: existing } = await db.query(
      'SELECT id, slug, name, description, hero_image_url, platform_links, sort_order FROM shows WHERE id = $1',
      [id]
    );
    if (!existing.length) return res.status(404).json({ error: 'Show not found' });
    const current = existing[0];

    const body = req.body || {};
    const name = typeof body.name === 'string' ? normalizeName(body.name) : current.name;
    const slug = typeof body.slug === 'string' ? normalizeSlug(body.slug) : current.slug;
    const description = typeof body.description === 'string' ? normalizeDescription(body.description) : current.description;
    const sortOrder = body.sort_order !== undefined ? normalizeSortOrder(body.sort_order) : current.sort_order;
    const platformLinks =
      body.platform_links !== undefined ? parsePlatformLinks(body.platform_links) : current.platform_links;

    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!slug) return res.status(400).json({ error: 'Slug is required' });

    let heroImageUrl =
      body.hero_image_url !== undefined && typeof body.hero_image_url === 'string'
        ? body.hero_image_url.trim() || null
        : current.hero_image_url;
    if (req.file) {
      if (!hasCloudinaryConfig()) {
        return res.status(400).json({ error: 'Cloudinary is not configured on the server' });
      }
      const result = await uploadImageBuffer(req.file.buffer, 'sideline-shows');
      heroImageUrl = result.secure_url;
    }

    const { rows } = await db.query(
      `UPDATE shows
       SET slug = $1, name = $2, description = $3, hero_image_url = $4, platform_links = $5::jsonb, sort_order = $6
       WHERE id = $7
       RETURNING id, slug, name, description, hero_image_url, platform_links, sort_order, created_at`,
      [
        slug,
        name,
        description,
        heroImageUrl,
        platformLinks ? JSON.stringify(platformLinks) : null,
        sortOrder,
        id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    if (String(err?.message || '').includes('duplicate key')) {
      return res.status(409).json({ error: 'A show with that slug already exists' });
    }
    console.error('shows admin update error:', err);
    res.status(500).json({ error: err.message || 'Failed to update show' });
  }
});

// Admin: delete
router.delete('/admin/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    const { rowCount } = await db.query('DELETE FROM shows WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Show not found' });
    res.status(204).send();
  } catch (err) {
    console.error('shows admin delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

