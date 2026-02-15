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
    const showFilter = typeof req.query.show === 'string' ? req.query.show.trim() || null : null;
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const searchPattern = q ? `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%` : null;

    let rows;
    if (showFilter && searchPattern) {
      const { rows: r } = await db.query(
        `SELECT id, title, video_id, video_url, duration_label, sort_order, show_name, created_at
         FROM watch_videos
         WHERE TRIM(COALESCE(show_name, '')) = $1
           AND (title ILIKE $2 OR COALESCE(show_name, '') ILIKE $2)
         ORDER BY sort_order ASC, created_at DESC`,
        [showFilter, searchPattern]
      );
      rows = r;
    } else if (showFilter) {
      const { rows: r } = await db.query(
        'SELECT id, title, video_id, video_url, duration_label, sort_order, show_name, created_at FROM watch_videos WHERE TRIM(COALESCE(show_name, \'\')) = $1 ORDER BY sort_order ASC, created_at DESC',
        [showFilter]
      );
      rows = r;
    } else if (searchPattern) {
      const { rows: r } = await db.query(
        `SELECT id, title, video_id, video_url, duration_label, sort_order, show_name, created_at
         FROM watch_videos
         WHERE title ILIKE $1 OR COALESCE(show_name, '') ILIKE $1
         ORDER BY sort_order ASC, created_at DESC`,
        [searchPattern]
      );
      rows = r;
    } else {
      const { rows: r } = await db.query(
        'SELECT id, title, video_id, video_url, duration_label, sort_order, show_name, created_at FROM watch_videos ORDER BY sort_order ASC, created_at DESC'
      );
      rows = r;
    }
    res.json(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        videoId: r.video_id || (r.video_url && extractYoutubeId(r.video_url)) || null,
        videoUrl: r.video_url,
        duration: r.duration_label || 'Video',
        show_name: r.show_name,
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
      'SELECT id, title, video_id, video_url, duration_label, show_name FROM watch_videos WHERE id = $1',
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
      show_name: r.show_name,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stored columns: watch_videos.title, video_id, video_url, duration_label, sort_order, show_name
router.post('/', authMiddleware, upload.single('video'), async (req, res) => {
  try {
    const body = req.body || {};
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const bodyVideoId = typeof body.video_id === 'string' ? body.video_id.trim() : '';
    const bodyVideoUrl = typeof body.video_url === 'string' ? body.video_url.trim() : null;
    const durationLabel = typeof body.duration_label === 'string' ? body.duration_label.trim() || 'Video' : 'Video';
    const showName = typeof body.show_name === 'string' ? body.show_name.trim().slice(0, 200) || null : null;

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
      `INSERT INTO watch_videos (title, video_id, video_url, duration_label, sort_order, show_name)
       VALUES ($1, $2, $3, $4, COALESCE((SELECT MAX(sort_order) + 1 FROM watch_videos), 0), $5)
       RETURNING id, title, video_id, video_url, duration_label, show_name`,
      [title, videoId, videoUrl, durationLabel, showName]
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

    const { rows: existing } = await db.query('SELECT id, video_url, video_id, show_name FROM watch_videos WHERE id = $1', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Video not found' });
    if (!videoId && !videoUrl) {
      videoUrl = existing[0].video_url;
      videoId = existing[0].video_id;
    }
    if (!videoId && !videoUrl) return res.status(400).json({ error: 'Provide either YouTube ID/URL or video file' });
    const showName = typeof body.show_name === 'string' ? body.show_name.trim().slice(0, 200) || null : existing[0].show_name;

    const { rows } = await db.query(
      'UPDATE watch_videos SET title = $1, video_id = $2, video_url = $3, duration_label = $4, show_name = $5 WHERE id = $6 RETURNING id, title, video_id, video_url, duration_label, show_name',
      [title, videoId, videoUrl, durationLabel, showName, id]
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
