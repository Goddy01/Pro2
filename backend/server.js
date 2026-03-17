import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDb } from './db.js';
import db from './db.js';
import { sendMail } from './email.js';
import authRoutes, { ensureAdmin } from './routes/auth.js';
import articleRoutes from './routes/articles.js';
import workWithUsRoutes from './routes/workWithUs.js';
import newsletterSignupsRoutes from './routes/newsletterSignups.js';
import galleryRoutes from './routes/gallery.js';
import eventsRoutes from './routes/events.js';
import podcastRoutes from './routes/podcast.js';
import watchRoutes from './routes/watch.js';
import teamRoutes from './routes/team.js';
import sponsorshipInquiriesRoutes from './routes/sponsorshipInquiries.js';
import sponsorshipRoutes from './routes/sponsorship.js';
import sponsorshipDiscoveryQuestionsRoutes from './routes/sponsorshipDiscoveryQuestions.js';
import sponsorshipDiscoverySubmissionsRoutes from './routes/sponsorshipDiscoverySubmissions.js';
import socialLinksRoutes from './routes/socialLinks.js';
import showsRoutes from './routes/shows.js';

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
app.use('/api/team', teamRoutes);
app.use('/api/sponsorship-inquiries', sponsorshipInquiriesRoutes);
app.use('/api/sponsorship', sponsorshipRoutes);
app.use('/api/social-links', socialLinksRoutes);
app.use('/api/sponsorship-discovery-questions', sponsorshipDiscoveryQuestionsRoutes);
app.use('/api/sponsorship-discovery-submissions', sponsorshipDiscoverySubmissionsRoutes);
app.use('/api/shows', showsRoutes);

async function start() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. On Railway: add a PostgreSQL service and link it to this service, or set DATABASE_URL in Variables.');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    console.error('JWT_SECRET must be set and at least 16 characters. Admin auth will not work without it.');
    process.exit(1);
  }
  await initDb();
  await ensureAdmin();
  const server = app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });

  // Simple interval-based job to send follow-up reminder emails for discovery submissions
  const REMINDER_INTERVAL_MINUTES = process.env.DISCOVERY_FOLLOWUP_POLL_MINUTES
    ? Math.max(1, Number(process.env.DISCOVERY_FOLLOWUP_POLL_MINUTES))
    : 15;

  const reminderIntervalMs = REMINDER_INTERVAL_MINUTES * 60 * 1000;

  async function runDiscoveryFollowupJob() {
    try {
      const { rows } = await db.query(
        `SELECT id, sponsor_name, business_name, email, phone, message, answers, created_at, followup_due_at
         FROM sponsorship_discovery_submissions
         WHERE followup_completed_at IS NULL
           AND followup_email_sent_at IS NULL
           AND followup_due_at <= NOW()
         ORDER BY followup_due_at ASC
         LIMIT 50`
      );

      if (!rows.length) return;

      const lines = [];
      lines.push('Sponsor discovery follow-up reminder');
      lines.push('');
      for (const row of rows) {
        lines.push(`ID: ${row.id}`);
        lines.push(`Name: ${row.sponsor_name}`);
        lines.push(`Business: ${row.business_name}`);
        lines.push(`Email: ${row.email}`);
        lines.push(`Phone: ${row.phone}`);
        if (row.message) {
          lines.push(`Message: ${row.message}`);
        }
        lines.push(`Created at: ${row.created_at}`);
        lines.push(`Follow-up due: ${row.followup_due_at}`);
        lines.push('');
        try {
          const answers = Array.isArray(row.answers) ? row.answers : JSON.parse(row.answers || '[]');
          if (answers.length) {
            lines.push('Discovery questions:');
            for (const a of answers) {
              if (!a) continue;
              const qText = a.questionText || a.question_text || '';
              const ans = a.answer || '';
              if (!qText && !ans) continue;
              lines.push(`- ${qText}`);
              lines.push(`  ${ans}`);
            }
            lines.push('');
          }
        } catch {
          // ignore JSON parse errors
        }
        lines.push('---');
        lines.push('');
      }

      await sendMail({
        subject: 'Sponsor discovery submissions needing follow-up',
        text: lines.join('\n'),
        html: undefined,
      });

      const ids = rows.map((r) => r.id);
      await db.query(
        `UPDATE sponsorship_discovery_submissions
         SET followup_email_sent_at = NOW()
         WHERE id = ANY($1::int[])`,
        [ids]
      );
    } catch (err) {
      console.error('discovery follow-up job error:', err);
    }
  }

  const followupTimer = setInterval(runDiscoveryFollowupJob, reminderIntervalMs);

  // Graceful shutdown: exit 0 on SIGTERM so Railway doesn't report npm error
  process.on('SIGTERM', () => {
    clearInterval(followupTimer);
    server.close(() => process.exit(0));
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
