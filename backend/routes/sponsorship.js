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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/i;
    const ext = path.extname(file.originalname).slice(1);
    if (allowed.test(ext) || allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

// Public: get all tiers with benefits (for Sponsorship page)
router.get('/tiers', async (req, res) => {
  try {
    const { rows: tiers } = await db.query(
      'SELECT id, name, slug, price, tagline, accent, sort_order FROM sponsorship_tiers ORDER BY sort_order ASC, name ASC'
    );
    const { rows: benefits } = await db.query(
      'SELECT tier_id, benefit_text, sort_order FROM sponsorship_benefits ORDER BY tier_id, sort_order ASC'
    );
    const byTier = {};
    for (const b of benefits) {
      if (!byTier[b.tier_id]) byTier[b.tier_id] = [];
      byTier[b.tier_id].push({ text: b.benefit_text, sortOrder: b.sort_order });
    }
    for (const k of Object.keys(byTier)) {
      byTier[k].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    res.json(
      tiers.map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        price: t.price,
        tagline: t.tagline || '',
        accent: t.accent || 'from-offwhite/20 via-offwhite/5 to-transparent',
        features: (byTier[t.id] || []).map((x) => x.text),
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: get all active banners (enabled, within show period)
router.get('/banner', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, image_url, link_url, sponsor_name FROM sponsorship_banner
       WHERE enabled = true AND image_url IS NOT NULL
       AND (show_until IS NULL OR show_until > NOW())
       ORDER BY sort_order ASC, id ASC`
    );
    res.json({
      banners: rows.map((b) => ({
        id: b.id,
        imageUrl: b.image_url,
        linkUrl: b.link_url || null,
        sponsorName: b.sponsor_name || null,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: list tiers with benefits (full)
router.get('/admin/tiers', authMiddleware, async (req, res) => {
  try {
    const { rows: tiers } = await db.query(
      'SELECT id, name, slug, price, tagline, accent, sort_order FROM sponsorship_tiers ORDER BY sort_order ASC'
    );
    const { rows: benefits } = await db.query(
      'SELECT id, tier_id, benefit_text, sort_order FROM sponsorship_benefits ORDER BY tier_id, sort_order ASC'
    );
    const byTier = {};
    for (const b of benefits) {
      if (!byTier[b.tier_id]) byTier[b.tier_id] = [];
      byTier[b.tier_id].push({ id: b.id, text: b.benefit_text, sortOrder: b.sort_order });
    }
    res.json(
      tiers.map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        price: t.price,
        tagline: t.tagline || '',
        accent: t.accent || 'from-offwhite/20 via-offwhite/5 to-transparent',
        sortOrder: t.sort_order,
        benefits: (byTier[t.id] || []).sort((a, b) => a.sortOrder - b.sortOrder),
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: create tier
router.post('/admin/tiers', authMiddleware, async (req, res) => {
  try {
    const body = req.body || {};
    const name = (body.name || '').trim();
    const slug = (body.slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')).slice(0, 50);
    const price = parseInt(body.price, 10) || 0;
    const tagline = (body.tagline || '').trim().slice(0, 500) || null;
    const accent = (body.accent || 'from-offwhite/20 via-offwhite/5 to-transparent').slice(0, 200);
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const { rows } = await db.query(
      `INSERT INTO sponsorship_tiers (name, slug, price, tagline, accent, sort_order)
       VALUES ($1, $2, $3, $4, $5, COALESCE((SELECT MAX(sort_order) + 1 FROM sponsorship_tiers), 0))
       RETURNING id, name, slug, price, tagline, accent, sort_order`,
      [name, slug, price, tagline, accent]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'A tier with this slug already exists' });
    res.status(500).json({ error: err.message });
  }
});

// Admin: update tier
router.put('/admin/tiers/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid tier ID' });
    const body = req.body || {};
    const name = body.name != null ? (body.name + '').trim() : null;
    const slug = body.slug != null ? (body.slug + '').trim().slice(0, 50) : null;
    const price = body.price != null ? parseInt(body.price, 10) : null;
    const tagline = body.tagline != null ? (body.tagline + '').trim().slice(0, 500) : null;
    const accent = body.accent != null ? (body.accent + '').slice(0, 200) : null;
    if (name !== null && !name) return res.status(400).json({ error: 'Name is required' });
    const updates = [];
    const values = [];
    let v = 1;
    if (name !== null) { updates.push(`name = $${v++}`); values.push(name); }
    if (slug !== null) { updates.push(`slug = $${v++}`); values.push(slug); }
    if (price !== null && !Number.isNaN(price)) { updates.push(`price = $${v++}`); values.push(price); }
    if (tagline !== null) { updates.push(`tagline = $${v++}`); values.push(tagline || null); }
    if (accent !== null) { updates.push(`accent = $${v++}`); values.push(accent); }
    if (updates.length === 0) {
      const { rows } = await db.query('SELECT id, name, slug, price, tagline, accent, sort_order FROM sponsorship_tiers WHERE id = $1', [id]);
      if (!rows.length) return res.status(404).json({ error: 'Tier not found' });
      return res.json(rows[0]);
    }
    values.push(id);
    const { rows } = await db.query(
      `UPDATE sponsorship_tiers SET ${updates.join(', ')} WHERE id = $${v} RETURNING id, name, slug, price, tagline, accent, sort_order`,
      values
    );
    if (!rows.length) return res.status(404).json({ error: 'Tier not found' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'A tier with this slug already exists' });
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete tier
router.delete('/admin/tiers/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid tier ID' });
    const { rowCount } = await db.query('DELETE FROM sponsorship_tiers WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Tier not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: add benefit to tier
router.post('/admin/tiers/:id/benefits', authMiddleware, async (req, res) => {
  try {
    const tierId = parseInt(req.params.id, 10);
    if (Number.isNaN(tierId)) return res.status(400).json({ error: 'Invalid tier ID' });
    const text = (req.body?.benefit_text || req.body?.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Benefit text is required' });
    const { rows: existing } = await db.query('SELECT id FROM sponsorship_tiers WHERE id = $1', [tierId]);
    if (!existing.length) return res.status(404).json({ error: 'Tier not found' });
    const { rows } = await db.query(
      `INSERT INTO sponsorship_benefits (tier_id, benefit_text, sort_order)
       VALUES ($1, $2, COALESCE((SELECT MAX(sort_order) + 1 FROM sponsorship_benefits WHERE tier_id = $1), 0))
       RETURNING id, tier_id, benefit_text, sort_order`,
      [tierId, text]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update benefit
router.put('/admin/benefits/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid benefit ID' });
    const text = (req.body?.benefit_text || req.body?.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Benefit text is required' });
    const { rows } = await db.query(
      'UPDATE sponsorship_benefits SET benefit_text = $1 WHERE id = $2 RETURNING id, tier_id, benefit_text, sort_order',
      [text, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Benefit not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete benefit
router.delete('/admin/benefits/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid benefit ID' });
    const { rowCount } = await db.query('DELETE FROM sponsorship_benefits WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Benefit not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: list all banners
router.get('/admin/banners', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, sponsor_name, image_url, link_url, show_until, enabled, sort_order FROM sponsorship_banner ORDER BY sort_order ASC, id ASC'
    );
    res.json(rows.map((b) => ({
      id: b.id,
      sponsorName: b.sponsor_name || '',
      imageUrl: b.image_url || null,
      linkUrl: b.link_url || null,
      showUntil: b.show_until || null,
      enabled: b.enabled,
      sortOrder: b.sort_order ?? 0,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: create banner
router.post('/admin/banners', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const sponsorName = typeof req.body?.sponsor_name === 'string' ? req.body.sponsor_name.trim().slice(0, 200) || null : null;
    if (!sponsorName) return res.status(400).json({ error: 'Sponsor name is required' });
    let imageUrl = null;
    if (req.file && hasCloudinaryConfig()) {
      const result = await uploadImageBuffer(req.file.buffer, 'sideline-sponsorship', { upload_preset: 'Sideline.Gallery' });
      imageUrl = result.secure_url;
    }
    const linkUrl = typeof req.body?.link_url === 'string' ? req.body.link_url.trim() || null : null;
    const enabled = req.body?.enabled === true || req.body?.enabled === 'true';
    const durationDays = req.body?.duration_days != null ? parseInt(req.body.duration_days, 10) : null;
    const showUntil = Number.isInteger(durationDays) && durationDays > 0
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : null;
    const { rows: maxRow } = await db.query('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM sponsorship_banner');
    const sortOrder = maxRow[0]?.next_order ?? 0;
    const { rows } = await db.query(
      `INSERT INTO sponsorship_banner (sponsor_name, image_url, link_url, enabled, show_until, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, sponsor_name, image_url, link_url, show_until, enabled, sort_order`,
      [sponsorName, imageUrl, linkUrl, enabled, showUntil, sortOrder]
    );
    const b = rows[0];
    res.status(201).json({
      id: b.id,
      sponsorName: b.sponsor_name || '',
      imageUrl: b.image_url || null,
      linkUrl: b.link_url || null,
      showUntil: b.show_until || null,
      enabled: b.enabled,
      sortOrder: b.sort_order ?? 0,
    });
  } catch (err) {
    console.error('Banner create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: update banner
router.put('/admin/banners/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid banner ID' });
    const sponsorName = typeof req.body?.sponsor_name === 'string' ? req.body.sponsor_name.trim().slice(0, 200) : null;
    if (sponsorName !== null && !sponsorName) return res.status(400).json({ error: 'Sponsor name is required' });
    let imageUrl = null;
    if (req.file && hasCloudinaryConfig()) {
      const result = await uploadImageBuffer(req.file.buffer, 'sideline-sponsorship', { upload_preset: 'Sideline.Gallery' });
      imageUrl = result.secure_url;
    }
    const linkUrl = typeof req.body?.link_url === 'string' ? req.body.link_url.trim() || null : null;
    const enabled = req.body?.enabled === true || req.body?.enabled === 'true';
    const durationDays = req.body?.duration_days != null ? parseInt(req.body.duration_days, 10) : null;
    const showUntil = Number.isInteger(durationDays) && durationDays > 0
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : durationDays === 0 ? null : undefined;

    const { rows: existing } = await db.query('SELECT id, image_url FROM sponsorship_banner WHERE id = $1', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Banner not found' });
    const updates = [];
    const values = [];
    let v = 1;
    if (imageUrl !== null) { updates.push(`image_url = $${v++}`); values.push(imageUrl); }
    if (sponsorName !== null) { updates.push(`sponsor_name = $${v++}`); values.push(sponsorName); }
    updates.push(`link_url = $${v++}`); values.push(linkUrl);
    updates.push(`enabled = $${v++}`); values.push(enabled);
    if (showUntil !== undefined) { updates.push(`show_until = $${v++}`); values.push(showUntil); }
    updates.push(`updated_at = NOW()`);
    values.push(id);
    await db.query(`UPDATE sponsorship_banner SET ${updates.join(', ')} WHERE id = $${v}`, values);
    const { rows } = await db.query(
      'SELECT id, sponsor_name, image_url, link_url, show_until, enabled, sort_order FROM sponsorship_banner WHERE id = $1',
      [id]
    );
    const b = rows[0];
    res.json({
      id: b.id,
      sponsorName: b.sponsor_name || '',
      imageUrl: b.image_url || null,
      linkUrl: b.link_url || null,
      showUntil: b.show_until || null,
      enabled: b.enabled,
      sortOrder: b.sort_order ?? 0,
    });
  } catch (err) {
    console.error('Banner update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete banner
router.delete('/admin/banners/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid banner ID' });
    const { rowCount } = await db.query('DELETE FROM sponsorship_banner WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Banner not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Image is too large (max 5MB).' });
  }
  if (err.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
