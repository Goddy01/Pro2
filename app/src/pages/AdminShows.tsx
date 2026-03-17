import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiUrl, authenticatedFetch } from '../lib/api';
import '../App.css';

type PlatformLinks = {
  youtube?: string;
  spotify?: string;
  apple?: string;
  website?: string;
};

type Show = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  hero_image_url: string | null;
  platform_links: PlatformLinks | null;
  sort_order: number;
  created_at: string;
};

const inputClass =
  'w-full px-4 py-3 bg-offwhite/5 border border-offwhite/20 text-offwhite placeholder:text-offwhite/40 focus:outline-none focus:border-lime';
const labelClass = 'text-offwhite text-sm font-medium mb-2 block';

function slugify(name: string) {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

export default function AdminShows() {
  const { token, isAuthenticated } = useAuth();
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const [youtube, setYoutube] = useState('');
  const [spotify, setSpotify] = useState('');
  const [apple, setApple] = useState('');
  const [website, setWebsite] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    authenticatedFetch(apiUrl('/api/shows/admin'), {}, token)
      .then(async (res) => {
        const data = await res.json().catch(() => ([]));
        if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to load shows');
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setShows(Array.isArray(data) ? (data as Show[]) : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Could not connect to server');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!isAuthenticated) return <Navigate to="/superuser" replace />;

  function resetForm() {
    setEditingId(null);
    setName('');
    setDescription('');
    setSortOrder('0');
    setHeroFile(null);
    if (heroInputRef.current) heroInputRef.current.value = '';
    setYoutube('');
    setSpotify('');
    setApple('');
    setWebsite('');
  }

  function startEdit(s: Show) {
    setError('');
    setSuccess('');
    setEditingId(s.id);
    setName(s.name || '');
    setDescription(s.description || '');
    setSortOrder(String(s.sort_order ?? 0));
    setHeroFile(null);
    if (heroInputRef.current) heroInputRef.current.value = '';
    setYoutube(s.platform_links?.youtube || '');
    setSpotify(s.platform_links?.spotify || '');
    setApple(s.platform_links?.apple || '');
    setWebsite(s.platform_links?.website || '');
  }

  async function handleDelete(id: number) {
    if (!token) return;
    if (!window.confirm('Delete this show? This cannot be undone.')) return;
    setError('');
    setSuccess('');
    try {
      const res = await authenticatedFetch(apiUrl(`/api/shows/admin/${id}`), { method: 'DELETE' }, token);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || 'Failed to delete show');
        return;
      }
      setShows((prev) => prev.filter((s) => s.id !== id));
      if (editingId === id) resetForm();
      setSuccess('Show deleted.');
    } catch {
      setError('Could not connect to server');
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError('');
    setSuccess('');
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Name is required');
      return;
    }

    const links: PlatformLinks = {};
    if (youtube.trim()) links.youtube = youtube.trim();
    if (spotify.trim()) links.spotify = spotify.trim();
    if (apple.trim()) links.apple = apple.trim();
    if (website.trim()) links.website = website.trim();

    const form = new FormData();
    form.append('name', cleanName);
    form.append('description', description.trim());
    form.append('sort_order', String(parseInt(sortOrder || '0', 10) || 0));
    form.append('platform_links', JSON.stringify(links));
    if (heroFile) form.append('hero_image', heroFile);

    setSaving(true);
    try {
      const url = editingId ? apiUrl(`/api/shows/admin/${editingId}`) : apiUrl('/api/shows/admin');
      const res = await authenticatedFetch(
        url,
        {
          method: editingId ? 'PUT' : 'POST',
          body: form,
        },
        token
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || 'Failed to save show');
        return;
      }
      const saved = data as Show;
      setShows((prev) => {
        const next = prev.filter((s) => s.id !== saved.id);
        next.push(saved);
        next.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.name || '').localeCompare(b.name || ''));
        return next;
      });
      setSuccess(editingId ? 'Show updated.' : 'Show added.');
      resetForm();
    } catch {
      setError('Could not connect to server');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-forest px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
        </div>

        <h1 className="text-offwhite font-editorial font-bold text-2xl mb-2">Shows</h1>
        <p className="text-offwhite/60 text-sm mb-6">
          Create and manage show pages. These power <span className="text-offwhite/80">/shows</span> and show detail pages.
        </p>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        {success && <p className="text-lime text-sm mb-4">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-5 p-6 bg-offwhite/5 border border-offwhite/10">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-offwhite font-semibold">
              {editingId ? 'Edit show' : 'Add show'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-offwhite/70 hover:text-offwhite underline text-sm"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="block">
              <span className={labelClass}>Name *</span>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  const v = e.target.value;
                  setName(v);
                }}
                className={inputClass}
                placeholder="e.g. Sideline Sports"
                required
              />
            </label>
            <div className="block">
              <span className={labelClass}>Public URL</span>
              <div className={`${inputClass} flex items-center`}>
                <span className="text-offwhite/70">/shows/{slugify(name) || '...'}</span>
              </div>
              <p className="text-offwhite/40 text-xs mt-1">Generated automatically from the show name.</p>
            </div>
          </div>

          <label className="block">
            <span className={labelClass}>Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={inputClass}
              placeholder="Short overview of the show..."
              maxLength={8000}
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="block">
              <span className={labelClass}>Hero image</span>
              <input
                ref={heroInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setHeroFile(e.target.files?.[0] || null)}
                className={`${inputClass} file:mr-4 file:py-2 file:px-4 file:bg-lime file:text-forest file:border-0`}
              />
              <p className="text-offwhite/40 text-xs mt-1">
                Uploads use Cloudinary (if configured). Otherwise, leave empty and use platform links.
              </p>
            </label>
            <label className="block">
              <span className={labelClass}>Sort order</span>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className={inputClass}
                min={0}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="block">
              <span className={labelClass}>YouTube</span>
              <input
                type="url"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                className={inputClass}
                placeholder="https://youtube.com/..."
              />
            </label>
            <label className="block">
              <span className={labelClass}>Spotify</span>
              <input
                type="url"
                value={spotify}
                onChange={(e) => setSpotify(e.target.value)}
                className={inputClass}
                placeholder="https://open.spotify.com/show/..."
              />
            </label>
            <label className="block">
              <span className={labelClass}>Apple Podcasts</span>
              <input
                type="url"
                value={apple}
                onChange={(e) => setApple(e.target.value)}
                className={inputClass}
                placeholder="https://podcasts.apple.com/..."
              />
            </label>
            <label className="block">
              <span className={labelClass}>Website</span>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className={inputClass}
                placeholder="https://..."
              />
            </label>
          </div>

          <button type="submit" disabled={saving} className="btn-premium py-4 px-8 disabled:opacity-50">
            {saving ? 'Saving…' : editingId ? 'Update show' : 'Add show'}
          </button>
        </form>

        <div className="mt-10">
          <h2 className="text-offwhite font-semibold mb-4">Existing shows</h2>
          {loading ? (
            <p className="text-offwhite/60">Loading…</p>
          ) : shows.length === 0 ? (
            <p className="text-offwhite/60">No shows yet.</p>
          ) : (
            <ul className="space-y-2">
              {shows.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-4 py-3 border-b border-offwhite/10">
                  <div className="min-w-0">
                    <p className="text-offwhite font-medium truncate">{s.name}</p>
                    <p className="text-offwhite/50 text-xs truncate">/shows/{s.slug}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className="p-2 text-offwhite/70 hover:text-lime transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
                      className="p-2 text-offwhite/70 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

