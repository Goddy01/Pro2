import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../lib/api';
import { ArrowLeft, LogOut, FileText, Image, Calendar, Headphones, Video, UserPlus, Users, Menu, X, ChevronDown } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import '../App.css';

const TABS = [
  { id: 'articles', label: 'Articles', icon: FileText },
  { id: 'gallery', label: 'Gallery', icon: Image },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'podcast', label: 'Show', icon: Headphones },
  { id: 'watch', label: 'Watch', icon: Video },
  { id: 'team', label: 'Team', icon: Users },
] as const;

type TabId = (typeof TABS)[number]['id'];

const inputClass =
  'w-full px-4 py-3 bg-offwhite/5 border border-offwhite/20 text-offwhite placeholder:text-offwhite/40 focus:outline-none focus:border-lime';
const labelClass = 'text-offwhite text-sm font-medium mb-2 block';

type LocationState = {
  openTab?: TabId;
  editId?: number;
  editSlug?: string;
  editCategoryId?: number;
  editGalleryId?: number;
} | null;

export default function AdminDashboard() {
  const { token, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>('articles');

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }
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
  const [galleryCategoryId, setGalleryCategoryId] = useState<string>('');
  const [galleryCategoriesList, setGalleryCategoriesList] = useState<{ id: number; name: string; slug: string; coverImageUrl: string | null }[]>([]);
  const [galleryCategoryName, setGalleryCategoryName] = useState('');
  const [galleryCategoryCover, setGalleryCategoryCover] = useState<File | null>(null);
  const [editingGalleryCategoryId, setEditingGalleryCategoryId] = useState<number | null>(null);
  const galleryCategoryCoverInputRef = useRef<HTMLInputElement>(null);

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
  const [podcastShowName, setPodcastShowName] = useState('');

  const [watchTitle, setWatchTitle] = useState('');
  const [watchVideoId, setWatchVideoId] = useState('');
  const [watchDuration, setWatchDuration] = useState('Video');
  const [watchShowName, setWatchShowName] = useState('');

  const [teamName, setTeamName] = useState('');
  const [teamRole, setTeamRole] = useState('');
  const [teamBio, setTeamBio] = useState('');
  const [teamImage, setTeamImage] = useState<File | null>(null);
  const [teamSocialX, setTeamSocialX] = useState('');
  const [teamSocialYoutube, setTeamSocialYoutube] = useState('');
  const [teamSocialTiktok, setTeamSocialTiktok] = useState('');
  const [teamSocialInstagram, setTeamSocialInstagram] = useState('');
  const teamImageInputRef = useRef<HTMLInputElement>(null);
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);

  const [addAdminModalOpen, setAddAdminModalOpen] = useState(false);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [addAdminError, setAddAdminError] = useState('');
  const [addAdminSuccess, setAddAdminSuccess] = useState('');
  const [addAdminLoading, setAddAdminLoading] = useState(false);

  const [galleryList, setGalleryList] = useState<{ id: number; src: string; caption: string | null; category_id: number | null }[]>([]);
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
  const [editingGalleryId, setEditingGalleryId] = useState<number | null>(null);
  const [editingEventSlug, setEditingEventSlug] = useState<string | null>(null);
  const [editingPodcastId, setEditingPodcastId] = useState<number | null>(null);
  const [editingWatchId, setEditingWatchId] = useState<number | null>(null);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [galleryCategoryDropdownOpen, setGalleryCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const galleryCategoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) setCategoryDropdownOpen(false);
      if (galleryCategoryDropdownRef.current && !galleryCategoryDropdownRef.current.contains(e.target as Node)) setGalleryCategoryDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ARTICLE_CATEGORIES = [
    { value: 'Features', label: 'Features' },
    { value: 'Analysis', label: 'Analysis' },
    { value: 'Events', label: 'Events' },
    { value: 'Podcast', label: 'Show' },
    { value: 'Video', label: 'Video' },
  ] as const;

  if (!isAuthenticated) return <Navigate to="/superuser" replace />;

  function refetchLists() {
    if (!token) return;
    Promise.all([
      fetch(apiUrl('/api/gallery')).then((r) => r.json()).then((d) => (Array.isArray(d) ? setGalleryList(d.map((g: { id: number; src: string; caption?: string; category_id?: number | null }) => ({ id: g.id, src: g.src, caption: g.caption ?? null, category_id: g.category_id ?? null }))) : null)),
      fetch(apiUrl('/api/gallery/categories')).then((r) => r.json()).then((d) => (Array.isArray(d) ? setGalleryCategoriesList(d.map((c: { id: number; name: string; slug: string; coverImageUrl?: string | null }) => ({ id: c.id, name: c.name, slug: c.slug, coverImageUrl: c.coverImageUrl ?? null }))) : null)),
    ]);
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
      setGalleryCategoryId(item.category_id != null ? String(item.category_id) : '');
      setGalleryImages([]);
      setEditingGalleryId(id);
    }
  }

  async function startEditGalleryCategory(id: number) {
    try {
      const res = await fetch(apiUrl(`/api/gallery/categories/${id}`));
      const data = await res.json();
      if (!res.ok) return;
      setGalleryCategoryName(data.name || '');
      setGalleryCategoryCover(null);
      if (galleryCategoryCoverInputRef.current) galleryCategoryCoverInputRef.current.value = '';
      setEditingGalleryCategoryId(id);
    } catch {
      setError('Could not load category');
    }
  }

  async function handleGalleryCategorySubmit(e: FormEvent) {
    e.preventDefault();
    clearMessages();
    if (!galleryCategoryName.trim()) {
      setError('Category name is required');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('name', galleryCategoryName.trim());
      if (galleryCategoryCover) form.append('cover', galleryCategoryCover);
      const url = editingGalleryCategoryId ? apiUrl(`/api/gallery/categories/${editingGalleryCategoryId}`) : apiUrl('/api/gallery/categories');
      const res = await fetch(url, {
        method: editingGalleryCategoryId ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save category');
        return;
      }
      setSuccess(editingGalleryCategoryId ? 'Category updated.' : 'Category added.');
      setEditingGalleryCategoryId(null);
      setGalleryCategoryName('');
      setGalleryCategoryCover(null);
      if (galleryCategoryCoverInputRef.current) galleryCategoryCoverInputRef.current.value = '';
      refetchLists();
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
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
      setPodcastShowName(data.show_name || '');
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
      setWatchShowName(data.show_name || '');
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
        if (galleryCategoryId) form.append('category_id', galleryCategoryId);
        if (galleryImages.length) form.append('image', galleryImages[0]);
        const res = await fetch(apiUrl(`/api/gallery/${editingGalleryId}`), {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof (data as { error?: string }).error === 'string' ? (data as { error: string }).error : 'Failed to update');
          return;
        }
        setSuccess('Gallery image updated.');
        setGalleryCaption('');
        setGalleryCategoryId('');
        setGalleryImages([]);
        setEditingGalleryId(null);
        if (galleryInputRef.current) galleryInputRef.current.value = '';
        refetchLists();
      } catch {
        setError('Could not reach the server. Check that the backend is running and your connection.');
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
    const UPLOAD_TIMEOUT_MS = 90_000;
    const DELAY_BETWEEN_UPLOADS_MS = 300;
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    try {
      for (let i = 0; i < galleryImages.length; i++) {
        if (i > 0) await delay(DELAY_BETWEEN_UPLOADS_MS);
        const file = galleryImages[i];
        const form = new FormData();
        form.append('image', file);
        if (galleryCaption.trim()) form.append('caption', galleryCaption.trim());
        if (galleryCategoryId) form.append('category_id', galleryCategoryId);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
        const res = await fetch(apiUrl('/api/gallery'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setGalleryUploadProgress(null);
          const msg = typeof data?.error === 'string' ? data.error : `Upload failed (${uploaded} of ${total} uploaded).`;
          setError(uploaded > 0 ? `${msg} ${uploaded} image(s) were saved.` : msg);
          return;
        }
        uploaded += 1;
        setGalleryUploadProgress({ uploaded, total });
      }
      setGalleryUploadProgress(null);
      setSuccess(total === 1 ? 'Image added to gallery.' : `${total} images added to gallery.`);
      setGalleryCaption('');
      setGalleryCategoryId('');
      setGalleryImages([]);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      refetchLists();
    } catch (err) {
      setGalleryUploadProgress(null);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      const partial = uploaded > 0 ? ` ${uploaded} of ${total} image(s) were saved.` : '';
      setError(
        isAbort
          ? `Upload timed out.${partial} Try fewer images or smaller file sizes.`
          : `Could not reach the server.${partial} Check that the backend is running and your connection.`
      );
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
      setError('Choose audio or video show first');
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
      if (podcastShowName.trim()) form.append('show_name', podcastShowName.trim());
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
      setSuccess(editingPodcastId ? 'Show episode updated.' : 'Show episode added.');
      setEditingPodcastId(null);
      setPodcastType(null);
      setPodcastTitle('');
      setPodcastDescription('');
      setPodcastDuration('');
      setPodcastGuests('');
      setPodcastAudioUrl('');
      setPodcastVideoUrl('');
      setPodcastShowName('');
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
        if (watchShowName.trim()) form.append('show_name', watchShowName.trim());
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
      if (watchShowName.trim()) form.append('show_name', watchShowName.trim());
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
      setWatchShowName('');
      refetchLists();
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  }

  async function startEditTeam(id: number) {
    try {
      const res = await fetch(apiUrl(`/api/team/${id}`));
      const data = await res.json();
      if (!res.ok) return;
      setTeamName(data.name || '');
      setTeamRole(data.role || '');
      setTeamBio(data.bio || '');
      setTeamSocialX(data.social_x || '');
      setTeamSocialYoutube(data.social_youtube || '');
      setTeamSocialTiktok(data.social_tiktok || '');
      setTeamSocialInstagram(data.social_instagram || '');
      setTeamImage(null);
      if (teamImageInputRef.current) teamImageInputRef.current.value = '';
      setEditingTeamId(id);
    } catch {
      setError('Could not load team member');
    }
  }

  async function handleTeamSubmit(e: FormEvent) {
    e.preventDefault();
    clearMessages();
    if (!teamName.trim()) {
      setError('Name is required');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('name', teamName.trim());
      form.append('role', teamRole.trim());
      form.append('bio', teamBio.trim());
      if (teamImage) form.append('image', teamImage);
      form.append('social_x', teamSocialX.trim());
      form.append('social_youtube', teamSocialYoutube.trim());
      form.append('social_tiktok', teamSocialTiktok.trim());
      form.append('social_instagram', teamSocialInstagram.trim());
      const url = editingTeamId ? apiUrl(`/api/team/${editingTeamId}`) : apiUrl('/api/team');
      const res = await fetch(url, {
        method: editingTeamId ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || (editingTeamId ? 'Failed to update team member' : 'Failed to add team member'));
        return;
      }
      setSuccess(editingTeamId ? 'Team member updated.' : 'Team member added.');
      setEditingTeamId(null);
      setTeamName('');
      setTeamRole('');
      setTeamBio('');
      setTeamImage(null);
      if (teamImageInputRef.current) teamImageInputRef.current.value = '';
      setTeamSocialX('');
      setTeamSocialYoutube('');
      setTeamSocialTiktok('');
      setTeamSocialInstagram('');
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

  // When navigating from a list page with state (openTab + edit id), open the right tab and start editing.
  useEffect(() => {
    const state = location.state as LocationState;
    if (!state?.openTab) return;
    setActiveTab(state.openTab);
    if (state.editId != null) {
      if (state.openTab === 'articles') startEditArticle(state.editId);
      else if (state.openTab === 'podcast') startEditPodcast(state.editId);
      else if (state.openTab === 'watch') startEditWatch(state.editId);
      else if (state.openTab === 'team') startEditTeam(state.editId);
    }
    if (state.editSlug != null && state.openTab === 'events') startEditEvent(state.editSlug);
    if (state.editCategoryId != null && state.openTab === 'gallery') startEditGalleryCategory(state.editCategoryId);
    if (state.editGalleryId != null && state.openTab === 'gallery') startEditGallery(state.editGalleryId);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state]);

  return (
    <div className="min-h-screen bg-forest px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm shrink-0 w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to site
          </Link>
          {/* Desktop: single-line nav bar */}
          <nav className="hidden md:flex items-center flex-nowrap gap-1 p-1 rounded-md border border-offwhite/20 bg-offwhite/5">
            <Link to="/admin/work-with-us-submissions" className="inline-flex items-center gap-1.5 px-3 py-2 text-offwhite/80 hover:text-lime hover:bg-offwhite/10 rounded transition-colors text-sm whitespace-nowrap" title="View Work with us submissions">
              Work with us
            </Link>
            <Link to="/admin/newsletter-signups" className="inline-flex items-center gap-1.5 px-3 py-2 text-offwhite/80 hover:text-lime hover:bg-offwhite/10 rounded transition-colors text-sm whitespace-nowrap" title="View newsletter signups">
              Newsletter
            </Link>
            <Link to="/admin/sponsorship-inquiries" className="inline-flex items-center gap-1.5 px-3 py-2 text-offwhite/80 hover:text-lime hover:bg-offwhite/10 rounded transition-colors text-sm whitespace-nowrap" title="View sponsorship inquiries">
              Sponsorship
            </Link>
            <Link to="/admin/sponsorship" className="inline-flex items-center gap-1.5 px-3 py-2 text-offwhite/80 hover:text-lime hover:bg-offwhite/10 rounded transition-colors text-sm whitespace-nowrap" title="Manage sponsorship tiers &amp; banner">
              Sponsorship Tiers
            </Link>
            <span className="w-px h-5 bg-offwhite/20 mx-1" aria-hidden />
            <button type="button" onClick={() => { setAddAdminModalOpen(true); setAddAdminError(''); setAddAdminSuccess(''); }} className="inline-flex items-center gap-1.5 px-3 py-2 text-offwhite/80 hover:text-lime hover:bg-offwhite/10 rounded transition-colors text-sm whitespace-nowrap">
              <UserPlus className="w-4 h-4" />
              Add admin
            </button>
            <button type="button" onClick={handleLogout} className="inline-flex items-center gap-1.5 px-3 py-2 text-offwhite/80 hover:text-lime hover:bg-offwhite/10 rounded transition-colors text-sm whitespace-nowrap">
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </nav>
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
              <Link to="/admin/sponsorship-inquiries" className="inline-flex items-center gap-2 text-offwhite hover:text-lime transition-colors text-sm py-2" onClick={() => setAdminMenuOpen(false)}>
                Sponsorship inquiries
              </Link>
              <Link to="/admin/sponsorship" className="inline-flex items-center gap-2 text-offwhite hover:text-lime transition-colors text-sm py-2" onClick={() => setAdminMenuOpen(false)}>
                Sponsorship Tiers
              </Link>
              <button type="button" onClick={() => { setAddAdminModalOpen(true); setAddAdminError(''); setAddAdminSuccess(''); setAdminMenuOpen(false); }} className="inline-flex items-center gap-2 text-offwhite hover:text-lime transition-colors text-sm py-2 text-left">
                <UserPlus className="w-4 h-4" />
                Add new admin
              </button>
              <button type="button" onClick={() => { setAdminMenuOpen(false); handleLogout(); }} className="inline-flex items-center gap-2 text-offwhite hover:text-lime transition-colors text-sm py-2 text-left">
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </nav>
          </div>
        )}

        <h1 className="text-offwhite font-editorial font-bold text-2xl mb-2">Admin</h1>
        <p className="text-offwhite/60 text-sm mb-6">Upload articles, gallery photos, events, and show episodes.</p>

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
            <p className="mb-6">
              <Link to="/admin/articles" className="text-lime hover:underline">View &amp; manage existing articles</Link>
            </p>
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
              <RichTextEditor key={editingArticleId ?? 'new'} value={content} onChange={setContent} placeholder="Article content..." minHeight="32rem" />
            </label>
            <label className="block">
              <span className={labelClass}>Category</span>
              <div ref={categoryDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setCategoryDropdownOpen((o) => !o)}
                  className={`${inputClass} flex items-center justify-between gap-2 text-left cursor-pointer rounded`}
                  aria-haspopup="listbox"
                  aria-expanded={categoryDropdownOpen}
                >
                  <span>{ARTICLE_CATEGORIES.find((c) => c.value === category)?.label ?? category}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 text-offwhite/60 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {categoryDropdownOpen && (
                  <ul
                    className="absolute z-20 left-0 right-0 mt-1 py-1 rounded border border-offwhite/20 bg-forest shadow-xl shadow-black/40 max-h-60 overflow-y-auto"
                    role="listbox"
                  >
                    {ARTICLE_CATEGORIES.map((opt) => (
                      <li
                        key={opt.value}
                        role="option"
                        aria-selected={category === opt.value}
                        onClick={() => {
                          setCategory(opt.value);
                          setCategoryDropdownOpen(false);
                        }}
                        className={`px-4 py-2.5 cursor-pointer transition-colors ${
                          category === opt.value ? 'bg-lime/20 text-lime' : 'text-offwhite hover:bg-offwhite/10'
                        }`}
                      >
                        {opt.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
            <div className="mb-10">
              <p className="text-offwhite/60 text-sm mb-4">
                <Link to="/admin/gallery" className="text-lime hover:underline">View &amp; manage categories and images</Link>
              </p>
              <h3 className="text-offwhite font-semibold mb-3">Gallery categories</h3>
              <p className="text-offwhite/60 text-sm mb-4">Create categories (e.g. NFL, NBA, Super Bowl) with a cover photo. Visitors see these on the gallery page and click in to see photos in that category.</p>
              <form onSubmit={handleGalleryCategorySubmit} className="space-y-4 p-4 border border-offwhite/10 rounded">
                {editingGalleryCategoryId && <p className="text-lime text-sm">Editing category. <button type="button" onClick={() => { setEditingGalleryCategoryId(null); setGalleryCategoryName(''); setGalleryCategoryCover(null); if (galleryCategoryCoverInputRef.current) galleryCategoryCoverInputRef.current.value = ''; }} className="underline">Cancel</button></p>}
                <label className="block">
                  <span className={labelClass}>Category name *</span>
                  <input type="text" value={galleryCategoryName} onChange={(e) => setGalleryCategoryName(e.target.value)} className={inputClass} placeholder="e.g. NFL" required />
                </label>
                <label className="block">
                  <span className={labelClass}>Cover photo (optional)</span>
                  <input ref={galleryCategoryCoverInputRef} type="file" accept="image/*" onChange={(e) => setGalleryCategoryCover(e.target.files?.[0] ?? null)} className={`${inputClass} file:mr-4 file:py-2 file:px-4 file:bg-lime file:text-forest file:border-0`} />
                </label>
                <button type="submit" disabled={loading} className="btn-premium py-3 px-6 disabled:opacity-50">{editingGalleryCategoryId ? 'Update category' : 'Add category'}</button>
              </form>
            </div>

            <form onSubmit={handleGallerySubmit} className="space-y-6">
              {editingGalleryId && (
                <p className="text-lime text-sm">Editing one image. <button type="button" onClick={() => { setEditingGalleryId(null); setGalleryCaption(''); setGalleryCategoryId(''); setGalleryImages([]); }} className="underline">Cancel</button></p>
              )}
            <label className="block">
              <span className={labelClass}>Category (optional – for which album this appears in)</span>
              <div ref={galleryCategoryDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setGalleryCategoryDropdownOpen((o) => !o)}
                  className={`${inputClass} flex items-center justify-between gap-2 text-left cursor-pointer rounded`}
                  aria-haspopup="listbox"
                  aria-expanded={galleryCategoryDropdownOpen}
                >
                  <span>
                    {galleryCategoryId ? (galleryCategoriesList.find((c) => String(c.id) === galleryCategoryId)?.name ?? galleryCategoryId) : '— No category —'}
                  </span>
                  <ChevronDown className={`w-4 h-4 shrink-0 text-offwhite/60 transition-transform ${galleryCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {galleryCategoryDropdownOpen && (
                  <ul
                    className="absolute z-20 left-0 right-0 mt-1 py-1 rounded border border-offwhite/20 bg-forest shadow-xl shadow-black/40 max-h-60 overflow-y-auto"
                    role="listbox"
                  >
                    <li
                      role="option"
                      aria-selected={!galleryCategoryId}
                      onClick={() => {
                        setGalleryCategoryId('');
                        setGalleryCategoryDropdownOpen(false);
                      }}
                      className={`px-4 py-2.5 cursor-pointer transition-colors ${!galleryCategoryId ? 'bg-lime/20 text-lime' : 'text-offwhite hover:bg-offwhite/10'}`}
                    >
                      — No category —
                    </li>
                    {galleryCategoriesList.map((c) => (
                      <li
                        key={c.id}
                        role="option"
                        aria-selected={galleryCategoryId === String(c.id)}
                        onClick={() => {
                          setGalleryCategoryId(String(c.id));
                          setGalleryCategoryDropdownOpen(false);
                        }}
                        className={`px-4 py-2.5 cursor-pointer transition-colors ${
                          galleryCategoryId === String(c.id) ? 'bg-lime/20 text-lime' : 'text-offwhite hover:bg-offwhite/10'
                        }`}
                      >
                        {c.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </label>
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
            <p className="text-offwhite/40 text-xs">Max 25MB per image. If uploads fail, ensure the backend is running and Cloudinary is configured on the server.</p>
            <button type="submit" disabled={loading || (!editingGalleryId && !galleryImages.length)} className="btn-premium py-4 px-8 disabled:opacity-50">
              {loading ? (galleryUploadProgress ? `Uploading ${galleryUploadProgress.uploaded}/${galleryUploadProgress.total}...` : (editingGalleryId ? 'Updating...' : 'Uploading...')) : editingGalleryId ? 'Update image' : galleryImages.length > 1 ? `Add ${galleryImages.length} to Gallery` : 'Add to Gallery'}
            </button>
          </form>
          </>
        )}

        {activeTab === 'events' && (
          <>
            <p className="mb-6">
              <Link to="/admin/events" className="text-lime hover:underline">View &amp; manage existing events</Link>
            </p>
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
            <p className="mb-6">
              <Link to="/admin/show" className="text-lime hover:underline">View &amp; manage existing episodes</Link>
            </p>
            {podcastType == null && !editingPodcastId ? (
              <>
                <p className={labelClass}>What are you uploading?</p>
                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => setPodcastType('audio')}
                    className="px-6 py-4 border-2 border-offwhite/30 text-offwhite hover:border-lime hover:text-lime transition-colors font-medium"
                  >
                    Audio show
                  </button>
                  <button
                    type="button"
                    onClick={() => setPodcastType('video')}
                    className="px-6 py-4 border-2 border-offwhite/30 text-offwhite hover:border-lime hover:text-lime transition-colors font-medium"
                  >
                    Video show
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handlePodcastSubmit} className="space-y-6">
                {(podcastType != null || editingPodcastId) && (
                  <p className="text-offwhite/70 text-sm">
                    {editingPodcastId ? (
                      <>Editing episode. <button type="button" onClick={() => { setEditingPodcastId(null); setPodcastType(null); setPodcastTitle(''); setPodcastDescription(''); setPodcastDuration(''); setPodcastGuests(''); setPodcastAudioUrl(''); setPodcastVideoUrl(''); setPodcastShowName(''); }} className="text-lime underline">Cancel</button></>
                    ) : (
                      <button type="button" onClick={() => setPodcastType(null)} className="text-lime hover:underline">← Change to {podcastType === 'audio' ? 'video' : 'audio'} show</button>
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
                <label className="block">
                  <span className={labelClass}>Show (optional – for multiple shows on the network)</span>
                  <input type="text" value={podcastShowName} onChange={(e) => setPodcastShowName(e.target.value)} className={inputClass} placeholder="e.g. Sideline Sports Weekly" />
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
                  {loading ? (editingPodcastId ? 'Updating...' : 'Adding...') : (editingPodcastId ? 'Update Episode' : 'Add Show Episode')}
                </button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'watch' && (
          <>
            <p className="mb-6">
              <Link to="/admin/watch" className="text-lime hover:underline">View &amp; manage existing videos</Link>
            </p>
            <form onSubmit={handleWatchSubmit} className="space-y-6">
              {editingWatchId && (
                <p className="text-lime text-sm">Editing video. <button type="button" onClick={() => { setEditingWatchId(null); setWatchTitle(''); setWatchVideoId(''); setWatchDuration('Video'); setWatchShowName(''); }} className="underline">Cancel</button></p>
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
            <label className="block">
              <span className={labelClass}>Show (optional – for multiple shows on the network)</span>
              <input type="text" value={watchShowName} onChange={(e) => setWatchShowName(e.target.value)} className={inputClass} placeholder="e.g. Sideline Sports Weekly" />
            </label>
            <button type="submit" disabled={loading} className="btn-premium py-4 px-8 disabled:opacity-50">
              {loading ? (editingWatchId ? 'Updating...' : 'Adding...') : (editingWatchId ? 'Update Video' : 'Add Video')}
            </button>
          </form>
          </>
        )}

        {activeTab === 'team' && (
          <>
            <p className="mb-6">
              <Link to="/admin/team" className="text-lime hover:underline">View &amp; manage existing team members</Link>
            </p>
            <form onSubmit={handleTeamSubmit} className="space-y-6">
              {editingTeamId && (
                <p className="text-lime text-sm">Editing team member. <button type="button" onClick={() => { setEditingTeamId(null); setTeamName(''); setTeamRole(''); setTeamBio(''); setTeamImage(null); if (teamImageInputRef.current) teamImageInputRef.current.value = ''; setTeamSocialX(''); setTeamSocialYoutube(''); setTeamSocialTiktok(''); setTeamSocialInstagram(''); }} className="underline">Cancel</button></p>
              )}
              <label className="block">
                <span className={labelClass}>Name *</span>
                <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} className={inputClass} placeholder="Full name" required />
              </label>
              <label className="block">
                <span className={labelClass}>Role (optional)</span>
                <input type="text" value={teamRole} onChange={(e) => setTeamRole(e.target.value)} className={inputClass} placeholder="e.g. Founder and CEO" />
              </label>
              <label className="block">
                <span className={labelClass}>Bio (optional)</span>
                <textarea value={teamBio} onChange={(e) => setTeamBio(e.target.value)} className={inputClass} rows={4} placeholder="Short bio for the team page" />
              </label>
              <label className="block">
                <span className={labelClass}>Photo (optional)</span>
                <input
                  ref={teamImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setTeamImage(e.target.files?.[0] ?? null)}
                  className="w-full text-offwhite/80 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-lime file:text-forest file:font-medium"
                />
              </label>
              <fieldset className="space-y-3">
                <legend className={labelClass}>Social links (optional – only provided links are shown on the site)</legend>
                <label className="block">
                  <span className="text-offwhite/70 text-xs mb-1 block">X (Twitter)</span>
                  <input type="url" value={teamSocialX} onChange={(e) => setTeamSocialX(e.target.value)} className={inputClass} placeholder="https://x.com/username" />
                </label>
                <label className="block">
                  <span className="text-offwhite/70 text-xs mb-1 block">YouTube</span>
                  <input type="url" value={teamSocialYoutube} onChange={(e) => setTeamSocialYoutube(e.target.value)} className={inputClass} placeholder="https://youtube.com/@channel" />
                </label>
                <label className="block">
                  <span className="text-offwhite/70 text-xs mb-1 block">TikTok</span>
                  <input type="url" value={teamSocialTiktok} onChange={(e) => setTeamSocialTiktok(e.target.value)} className={inputClass} placeholder="https://tiktok.com/@username" />
                </label>
                <label className="block">
                  <span className="text-offwhite/70 text-xs mb-1 block">Instagram</span>
                  <input type="url" value={teamSocialInstagram} onChange={(e) => setTeamSocialInstagram(e.target.value)} className={inputClass} placeholder="https://instagram.com/username" />
                </label>
              </fieldset>
              <button type="submit" disabled={loading} className="btn-premium py-4 px-8 disabled:opacity-50">
                {loading ? (editingTeamId ? 'Updating...' : 'Adding...') : (editingTeamId ? 'Update team member' : 'Add team member')}
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
