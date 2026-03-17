import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiUrl, authenticatedFetch } from '../lib/api';
import '../App.css';

type PlatformLinks = { youtube?: string; spotify?: string; apple?: string };

type ShowPage = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  hero_image_url: string | null;
  platform_links: PlatformLinks | null;
  sort_order: number;
  created_at?: string;
};

type Episode = {
  id: number;
  title: string;
  description: string | null;
  duration_label: string | null;
  guests: string | null;
  audio_url: string | null;
  video_url: string | null;
  show_name: string | null;
  created_at: string;
};

const inputClass =
  'w-full px-4 py-3 bg-offwhite/5 border border-offwhite/20 text-offwhite placeholder:text-offwhite/40 focus:outline-none focus:border-lime';
const labelClass = 'text-offwhite text-sm font-medium mb-2 block';

export default function AdminShowPagesManager() {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [shows, setShows] = useState<ShowPage[]>([]);
  const [showsLoading, setShowsLoading] = useState(true);
  const [selectedShowId, setSelectedShowId] = useState<number | null>(null);

  // Show form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const [youtube, setYoutube] = useState('');
  const [spotify, setSpotify] = useState('');
  const [apple, setApple] = useState('');

  // Episodes under selected show
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodeQuery, setEpisodeQuery] = useState('');
  const [addEpisodeOpen, setAddEpisodeOpen] = useState(false);

  // Add episode form
  const [episodeType, setEpisodeType] = useState<'audio' | 'video' | null>(null);
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [episodeDescription, setEpisodeDescription] = useState('');
  const [episodeDuration, setEpisodeDuration] = useState('');
  const [episodeGuests, setEpisodeGuests] = useState('');
  const [episodeAudioUrl, setEpisodeAudioUrl] = useState('');
  const [episodeVideoUrl, setEpisodeVideoUrl] = useState('');
  const [episodeShowName, setEpisodeShowName] = useState('');

  function clearMessages() {
    setError('');
    setSuccess('');
  }

  function resetShowForm() {
    setSelectedShowId(null);
    setName('');
    setDescription('');
    setSortOrder('0');
    setHeroFile(null);
    if (heroInputRef.current) heroInputRef.current.value = '';
    setYoutube('');
    setSpotify('');
    setApple('');
    setEpisodes([]);
    setEpisodeQuery('');
    setAddEpisodeOpen(false);
    setEpisodeType(null);
    setEpisodeTitle('');
    setEpisodeDescription('');
    setEpisodeDuration('');
    setEpisodeGuests('');
    setEpisodeAudioUrl('');
    setEpisodeVideoUrl('');
    setEpisodeShowName('');
  }

  function resetEpisodeForm(keepShow = true) {
    setAddEpisodeOpen(false);
    setEpisodeType(null);
    setEpisodeTitle('');
    setEpisodeDescription('');
    setEpisodeDuration('');
    setEpisodeGuests('');
    setEpisodeAudioUrl('');
    setEpisodeVideoUrl('');
    if (!keepShow) setEpisodeShowName('');
  }

  async function refreshShows() {
    if (!token) return;
    setShowsLoading(true);
    try {
      const res = await authenticatedFetch(apiUrl('/api/shows/admin'), {}, token);
      const data = await res.json().catch(() => ([]));
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to load shows');
      setShows(Array.isArray(data) ? (data as ShowPage[]) : []);
    } catch (e) {
      setShows([]);
      setError((e as { message?: string })?.message || 'Could not connect to server');
    } finally {
      setShowsLoading(false);
    }
  }

  async function refreshEpisodes(showName: string) {
    if (!token) return;
    setEpisodesLoading(true);
    try {
      const res = await authenticatedFetch(apiUrl(`/api/podcast?show=${encodeURIComponent(showName)}`), {}, token);
      const data = await res.json().catch(() => ([]));
      setEpisodes(res.ok && Array.isArray(data) ? (data as Episode[]) : []);
    } catch {
      setEpisodes([]);
    } finally {
      setEpisodesLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    refreshShows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const selectedShow = useMemo(() => {
    if (!selectedShowId) return null;
    return shows.find((s) => s.id === selectedShowId) || null;
  }, [shows, selectedShowId]);

  const sortedShows = useMemo(() => {
    const list = [...shows];
    list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.name || '').localeCompare(b.name || ''));
    return list;
  }, [shows]);

  const showNameOptions = useMemo(() => {
    const names = sortedShows.map((s) => (s.name || '').trim()).filter(Boolean);
    return Array.from(new Set(names));
  }, [sortedShows]);

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

  function startNewShow() {
    clearMessages();
    resetShowForm();
  }

  function startEditShow(s: ShowPage) {
    clearMessages();
    setSelectedShowId(s.id);
    setName(s.name || '');
    setDescription(s.description || '');
    setSortOrder(String(s.sort_order ?? 0));
    setHeroFile(null);
    if (heroInputRef.current) heroInputRef.current.value = '';
    setYoutube(s.platform_links?.youtube || '');
    setSpotify(s.platform_links?.spotify || '');
    setApple(s.platform_links?.apple || '');
    setEpisodeShowName(s.name || '');
    refreshEpisodes(s.name || '');
  }

  async function handleSaveShow(e: FormEvent) {
    e.preventDefault();
    clearMessages();
    if (!token) return;
    if (!name.trim()) {
      setError('Show name is required');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('name', name.trim());
      form.append('description', description.trim());
      form.append('sort_order', String(parseInt(sortOrder || '0', 10) || 0));
      if (heroFile) form.append('hero_image', heroFile);
      form.append('platform_links', JSON.stringify({
        youtube: youtube.trim() || undefined,
        spotify: spotify.trim() || undefined,
        apple: apple.trim() || undefined,
      }));

      const isEditing = typeof selectedShowId === 'number';
      const url = isEditing ? apiUrl(`/api/shows/admin/${selectedShowId}`) : apiUrl('/api/shows/admin');
      const res = await authenticatedFetch(url, { method: isEditing ? 'PUT' : 'POST', body: form }, token);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to save show');

      const saved = data as Partial<ShowPage>;
      setSuccess(isEditing ? 'Show updated.' : 'Show created.');
      await refreshShows();

      // Keep editing context on create: select the newly created show if returned
      if (!isEditing && typeof saved.id === 'number') {
        setSelectedShowId(saved.id);
      }
      setEpisodeShowName(name.trim());
      if (name.trim()) refreshEpisodes(name.trim());
    } catch (e) {
      setError((e as { message?: string })?.message || 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteShow(id: number) {
    if (!token) return;
    if (!window.confirm('Delete this show? This cannot be undone.')) return;
    clearMessages();
    setLoading(true);
    try {
      const res = await authenticatedFetch(apiUrl(`/api/shows/admin/${id}`), { method: 'DELETE' }, token);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to delete show');
      setSuccess('Show deleted.');
      if (selectedShowId === id) resetShowForm();
      await refreshShows();
    } catch (e) {
      setError((e as { message?: string })?.message || 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEpisode(e: FormEvent) {
    e.preventDefault();
    clearMessages();
    if (!token) return;
    if (!episodeType) {
      setError('Choose audio or video episode first');
      return;
    }
    if (!episodeTitle.trim()) {
      setError('Episode title is required');
      return;
    }
    if (!episodeShowName.trim()) {
      setError('Select a show');
      return;
    }
    if (episodeType === 'audio' && !episodeAudioUrl.trim()) {
      setError('Audio URL is required');
      return;
    }
    if (episodeType === 'video' && !episodeVideoUrl.trim()) {
      setError('Video URL is required');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('title', episodeTitle.trim());
      form.append('description', episodeDescription.trim());
      form.append('duration_label', episodeDuration.trim());
      form.append('guests', episodeGuests.trim());
      form.append('show_name', episodeShowName.trim());
      if (episodeType === 'audio') form.append('audio_url', episodeAudioUrl.trim());
      if (episodeType === 'video') form.append('video_url', episodeVideoUrl.trim());

      const res = await authenticatedFetch(apiUrl('/api/podcast'), { method: 'POST', body: form }, token);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to add episode');

      setSuccess('Episode created.');
      resetEpisodeForm(true);
      await refreshEpisodes(episodeShowName.trim());
    } catch (e) {
      setError((e as { message?: string })?.message || 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) return <Navigate to="/superuser" replace />;

  return (
    <div className="min-h-screen bg-forest px-6 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/admin', { replace: true })}
            className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </button>
          <Link to="/shows" className="text-offwhite/60 hover:text-lime text-sm">
            View public shows page
          </Link>
        </div>

        <div>
          <h1 className="text-offwhite font-editorial font-bold text-2xl mb-2">Show pages manager</h1>
          <p className="text-offwhite/60 text-sm">Manage show pages and add episodes under them.</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-lime text-sm">{success}</p>}

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="border border-offwhite/20 bg-offwhite/5 rounded p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-offwhite font-medium">Existing shows</h2>
              <button
                type="button"
                onClick={startNewShow}
                className="inline-flex items-center gap-2 px-3 py-2 border border-offwhite/20 text-offwhite/80 hover:text-lime hover:border-lime transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                New
              </button>
            </div>
            {showsLoading ? (
              <p className="text-offwhite/60">Loading…</p>
            ) : sortedShows.length === 0 ? (
              <p className="text-offwhite/60">No shows yet.</p>
            ) : (
              <ul className="space-y-2 max-h-[520px] overflow-auto pr-1">
                {sortedShows.map((s) => {
                  const active = s.id === selectedShowId;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => startEditShow(s)}
                        className={`w-full text-left px-3 py-2 rounded border transition-colors ${
                          active ? 'border-lime bg-lime/10 text-offwhite' : 'border-offwhite/10 text-offwhite/80 hover:border-offwhite/20 hover:bg-offwhite/5'
                        }`}
                      >
                        <p className="font-medium truncate">{s.name}</p>
                        <p className="text-xs text-offwhite/50 truncate">/shows/{s.slug}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="space-y-6">
            <div className="border border-offwhite/20 bg-offwhite/5 rounded p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div>
                  <h2 className="text-offwhite font-medium">{selectedShowId ? 'Edit show' : 'Add show'}</h2>
                  <p className="text-offwhite/60 text-sm">These details power the public show page.</p>
                </div>
                {selectedShowId && (
                  <button
                    type="button"
                    onClick={() => handleDeleteShow(selectedShowId)}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-red-500/40 text-red-300 hover:border-red-400 hover:text-red-200 transition-colors disabled:opacity-50 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveShow} className="space-y-4">
                <label className="block">
                  <span className={labelClass}>Name *</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Show name" required />
                </label>
                <label className="block">
                  <span className={labelClass}>Description (optional)</span>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputClass} placeholder="Short show description" />
                </label>
                <label className="block">
                  <span className={labelClass}>Hero image (optional)</span>
                  <input
                    ref={heroInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setHeroFile(e.target.files?.[0] ?? null)}
                    className="w-full text-offwhite/80 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-lime file:text-forest file:font-medium"
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>
                    Sort order <span className="text-offwhite/50 font-normal text-xs ml-2">Lower numbers show first on /shows.</span>
                  </span>
                  <input value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={inputClass} placeholder="0" />
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-offwhite/70 text-xs mb-1 block">YouTube</span>
                    <input value={youtube} onChange={(e) => setYoutube(e.target.value)} className={inputClass} placeholder="https://..." />
                  </label>
                  <label className="block">
                    <span className="text-offwhite/70 text-xs mb-1 block">Spotify</span>
                    <input value={spotify} onChange={(e) => setSpotify(e.target.value)} className={inputClass} placeholder="https://..." />
                  </label>
                  <label className="block">
                    <span className="text-offwhite/70 text-xs mb-1 block">Apple Podcasts</span>
                    <input value={apple} onChange={(e) => setApple(e.target.value)} className={inputClass} placeholder="https://..." />
                  </label>
                </div>

                <div className="flex items-center gap-3 flex-wrap pt-2">
                  <button type="submit" disabled={loading} className="btn-premium py-3 px-6 disabled:opacity-50">
                    {loading ? 'Saving…' : selectedShowId ? 'Save changes' : 'Create show'}
                  </button>
                  <button
                    type="button"
                    onClick={resetShowForm}
                    className="px-4 py-3 border border-offwhite/20 text-offwhite/80 hover:text-lime hover:border-lime transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>

            <div className="border border-offwhite/20 bg-offwhite/5 rounded p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div>
                  <h2 className="text-offwhite font-medium">Episodes under this show</h2>
                  <p className="text-offwhite/60 text-sm">
                    {selectedShow?.name ? (
                      <>Showing episodes assigned to <span className="text-offwhite">{selectedShow.name}</span>.</>
                    ) : (
                      <>Select a show to view and add episodes.</>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { if (selectedShow?.name) refreshEpisodes(selectedShow.name); }}
                  disabled={!selectedShow?.name || episodesLoading}
                  className="text-offwhite/70 hover:text-lime text-sm disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>

              {selectedShow?.name ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
                    <label className="block w-full">
                      <span className="text-offwhite/70 text-xs mb-1 block">Search</span>
                      <input value={episodeQuery} onChange={(e) => setEpisodeQuery(e.target.value)} className={inputClass} placeholder="Search episodes…" />
                    </label>
                    <button
                      type="button"
                      onClick={() => { clearMessages(); setAddEpisodeOpen((o) => !o); setEpisodeShowName(selectedShow.name); }}
                      className="btn-premium py-3 px-6"
                    >
                      {addEpisodeOpen ? 'Close' : 'Add episode'}
                    </button>
                  </div>

                  {addEpisodeOpen && (
                    <form onSubmit={handleCreateEpisode} className="space-y-4 mb-6 border border-offwhite/10 rounded p-4">
                      {episodeType == null ? (
                        <div className="space-y-2">
                          <p className={labelClass}>What kind of episode?</p>
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => setEpisodeType('audio')}
                              className="px-5 py-3 border border-offwhite/30 text-offwhite hover:border-lime hover:text-lime transition-colors"
                            >
                              Audio episode
                            </button>
                            <button
                              type="button"
                              onClick={() => setEpisodeType('video')}
                              className="px-5 py-3 border border-offwhite/30 text-offwhite hover:border-lime hover:text-lime transition-colors"
                            >
                              Video episode
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <p className="text-offwhite/70 text-sm">
                              Adding a {episodeType === 'audio' ? 'audio' : 'video'} episode.
                            </p>
                            <button type="button" onClick={() => setEpisodeType(null)} className="text-offwhite/70 hover:text-lime text-sm">
                              Change type
                            </button>
                          </div>
                          <label className="block">
                            <span className={labelClass}>Episode title *</span>
                            <input value={episodeTitle} onChange={(e) => setEpisodeTitle(e.target.value)} className={inputClass} placeholder="Episode title" required />
                          </label>
                          <label className="block">
                            <span className={labelClass}>Description (optional)</span>
                            <textarea value={episodeDescription} onChange={(e) => setEpisodeDescription(e.target.value)} rows={3} className={inputClass} placeholder="Episode description" />
                          </label>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block">
                              <span className={labelClass}>Duration (optional)</span>
                              <input value={episodeDuration} onChange={(e) => setEpisodeDuration(e.target.value)} className={inputClass} placeholder="01:02:28" />
                            </label>
                            <label className="block">
                              <span className={labelClass}>Guests (optional)</span>
                              <input value={episodeGuests} onChange={(e) => setEpisodeGuests(e.target.value)} className={inputClass} placeholder="Name 1, Name 2" />
                            </label>
                          </div>
                          <label className="block">
                            <span className={labelClass}>Show *</span>
                            <select value={episodeShowName} onChange={(e) => setEpisodeShowName(e.target.value)} className={`${inputClass} admin-select`}>
                              <option value="">Select a show…</option>
                              {showNameOptions.map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </label>
                          {episodeType === 'audio' && (
                            <label className="block">
                              <span className={labelClass}>Audio URL *</span>
                              <input value={episodeAudioUrl} onChange={(e) => setEpisodeAudioUrl(e.target.value)} className={inputClass} placeholder="https://..." required />
                            </label>
                          )}
                          {episodeType === 'video' && (
                            <label className="block">
                              <span className={labelClass}>Video URL or YouTube link *</span>
                              <input value={episodeVideoUrl} onChange={(e) => setEpisodeVideoUrl(e.target.value)} className={inputClass} placeholder="https://..." required />
                            </label>
                          )}
                          <div className="flex items-center gap-3 flex-wrap pt-2">
                            <button type="submit" disabled={loading} className="btn-premium py-3 px-6 disabled:opacity-50">
                              {loading ? 'Adding…' : 'Create episode'}
                            </button>
                            <button
                              type="button"
                              onClick={() => resetEpisodeForm(true)}
                              className="px-4 py-3 border border-offwhite/20 text-offwhite/80 hover:text-lime hover:border-lime transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      )}
                    </form>
                  )}

                  {episodesLoading ? (
                    <p className="text-offwhite/60">Loading episodes…</p>
                  ) : filteredEpisodes.length === 0 ? (
                    <p className="text-offwhite/60">No episodes assigned yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {filteredEpisodes.map((ep) => (
                        <li key={ep.id} className="py-2 border-b border-offwhite/10">
                          <p className="text-offwhite font-medium">{ep.title}</p>
                          <p className="text-offwhite/50 text-xs">
                            {(ep.audio_url ? 'Audio' : ep.video_url ? 'Video' : 'Episode')} • {ep.duration_label || '—'}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <p className="text-offwhite/60">Select a show to see its episodes.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

