import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const MAX_QUESTION_LEN = 2000;

// Public: active questions for sponsorship page
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, question_text, position, is_required FROM sponsorship_discovery_questions WHERE is_active = true ORDER BY position ASC, id ASC'
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
      'SELECT id, question_text, position, is_required, is_active, created_at, updated_at FROM sponsorship_discovery_questions ORDER BY position ASC, id ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('discovery-questions admin list error:', err);
    res.status(500).json({ error: err.message });
  }
});

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

    if (!questionText) {
      return res.status(400).json({ error: 'Question text is required' });
    }

    const position =
      typeof body.position === 'number' && Number.isFinite(body.position) ? Math.max(0, Math.floor(body.position)) : 0;

    const { rows } = await db.query(
      `INSERT INTO sponsorship_discovery_questions (question_text, position, is_required, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING id, question_text, position, is_required, is_active, created_at, updated_at`,
      [questionText, position, isRequired]
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
       RETURNING id, question_text, position, is_required, is_active, created_at, updated_at`,
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

