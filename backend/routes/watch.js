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
  const m = s.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, title, video_id, video_url, duration_label, sort_order, created_at FROM watch_videos ORDER BY sort_order ASC, created_at DESC'
    );
    res.json(
      rows.map((r) => ({
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

router.post('/', authMiddleware, upload.single('video'), async (req, res) => {
  try {
    const { title, video_id: bodyVideoId, video_url: bodyVideoUrl, duration_label } = req.body || {};
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

    let videoId = bodyVideoId ? extractYoutubeId(bodyVideoId) || bodyVideoId.trim() : null;
    let videoUrl = (bodyVideoUrl || '').trim() || null;

    if (req.file && hasCloudinaryConfig()) {
      const result = await uploadVideoBuffer(req.file.buffer, 'sideline-watch');
      videoUrl = result.secure_url;
      videoId = null;
    }

    if (!videoId && !videoUrl) return res.status(400).json({ error: 'Provide either YouTube video ID/URL or upload a video file' });

    const duration = (duration_label || '').trim() || 'Video';
    const { rows } = await db.query(
      `INSERT INTO watch_videos (title, video_id, video_url, duration_label, sort_order)
       VALUES ($1, $2, $3, $4, COALESCE((SELECT MAX(sort_order) + 1 FROM watch_videos), 0))
       RETURNING id, title, video_id, video_url, duration_label`,
      [title.trim(), videoId, videoUrl, duration]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Watch video create error:', err);
    res.status(500).json({ error: err.message || 'Failed to add video' });
  }
});

export default router;
