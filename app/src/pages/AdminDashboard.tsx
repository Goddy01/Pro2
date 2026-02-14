import { useState, useRef, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../lib/api';
import { ArrowLeft, LogOut, FileText, Image, Calendar, Headphones, Video, UserPlus } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
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
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [galleryUploadProgress, setGalleryUploadProgress] = useState<{ uploaded: number; total: number } | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventImages, setEventImages] = useState<File[]>([]);
  const eventImagesRef = useRef<HTMLInputElement>(null);

  const [podcastType, setPodcastType] = useState<'audio' | 'video' | null>(null);
  const [podcastTitle, setPodcastTitle] = useState('');
  const [podcastDescription, setPodcastDescription] = useState('');
  const [podcastDuration, setPodcastDuration] = useState('');
  const [podcastGuests, setPodcastGuests] = useState('');
  const [podcastAudioUrl, setPodcastAudioUrl] = useState('');
  const [podcastVideoUrl, setPodcastVideoUrl] = useState('');

  const [watchTitle, setWatchTitle] = useState('');
  const [watchVideoId, setWatchVideoId] = useState('');
  const [watchDuration, setWatchDuration] = useState('Video');

  const [addAdminModalOpen, setAddAdminModalOpen] = useState(false);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [addAdminError, setAddAdminError] = useState('');
  const [addAdminSuccess, setAddAdminSuccess] = useState('');
  const [addAdminLoading, setAddAdminLoading] = useState(false);

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
    const textOnly = (content || '').replace(/<[^>]*>/g, '').trim();
    if (!textOnly) {
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
      const res = await fetch(apiUrl('/api/articles'), {
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
    if (!galleryImages.length) {
      setError('Choose at least one image');
      return;
    }
    setLoading(true);
    const total = galleryImages.length;
    let uploaded = 0;
    setGalleryUploadProgress({ uploaded: 0, total });
    try {
      for (const file of galleryImages) {
        const form = new FormData();
        form.append('image', file);
        if (galleryCaption.trim()) form.append('caption', galleryCaption.trim());
        const res = await fetch(apiUrl('/api/gallery'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const data = await res.json();
        if (!res.ok) {
          setGalleryUploadProgress(null);
          setError(data.error || `Upload failed (${uploaded} of ${total} uploaded)`);
          return;
        }
        uploaded += 1;
        setGalleryUploadProgress({ uploaded, total });
      }
      setGalleryUploadProgress(null);
      setSuccess(total === 1 ? 'Image added to gallery.' : `${total} images added to gallery.`);
      setGalleryCaption('');
      setGalleryImages([]);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    } catch {
      setGalleryUploadProgress(null);
      setError('Could not connect to server' + (uploaded ? ` (${uploaded} of ${total} uploaded)` : ''));
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
      eventImages.forEach((f) => form.append('images', f));
      const res = await fetch(apiUrl('/api/events'), {
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
    if (!podcastType) {
      setError('Choose audio or video podcast first');
      return;
    }
    if (!podcastTitle.trim()) {
      setError('Title is required');
      return;
    }
    if (podcastType === 'audio' && !podcastAudioUrl.trim()) {
      setError('Audio URL is required');
      return;
    }
    if (podcastType === 'video' && !podcastVideoUrl.trim()) {
      setError('Video URL is required');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('title', podcastTitle.trim());
      form.append('description', podcastDescription.trim());
      form.append('duration_label', podcastDuration.trim());
      form.append('guests', podcastGuests.trim());
      if (podcastType === 'audio' && podcastAudioUrl.trim()) form.append('audio_url', podcastAudioUrl.trim());
      if (podcastType === 'video' && podcastVideoUrl.trim()) form.append('video_url', podcastVideoUrl.trim());
      const res = await fetch(apiUrl('/api/podcast'), {
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
      setPodcastType(null);
      setPodcastTitle('');
      setPodcastDescription('');
      setPodcastDuration('');
      setPodcastGuests('');
      setPodcastAudioUrl('');
      setPodcastVideoUrl('');
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAdmin(e: FormEvent) {
    e.preventDefault();
    setAddAdminError('');
    setAddAdminSuccess('');
    if (!newAdminUsername.trim() || !newAdminPassword.trim()) {
      setAddAdminError('Username and password required');
      return;
    }
    if (newAdminPassword.length < 6) {
      setAddAdminError('Password must be at least 6 characters');
      return;
    }
    setAddAdminLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/admins'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: newAdminUsername.trim(), password: newAdminPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddAdminError(data.error || 'Failed to add admin');
        return;
      }
      setAddAdminSuccess(`Admin "${newAdminUsername.trim()}" created. They can log in from another device.`);
      setNewAdminUsername('');
      setNewAdminPassword('');
      setAddAdminModalOpen(false);
    } catch {
      setAddAdminError('Could not connect to server');
    } finally {
      setAddAdminLoading(false);
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
    if (!hasYoutube) {
      setError('YouTube video ID or URL is required');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('title', watchTitle.trim());
      form.append('duration_label', watchDuration.trim());
      form.append('video_id', watchVideoId.trim());
      const res = await fetch(apiUrl('/api/watch'), {
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
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => { setAddAdminModalOpen(true); setAddAdminError(''); setAddAdminSuccess(''); }} className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm">
              <UserPlus className="w-4 h-4" />
              Add new admin
            </button>
            <button type="button" onClick={logout} className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm">
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>

        <h1 className="text-offwhite font-editorial font-bold text-2xl mb-2">Admin</h1>
        <p className="text-offwhite/60 text-sm mb-6">Upload articles, gallery photos, events, and podcast episodes. <Link to="/admin/work-with-us-submissions" className="text-lime hover:underline">View Work with us submissions</Link> · <Link to="/admin/newsletter-signups" className="text-lime hover:underline">View newsletter signups</Link></p>

        <div className="flex flex-wrap gap-2 mb-8 border-b border-offwhite/10 pb-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setActiveTab(tab.id); clearMessages(); if (tab.id !== 'podcast') setPodcastType(null); }}
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
              <RichTextEditor value={content} onChange={setContent} placeholder="Article content..." minHeight="32rem" />
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
              <span className={labelClass}>Photos * (select one or multiple)</span>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setGalleryImages(Array.from(e.target.files || []))}
                className={`${inputClass} file:mr-4 file:py-2 file:px-4 file:bg-lime file:text-forest file:border-0`}
              />
              {galleryImages.length > 0 && (
                <p className="text-offwhite/50 text-sm mt-1">{galleryImages.length} image{galleryImages.length !== 1 ? 's' : ''} selected</p>
              )}
            </label>
            <label className="block">
              <span className={labelClass}>Caption (optional, applied to all)</span>
              <input type="text" value={galleryCaption} onChange={(e) => setGalleryCaption(e.target.value)} className={inputClass} placeholder="Brief caption" />
            </label>
            {galleryUploadProgress && (
              <p className="text-lime text-sm">{galleryUploadProgress.total > 1 ? `Uploading ${galleryUploadProgress.uploaded} of ${galleryUploadProgress.total}...` : 'Uploading...'}</p>
            )}
            <button type="submit" disabled={loading || !galleryImages.length} className="btn-premium py-4 px-8 disabled:opacity-50">
              {loading ? (galleryUploadProgress ? `Uploading ${galleryUploadProgress.uploaded}/${galleryUploadProgress.total}...` : 'Uploading...') : galleryImages.length > 1 ? `Add ${galleryImages.length} to Gallery` : 'Add to Gallery'}
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
          <div className="space-y-6">
            {podcastType == null ? (
              <>
                <p className={labelClass}>What are you uploading?</p>
                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => setPodcastType('audio')}
                    className="px-6 py-4 border-2 border-offwhite/30 text-offwhite hover:border-lime hover:text-lime transition-colors font-medium"
                  >
                    Audio podcast
                  </button>
                  <button
                    type="button"
                    onClick={() => setPodcastType('video')}
                    className="px-6 py-4 border-2 border-offwhite/30 text-offwhite hover:border-lime hover:text-lime transition-colors font-medium"
                  >
                    Video podcast
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handlePodcastSubmit} className="space-y-6">
                <button type="button" onClick={() => setPodcastType(null)} className="text-offwhite/60 hover:text-lime text-sm mb-2">
                  ← Change to {podcastType === 'audio' ? 'video' : 'audio'} podcast
                </button>
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
                {podcastType === 'audio' && (
                  <label className="block">
                    <span className={labelClass}>Audio URL *</span>
                    <input type="url" value={podcastAudioUrl} onChange={(e) => setPodcastAudioUrl(e.target.value)} className={inputClass} placeholder="https://..." required={podcastType === 'audio'} />
                  </label>
                )}
                {podcastType === 'video' && (
                  <label className="block">
                    <span className={labelClass}>Video URL or YouTube link *</span>
                    <input type="url" value={podcastVideoUrl} onChange={(e) => setPodcastVideoUrl(e.target.value)} className={inputClass} placeholder="https://..." required={podcastType === 'video'} />
                  </label>
                )}
                <button type="submit" disabled={loading} className="btn-premium py-4 px-8 disabled:opacity-50">
                  {loading ? 'Adding...' : 'Add Podcast Episode'}
                </button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'watch' && (
          <form onSubmit={handleWatchSubmit} className="space-y-6">
            <label className="block">
              <span className={labelClass}>Video title *</span>
              <input type="text" value={watchTitle} onChange={(e) => setWatchTitle(e.target.value)} className={inputClass} placeholder="Video title" required />
            </label>
            <label className="block">
              <span className={labelClass}>YouTube video ID or URL *</span>
              <input type="text" value={watchVideoId} onChange={(e) => setWatchVideoId(e.target.value)} className={inputClass} placeholder="dQw4w9WgXcQ or full YouTube URL" required />
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

        <Dialog open={addAdminModalOpen} onOpenChange={(open) => { setAddAdminModalOpen(open); if (!open) { setAddAdminError(''); setAddAdminSuccess(''); } }}>
          <DialogContent className="bg-forest border-offwhite/20 text-offwhite">
            <DialogHeader>
              <DialogTitle className="text-offwhite">Add another admin</DialogTitle>
              <DialogDescription className="text-offwhite/60">
                Multiple admins can be logged in at the same time. Create a new account for another person.
              </DialogDescription>
            </DialogHeader>
            {addAdminError && <p className="text-red-400 text-sm">{addAdminError}</p>}
            {addAdminSuccess && <p className="text-lime text-sm">{addAdminSuccess}</p>}
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <label className="block">
                <span className={labelClass}>Username</span>
                <input type="text" value={newAdminUsername} onChange={(e) => setNewAdminUsername(e.target.value)} className={inputClass} placeholder="newadmin" autoComplete="off" />
              </label>
              <label className="block">
                <span className={labelClass}>Password</span>
                <input type="password" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} className={inputClass} placeholder="min 6 characters" autoComplete="new-password" minLength={6} />
              </label>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={addAdminLoading} className="btn-premium py-3 px-6 disabled:opacity-50">
                  {addAdminLoading ? 'Adding...' : 'Add admin'}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
