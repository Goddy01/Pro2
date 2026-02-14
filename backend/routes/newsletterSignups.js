import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const MAX_NAME = 200;
const MAX_EMAIL = 254;
const MAX_CELL = 30;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const rateLimitMap = new Map();

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(ip) {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (now >= entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + RATE_LIMIT_WINDOW_MS;
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

// Admin: list all signups (auth required). ?format=csv for CSV export
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, email, cell, created_at FROM newsletter_signups ORDER BY created_at DESC'
    );

    const format = (req.query.format || '').toLowerCase();
    if (format === 'csv') {
      const header = 'Name,Email,Cell,Signed up at\n';
      const csvRows = rows.map(
        (r) =>
          `"${String(r.name || '').replace(/"/g, '""')}","${String(r.email || '').replace(/"/g, '""')}","${String(r.cell || '').replace(/"/g, '""')}","${r.created_at || ''}"`
      );
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="newsletter-signups.csv"');
      return res.send(header + csvRows.join('\n'));
    }

    res.json(rows);
  } catch (err) {
    console.error('newsletter-signups list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Public: submit sign-up (rate limited)
router.post('/', async (req, res) => {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Too many sign-ups. Please try again later.' });
    }

    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    let name = typeof body.name === 'string' ? body.name.trim().slice(0, MAX_NAME) : '';
    let email = typeof body.email === 'string' ? body.email.trim().slice(0, MAX_EMAIL).toLowerCase() : '';
    let cell = typeof body.cell === 'string' ? body.cell.trim().slice(0, MAX_CELL) : '';

    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Valid email required' });
    }
    if (!cell || cell.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'Valid cell number required' });
    }

    await db.query(
      'INSERT INTO newsletter_signups (name, email, cell) VALUES ($1, $2, $3)',
      [name, email, cell]
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('newsletter-signup error:', err);
    res.status(500).json({ error: 'Could not sign up. Please try again.' });
  }
});

export default router;
