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

// List categories with cover and image count (for gallery landing)
router.get('/categories', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT c.id, c.name, c.slug, c.cover_image_url, c.sort_order,
              COUNT(g.id) AS image_count
       FROM gallery_categories c
       LEFT JOIN gallery_images g ON g.category_id = c.id
       GROUP BY c.id, c.name, c.slug, c.cover_image_url, c.sort_order
       ORDER BY c.sort_order ASC, c.name ASC`
    );
    res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        coverImageUrl: r.cover_image_url,
        sortOrder: r.sort_order,
        imageCount: parseInt(String(r.image_count), 10),
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create category (admin)
router.post('/categories', authMiddleware, upload.single('cover'), async (req, res) => {
  try {
    const name = req.body.name != null && typeof req.body.name === 'string' ? req.body.name.trim() : '';
    let slug = req.body.slug != null && typeof req.body.slug === 'string' ? req.body.slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!slug) slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    let coverImageUrl = null;
    if (req.file && hasCloudinaryConfig()) {
      const result = await uploadImageBuffer(req.file.buffer, 'sideline-gallery', { upload_preset: 'Sideline.Gallery' });
      coverImageUrl = result.secure_url;
    }
    const { rows } = await db.query(
      `INSERT INTO gallery_categories (name, slug, cover_image_url, sort_order)
       VALUES ($1, $2, $3, COALESCE((SELECT MAX(sort_order) + 1 FROM gallery_categories), 0))
       RETURNING id, name, slug, cover_image_url, sort_order`,
      [name, slug, coverImageUrl]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'A category with this slug already exists' });
    res.status(500).json({ error: err.message || 'Failed to create category' });
  }
});

// Get one category (admin edit)
router.get('/categories/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid category ID' });
    const { rows } = await db.query(
      'SELECT id, name, slug, cover_image_url, sort_order FROM gallery_categories WHERE id = $1',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Category not found' });
    res.json({ id: rows[0].id, name: rows[0].name, slug: rows[0].slug, coverImageUrl: rows[0].cover_image_url, sortOrder: rows[0].sort_order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update category (admin)
router.put('/categories/:id', authMiddleware, upload.single('cover'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid category ID' });
    const { rows: existing } = await db.query('SELECT id FROM gallery_categories WHERE id = $1', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Category not found' });
    const name = req.body.name != null && typeof req.body.name === 'string' ? req.body.name.trim() : null;
    let slug = req.body.slug != null && typeof req.body.slug === 'string' ? req.body.slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : null;
    if (name !== null && !name) return res.status(400).json({ error: 'Name is required' });
    let coverImageUrl = undefined;
    if (req.file && hasCloudinaryConfig()) {
      const result = await uploadImageBuffer(req.file.buffer, 'sideline-gallery', { upload_preset: 'Sideline.Gallery' });
      coverImageUrl = result.secure_url;
    }
    const updates = [];
    const values = [];
    let v = 1;
    if (name !== null) { updates.push(`name = $${v++}`); values.push(name); }
    if (slug !== null) { updates.push(`slug = $${v++}`); values.push(slug); }
    if (coverImageUrl !== undefined) { updates.push(`cover_image_url = $${v++}`); values.push(coverImageUrl); }
    if (updates.length === 0 && coverImageUrl === undefined) {
      const { rows } = await db.query('SELECT id, name, slug, cover_image_url, sort_order FROM gallery_categories WHERE id = $1', [id]);
      return res.json(rows[0]);
    }
    values.push(id);
    const { rows } = await db.query(
      `UPDATE gallery_categories SET ${updates.join(', ')} WHERE id = $${v} RETURNING id, name, slug, cover_image_url, sort_order`,
      values
    );
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'A category with this slug already exists' });
    res.status(500).json({ error: err.message });
  }
});

// Delete category (admin) – images get category_id set to null
router.delete('/categories/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid category ID' });
    const { rowCount } = await db.query('DELETE FROM gallery_categories WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Category not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List images – optional ?category=slug to filter by category
router.get('/', async (req, res) => {
  try {
    const categorySlug = typeof req.query.category === 'string' ? req.query.category.trim() || null : null;
    let rows;
    if (categorySlug) {
      const { rows: r } = await db.query(
        `SELECT g.id, g.image_url, g.caption, g.sort_order, g.category_id
         FROM gallery_images g
         JOIN gallery_categories c ON c.id = g.category_id AND c.slug = $1
         ORDER BY g.sort_order ASC, g.created_at DESC`,
        [categorySlug]
      );
      rows = r;
    } else {
      const { rows: r } = await db.query(
        'SELECT id, image_url, caption, sort_order, category_id FROM gallery_images ORDER BY sort_order ASC, created_at DESC'
      );
      rows = r;
    }
    res.json(rows.map((r) => ({ id: r.id, src: r.image_url, alt: r.caption || 'Sideline Sports & Entertainment', caption: r.caption, category_id: r.category_id ?? null })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stored columns: gallery_images.image_url, gallery_images.caption, gallery_images.sort_order, gallery_images.category_id
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image is required' });
    if (!hasCloudinaryConfig()) return res.status(503).json({ error: 'Image upload is not configured. Set CLOUDINARY_* env vars.' });

    const result = await uploadImageBuffer(req.file.buffer, 'sideline-gallery', { upload_preset: 'Sideline.Gallery' });
    const caption = (req.body.caption != null && typeof req.body.caption === 'string') ? req.body.caption.trim() || null : null;
    const categoryId = req.body.category_id != null && req.body.category_id !== '' ? parseInt(req.body.category_id, 10) : null;
    const { rows } = await db.query(
      'INSERT INTO gallery_images (image_url, caption, sort_order, category_id) VALUES ($1, $2, COALESCE((SELECT MAX(sort_order) + 1 FROM gallery_images), 0), $3) RETURNING id, image_url, caption, category_id',
      [result.secure_url, caption, Number.isNaN(categoryId) ? null : categoryId]
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
    const categoryId = req.body.category_id != null && req.body.category_id !== '' ? parseInt(req.body.category_id, 10) : null;
    const categoryIdVal = categoryId !== null && !Number.isNaN(categoryId) ? categoryId : null;
    if (sortOrder !== null && !Number.isNaN(sortOrder)) {
      const { rows } = await db.query(
        'UPDATE gallery_images SET image_url = $1, caption = $2, sort_order = $3, category_id = $4 WHERE id = $5 RETURNING id, image_url, caption, sort_order, category_id',
        [imageUrl, caption, sortOrder, categoryIdVal, id]
      );
      return res.json(rows[0]);
    }
    const { rows } = await db.query(
      'UPDATE gallery_images SET image_url = $1, caption = $2, category_id = $3 WHERE id = $4 RETURNING id, image_url, caption, sort_order, category_id',
      [imageUrl, caption, categoryIdVal, id]
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
