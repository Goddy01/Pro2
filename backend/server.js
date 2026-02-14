import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDb } from './db.js';
import authRoutes, { ensureAdmin } from './routes/auth.js';
import articleRoutes from './routes/articles.js';
import workWithUsRoutes from './routes/workWithUs.js';
import newsletterSignupsRoutes from './routes/newsletterSignups.js';
import galleryRoutes from './routes/gallery.js';
import eventsRoutes from './routes/events.js';
import podcastRoutes from './routes/podcast.js';
import watchRoutes from './routes/watch.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50kb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root and /health for Railway (and other platforms) that probe for liveness
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'sideline-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/work-with-us', workWithUsRoutes);
app.use('/api/newsletter-signups', newsletterSignupsRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/podcast', podcastRoutes);
app.use('/api/watch', watchRoutes);

async function start() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. On Railway: add a PostgreSQL service and link it to this service, or set DATABASE_URL in Variables.');
    process.exit(1);
  }
  await initDb();
  await ensureAdmin();
  const server = app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });

  // Graceful shutdown: exit 0 on SIGTERM so Railway doesn't report npm error
  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
