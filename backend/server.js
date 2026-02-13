import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDb } from './db.js';
import authRoutes, { ensureAdmin } from './routes/auth.js';
import articleRoutes from './routes/articles.js';
import workWithUsRoutes from './routes/workWithUs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50kb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/work-with-us', workWithUsRoutes);

async function start() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. On Railway: add a PostgreSQL service and link it to this service, or set DATABASE_URL in Variables.');
    process.exit(1);
  }
  await initDb();
  await ensureAdmin();
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
