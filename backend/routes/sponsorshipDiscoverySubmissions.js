import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { sendMail } from '../email.js';

const router = Router();

const MAX_NAME = 200;
const MAX_BUSINESS = 300;
const MAX_EMAIL = 254;
const MAX_PHONE = 30;
const MAX_MESSAGE = 2000;
const MAX_ANSWER = 4000;

const FOLLOWUP_HOURS = process.env.DISCOVERY_FOLLOWUP_HOURS
  ? Math.max(1, Number(process.env.DISCOVERY_FOLLOWUP_HOURS))
  : 24;

function stripHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Public: submit discovery responses
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const name = typeof body.name === 'string' ? body.name.trim().slice(0, MAX_NAME) : '';
    const businessName =
      typeof body.business_name === 'string' ? body.business_name.trim().slice(0, MAX_BUSINESS) : '';
    const email =
      typeof body.email === 'string' ? body.email.trim().slice(0, MAX_EMAIL).toLowerCase() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, MAX_PHONE) : '';
    const rawMessage = typeof body.message === 'string' ? body.message.slice(0, MAX_MESSAGE) : '';
    const message = rawMessage ? stripHtml(rawMessage) : null;

    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }
    if (!businessName || businessName.length < 2) {
      return res.status(400).json({ error: 'Business name is required' });
    }
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Valid email required' });
    }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'Valid phone number required' });
    }

    const answersPayload = Array.isArray(body.answers) ? body.answers : [];
    const questionIdsFromClient = new Set(
      answersPayload
        .map((a) => (a && typeof a.questionId === 'number' ? a.questionId : null))
        .filter((v) => v != null)
    );

    // Load active questions to validate required answers
    const { rows: questionRows } = await db.query(
      'SELECT id, question_text, is_required FROM sponsorship_discovery_questions WHERE is_active = true ORDER BY position ASC, id ASC'
    );

    const answers = [];
    for (const q of questionRows) {
      const raw = answersPayload.find((a) => a && Number(a.questionId) === q.id);
      const val =
        raw && typeof raw.answer === 'string'
          ? stripHtml(raw.answer.slice(0, MAX_ANSWER))
          : '';

      if (q.is_required && !val) {
        return res.status(400).json({ error: 'Please answer all required questions' });
      }

      if (val) {
        answers.push({
          questionId: q.id,
          questionText: q.question_text,
          answer: val,
        });
      }
    }

    if (!answers.length) {
      return res.status(400).json({ error: 'Please answer at least one question' });
    }

    const now = new Date();
    const followupDue = new Date(now.getTime() + FOLLOWUP_HOURS * 60 * 60 * 1000);

    const insertResult = await db.query(
      `INSERT INTO sponsorship_discovery_submissions
        (sponsor_name, business_name, email, phone, message, answers, created_at, followup_due_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
       RETURNING id, created_at, followup_due_at`,
      [name, businessName, email, phone, message, JSON.stringify(answers), now, followupDue]
    );

    const submission = insertResult.rows[0];

    // Fire-and-forget email; don't block response on failure
    const textLines = [
      'New sponsor discovery submission',
      '',
      `Name: ${name}`,
      `Business: ${businessName}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      '',
      message ? `Message:\n${message}\n` : '',
      'Discovery questions:',
      '',
      ...answers.map((a, idx) => `${idx + 1}. ${a.questionText}\n   ${a.answer}`),
      '',
      `Created at: ${submission.created_at?.toISOString?.() || submission.created_at}`,
      `Follow-up due: ${submission.followup_due_at?.toISOString?.() || submission.followup_due_at}`,
    ].filter(Boolean);

    sendMail({
      subject: `New Sponsor Discovery Submission from ${name}`,
      text: textLines.join('\n'),
      html: undefined,
    }).catch(() => {});

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('discovery-submission error:', err);
    res.status(500).json({ error: 'Could not submit. Please try again.' });
  }
});

// Admin: list submissions
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : 'all';

    let where = '1=1';
    const params = [];

    if (status === 'needs-followup') {
      where = 'followup_completed_at IS NULL';
    } else if (status === 'completed') {
      where = 'followup_completed_at IS NOT NULL';
    }

    const { rows } = await db.query(
      `SELECT id, sponsor_name, business_name, email, phone, message, answers,
              created_at, followup_due_at, followup_completed_at, followup_email_sent_at
       FROM sponsorship_discovery_submissions
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT 200`,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error('discovery-submissions admin list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: mark follow-up complete or reopen
router.patch('/admin/:id/followup', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const done = !!(req.body && req.body.completed);

    const { rows } = await db.query(
      done
        ? `UPDATE sponsorship_discovery_submissions
           SET followup_completed_at = NOW()
           WHERE id = $1
           RETURNING id, followup_completed_at`
        : `UPDATE sponsorship_discovery_submissions
           SET followup_completed_at = NULL
           WHERE id = $1
           RETURNING id, followup_completed_at`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Submission not found' });

    res.json(rows[0]);
  } catch (err) {
    console.error('discovery-submission followup patch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: count submissions that still need follow-up (for dashboard badge)
router.get('/admin/needs-followup-count', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT COUNT(*) AS count
       FROM sponsorship_discovery_submissions
       WHERE followup_completed_at IS NULL`
    );
    res.json({ count: parseInt(rows[0]?.count ?? '0', 10) });
  } catch (err) {
    console.error('discovery-submission needs-followup-count error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

