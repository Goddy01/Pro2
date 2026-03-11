import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const MAX_QUESTION_LEN = 2000;
const MAX_OPTION_LEN = 200;
const MAX_OPTIONS = 50;
const QUESTION_TYPES = ['short_text', 'long_text', 'dropdown'];
const ROLES = ['email', 'name', 'business_name', 'phone', 'message'];

// Public: active questions for sponsorship page
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, question_text, position, is_required, question_type, options, role
       FROM sponsorship_discovery_questions
       WHERE is_active = true
       ORDER BY position ASC, id ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('discovery-questions public list error:', err);
    res.status(500).json({ error: 'Failed to load questions' });
  }
});

// Admin: full list
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, question_text, position, is_required, is_active, question_type, options, role, created_at, updated_at
       FROM sponsorship_discovery_questions
       ORDER BY position ASC, id ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('discovery-questions admin list error:', err);
    res.status(500).json({ error: err.message });
  }
});

function normalizeQuestionType(v) {
  if (typeof v !== 'string') return 'short_text';
  const t = v.trim().toLowerCase();
  return QUESTION_TYPES.includes(t) ? t : 'short_text';
}

function normalizeRole(v) {
  if (v == null || v === '') return null;
  const r = typeof v === 'string' ? v.trim().toLowerCase() : '';
  return ROLES.includes(r) ? r : null;
}

function normalizeOptions(questionType, bodyOptions) {
  if (questionType !== 'dropdown') return null;
  if (!Array.isArray(bodyOptions)) return null;
  const opts = bodyOptions
    .filter((o) => typeof o === 'string')
    .map((o) => o.trim().slice(0, MAX_OPTION_LEN))
    .filter(Boolean)
    .slice(0, MAX_OPTIONS);
  return opts.length ? opts : null;
}

// Admin: create
router.post('/admin', authMiddleware, async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    const rawText = typeof body.question_text === 'string' ? body.question_text : '';
    const questionText = rawText.trim().slice(0, MAX_QUESTION_LEN);
    const isRequired = body.is_required !== false;
    const questionType = normalizeQuestionType(body.question_type);
    const role = normalizeRole(body.role);
    const options = normalizeOptions(questionType, body.options);

    if (!questionText) {
      return res.status(400).json({ error: 'Question text is required' });
    }
    if (questionType === 'dropdown' && (!options || options.length === 0)) {
      return res.status(400).json({ error: 'Dropdown questions must have at least one option' });
    }

    const position =
      typeof body.position === 'number' && Number.isFinite(body.position) ? Math.max(0, Math.floor(body.position)) : 0;

    const { rows } = await db.query(
      `INSERT INTO sponsorship_discovery_questions (question_text, position, is_required, is_active, question_type, options, role)
       VALUES ($1, $2, $3, true, $4, $5::jsonb, $6)
       RETURNING id, question_text, position, is_required, is_active, question_type, options, role, created_at, updated_at`,
      [questionText, position, isRequired, questionType, options ? JSON.stringify(options) : null, role]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('discovery-questions create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: update
router.put('/admin/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const body = req.body || {};
    const fields = [];
    const values = [];

    if (typeof body.question_text === 'string') {
      const text = body.question_text.trim().slice(0, MAX_QUESTION_LEN);
      if (!text) return res.status(400).json({ error: 'Question text cannot be empty' });
      fields.push('question_text');
      values.push(text);
    }

    if (typeof body.position === 'number' && Number.isFinite(body.position)) {
      fields.push('position');
      values.push(Math.max(0, Math.floor(body.position)));
    }

    if (typeof body.is_required === 'boolean') {
      fields.push('is_required');
      values.push(body.is_required);
    }

    if (typeof body.is_active === 'boolean') {
      fields.push('is_active');
      values.push(body.is_active);
    }

    if (body.question_type !== undefined) {
      fields.push('question_type');
      values.push(normalizeQuestionType(body.question_type));
    }
    if (body.role !== undefined) {
      fields.push('role');
      values.push(normalizeRole(body.role));
    }
    if (body.options !== undefined) {
      const qType = body.question_type !== undefined ? normalizeQuestionType(body.question_type) : (await db.query('SELECT question_type FROM sponsorship_discovery_questions WHERE id = $1', [id])).rows[0]?.question_type || 'short_text';
      const opts = normalizeOptions(qType, body.options);
      fields.push('options');
      values.push(opts ? JSON.stringify(opts) : null);
    }

    if (!fields.length) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Always touch updated_at
    fields.push('updated_at');
    values.push(new Date());

    const setFragments = fields.map((f, idx) => `${f} = $${idx + 1}`).join(', ');
    values.push(id);

    const { rows } = await db.query(
      `UPDATE sponsorship_discovery_questions
       SET ${setFragments}
       WHERE id = $${values.length}
       RETURNING id, question_text, position, is_required, is_active, question_type, options, role, created_at, updated_at`,
      values
    );

    if (!rows.length) return res.status(404).json({ error: 'Question not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('discovery-questions update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete (hard delete for now)
router.delete('/admin/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    const { rowCount } = await db.query('DELETE FROM sponsorship_discovery_questions WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Question not found' });
    res.status(204).send();
  } catch (err) {
    console.error('discovery-questions delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

