import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const MIN_USERNAME_LEN = 2;
const MAX_USERNAME_LEN = 100;
const MIN_PASSWORD_LEN = 6;

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
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET not set' });
    }
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
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

export default router;
