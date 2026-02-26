import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Public: get site social links (single row)
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT x_url, instagram_url, tiktok_url, youtube_url FROM site_social_links ORDER BY id ASC LIMIT 1'
    );
    const r = rows[0];
    if (!r) {
      return res.json({ x: null, instagram: null, tiktok: null, youtube: null });
    }
    res.json({
      x: r.x_url || null,
      instagram: r.instagram_url || null,
      tiktok: r.tiktok_url || null,
      youtube: r.youtube_url || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get (same shape)
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT x_url, instagram_url, tiktok_url, youtube_url FROM site_social_links ORDER BY id ASC LIMIT 1'
    );
    const r = rows[0];
    if (!r) {
      return res.json({ x: '', instagram: '', tiktok: '', youtube: '' });
    }
    res.json({
      x: r.x_url || '',
      instagram: r.instagram_url || '',
      tiktok: r.tiktok_url || '',
      youtube: r.youtube_url || '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update
router.put('/admin', authMiddleware, async (req, res) => {
  try {
    const body = req.body || {};
    const x = typeof body.x === 'string' ? body.x.trim().slice(0, 500) || null : null;
    const instagram = typeof body.instagram === 'string' ? body.instagram.trim().slice(0, 500) || null : null;
    const tiktok = typeof body.tiktok === 'string' ? body.tiktok.trim().slice(0, 500) || null : null;
    const youtube = typeof body.youtube === 'string' ? body.youtube.trim().slice(0, 500) || null : null;

    const { rows: existing } = await db.query('SELECT id FROM site_social_links ORDER BY id ASC LIMIT 1');
    if (existing.length) {
      await db.query(
        `UPDATE site_social_links SET x_url = $1, instagram_url = $2, tiktok_url = $3, youtube_url = $4, updated_at = NOW() WHERE id = $5`,
        [x, instagram, tiktok, youtube, existing[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO site_social_links (x_url, instagram_url, tiktok_url, youtube_url) VALUES ($1, $2, $3, $4)',
        [x, instagram, tiktok, youtube]
      );
    }
    const { rows } = await db.query(
      'SELECT x_url, instagram_url, tiktok_url, youtube_url FROM site_social_links ORDER BY id ASC LIMIT 1'
    );
    const r = rows[0];
    res.json({
      x: r?.x_url || '',
      instagram: r?.instagram_url || '',
      tiktok: r?.tiktok_url || '',
      youtube: r?.youtube_url || '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
