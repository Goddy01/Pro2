import { useEffect, useMemo, useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
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

export default function AdminShowsList() {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const sorted = useMemo(() => {
    const list = [...shows];
    list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.name || '').localeCompare(b.name || ''));
    return list;
  }, [shows]);

  async function handleDelete(id: number) {
    if (!token) return;
    if (!window.confirm('Delete this show? This cannot be undone.')) return;
    setError('');
    try {
      const res = await authenticatedFetch(apiUrl(`/api/shows/admin/${id}`), { method: 'DELETE' }, token);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || 'Failed to delete show');
        return;
      }
      setShows((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError('Could not connect to server');
    }
  }

  return (
    <div className="min-h-screen bg-forest px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <Link to="/admin" className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
          <Link to="/admin/shows/new" className="btn-premium inline-flex items-center gap-2 px-4 py-2">
            <Plus className="w-4 h-4" />
            Add show
          </Link>
        </div>

        <h1 className="text-offwhite font-editorial font-bold text-2xl mb-2">Manage shows</h1>
        <p className="text-offwhite/60 text-sm mb-6">Edit or delete existing show pages.</p>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {loading ? (
          <p className="text-offwhite/60">Loading…</p>
        ) : sorted.length === 0 ? (
          <p className="text-offwhite/60">
            No shows yet. <Link to="/admin/shows/new" className="text-lime hover:underline">Add one</Link>.
          </p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 py-3 border-b border-offwhite/10">
                <div className="min-w-0">
                  <p className="text-offwhite font-medium truncate">{s.name}</p>
                  <p className="text-offwhite/50 text-xs truncate">/shows/{s.slug}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/shows/${s.id}`)}
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
  );
}

