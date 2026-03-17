import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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

type Episode = {
  id: number;
  title: string;
  show_name: string | null;
  created_at: string;
};

const inputClass =
  'w-full px-4 py-3 bg-offwhite/5 border border-offwhite/20 text-offwhite placeholder:text-offwhite/40 focus:outline-none focus:border-lime';
const labelClass = 'text-offwhite text-sm font-medium mb-2 block';

function slugPreview(name: string) {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

export default function AdminShowEditor() {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const idParam = params.id;
  const isNew = idParam === 'new' || !idParam;
  const showId = !isNew ? parseInt(idParam as string, 10) : null;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const [youtube, setYoutube] = useState('');
  const [spotify, setSpotify] = useState('');
  const [apple, setApple] = useState('');
  const [website, setWebsite] = useState('');

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [episodesError, setEpisodesError] = useState('');
  const [episodeQuery, setEpisodeQuery] = useState('');
  const [selectedEpisodeIds, setSelectedEpisodeIds] = useState<Set<number>>(new Set());
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!token) return;
    if (isNew) return;
    if (!showId || Number.isNaN(showId)) {
      setError('Invalid show ID');
      return;
    }
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
        const list = Array.isArray(data) ? (data as Show[]) : [];
        const s = list.find((x) => x.id === showId);
        if (!s) {
          setError('Show not found');
          return;
        }
        setName(s.name || '');
        setDescription(s.description || '');
        setSortOrder(String(s.sort_order ?? 0));
        setYoutube(s.platform_links?.youtube || '');
        setSpotify(s.platform_links?.spotify || '');
        setApple(s.platform_links?.apple || '');
        setWebsite(s.platform_links?.website || '');
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
  }, [token, isNew, showId]);

  // Load episodes list (for attaching) when editing an existing show
  useEffect(() => {
    if (!token) return;
    if (isNew) return;
    const showName = name.trim();
    if (!showName) return;

    let cancelled = false;
    setEpisodesLoading(true);
    setEpisodesError('');
    authenticatedFetch(apiUrl('/api/podcast'), {}, token)
      .then(async (res) => {
        const data = await res.json().catch(() => ([]));
        if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to load episodes');
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? (data as Episode[]) : [];
        setEpisodes(list);
        // Preselect episodes currently assigned to this show by show_name
        const assigned = new Set<number>();
        list.forEach((ep) => {
          if ((ep.show_name || '').trim() === showName) assigned.add(ep.id);
        });
        setSelectedEpisodeIds(assigned);
      })
      .catch((err) => {
        if (!cancelled) setEpisodesError(err?.message || 'Could not connect to server');
      })
      .finally(() => {
        if (!cancelled) setEpisodesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, isNew, name]);

  if (!isAuthenticated) return <Navigate to="/superuser" replace />;

  const filteredEpisodes = useMemo(() => {
    const q = episodeQuery.trim().toLowerCase();
    const list = [...episodes];
    list.sort((a, b) => {
      try {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } catch {
        return (b.id ?? 0) - (a.id ?? 0);
      }
    });
    if (!q) return list;
    return list.filter((ep) => (ep.title || '').toLowerCase().includes(q));
  }, [episodes, episodeQuery]);

  const assignedIds = useMemo(() => {
    const showName = name.trim();
    const set = new Set<number>();
    episodes.forEach((ep) => {
      if ((ep.show_name || '').trim() === showName) set.add(ep.id);
    });
    return set;
  }, [episodes, name]);

  async function applyEpisodeAssignments() {
    if (!token) return;
    const showName = name.trim();
    if (!showName) return;

    const toAttach: number[] = [];
    const toDetach: number[] = [];
    selectedEpisodeIds.forEach((id) => {
      if (!assignedIds.has(id)) toAttach.push(id);
    });
    assignedIds.forEach((id) => {
      if (!selectedEpisodeIds.has(id)) toDetach.push(id);
    });

    if (toAttach.length === 0 && toDetach.length === 0) {
      setSuccess('No episode changes to apply.');
      return;
    }

    setAssigning(true);
    setEpisodesError('');
    try {
      if (toAttach.length) {
        const res = await authenticatedFetch(
          apiUrl('/api/podcast/admin/assign-show'),
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ show_name: showName, mode: 'set', episode_ids: toAttach }),
          },
          token
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setEpisodesError((data as { error?: string }).error || 'Failed to attach episodes');
          return;
        }
      }
      if (toDetach.length) {
        const res = await authenticatedFetch(
          apiUrl('/api/podcast/admin/assign-show'),
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ show_name: showName, mode: 'clear', episode_ids: toDetach }),
          },
          token
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setEpisodesError((data as { error?: string }).error || 'Failed to detach episodes');
          return;
        }
      }

      // Refresh episodes list to reflect assignments
      const res = await authenticatedFetch(apiUrl('/api/podcast'), {}, token);
      const data = await res.json().catch(() => ([]));
      if (res.ok) setEpisodes(Array.isArray(data) ? (data as Episode[]) : []);
      setSuccess('Episode assignments updated.');
    } catch (err) {
      setEpisodesError(err instanceof Error ? err.message : 'Could not connect to server');
    } finally {
      setAssigning(false);
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
      const url = isNew ? apiUrl('/api/shows/admin') : apiUrl(`/api/shows/admin/${showId}`);
      const res = await authenticatedFetch(
        url,
        { method: isNew ? 'POST' : 'PUT', body: form },
        token
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || 'Failed to save show');
        return;
      }
      setSuccess(isNew ? 'Show created.' : 'Show updated.');
      const saved = data as Show;
      if (isNew && saved?.id) {
        // Go to edit page so episodes can be attached
        navigate(`/admin/shows/${saved.id}`, { replace: true });
      } else {
        navigate('/admin/shows', { replace: true });
      }
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
          <Link to="/admin/shows" className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Manage Shows
          </Link>
        </div>

        <h1 className="text-offwhite font-editorial font-bold text-2xl mb-2">
          {isNew ? 'Add show' : 'Edit show'}
        </h1>
        <p className="text-offwhite/60 text-sm mb-6">
          Slug/URL is generated automatically from the show name.
        </p>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        {success && <p className="text-lime text-sm mb-4">{success}</p>}

        {loading ? (
          <p className="text-offwhite/60">Loading…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 p-6 bg-offwhite/5 border border-offwhite/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="block">
                <span className={labelClass}>Name *</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Sideline Sports"
                  required
                />
              </label>
              <div className="block">
                <span className={labelClass}>Public URL</span>
                <div className={`${inputClass} flex items-center`}>
                  <span className="text-offwhite/70">/shows/{slugPreview(name) || '...'}</span>
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
                <input type="url" value={youtube} onChange={(e) => setYoutube(e.target.value)} className={inputClass} placeholder="https://youtube.com/..." />
              </label>
              <label className="block">
                <span className={labelClass}>Spotify</span>
                <input type="url" value={spotify} onChange={(e) => setSpotify(e.target.value)} className={inputClass} placeholder="https://open.spotify.com/show/..." />
              </label>
              <label className="block">
                <span className={labelClass}>Apple Podcasts</span>
                <input type="url" value={apple} onChange={(e) => setApple(e.target.value)} className={inputClass} placeholder="https://podcasts.apple.com/..." />
              </label>
              <label className="block">
                <span className={labelClass}>Website</span>
                <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} placeholder="https://..." />
              </label>
            </div>

            <button type="submit" disabled={saving} className="btn-premium py-4 px-8 disabled:opacity-50">
              {saving ? 'Saving…' : isNew ? 'Create show' : 'Update show'}
            </button>
          </form>
        )}

        {!isNew && !loading && (
          <div className="mt-10 p-6 bg-offwhite/5 border border-offwhite/10">
            <h2 className="text-offwhite font-semibold mb-2">Attach episodes</h2>
            <p className="text-offwhite/60 text-sm mb-4">
              Select which podcast episodes belong to <span className="text-offwhite/80">{name.trim() || 'this show'}</span>.
            </p>

            {episodesError && <p className="text-red-400 text-sm mb-3">{episodesError}</p>}

            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
              <input
                type="search"
                value={episodeQuery}
                onChange={(e) => setEpisodeQuery(e.target.value)}
                placeholder="Search episodes…"
                className={`${inputClass} md:max-w-md`}
              />
              <button
                type="button"
                onClick={applyEpisodeAssignments}
                disabled={assigning || episodesLoading}
                className="btn-premium inline-flex items-center justify-center px-5 py-3 disabled:opacity-50"
              >
                {assigning ? 'Saving…' : 'Save episode attachments'}
              </button>
            </div>

            {episodesLoading ? (
              <p className="text-offwhite/60">Loading episodes…</p>
            ) : episodes.length === 0 ? (
              <p className="text-offwhite/60">No episodes found. Add episodes in the Admin dashboard first.</p>
            ) : (
              <div className="max-h-[420px] overflow-y-auto border border-offwhite/10">
                <ul className="divide-y divide-offwhite/10">
                  {filteredEpisodes.map((ep) => {
                    const checked = selectedEpisodeIds.has(ep.id);
                    return (
                      <li key={ep.id} className="flex items-start gap-3 p-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setSelectedEpisodeIds((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(ep.id);
                              else next.delete(ep.id);
                              return next;
                            });
                          }}
                          className="mt-1 w-4 h-4 accent-lime"
                        />
                        <div className="min-w-0">
                          <p className="text-offwhite text-sm font-medium break-words">{ep.title}</p>
                          <p className="text-offwhite/50 text-xs">
                            {ep.show_name ? `Assigned: ${ep.show_name}` : 'Unassigned'}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

