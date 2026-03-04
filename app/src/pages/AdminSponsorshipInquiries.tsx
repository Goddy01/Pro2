import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl, authenticatedFetch } from '../lib/api';
import { ArrowLeft, Trash2 } from 'lucide-react';
import '../App.css';

type Inquiry = {
  id: number;
  name: string;
  business_name: string;
  email: string;
  phone: string;
  tier: string | null;
  message: string | null;
  created_at: string;
};

const TIER_LABELS: Record<string, string> = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

const PER_PAGE = 5;

export default function AdminSponsorshipInquiries() {
  const { token, isAuthenticated } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await authenticatedFetch(apiUrl('/api/sponsorship-inquiries'), {}, token);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (!cancelled) setError(data.error || 'Failed to load inquiries');
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setInquiries(Array.isArray(data) ? data : []);
          setPage(1);
        }
      } catch {
        if (!cancelled) setError('Could not connect to server');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (!isAuthenticated) return <Navigate to="/superuser" replace />;

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return s;
    }
  };

  const totalPages = Math.max(1, Math.ceil(inquiries.length / PER_PAGE));
  const start = (page - 1) * PER_PAGE;
  const paginated = inquiries.slice(start, start + PER_PAGE);

  async function handleDelete(id: number) {
    if (!token || !window.confirm('Delete this inquiry? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      const res = await authenticatedFetch(apiUrl(`/api/sponsorship-inquiries/${id}`), { method: 'DELETE' }, token);
      if (res.ok) setInquiries((prev) => prev.filter((i) => i.id !== id));
      else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to delete');
      }
    } catch {
      setError('Could not connect to server');
    } finally {
      setDeletingId(null);
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

        <h1 className="text-offwhite font-editorial font-bold text-2xl mb-2">Sponsorship inquiries</h1>
        <p className="text-offwhite/60 text-sm mb-6">Partner / sponsorship form submissions from the Sponsorship page.</p>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {loading ? (
          <p className="text-offwhite/60">Loading…</p>
        ) : inquiries.length === 0 ? (
          <p className="text-offwhite/60">No inquiries yet.</p>
        ) : (
          <>
            <div className="space-y-6">
              {paginated.map((s) => (
                <article
                  key={s.id}
                  className="border border-offwhite/20 bg-offwhite/5 p-5 rounded text-offwhite relative"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                    <h2 className="text-lg font-semibold text-lime">{s.business_name}</h2>
                    <div className="flex items-center gap-2">
                      {s.tier != null && s.tier !== '' && (
                        <span className="px-2 py-0.5 bg-lime/20 text-lime text-sm font-medium rounded">
                          {TIER_LABELS[s.tier] ?? s.tier}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id)}
                        disabled={deletingId === s.id}
                        className="p-2 text-offwhite/60 hover:text-red-400 transition-colors rounded disabled:opacity-50"
                        title="Delete inquiry"
                        aria-label="Delete inquiry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <time className="text-offwhite/50 text-sm block mb-3">{formatDate(s.created_at)}</time>
                  <dl className="grid gap-1 text-sm">
                    <div>
                      <span className="text-offwhite/50">Contact: </span>
                      <span>{s.name}</span>
                    </div>
                    <div>
                      <span className="text-offwhite/50">Email: </span>
                      <a href={`mailto:${s.email}`} className="text-lime hover:underline">{s.email}</a>
                    </div>
                    <div>
                      <span className="text-offwhite/50">Phone: </span>
                      <a href={`tel:${s.phone}`} className="text-offwhite hover:underline">{s.phone}</a>
                    </div>
                  </dl>
                  {s.message && (
                    <div className="mt-3 pt-3 border-t border-offwhite/10">
                      <span className="text-offwhite/50 text-sm block mb-1">Message</span>
                      <p className="text-offwhite whitespace-pre-wrap text-sm">{s.message}</p>
                    </div>
                  )}
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
                <span className="text-offwhite/70 text-sm">Page {page} of {totalPages}</span>
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
