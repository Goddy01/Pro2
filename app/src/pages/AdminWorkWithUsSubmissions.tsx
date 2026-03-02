import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl, authenticatedFetch } from '../lib/api';
import { ArrowLeft, Trash2, Mail, MailOpen } from 'lucide-react';
import '../App.css';

type Submission = {
  id: number;
  name: string;
  phone: string;
  email: string;
  introduction: string;
  created_at: string;
  read_at: string | null;
};

const PER_PAGE = 10;
type Filter = 'all' | 'unread' | 'read';

export default function AdminWorkWithUsSubmissions() {
  const { token, isAuthenticated } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<Filter>('all');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  function fetchSubmissions() {
    if (!token) return;
    setLoading(true);
    authenticatedFetch(apiUrl('/api/work-with-us'), {}, token)
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { setError(d.error || 'Failed to load'); return []; });
        return res.json();
      })
      .then((data) => {
        setSubmissions(Array.isArray(data) ? data : []);
        setPage(1);
      })
      .catch(() => setError('Could not connect to server'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (token) fetchSubmissions();
  }, [token]);

  if (!isAuthenticated) return <Navigate to="/superuser" replace />;

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return s;
    }
  };

  const filtered =
    filter === 'unread'
      ? submissions.filter((s) => !s.read_at)
      : filter === 'read'
        ? submissions.filter((s) => s.read_at)
        : submissions;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const start = (page - 1) * PER_PAGE;
  const paginatedSubmissions = filtered.slice(start, start + PER_PAGE);
  const unreadCount = submissions.filter((s) => !s.read_at).length;

  async function handleDelete(id: number) {
    if (!token || !window.confirm('Remove this submission? This cannot be undone.')) return;
    setActionLoadingId(id);
    try {
      const res = await authenticatedFetch(apiUrl(`/api/work-with-us/${id}`), { method: 'DELETE' }, token);
      if (res.ok) setSubmissions((prev) => prev.filter((s) => s.id !== id));
      else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to delete');
      }
    } catch {
      setError('Could not connect to server');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleToggleRead(id: number, currentlyRead: boolean) {
    if (!token) return;
    setActionLoadingId(id);
    setError('');
    try {
      const res = await authenticatedFetch(
        apiUrl(`/api/work-with-us/${id}`),
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ read: !currentlyRead }) },
        token
      );
      if (res.ok) {
        const data = await res.json();
        setSubmissions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, read_at: data.read_at ?? null } : s))
        );
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to update');
      }
    } catch {
      setError('Could not connect to server');
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-forest px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/admin" className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
        </div>

        <h1 className="text-offwhite font-editorial font-bold text-2xl mb-2">Work with us submissions</h1>
        <p className="text-offwhite/60 text-sm mb-6">All submissions from the Work with us form. Mark as read when you’ve followed up, or remove when done.</p>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {loading ? (
          <p className="text-offwhite/60">Loading…</p>
        ) : submissions.length === 0 ? (
          <p className="text-offwhite/60">No submissions yet.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="text-offwhite/60 text-sm">Filter:</span>
              {(['all', 'unread', 'read'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => { setFilter(f); setPage(1); }}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-lime text-forest'
                      : 'bg-offwhite/10 text-offwhite/80 hover:bg-offwhite/20'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'unread' ? `Unread (${unreadCount})` : 'Read'}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {paginatedSubmissions.map((s) => (
                <article
                  key={s.id}
                  className={`border rounded text-offwhite p-5 ${
                    s.read_at
                      ? 'border-offwhite/15 bg-offwhite/5 opacity-90'
                      : 'border-lime/40 bg-offwhite/10'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {!s.read_at && (
                        <span className="w-2 h-2 rounded-full bg-lime shrink-0" title="Unread" aria-hidden />
                      )}
                      <h2 className="text-lg font-semibold text-lime">{s.name}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <time className="text-offwhite/50 text-sm">{formatDate(s.created_at)}</time>
                      <button
                        type="button"
                        onClick={() => handleToggleRead(s.id, !!s.read_at)}
                        disabled={actionLoadingId === s.id}
                        className="p-2 text-offwhite/60 hover:text-lime transition-colors rounded"
                        title={s.read_at ? 'Mark as unread' : 'Mark as read'}
                        aria-label={s.read_at ? 'Mark as unread' : 'Mark as read'}
                      >
                        {s.read_at ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id)}
                        disabled={actionLoadingId === s.id}
                        className="p-2 text-offwhite/60 hover:text-red-400 transition-colors rounded"
                        title="Remove submission"
                        aria-label="Remove submission"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <dl className="grid gap-1 text-sm">
                    <div>
                      <span className="text-offwhite/50">Email: </span>
                      <a href={`mailto:${s.email}`} className="text-lime hover:underline">{s.email}</a>
                    </div>
                    <div>
                      <span className="text-offwhite/50">Phone: </span>
                      <a href={`tel:${s.phone}`} className="text-offwhite hover:underline">{s.phone}</a>
                    </div>
                  </dl>
                  <div className="mt-3 pt-3 border-t border-offwhite/10">
                    <span className="text-offwhite/50 text-sm block mb-1">Introduction</span>
                    <p className="text-offwhite whitespace-pre-wrap">{s.introduction}</p>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 border border-offwhite/30 text-offwhite disabled:opacity-40 disabled:cursor-not-allowed hover:border-lime hover:text-lime transition-colors"
                >
                  Previous
                </button>
                <span className="text-offwhite/70 text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 border border-offwhite/30 text-offwhite disabled:opacity-40 disabled:cursor-not-allowed hover:border-lime hover:text-lime transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
