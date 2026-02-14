import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = Router();

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
    const newHash = bcrypt.hashSync(process.env.ADMIN_RESET_PASSWORD, 10);
    await db.query('UPDATE admin SET password_hash = $1 WHERE id = $2', [newHash, rows[0].id]);
    console.log(`Admin "${rows[0].username}" password was reset. Remove ADMIN_RESET_PASSWORD from env.`);
  } else {
    console.log(`Admin login username: ${rows[0].username}`);
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

export default router;
