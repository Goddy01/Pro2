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

const emailRegex =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const THANK_YOU_BODY = `Thank you for your interest in partnering with Sideline Sports & Entertainment.

We've received your sponsorship inquiry and a member of our team will review your submission shortly. We're excited to learn more about your organization and explore potential partnership opportunities.

Someone from our team will follow up with you within the next 24–48 hours to discuss the next steps.

In the meantime, feel free to learn more about our platform and coverage at sideline-se.com.

We appreciate your interest in working with Sideline Sports.`;

// Public: submit discovery responses (body: { answers: [{ questionId, answer }] })
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const answersPayload = Array.isArray(body.answers) ? body.answers : [];

    const { rows: questionRows } = await db.query(
      `SELECT id, question_text, is_required, question_type, options, role
       FROM sponsorship_discovery_questions
       WHERE is_active = true
       ORDER BY position ASC, id ASC`
    );

    if (!questionRows.length) {
      return res.status(400).json({ error: 'No questions are configured. Please try again later.' });
    }

    const emailQuestion = questionRows.find((q) => q.role === 'email');
    if (!emailQuestion) {
      return res.status(400).json({ error: 'A valid email is required. Please complete the form and try again.' });
    }

    const answers = [];
    const byRole = { email: '', name: '', business_name: '', phone: '', message: null };

    for (const q of questionRows) {
      const raw = answersPayload.find((a) => a && Number(a.questionId) === q.id);
      let val =
        raw && typeof raw.answer === 'string'
          ? stripHtml(raw.answer.slice(0, MAX_ANSWER)).trim()
          : '';

      if (q.is_required && !val) {
        return res.status(400).json({ error: 'Please answer all required questions' });
      }

      if (q.question_type === 'dropdown' && q.options && Array.isArray(q.options)) {
        if (val && !q.options.includes(val)) {
          return res.status(400).json({ error: `Please select a valid option for: ${q.question_text}` });
        }
      }

      if (q.role && byRole.hasOwnProperty(q.role)) {
        if (q.role === 'message') byRole[q.role] = val ? val.slice(0, MAX_MESSAGE) : null;
        else byRole[q.role] = val.slice(0, q.role === 'email' ? MAX_EMAIL : q.role === 'name' ? MAX_NAME : q.role === 'business_name' ? MAX_BUSINESS : MAX_PHONE);
      }

      if (val) {
        answers.push({
          questionId: q.id,
          questionText: q.question_text,
          answer: val,
        });
      }
    }

    const email = (byRole.email || '').toLowerCase();
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }

    const sponsor_name = (byRole.name || '').slice(0, MAX_NAME) || '—';
    const business_name = (byRole.business_name || '').slice(0, MAX_BUSINESS) || '—';
    const phone = (byRole.phone || '').slice(0, MAX_PHONE) || '—';
    const message = byRole.message;

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
      [sponsor_name, business_name, email, phone, message, JSON.stringify(answers), now, followupDue]
    );

    const submission = insertResult.rows[0];

    const textLines = [
      'New sponsor discovery submission',
      '',
      `Name: ${sponsor_name}`,
      `Business: ${business_name}`,
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
      subject: `New Sponsor Discovery Submission from ${sponsor_name}`,
      text: textLines.join('\n'),
      html: undefined,
    }).catch((err) => {
      console.error('Internal notification email failed:', err?.message || err);
    });

    sendMail({
      subject: "We've received your sponsorship inquiry – Sideline Sports & Entertainment",
      text: THANK_YOU_BODY,
      html: undefined,
      to: email,
    }).catch((err) => {
      console.error('Thank-you email to submitter failed:', email, err?.message || err);
    });

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

// Admin: delete a submission
router.delete('/admin/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const { rowCount } = await db.query(
      'DELETE FROM sponsorship_discovery_submissions WHERE id = $1',
      [id]
    );

    if (rowCount === 0) return res.status(404).json({ error: 'Submission not found' });

    res.status(204).send();
  } catch (err) {
    console.error('discovery-submission delete error:', err);
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

