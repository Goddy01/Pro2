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
      `SELECT id, name, role, bio, image, social_x, social_youtube, social_tiktok, social_instagram, sort_order
       FROM team_members ORDER BY sort_order ASC, id ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, role, bio, social_x, social_youtube, social_tiktok, social_instagram } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    let imageUrl = (req.body.image && typeof req.body.image === 'string') ? req.body.image.trim() || null : null;
    if (req.file && hasCloudinaryConfig()) {
      const result = await uploadImageBuffer(req.file.buffer, 'sideline-team');
      imageUrl = result.secure_url;
    }

    const { rows } = await db.query(
      `INSERT INTO team_members (name, role, bio, image, social_x, social_youtube, social_tiktok, social_instagram, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE((SELECT MAX(sort_order) + 1 FROM team_members), 0))
       RETURNING id, name, role, bio, image, social_x, social_youtube, social_tiktok, social_instagram, sort_order, created_at`,
      [
        name.trim(),
        (role != null && typeof role === 'string') ? role.trim() || null : null,
        (bio != null && typeof bio === 'string') ? bio.trim() || null : null,
        imageUrl,
        (social_x != null && typeof social_x === 'string') ? social_x.trim() || null : null,
        (social_youtube != null && typeof social_youtube === 'string') ? social_youtube.trim() || null : null,
        (social_tiktok != null && typeof social_tiktok === 'string') ? social_tiktok.trim() || null : null,
        (social_instagram != null && typeof social_instagram === 'string') ? social_instagram.trim() || null : null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Team member create error:', err);
    res.status(500).json({ error: err.message || 'Failed to create team member' });
  }
});

export default router;
