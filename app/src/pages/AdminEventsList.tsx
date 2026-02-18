import { useState, useEffect } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../lib/api';
import { ArrowLeft, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import '../App.css';

const PAGE_SIZE = 10;
type Event = { id: string; title: string };

export default function AdminEventsList() {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState<Event[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(apiUrl('/api/events'), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setList(data.map((e: Event) => ({ id: e.id, title: e.title })));
      })
      .catch(() => { if (!cancelled) setError('Could not load events'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageList = list.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages && totalPages >= 1) setPage(1);
  }, [list.length, totalPages, page]);

  async function handleDelete(slug: string) {
    if (!confirm('Delete this event? All its images will be removed.')) return;
    try {
      const res = await fetch(apiUrl(`/api/events/${slug}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to delete');
        return;
      }
      setList((prev) => prev.filter((e) => e.id !== slug));
    } catch {
      setError('Could not connect to server');
    }
  }

  if (!isAuthenticated) return <Navigate to="/superuser" replace />;

  return (
    <div className="min-h-screen bg-forest px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link to="/admin" className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
          <Link to="/admin" state={{ openTab: 'events' }} className="px-3 py-2 bg-lime text-forest text-sm font-medium hover:bg-lime/90 transition-colors">
            Add new event
          </Link>
        </div>
        <h1 className="text-offwhite font-editorial font-bold text-2xl mb-2">Events</h1>
        <p className="text-offwhite/60 text-sm mb-6">Manage and edit existing events.</p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        {loading ? (
          <p className="text-offwhite/60">Loading…</p>
        ) : list.length === 0 ? (
          <p className="text-offwhite/60">No events yet. <Link to="/admin" state={{ openTab: 'events' }} className="text-lime hover:underline">Add one</Link>.</p>
        ) : (
          <>
          <ul className="space-y-2">
            {pageList.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-4 py-3 border-b border-offwhite/10">
                <span className="text-offwhite truncate flex-1">{e.title}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate('/admin', { state: { openTab: 'events', editSlug: e.id } })}
                    className="p-2 text-offwhite/70 hover:text-lime transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => handleDelete(e.id)} className="p-2 text-offwhite/70 hover:text-red-400 transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {list.length > PAGE_SIZE && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-offwhite/10 pt-4">
              <p className="text-offwhite/60 text-sm">
                Showing {start + 1}–{Math.min(start + PAGE_SIZE, list.length)} of {list.length}
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="p-2 text-offwhite/70 hover:text-lime disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-offwhite/80 text-sm min-w-[6rem] text-center">Page {safePage} of {totalPages}</span>
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="p-2 text-offwhite/70 hover:text-lime disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Next page"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
