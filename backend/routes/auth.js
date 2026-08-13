import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const MIN_USERNAME_LEN = 2;
const MAX_USERNAME_LEN = 100;
const MIN_PASSWORD_LEN = 6;

const LOGIN_RATE_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_RATE_MAX = 10;
const loginRateMap = new Map();

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
}

function checkLoginRateLimit(ip) {
  const now = Date.now();
  let entry = loginRateMap.get(ip);
  if (!entry) {
    loginRateMap.set(ip, { count: 1, resetAt: now + LOGIN_RATE_WINDOW_MS });
    return true;
  }
  if (now >= entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + LOGIN_RATE_WINDOW_MS;
    return true;
  }
  if (entry.count >= LOGIN_RATE_MAX) return false;
  entry.count += 1;
  return true;
}

export async function ensureAdmin() {
  const { rows } = await db.query('SELECT id, username FROM admin');
  if (rows.length === 0) {
    const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await db.query(
      'INSERT INTO admin (username, password_hash) VALUES ($1, $2)',
      [process.env.ADMIN_USERNAME || 'admin', hash]
    );
    console.log('Admin user created. Login with ADMIN_USERNAME / ADMIN_PASSWORD (env) or default: admin / admin123');
  } else if (process.env.ADMIN_RESET_PASSWORD) {
    const targetUsername = process.env.ADMIN_USERNAME || 'admin';
    const target = rows.find((r) => r.username === targetUsername) || rows[0];
    const newHash = bcrypt.hashSync(process.env.ADMIN_RESET_PASSWORD, 10);
    await db.query('UPDATE admin SET password_hash = $1 WHERE id = $2', [newHash, target.id]);
    console.log(`Admin "${target.username}" password was reset. Remove ADMIN_RESET_PASSWORD from env.`);
  } else {
    console.log(`Admin logins: ${rows.map((r) => r.username).join(', ')}`);
  }
}

router.post('/login', async (req, res) => {
  try {
    const ip = getClientIp(req);
    if (!checkLoginRateLimit(ip)) {
      return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET not set' });
    }
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Username and password must be strings' });
    }

    const { rows } = await db.query('SELECT * FROM admin WHERE username = $1', [username]);
    const admin = rows[0];
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = bcrypt.compareSync(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, username: admin.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create another admin (existing admin only). Allows multiple admins logged in at once.
router.post('/admins', authMiddleware, async (req, res) => {
  try {
    const { username, password } = req.body;
    const name = typeof username === 'string' ? username.trim().slice(0, MAX_USERNAME_LEN) : '';
    if (name.length < MIN_USERNAME_LEN) {
      return res.status(400).json({ error: `Username must be at least ${MIN_USERNAME_LEN} characters` });
    }
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LEN) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LEN} characters` });
    }

    const existing = await db.query('SELECT id FROM admin WHERE username = $1', [name]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username already in use' });
    }

    const hash = bcrypt.hashSync(password, 10);
    await db.query('INSERT INTO admin (username, password_hash) VALUES ($1, $2)', [name, hash]);
    res.status(201).json({ ok: true, username: name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (newPassword.length < MIN_PASSWORD_LEN) {
      return res.status(400).json({ error: `New password must be at least ${MIN_PASSWORD_LEN} characters` });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { rows } = await db.query('SELECT id, password_hash FROM admin WHERE id = $1', [adminId]);
    const admin = rows[0];
    if (!admin) {
      return res.status(401).json({ error: 'Admin not found' });
    }

    const valid = bcrypt.compareSync(currentPassword, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    await db.query('UPDATE admin SET password_hash = $1 WHERE id = $2', [hash, admin.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
