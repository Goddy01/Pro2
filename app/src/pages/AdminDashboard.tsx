import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../lib/api';
import { ArrowLeft, LogOut, FileText, Image, Calendar, Headphones, Video, UserPlus, Pencil, Trash2, Menu, X } from 'lucide-react';
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

  const [articlesList, setArticlesList] = useState<{ id: number; title: string }[]>([]);
  const [galleryList, setGalleryList] = useState<{ id: number; src: string; caption: string | null }[]>([]);
  const [eventsList, setEventsList] = useState<{ id: string; title: string }[]>([]);
  const [podcastList, setPodcastList] = useState<{ id: number; title: string }[]>([]);
  const [watchList, setWatchList] = useState<{ id: number; title: string }[]>([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
  const [editingGalleryId, setEditingGalleryId] = useState<number | null>(null);
  const [editingEventSlug, setEditingEventSlug] = useState<string | null>(null);
  const [editingPodcastId, setEditingPodcastId] = useState<number | null>(null);
  const [editingWatchId, setEditingWatchId] = useState<number | null>(null);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  if (!isAuthenticated) return <Navigate to="/superuser" replace />;

  function refetchLists() {
    if (!token) return;
    setListsLoading(true);
    Promise.all([
      fetch(apiUrl('/api/articles')).then((r) => r.json()).then((d) => (Array.isArray(d) ? setArticlesList(d.map((a: { id: number; title: string }) => ({ id: a.id, title: a.title }))) : null)),
      fetch(apiUrl('/api/gallery')).then((r) => r.json()).then((d) => (Array.isArray(d) ? setGalleryList(d.map((g: { id: number; src: string; caption?: string }) => ({ id: g.id, src: g.src, caption: g.caption ?? null }))) : null)),
      fetch(apiUrl('/api/events')).then((r) => r.json()).then((d) => (Array.isArray(d) ? setEventsList(d.map((e: { id: string; title: string }) => ({ id: e.id, title: e.title }))) : null)),
      fetch(apiUrl('/api/podcast')).then((r) => r.json()).then((d) => (Array.isArray(d) ? setPodcastList(d.map((p: { id: number; title: string }) => ({ id: p.id, title: p.title }))) : null)),
      fetch(apiUrl('/api/watch')).then((r) => r.json()).then((d) => (Array.isArray(d) ? setWatchList(d.map((w: { id: number; title: string }) => ({ id: w.id, title: w.title }))) : null)),
    ]).finally(() => setListsLoading(false));
  }

  useEffect(() => {
    if (token) refetchLists();
  }, [token]);

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
    if (!editingArticleId && !image) {
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
      if (image) form.append('image', image);
      const url = editingArticleId ? apiUrl(`/api/articles/${editingArticleId}`) : apiUrl('/api/articles');
      const res = await fetch(url, {
        method: editingArticleId ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || (editingArticleId ? 'Failed to update article' : 'Failed to publish article'));
        return;
      }
      setSuccess(editingArticleId ? 'Article updated.' : 'Article published.');
      setTitle('');
      setContent('');
      setImage(null);
      setEditingArticleId(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
      refetchLists();
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  }

  async function deleteArticle(id: number) {
    if (!confirm('Delete this article? This cannot be undone.')) return;
    try {
      const res = await fetch(apiUrl(`/api/articles/${id}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to delete');
        return;
      }
      setSuccess('Article deleted.');
      if (editingArticleId === id) {
        setEditingArticleId(null);
        setTitle('');
        setContent('');
        setImage(null);
      }
      refetchLists();
    } catch {
      setError('Could not connect to server');
    }
  }

  async function deleteGallery(id: number) {
    if (!confirm('Remove this image from the gallery?')) return;
    try {
      const res = await fetch(apiUrl(`/api/gallery/${id}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to delete');
        return;
      }
      setSuccess('Image removed.');
      if (editingGalleryId === id) setEditingGalleryId(null);
      refetchLists();
    } catch {
      setError('Could not connect to server');
    }
  }

  async function deleteEvent(slug: string) {
    if (!confirm('Delete this event? All its images will be removed.')) return;
    try {
      const res = await fetch(apiUrl(`/api/events/${slug}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to delete');
        return;
      }
      setSuccess('Event deleted.');
      if (editingEventSlug === slug) {
        setEditingEventSlug(null);
        setEventTitle('');
        setEventDescription('');
      }
      refetchLists();
    } catch {
      setError('Could not connect to server');
    }
  }

  async function deletePodcast(id: number) {
    if (!confirm('Delete this podcast episode?')) return;
    try {
      const res = await fetch(apiUrl(`/api/podcast/${id}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to delete');
        return;
      }
      setSuccess('Episode deleted.');
      if (editingPodcastId === id) {
        setEditingPodcastId(null);
        setPodcastType(null);
        setPodcastTitle('');
        setPodcastDescription('');
        setPodcastDuration('');
        setPodcastGuests('');
        setPodcastAudioUrl('');
        setPodcastVideoUrl('');
      }
      refetchLists();
    } catch {
      setError('Could not connect to server');
    }
  }

  async function deleteWatch(id: number) {
    if (!confirm('Delete this video?')) return;
    try {
      const res = await fetch(apiUrl(`/api/watch/${id}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to delete');
        return;
      }
      setSuccess('Video deleted.');
      if (editingWatchId === id) {
        setEditingWatchId(null);
        setWatchTitle('');
        setWatchVideoId('');
        setWatchDuration('Video');
      }
      refetchLists();
    } catch {
      setError('Could not connect to server');
    }
  }

  async function startEditArticle(id: number) {
    try {
      const res = await fetch(apiUrl(`/api/articles/${id}`));
      const data = await res.json();
      if (!res.ok) return;
      setTitle(data.title || '');
      setContent(data.content || '');
      setCategory(data.category || 'Features');
      setAuthor(data.author || '');
      setEditingArticleId(id);
    } catch {
      setError('Could not load article');
    }
  }

  function startEditGallery(id: number) {
    const item = galleryList.find((g) => g.id === id);
    if (item) {
      setGalleryCaption(item.caption || '');
      setGalleryImages([]);
      setEditingGalleryId(id);
    }
  }

  async function startEditEvent(slug: string) {
    try {
      const res = await fetch(apiUrl(`/api/events/${slug}`));
      const data = await res.json();
      if (!res.ok) return;
      setEventTitle(data.title || '');
      setEventDescription(data.description || '');
      setEventImages([]);
      setEditingEventSlug(slug);
    } catch {
      setError('Could not load event');
    }
  }

  async function startEditPodcast(id: number) {
    try {
      const res = await fetch(apiUrl(`/api/podcast/${id}`));
      const data = await res.json();
      if (!res.ok) return;
      setPodcastTitle(data.title || '');
      setPodcastDescription(data.description || '');
      setPodcastDuration(data.duration_label || '');
      setPodcastGuests(data.guests || '');
      setPodcastAudioUrl(data.audio_url || '');
      setPodcastVideoUrl(data.video_url || '');
      setPodcastType(data.audio_url ? 'audio' : 'video');
      setEditingPodcastId(id);
    } catch {
      setError('Could not load episode');
    }
  }

  async function startEditWatch(id: number) {
    try {
      const res = await fetch(apiUrl(`/api/watch/${id}`));
      const data = await res.json();
      if (!res.ok) return;
      setWatchTitle(data.title || '');
      setWatchVideoId(data.videoId || data.video_id || '');
      setWatchDuration(data.duration || 'Video');
      setEditingWatchId(id);
    } catch {
      setError('Could not load video');
    }
  }

  async function handleGallerySubmit(e: FormEvent) {
    e.preventDefault();
    clearMessages();
    if (editingGalleryId) {
      setLoading(true);
      try {
        const form = new FormData();
        form.append('caption', galleryCaption.trim());
        if (galleryImages.length) form.append('image', galleryImages[0]);
        const res = await fetch(apiUrl(`/api/gallery/${editingGalleryId}`), {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to update');
          return;
        }
        setSuccess('Gallery image updated.');
        setGalleryCaption('');
        setGalleryImages([]);
        setEditingGalleryId(null);
        if (galleryInputRef.current) galleryInputRef.current.value = '';
        refetchLists();
      } catch {
        setError('Could not connect to server');
      } finally {
        setLoading(false);
      }
      return;
    }
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
      refetchLists();
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
      refetchLists();
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  }

  async function handleEventEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editingEventSlug) return;
    clearMessages();
    if (!eventTitle.trim()) {
      setError('Event title is required');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('title', eventTitle.trim());
      form.append('description', eventDescription.trim());
      if (eventImages.length) eventImages.forEach((f) => form.append('images', f));
      const res = await fetch(apiUrl(`/api/events/${editingEventSlug}`), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update event');
        return;
      }
      setSuccess('Event updated.');
      setEventTitle('');
      setEventDescription('');
      setEventImages([]);
      setEditingEventSlug(null);
      if (eventImagesRef.current) eventImagesRef.current.value = '';
      refetchLists();
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
    if (!editingPodcastId && podcastType === 'audio' && !podcastAudioUrl.trim()) {
      setError('Audio URL is required');
      return;
    }
    if (!editingPodcastId && podcastType === 'video' && !podcastVideoUrl.trim()) {
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
      const url = editingPodcastId ? apiUrl(`/api/podcast/${editingPodcastId}`) : apiUrl('/api/podcast');
      const res = await fetch(url, {
        method: editingPodcastId ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add episode');
        return;
      }
      setSuccess(editingPodcastId ? 'Podcast episode updated.' : 'Podcast episode added.');
      setEditingPodcastId(null);
      setPodcastType(null);
      setPodcastTitle('');
      setPodcastDescription('');
      setPodcastDuration('');
      setPodcastGuests('');
      setPodcastAudioUrl('');
      setPodcastVideoUrl('');
      refetchLists();
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  }

  async function handleWatchSubmit(e: FormEvent) {
    e.preventDefault();
    clearMessages();
    if (editingWatchId) {
      setLoading(true);
      try {
        const form = new FormData();
        form.append('title', watchTitle.trim());
        form.append('duration_label', watchDuration.trim());
        form.append('video_id', watchVideoId.trim());
        const res = await fetch(apiUrl(`/api/watch/${editingWatchId}`), {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to update video');
          return;
        }
        setSuccess('Video updated.');
        setWatchTitle('');
        setWatchVideoId('');
        setWatchDuration('Video');
        setEditingWatchId(null);
        refetchLists();
      } catch {
        setError('Could not connect to server');
      } finally {
        setLoading(false);
      }
      return;
    }
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
      refetchLists();
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

  return (
    <div className="min-h-screen bg-forest px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm shrink-0">
            <ArrowLeft className="w-4 h-4" />
            Back to site
          </Link>
          {/* Desktop: all nav items in a row */}
          <div className="hidden md:flex items-center gap-3 flex-wrap">
            <Link to="/admin/work-with-us-submissions" className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm">
              View Work with us submissions
            </Link>
            <Link to="/admin/newsletter-signups" className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm">
              View newsletter signups
            </Link>
            <button type="button" onClick={() => { setAddAdminModalOpen(true); setAddAdminError(''); setAddAdminSuccess(''); }} className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm">
              <UserPlus className="w-4 h-4" />
              Add new admin
            </button>
            <button type="button" onClick={logout} className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm">
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
          {/* Mobile: hamburger toggle */}
          <button
            type="button"
            onClick={() => setAdminMenuOpen((o) => !o)}
            className="md:hidden p-2 text-offwhite/70 hover:text-lime transition-colors"
            aria-expanded={adminMenuOpen}
            aria-label={adminMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {adminMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {/* Mobile: dropdown menu */}
        {adminMenuOpen && (
          <div className="md:hidden mb-6 py-4 px-4 border border-offwhite/20 bg-offwhite/5 rounded">
            <nav className="flex flex-col gap-3">
              <Link to="/admin/work-with-us-submissions" className="inline-flex items-center gap-2 text-offwhite hover:text-lime transition-colors text-sm py-2" onClick={() => setAdminMenuOpen(false)}>
                View Work with us submissions
              </Link>
              <Link to="/admin/newsletter-signups" className="inline-flex items-center gap-2 text-offwhite hover:text-lime transition-colors text-sm py-2" onClick={() => setAdminMenuOpen(false)}>
                View newsletter signups
              </Link>
              <button type="button" onClick={() => { setAddAdminModalOpen(true); setAddAdminError(''); setAddAdminSuccess(''); setAdminMenuOpen(false); }} className="inline-flex items-center gap-2 text-offwhite hover:text-lime transition-colors text-sm py-2 text-left">
                <UserPlus className="w-4 h-4" />
                Add new admin
              </button>
              <button type="button" onClick={() => { setAdminMenuOpen(false); logout(); }} className="inline-flex items-center gap-2 text-offwhite hover:text-lime transition-colors text-sm py-2 text-left">
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </nav>
          </div>
        )}

        <h1 className="text-offwhite font-editorial font-bold text-2xl mb-2">Admin</h1>
        <p className="text-offwhite/60 text-sm mb-6">Upload articles, gallery photos, events, and podcast episodes.</p>

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
          <>
            {articlesList.length > 0 && (
              <div className="mb-8">
                <h3 className="text-offwhite font-semibold mb-3">Existing articles</h3>
                <ul className="space-y-2">
                  {articlesList.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-4 py-2 border-b border-offwhite/10">
                      <span className="text-offwhite truncate">{a.title}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => startEditArticle(a.id)} className="p-1.5 text-offwhite/70 hover:text-lime transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => deleteArticle(a.id)} className="p-1.5 text-offwhite/70 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <form onSubmit={handleArticleSubmit} className="space-y-6">
              {editingArticleId && (
                <p className="text-lime text-sm">Editing article. <button type="button" onClick={() => { setEditingArticleId(null); setTitle(''); setContent(''); setImage(null); }} className="underline">Cancel</button></p>
              )}
            <label className="block">
              <span className={labelClass}>Title *</span>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Article title" required />
            </label>
            <label className="block">
              <span className={labelClass}>{editingArticleId ? 'Image (optional, leave empty to keep current)' : 'Image *'}</span>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className={`${inputClass} file:mr-4 file:py-2 file:px-4 file:bg-lime file:text-forest file:border-0`}
                required={!editingArticleId}
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
              {loading ? (editingArticleId ? 'Updating...' : 'Publishing...') : (editingArticleId ? 'Update Article' : 'Publish Article')}
            </button>
          </form>
          </>
        )}

        {activeTab === 'gallery' && (
          <>
            {galleryList.length > 0 && (
              <div className="mb-8">
                <h3 className="text-offwhite font-semibold mb-3">Existing gallery images</h3>
                <ul className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {galleryList.map((g) => (
                    <li key={g.id} className="relative group">
                      <img src={g.src} alt="" className="w-full aspect-square object-cover border border-offwhite/20" />
                      <p className="text-offwhite/60 text-xs mt-1 truncate">{g.caption || '—'}</p>
                      <div className="flex gap-1 mt-1">
                        <button type="button" onClick={() => startEditGallery(g.id)} className="p-1.5 text-offwhite/70 hover:text-lime transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => deleteGallery(g.id)} className="p-1.5 text-offwhite/70 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <form onSubmit={handleGallerySubmit} className="space-y-6">
              {editingGalleryId && (
                <p className="text-lime text-sm">Editing one image. <button type="button" onClick={() => { setEditingGalleryId(null); setGalleryCaption(''); setGalleryImages([]); }} className="underline">Cancel</button></p>
              )}
            <label className="block">
              <span className={labelClass}>{editingGalleryId ? 'New image (optional)' : 'Photos * (select one or multiple)'}</span>
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
            <button type="submit" disabled={loading || (!editingGalleryId && !galleryImages.length)} className="btn-premium py-4 px-8 disabled:opacity-50">
              {loading ? (galleryUploadProgress ? `Uploading ${galleryUploadProgress.uploaded}/${galleryUploadProgress.total}...` : (editingGalleryId ? 'Updating...' : 'Uploading...')) : editingGalleryId ? 'Update image' : galleryImages.length > 1 ? `Add ${galleryImages.length} to Gallery` : 'Add to Gallery'}
            </button>
          </form>
          </>
        )}

        {activeTab === 'events' && (
          <>
            {eventsList.length > 0 && (
              <div className="mb-8">
                <h3 className="text-offwhite font-semibold mb-3">Existing events</h3>
                <ul className="space-y-2">
                  {eventsList.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-4 py-2 border-b border-offwhite/10">
                      <span className="text-offwhite truncate">{e.title}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => startEditEvent(e.id)} className="p-1.5 text-offwhite/70 hover:text-lime transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => deleteEvent(e.id)} className="p-1.5 text-offwhite/70 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <form onSubmit={editingEventSlug ? handleEventEditSubmit : handleEventSubmit} className="space-y-6">
              {editingEventSlug && (
                <p className="text-lime text-sm">Editing event. <button type="button" onClick={() => { setEditingEventSlug(null); setEventTitle(''); setEventDescription(''); setEventImages([]); }} className="underline">Cancel</button></p>
              )}
            <label className="block">
              <span className={labelClass}>Event title *</span>
              <input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className={inputClass} placeholder="e.g. Ronald McDonald House Charities" required />
            </label>
            <label className="block">
              <span className={labelClass}>Description (optional)</span>
              <textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} rows={3} className={inputClass} placeholder="Short description" />
            </label>
            <label className="block">
              <span className={labelClass}>{editingEventSlug ? 'Add more images (optional)' : 'Images * (one or more)'}</span>
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
            <button type="submit" disabled={loading || !eventTitle.trim()} className="btn-premium py-4 px-8 disabled:opacity-50">
              {loading ? (editingEventSlug ? 'Updating...' : 'Creating...') : editingEventSlug ? 'Update Event' : 'Add Event'}
            </button>
          </form>
          </>
        )}

        {activeTab === 'podcast' && (
          <div className="space-y-6">
            {podcastList.length > 0 && (
              <div className="mb-6">
                <h3 className="text-offwhite font-semibold mb-3">Existing episodes</h3>
                <ul className="space-y-2">
                  {podcastList.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-4 py-2 border-b border-offwhite/10">
                      <span className="text-offwhite truncate">{p.title}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => startEditPodcast(p.id)} className="p-1.5 text-offwhite/70 hover:text-lime transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => deletePodcast(p.id)} className="p-1.5 text-offwhite/70 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {podcastType == null && !editingPodcastId ? (
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
                {(podcastType != null || editingPodcastId) && (
                  <p className="text-offwhite/70 text-sm">
                    {editingPodcastId ? (
                      <>Editing episode. <button type="button" onClick={() => { setEditingPodcastId(null); setPodcastType(null); setPodcastTitle(''); setPodcastDescription(''); setPodcastDuration(''); setPodcastGuests(''); setPodcastAudioUrl(''); setPodcastVideoUrl(''); }} className="text-lime underline">Cancel</button></>
                    ) : (
                      <button type="button" onClick={() => setPodcastType(null)} className="text-lime hover:underline">← Change to {podcastType === 'audio' ? 'video' : 'audio'} podcast</button>
                    )}
                  </p>
                )}
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
                  {loading ? (editingPodcastId ? 'Updating...' : 'Adding...') : (editingPodcastId ? 'Update Episode' : 'Add Podcast Episode')}
                </button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'watch' && (
          <>
            {watchList.length > 0 && (
              <div className="mb-8">
                <h3 className="text-offwhite font-semibold mb-3">Existing videos</h3>
                <ul className="space-y-2">
                  {watchList.map((w) => (
                    <li key={w.id} className="flex items-center justify-between gap-4 py-2 border-b border-offwhite/10">
                      <span className="text-offwhite truncate">{w.title}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => startEditWatch(w.id)} className="p-1.5 text-offwhite/70 hover:text-lime transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => deleteWatch(w.id)} className="p-1.5 text-offwhite/70 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <form onSubmit={handleWatchSubmit} className="space-y-6">
              {editingWatchId && (
                <p className="text-lime text-sm">Editing video. <button type="button" onClick={() => { setEditingWatchId(null); setWatchTitle(''); setWatchVideoId(''); setWatchDuration('Video'); }} className="underline">Cancel</button></p>
              )}
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
              {loading ? (editingWatchId ? 'Updating...' : 'Adding...') : (editingWatchId ? 'Update Video' : 'Add Video')}
            </button>
          </form>
          </>
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
