import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadImageBuffer, uploadAudioBuffer, uploadVideoBuffer, hasCloudinaryConfig } from '../lib/cloudinary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const memoryStorage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const img = /jpeg|jpg|png|gif|webp/i;
  const audio = /mp3|m4a|wav|ogg|webm/i;
  const video = /mp4|webm|mov/i;
  const ext = path.extname(file.originalname).slice(1);
  const mime = file.mimetype || '';
  if (img.test(ext) || img.test(mime)) return cb(null, true);
  if (audio.test(ext) || audio.test(mime)) return cb(null, true);
  if (video.test(ext) || video.test(mime)) return cb(null, true);
  cb(new Error('Invalid file type'));
};
const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter,
});

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, title, description, duration_label, guests, audio_url, video_url, thumbnail_url, created_at FROM podcast_episodes ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid episode ID' });
    const { rows } = await db.query(
      'SELECT id, title, description, duration_label, guests, audio_url, video_url, thumbnail_url, created_at FROM podcast_episodes WHERE id = $1',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Episode not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stored columns: podcast_episodes.title, description, duration_label, guests, audio_url, video_url, thumbnail_url
router.post('/', authMiddleware, upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), async (req, res) => {
  try {
    const body = req.body || {};
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : null;
    const durationLabel = typeof body.duration_label === 'string' ? body.duration_label.trim() || null : null;
    const guests = typeof body.guests === 'string' ? body.guests.trim() || null : null;
    let audioUrl = typeof body.audio_url === 'string' ? body.audio_url.trim() || null : null;
    let videoUrl = typeof body.video_url === 'string' ? body.video_url.trim() || null : null;
    let thumbnailUrl = null;

    if (!title) return res.status(400).json({ error: 'Title is required' });

    if (hasCloudinaryConfig()) {
      const files = req.files || {};
      if (files.audio?.[0]) {
        const result = await uploadAudioBuffer(files.audio[0].buffer, 'sideline-podcast');
        audioUrl = result.secure_url;
      }
      if (files.video?.[0]) {
        const result = await uploadVideoBuffer(files.video[0].buffer, 'sideline-podcast');
        videoUrl = result.secure_url;
      }
      if (files.thumbnail?.[0]) {
        const result = await uploadImageBuffer(files.thumbnail[0].buffer, 'sideline-podcast');
        thumbnailUrl = result.secure_url;
      }
    }

    if (!audioUrl && !videoUrl) return res.status(400).json({ error: 'Provide either audio file/URL or video file/URL' });

    const { rows } = await db.query(
      `INSERT INTO podcast_episodes (title, description, duration_label, guests, audio_url, video_url, thumbnail_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, title, description, duration_label, guests, audio_url, video_url, thumbnail_url, created_at`,
      [title, description, durationLabel, guests, audioUrl, videoUrl, thumbnailUrl]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Podcast create error:', err);
    res.status(500).json({ error: err.message || 'Failed to create episode' });
  }
});

router.put('/:id', authMiddleware, upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid episode ID' });
    const body = req.body || {};
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const { rows: existing } = await db.query(
      'SELECT id, title, description, duration_label, guests, audio_url, video_url, thumbnail_url FROM podcast_episodes WHERE id = $1',
      [id]
    );
    if (!existing.length) return res.status(404).json({ error: 'Episode not found' });
    const current = existing[0];

    let description = typeof body.description === 'string' ? body.description.trim() || null : current.description;
    let durationLabel = typeof body.duration_label === 'string' ? body.duration_label.trim() || null : current.duration_label;
    let guests = typeof body.guests === 'string' ? body.guests.trim() || null : current.guests;
    let audioUrl = typeof body.audio_url === 'string' ? body.audio_url.trim() || null : current.audio_url;
    let videoUrl = typeof body.video_url === 'string' ? body.video_url.trim() || null : current.video_url;
    let thumbnailUrl = current.thumbnail_url;

    if (hasCloudinaryConfig()) {
      const files = req.files || {};
      if (files.audio?.[0]) {
        const result = await uploadAudioBuffer(files.audio[0].buffer, 'sideline-podcast');
        audioUrl = result.secure_url;
      }
      if (files.video?.[0]) {
        const result = await uploadVideoBuffer(files.video[0].buffer, 'sideline-podcast');
        videoUrl = result.secure_url;
      }
      if (files.thumbnail?.[0]) {
        const result = await uploadImageBuffer(files.thumbnail[0].buffer, 'sideline-podcast');
        thumbnailUrl = result.secure_url;
      }
    }
    if (!audioUrl && !videoUrl) return res.status(400).json({ error: 'Provide either audio or video URL/file' });

    const { rows } = await db.query(
      `UPDATE podcast_episodes SET title = $1, description = $2, duration_label = $3, guests = $4, audio_url = $5, video_url = $6, thumbnail_url = $7 WHERE id = $8
       RETURNING id, title, description, duration_label, guests, audio_url, video_url, thumbnail_url, created_at`,
      [title, description, durationLabel, guests, audioUrl, videoUrl, thumbnailUrl, id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('Podcast update error:', err);
    res.status(500).json({ error: err.message || 'Failed to update episode' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid episode ID' });
    const { rowCount } = await db.query('DELETE FROM podcast_episodes WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Episode not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
