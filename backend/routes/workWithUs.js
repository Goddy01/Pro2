import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Admin: unread count for notification badge (auth required)
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT COUNT(*) AS count FROM work_with_us WHERE read_at IS NULL'
    );
    res.json({ count: parseInt(rows[0]?.count ?? '0', 10) });
  } catch (err) {
    console.error('work-with-us unread-count error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: list all submissions (auth required)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, phone, email, introduction, created_at, read_at FROM work_with_us ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('work-with-us list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete one submission (auth required)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    const { rowCount } = await db.query('DELETE FROM work_with_us WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Submission not found' });
    res.status(204).send();
  } catch (err) {
    console.error('work-with-us delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: mark submission read or unread (auth required)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    const read = req.body && req.body.read === true;
    const { rows } = await db.query(
      read
        ? 'UPDATE work_with_us SET read_at = NOW() WHERE id = $1 RETURNING id, read_at'
        : 'UPDATE work_with_us SET read_at = NULL WHERE id = $1 RETURNING id, read_at',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Submission not found' });
    res.json({ id: rows[0].id, read_at: rows[0].read_at });
  } catch (err) {
    console.error('work-with-us patch error:', err);
    res.status(500).json({ error: err.message });
  }
});

const MAX_NAME = 200;
const MAX_PHONE = 30;
const MAX_EMAIL = 254;
const MAX_INTRO = 2000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5; // per IP per window

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

function stripHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Stored columns: work_with_us.name, phone, email, introduction (all required)
router.post('/', async (req, res) => {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Too many submissions. Please try again later.' });
    }

    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Only read fields that are stored in work_with_us table
    let name = typeof body.name === 'string' ? body.name.trim().slice(0, MAX_NAME) : '';
    let phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, MAX_PHONE) : '';
    let email = typeof body.email === 'string' ? body.email.trim().slice(0, MAX_EMAIL).toLowerCase() : '';
    let introduction = typeof body.introduction === 'string' ? stripHtml(body.introduction).slice(0, MAX_INTRO).trim() : '';

    if (body.introduction?.length > MAX_INTRO) {
      return res.status(400).json({ error: `Introduction must be ${MAX_INTRO} characters or less` });
    }

    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'Valid phone number required' });
    }
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Valid email required' });
    }
    if (!introduction || introduction.length < 50) {
      return res.status(400).json({ error: 'Introduction must be at least 50 characters' });
    }

    await db.query(
      `INSERT INTO work_with_us (name, phone, email, introduction) VALUES ($1, $2, $3, $4)`,
      [name, phone, email, introduction]
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('work-with-us error:', err);
    res.status(500).json({ error: 'Could not submit. Please try again.' });
  }
});

export default router;
