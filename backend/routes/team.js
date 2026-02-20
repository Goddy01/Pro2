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
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per image
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

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid team member ID' });
    const { rows } = await db.query(
      'SELECT id, name, role, bio, image, social_x, social_youtube, social_tiktok, social_instagram, sort_order FROM team_members WHERE id = $1',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Team member not found' });
    res.json(rows[0]);
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

function parseTeamBody(body) {
  return {
    name: (body.name != null && typeof body.name === 'string') ? body.name.trim() : null,
    role: (body.role != null && typeof body.role === 'string') ? body.role.trim() || null : null,
    bio: (body.bio != null && typeof body.bio === 'string') ? body.bio.trim() || null : null,
    social_x: (body.social_x != null && typeof body.social_x === 'string') ? body.social_x.trim() || null : null,
    social_youtube: (body.social_youtube != null && typeof body.social_youtube === 'string') ? body.social_youtube.trim() || null : null,
    social_tiktok: (body.social_tiktok != null && typeof body.social_tiktok === 'string') ? body.social_tiktok.trim() || null : null,
    social_instagram: (body.social_instagram != null && typeof body.social_instagram === 'string') ? body.social_instagram.trim() || null : null,
  };
}

router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid team member ID' });
    const { rows: existing } = await db.query('SELECT id, image FROM team_members WHERE id = $1', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Team member not found' });

    const parsed = parseTeamBody(req.body);
    if (!parsed.name) return res.status(400).json({ error: 'Name is required' });

    let imageUrl = existing[0].image;
    if (req.file && hasCloudinaryConfig()) {
      const result = await uploadImageBuffer(req.file.buffer, 'sideline-team');
      imageUrl = result.secure_url;
    } else if (req.body.image !== undefined && typeof req.body.image === 'string' && req.body.image.trim() === '') {
      imageUrl = null;
    }

    const { rows } = await db.query(
      `UPDATE team_members SET name = $1, role = $2, bio = $3, image = $4, social_x = $5, social_youtube = $6, social_tiktok = $7, social_instagram = $8
       WHERE id = $9 RETURNING id, name, role, bio, image, social_x, social_youtube, social_tiktok, social_instagram, sort_order, created_at`,
      [
        parsed.name,
        parsed.role,
        parsed.bio,
        imageUrl,
        parsed.social_x,
        parsed.social_youtube,
        parsed.social_tiktok,
        parsed.social_instagram,
        id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('Team member update error:', err);
    res.status(500).json({ error: err.message || 'Failed to update team member' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid team member ID' });
    const { rowCount } = await db.query('DELETE FROM team_members WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Team member not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
