import { useState, useRef, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, LogOut, FileText, Image, Calendar, Headphones, Video } from 'lucide-react';
import '../App.css';

const TABS = [
  { id: 'articles', label: 'Articles', icon: FileText },
  { id: 'gallery', label: 'Gallery', icon: Image },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'podcast', label: 'Podcast', icon: Headphones },
  { id: 'watch', label: 'Watch', icon: Video },
] as const;

type TabId = (typeof TABS)[number]['id'];

const inputClass =
  'w-full px-4 py-3 bg-offwhite/5 border border-offwhite/20 text-offwhite placeholder:text-offwhite/40 focus:outline-none focus:border-lime';
const labelClass = 'text-offwhite text-sm font-medium mb-2 block';

export default function AdminDashboard() {
  const { token, logout, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('articles');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Features');
  const [author, setAuthor] = useState('Sideline Sports & Entertainment Team');
  const [image, setImage] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [galleryCaption, setGalleryCaption] = useState('');
  const [galleryImage, setGalleryImage] = useState<File | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventSlug, setEventSlug] = useState('');
  const [eventImages, setEventImages] = useState<File[]>([]);
  const eventImagesRef = useRef<HTMLInputElement>(null);

  const [podcastTitle, setPodcastTitle] = useState('');
  const [podcastDescription, setPodcastDescription] = useState('');
  const [podcastDuration, setPodcastDuration] = useState('');
  const [podcastGuests, setPodcastGuests] = useState('');
  const [podcastAudioUrl, setPodcastAudioUrl] = useState('');
  const [podcastVideoUrl, setPodcastVideoUrl] = useState('');
  const [podcastAudioFile, setPodcastAudioFile] = useState<File | null>(null);
  const [podcastVideoFile, setPodcastVideoFile] = useState<File | null>(null);
  const [podcastThumbnail, setPodcastThumbnail] = useState<File | null>(null);

  const [watchTitle, setWatchTitle] = useState('');
  const [watchVideoId, setWatchVideoId] = useState('');
  const [watchDuration, setWatchDuration] = useState('Video');
  const [watchVideoFile, setWatchVideoFile] = useState<File | null>(null);

  if (!isAuthenticated) return <Navigate to="/superuser" replace />;

  function clearMessages() {
    setError('');
    setSuccess('');
  }

  async function handleArticleSubmit(e: FormEvent) {
    e.preventDefault();
    clearMessages();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!content.trim()) {
      setError('Content is required');
      return;
    }
    if (!image) {
      setError('Image is required');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('title', title.trim());
      form.append('content', content.trim());
      form.append('category', category);
      form.append('author', author);
      form.append('image', image);
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to publish article');
        return;
      }
      setSuccess('Article published.');
      setTitle('');
      setContent('');
      setImage(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  }

  async function handleGallerySubmit(e: FormEvent) {
    e.preventDefault();
    clearMessages();
    if (!galleryImage) {
      setError('Choose an image');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('image', galleryImage);
      if (galleryCaption.trim()) form.append('caption', galleryCaption.trim());
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Upload failed');
        return;
      }
      setSuccess('Image added to gallery.');
      setGalleryCaption('');
      setGalleryImage(null);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  }

  async function handleEventSubmit(e: FormEvent) {
    e.preventDefault();
    clearMessages();
    if (!eventTitle.trim()) {
      setError('Event title is required');
      return;
    }
    if (!eventImages.length) {
      setError('Add at least one image');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('title', eventTitle.trim());
      form.append('description', eventDescription.trim());
      if (eventSlug.trim()) form.append('slug', eventSlug.trim());
      eventImages.forEach((f) => form.append('images', f));
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create event');
        return;
      }
      setSuccess('Event added.');
      setEventTitle('');
      setEventDescription('');
      setEventSlug('');
      setEventImages([]);
      if (eventImagesRef.current) eventImagesRef.current.value = '';
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  }

  async function handlePodcastSubmit(e: FormEvent) {
    e.preventDefault();
    clearMessages();
    if (!podcastTitle.trim()) {
      setError('Title is required');
      return;
    }
    if (!podcastAudioFile && !podcastVideoFile && !podcastAudioUrl.trim() && !podcastVideoUrl.trim()) {
      setError('Add audio or video (file or URL)');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('title', podcastTitle.trim());
      form.append('description', podcastDescription.trim());
      form.append('duration_label', podcastDuration.trim());
      form.append('guests', podcastGuests.trim());
      if (podcastAudioUrl.trim()) form.append('audio_url', podcastAudioUrl.trim());
      if (podcastVideoUrl.trim()) form.append('video_url', podcastVideoUrl.trim());
      if (podcastAudioFile) form.append('audio', podcastAudioFile);
      if (podcastVideoFile) form.append('video', podcastVideoFile);
      if (podcastThumbnail) form.append('thumbnail', podcastThumbnail);
      const res = await fetch('/api/podcast', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add episode');
        return;
      }
      setSuccess('Podcast episode added.');
      setPodcastTitle('');
      setPodcastDescription('');
      setPodcastDuration('');
      setPodcastGuests('');
      setPodcastAudioUrl('');
      setPodcastVideoUrl('');
      setPodcastAudioFile(null);
      setPodcastVideoFile(null);
      setPodcastThumbnail(null);
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  }

  async function handleWatchSubmit(e: FormEvent) {
    e.preventDefault();
    clearMessages();
    if (!watchTitle.trim()) {
      setError('Title is required');
      return;
    }
    const hasYoutube = /^[a-zA-Z0-9_-]{11}$/.test(watchVideoId.trim()) || watchVideoId.includes('youtube') || watchVideoId.includes('youtu.be');
    if (!watchVideoFile && !hasYoutube) {
      setError('Add a YouTube video ID/URL or upload a video file');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('title', watchTitle.trim());
      form.append('duration_label', watchDuration.trim());
      if (watchVideoId.trim()) form.append('video_id', watchVideoId.trim());
      if (watchVideoFile) form.append('video', watchVideoFile);
      const res = await fetch('/api/watch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add video');
        return;
      }
      setSuccess('Video added.');
      setWatchTitle('');
      setWatchVideoId('');
      setWatchDuration('Video');
      setWatchVideoFile(null);
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-forest px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to site
          </Link>
          <button type="button" onClick={logout} className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm">
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>

        <h1 className="text-offwhite font-editorial font-bold text-2xl mb-2">Admin</h1>
        <p className="text-offwhite/60 text-sm mb-6">Upload articles, gallery photos, events, and podcast episodes.</p>

        <div className="flex flex-wrap gap-2 mb-8 border-b border-offwhite/10 pb-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setActiveTab(tab.id); clearMessages(); }}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-lime text-forest' : 'text-offwhite/70 hover:text-lime'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        {success && <p className="text-lime text-sm mb-4">{success}</p>}

        {activeTab === 'articles' && (
          <form onSubmit={handleArticleSubmit} className="space-y-6">
            <label className="block">
              <span className={labelClass}>Title *</span>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Article title" required />
            </label>
            <label className="block">
              <span className={labelClass}>Image *</span>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className={`${inputClass} file:mr-4 file:py-2 file:px-4 file:bg-lime file:text-forest file:border-0`}
                required
              />
            </label>
            <label className="block">
              <span className={labelClass}>Content *</span>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} className={inputClass} placeholder="Article content..." required />
            </label>
            <label className="block">
              <span className={labelClass}>Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                <option value="Features">Features</option>
                <option value="Analysis">Analysis</option>
                <option value="Events">Events</option>
                <option value="Podcast">Podcast</option>
                <option value="Video">Video</option>
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Author</span>
              <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className={inputClass} placeholder="Author name" />
            </label>
            <button type="submit" disabled={loading} className="btn-premium py-4 px-8 disabled:opacity-50">
              {loading ? 'Publishing...' : 'Publish Article'}
            </button>
          </form>
        )}

        {activeTab === 'gallery' && (
          <form onSubmit={handleGallerySubmit} className="space-y-6">
            <label className="block">
              <span className={labelClass}>Photo *</span>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setGalleryImage(e.target.files?.[0] || null)}
                className={`${inputClass} file:mr-4 file:py-2 file:px-4 file:bg-lime file:text-forest file:border-0`}
                required
              />
            </label>
            <label className="block">
              <span className={labelClass}>Caption (optional)</span>
              <input type="text" value={galleryCaption} onChange={(e) => setGalleryCaption(e.target.value)} className={inputClass} placeholder="Brief caption" />
            </label>
            <button type="submit" disabled={loading} className="btn-premium py-4 px-8 disabled:opacity-50">
              {loading ? 'Uploading...' : 'Add to Gallery'}
            </button>
          </form>
        )}

        {activeTab === 'events' && (
          <form onSubmit={handleEventSubmit} className="space-y-6">
            <label className="block">
              <span className={labelClass}>Event title *</span>
              <input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className={inputClass} placeholder="e.g. Ronald McDonald House Charities" required />
            </label>
            <label className="block">
              <span className={labelClass}>Description (optional)</span>
              <textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} rows={3} className={inputClass} placeholder="Short description" />
            </label>
            <label className="block">
              <span className={labelClass}>URL slug (optional, auto from title if empty)</span>
              <input type="text" value={eventSlug} onChange={(e) => setEventSlug(e.target.value)} className={inputClass} placeholder="e.g. rmh-2025" />
            </label>
            <label className="block">
              <span className={labelClass}>Images * (one or more)</span>
              <input
                ref={eventImagesRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setEventImages(Array.from(e.target.files || []))}
                className={`${inputClass} file:mr-4 file:py-2 file:px-4 file:bg-lime file:text-forest file:border-0`}
              />
              {eventImages.length > 0 && <p className="text-offwhite/50 text-xs mt-1">{eventImages.length} file(s) selected</p>}
            </label>
            <button type="submit" disabled={loading} className="btn-premium py-4 px-8 disabled:opacity-50">
              {loading ? 'Creating...' : 'Add Event'}
            </button>
          </form>
        )}

        {activeTab === 'podcast' && (
          <form onSubmit={handlePodcastSubmit} className="space-y-6">
            <label className="block">
              <span className={labelClass}>Episode title *</span>
              <input type="text" value={podcastTitle} onChange={(e) => setPodcastTitle(e.target.value)} className={inputClass} placeholder="Episode title" required />
            </label>
            <label className="block">
              <span className={labelClass}>Description (optional)</span>
              <textarea value={podcastDescription} onChange={(e) => setPodcastDescription(e.target.value)} rows={4} className={inputClass} placeholder="Description" />
            </label>
            <label className="block">
              <span className={labelClass}>Duration (e.g. 59:02)</span>
              <input type="text" value={podcastDuration} onChange={(e) => setPodcastDuration(e.target.value)} className={inputClass} placeholder="01:02:28" />
            </label>
            <label className="block">
              <span className={labelClass}>Guests (comma-separated)</span>
              <input type="text" value={podcastGuests} onChange={(e) => setPodcastGuests(e.target.value)} className={inputClass} placeholder="Name 1, Name 2" />
            </label>
            <label className="block">
              <span className={labelClass}>Audio URL (or upload file below)</span>
              <input type="url" value={podcastAudioUrl} onChange={(e) => setPodcastAudioUrl(e.target.value)} className={inputClass} placeholder="https://..." />
            </label>
            <label className="block">
              <span className={labelClass}>Audio file (optional if URL set)</span>
              <input type="file" accept="audio/*,.mp3,.m4a" onChange={(e) => setPodcastAudioFile(e.target.files?.[0] || null)} className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Video URL or YouTube link (optional)</span>
              <input type="url" value={podcastVideoUrl} onChange={(e) => setPodcastVideoUrl(e.target.value)} className={inputClass} placeholder="https://..." />
            </label>
            <label className="block">
              <span className={labelClass}>Video file (optional)</span>
              <input type="file" accept="video/*,.mp4" onChange={(e) => setPodcastVideoFile(e.target.files?.[0] || null)} className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Thumbnail image (optional)</span>
              <input type="file" accept="image/*" onChange={(e) => setPodcastThumbnail(e.target.files?.[0] || null)} className={inputClass} />
            </label>
            <button type="submit" disabled={loading} className="btn-premium py-4 px-8 disabled:opacity-50">
              {loading ? 'Adding...' : 'Add Podcast Episode'}
            </button>
          </form>
        )}

        {activeTab === 'watch' && (
          <form onSubmit={handleWatchSubmit} className="space-y-6">
            <label className="block">
              <span className={labelClass}>Video title *</span>
              <input type="text" value={watchTitle} onChange={(e) => setWatchTitle(e.target.value)} className={inputClass} placeholder="Video title" required />
            </label>
            <label className="block">
              <span className={labelClass}>YouTube video ID or URL</span>
              <input type="text" value={watchVideoId} onChange={(e) => setWatchVideoId(e.target.value)} className={inputClass} placeholder="dQw4w9WgXcQ or full YouTube URL" />
            </label>
            <label className="block">
              <span className={labelClass}>Or upload video file (if not using YouTube)</span>
              <input type="file" accept="video/*,.mp4" onChange={(e) => setWatchVideoFile(e.target.files?.[0] || null)} className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Duration label</span>
              <input type="text" value={watchDuration} onChange={(e) => setWatchDuration(e.target.value)} className={inputClass} placeholder="Video or Shorts" />
            </label>
            <button type="submit" disabled={loading} className="btn-premium py-4 px-8 disabled:opacity-50">
              {loading ? 'Adding...' : 'Add Video'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
