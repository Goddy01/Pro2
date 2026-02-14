import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadVideoBuffer, hasCloudinaryConfig } from '../lib/cloudinary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const memoryStorage = multer.memoryStorage();
const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /mp4|webm|mov|avi/i;
    const ext = path.extname(file.originalname).slice(1);
    const mime = (file.mimetype || '').toLowerCase();
    if (allowed.test(ext) || mime.includes('video')) cb(null, true);
    else cb(new Error('Only video files allowed'));
  },
});

function extractYoutubeId(urlOrId) {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const s = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  // Match YouTube ID from watch?v=, youtu.be/, /live/, /embed/, /v/
  const m = s.match(/(?:youtube\.com\/(?:watch\?v=|live\/|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, title, video_id, video_url, duration_label, sort_order, created_at FROM watch_videos ORDER BY sort_order ASC, created_at DESC'
    );
    res.json(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        videoId: r.video_id || (r.video_url && extractYoutubeId(r.video_url)) || null,
        videoUrl: r.video_url,
        duration: r.duration_label || 'Video',
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid video ID' });
    const { rows } = await db.query(
      'SELECT id, title, video_id, video_url, duration_label FROM watch_videos WHERE id = $1',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Video not found' });
    const r = rows[0];
    res.json({
      id: r.id,
      title: r.title,
      videoId: r.video_id || (r.video_url && extractYoutubeId(r.video_url)) || null,
      videoUrl: r.video_url,
      duration: r.duration_label || 'Video',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stored columns: watch_videos.title, video_id, video_url, duration_label, sort_order
router.post('/', authMiddleware, upload.single('video'), async (req, res) => {
  try {
    const body = req.body || {};
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const bodyVideoId = typeof body.video_id === 'string' ? body.video_id.trim() : '';
    const bodyVideoUrl = typeof body.video_url === 'string' ? body.video_url.trim() : null;
    const durationLabel = typeof body.duration_label === 'string' ? body.duration_label.trim() || 'Video' : 'Video';

    if (!title) return res.status(400).json({ error: 'Title is required' });

    let videoId = bodyVideoId ? extractYoutubeId(bodyVideoId) : null;
    if (bodyVideoId && !videoId && bodyVideoId.length > 20) {
      return res.status(400).json({ error: 'Could not find YouTube video ID in that URL. Use a link like youtube.com/watch?v=... or youtube.com/live/... or paste the 11-character video ID.' });
    }
    if (bodyVideoId && !videoId) videoId = bodyVideoId.slice(0, 20);
    let videoUrl = bodyVideoUrl || null;

    if (req.file && hasCloudinaryConfig()) {
      const result = await uploadVideoBuffer(req.file.buffer, 'sideline-watch');
      videoUrl = result.secure_url;
      videoId = null;
    }

    if (!videoId && !videoUrl) return res.status(400).json({ error: 'Provide either YouTube video ID/URL or upload a video file' });

    const { rows } = await db.query(
      `INSERT INTO watch_videos (title, video_id, video_url, duration_label, sort_order)
       VALUES ($1, $2, $3, $4, COALESCE((SELECT MAX(sort_order) + 1 FROM watch_videos), 0))
       RETURNING id, title, video_id, video_url, duration_label`,
      [title, videoId, videoUrl, durationLabel]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Watch video create error:', err);
    res.status(500).json({ error: err.message || 'Failed to add video' });
  }
});

router.put('/:id', authMiddleware, upload.single('video'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid video ID' });
    const body = req.body || {};
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const bodyVideoId = typeof body.video_id === 'string' ? body.video_id.trim() : '';
    const bodyVideoUrl = typeof body.video_url === 'string' ? body.video_url.trim() : null;
    const durationLabel = typeof body.duration_label === 'string' ? body.duration_label.trim() || 'Video' : 'Video';

    let videoId = bodyVideoId ? (extractYoutubeId(bodyVideoId) || bodyVideoId) : null;
    let videoUrl = bodyVideoUrl || null;
    if (req.file && hasCloudinaryConfig()) {
      const result = await uploadVideoBuffer(req.file.buffer, 'sideline-watch');
      videoUrl = result.secure_url;
      videoId = null;
    }

    const { rows: existing } = await db.query('SELECT id, video_url, video_id FROM watch_videos WHERE id = $1', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Video not found' });
    if (!videoId && !videoUrl) {
      videoUrl = existing[0].video_url;
      videoId = existing[0].video_id;
    }
    if (!videoId && !videoUrl) return res.status(400).json({ error: 'Provide either YouTube ID/URL or video file' });

    const { rows } = await db.query(
      'UPDATE watch_videos SET title = $1, video_id = $2, video_url = $3, duration_label = $4 WHERE id = $5 RETURNING id, title, video_id, video_url, duration_label',
      [title, videoId, videoUrl, durationLabel, id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('Watch update error:', err);
    res.status(500).json({ error: err.message || 'Failed to update video' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid video ID' });
    const { rowCount } = await db.query('DELETE FROM watch_videos WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Video not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
