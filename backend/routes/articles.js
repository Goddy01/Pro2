import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const MAX_SLUG = 200;
const ARTICLE_SELECT =
  'id, slug, title, image, content, category, author, created_at';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const memoryStorage = multer.memoryStorage();
const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per image
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/i;
    const ext = path.extname(file.originalname).slice(1);
    if (allowed.test(ext) || allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  },
});

function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'sideline-articles', ...options },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

export function normalizeArticleSlug(v) {
  if (typeof v !== 'string') return '';
  return v
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, MAX_SLUG);
}

async function generateUniqueArticleSlug(titleOrSlug, excludeId = null) {
  const base = normalizeArticleSlug(titleOrSlug) || 'article';
  let candidate = base;
  for (let i = 0; i < 100; i++) {
    const { rows } = excludeId
      ? await db.query('SELECT 1 FROM articles WHERE slug = $1 AND id <> $2 LIMIT 1', [candidate, excludeId])
      : await db.query('SELECT 1 FROM articles WHERE slug = $1 LIMIT 1', [candidate]);
    if (!rows.length) return candidate;
    candidate = `${base}-${i + 2}`.slice(0, MAX_SLUG);
  }
  return candidate;
}

router.get('/', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    let rows;
    if (q) {
      const pattern = `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
      const { rows: r } = await db.query(
        `SELECT ${ARTICLE_SELECT} FROM articles
         WHERE title ILIKE $1 OR author ILIKE $1 OR category ILIKE $1 OR slug ILIKE $1
         ORDER BY created_at DESC`,
        [pattern]
      );
      rows = r;
    } else {
      const { rows: r } = await db.query(
        `SELECT ${ARTICLE_SELECT} FROM articles ORDER BY created_at DESC`
      );
      rows = r;
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Public detail: lookup by slug, or numeric id (admin / legacy). */
router.get('/:slugOrId', async (req, res) => {
  try {
    const key = String(req.params.slugOrId || '').trim();
    if (!key) return res.status(400).json({ error: 'Invalid article' });

    const asId = /^\d+$/.test(key) ? parseInt(key, 10) : null;
    let rows;
    if (asId != null && !Number.isNaN(asId)) {
      ({ rows } = await db.query(
        `SELECT ${ARTICLE_SELECT} FROM articles WHERE id = $1`,
        [asId]
      ));
    } else {
      const slug = normalizeArticleSlug(key);
      if (!slug) return res.status(400).json({ error: 'Invalid article slug' });
      ({ rows } = await db.query(
        `SELECT ${ARTICLE_SELECT} FROM articles WHERE slug = $1`,
        [slug]
      ));
    }

    if (!rows.length) return res.status(404).json({ error: 'Article not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stored columns: articles.title, articles.slug, articles.image, articles.content, articles.category, articles.author
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, content, category, author } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });
    if (!req.file) return res.status(400).json({ error: 'Image is required' });

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(503).json({ error: 'Image upload is not configured. Set CLOUDINARY_* env vars.' });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      resource_type: 'image',
    });
    const imageUrl = result.secure_url;
    const slug = await generateUniqueArticleSlug(title);

    const { rows } = await db.query(
      `INSERT INTO articles (title, slug, image, content, category, author)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${ARTICLE_SELECT}`,
      [
        title.trim(),
        slug,
        imageUrl,
        content.trim(),
        (category || 'Features').trim(),
        (author || 'Sideline Sports & Entertainment Team').trim(),
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Article create error:', err);
    if (err.code === '23505') return res.status(409).json({ error: 'An article with that slug already exists' });
    res.status(500).json({ error: err.message || 'Failed to create article' });
  }
});

router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid article ID' });
    const { title, content, category, author } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const { rows: existing } = await db.query('SELECT id, image, slug, title FROM articles WHERE id = $1', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Article not found' });

    let imageUrl = existing[0].image;
    if (req.file) {
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        return res.status(503).json({ error: 'Image upload is not configured.' });
      }
      const result = await uploadBufferToCloudinary(req.file.buffer, { resource_type: 'image' });
      imageUrl = result.secure_url;
    }

    // Refresh slug when title changes so URLs stay readable
    const titleChanged = title.trim() !== existing[0].title;
    const slug = titleChanged
      ? await generateUniqueArticleSlug(title, id)
      : existing[0].slug || (await generateUniqueArticleSlug(title, id));

    const { rows } = await db.query(
      `UPDATE articles SET title = $1, slug = $2, image = $3, content = $4, category = $5, author = $6 WHERE id = $7
       RETURNING ${ARTICLE_SELECT}`,
      [
        title.trim(),
        slug,
        imageUrl,
        content.trim(),
        (category || 'Features').trim(),
        (author || 'Sideline Sports & Entertainment Team').trim(),
        id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('Article update error:', err);
    if (err.code === '23505') return res.status(409).json({ error: 'An article with that slug already exists' });
    res.status(500).json({ error: err.message || 'Failed to update article' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid article ID' });
    const { rowCount } = await db.query('DELETE FROM articles WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
