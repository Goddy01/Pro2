import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const MAX_NAME = 200;
const MAX_BUSINESS = 300;
const MAX_EMAIL = 254;
const MAX_PHONE = 30;
const MAX_MESSAGE = 2000;

// Admin: list all inquiries (auth required)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, business_name, email, phone, tier, message, created_at FROM sponsorship_inquiries ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('sponsorship-inquiries list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Public: submit inquiry
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const name = typeof body.name === 'string' ? body.name.trim().slice(0, MAX_NAME) : '';
    const businessName = typeof body.business_name === 'string' ? body.business_name.trim().slice(0, MAX_BUSINESS) : '';
    const email = typeof body.email === 'string' ? body.email.trim().slice(0, MAX_EMAIL).toLowerCase() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, MAX_PHONE) : '';
    const tier = typeof body.tier === 'string' ? body.tier.trim().toLowerCase() : '';
    // Strip any HTML/script from message and enforce max length
    const rawMessage = typeof body.message === 'string' ? body.message.slice(0, MAX_MESSAGE) : '';
    const message = rawMessage
      ? rawMessage
          .replace(/<[^>]*>/g, '')
          .replace(/javascript:/gi, '')
          .replace(/data:/gi, '')
          .trim()
      : null;

    if (!name || name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });
    if (!businessName || businessName.length < 2) return res.status(400).json({ error: 'Business name is required' });
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!email || !emailRegex.test(email)) return res.status(400).json({ error: 'Valid email required' });
    if (!phone || phone.replace(/\D/g, '').length < 10) return res.status(400).json({ error: 'Valid phone number required' });

    // Tier is now optional: only validate if provided, otherwise store null
    let normalizedTier = null;
    if (tier) {
      const { rows: validTiers } = await db.query('SELECT slug FROM sponsorship_tiers');
      const validSlugs = validTiers.map((t) => t.slug);
      if (!validSlugs.includes(tier)) {
        return res.status(400).json({ error: 'Please select a valid sponsorship tier' });
      }
      normalizedTier = tier;
    }

    await db.query(
      'INSERT INTO sponsorship_inquiries (name, business_name, email, phone, tier, message) VALUES ($1, $2, $3, $4, $5, $6)',
      [name, businessName, email, phone, normalizedTier, message || null]
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('sponsorship-inquiry error:', err);
    res.status(500).json({ error: 'Could not submit. Please try again.' });
  }
});

// Admin: delete one inquiry (auth required)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    const { rowCount } = await db.query('DELETE FROM sponsorship_inquiries WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Inquiry not found' });
    res.status(204).send();
  } catch (err) {
    console.error('sponsorship-inquiry delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
