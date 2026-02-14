import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const memoryStorage = multer.memoryStorage();
const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
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

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, title, image, content, category, author, created_at FROM articles ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid article ID' });
    const { rows } = await db.query(
      'SELECT id, title, image, content, category, author, created_at FROM articles WHERE id = $1',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Article not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stored columns: articles.title, articles.image, articles.content, articles.category, articles.author
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

    const { rows } = await db.query(
      `INSERT INTO articles (title, image, content, category, author)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, image, content, category, author`,
      [
        title.trim(),
        imageUrl,
        content.trim(),
        (category || 'Features').trim(),
        (author || 'Sideline Sports & Entertainment Team').trim(),
      ]
    );

    const article = rows[0];
    res.status(201).json(article);
  } catch (err) {
    console.error('Article create error:', err);
    res.status(500).json({ error: err.message || 'Failed to create article' });
  }
});

export default router;
