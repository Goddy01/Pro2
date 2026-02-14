import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../lib/api';
import { ArrowLeft, Download } from 'lucide-react';
import '../App.css';

type Signup = {
  id: number;
  name: string;
  email: string;
  cell: string;
  created_at: string;
};

const PER_PAGE = 10;

export default function AdminNewsletterSignups() {
  const { token, isAuthenticated } = useAuth();
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl('/api/newsletter-signups'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (!cancelled) setError(data.error || 'Failed to load signups');
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setSignups(Array.isArray(data) ? data : []);
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

  const totalPages = Math.max(1, Math.ceil(signups.length / PER_PAGE));
  const start = (page - 1) * PER_PAGE;
  const paginatedSignups = signups.slice(start, start + PER_PAGE);

  function handleExportCsv() {
    if (!token) return;
    const url = `${apiUrl('/api/newsletter-signups')}?format=csv`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'newsletter-signups.csv');
    document.body.appendChild(link);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.text())
      .then((csv) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        link.href = blobUrl;
        link.click();
        URL.revokeObjectURL(blobUrl);
      })
      .catch(() => setError('Export failed'))
      .finally(() => link.remove());
  }

  return (
    <div className="min-h-screen bg-forest px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <Link to="/admin" className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={signups.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-lime text-forest font-semibold text-sm uppercase tracking-wide hover:bg-lime/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <h1 className="text-offwhite font-editorial font-bold text-2xl mb-2">Newsletter signups</h1>
        <p className="text-offwhite/60 text-sm mb-6">
          Everyone who signed up for more information (name, email, cell). Export to compile your list.
        </p>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {loading ? (
          <p className="text-offwhite/60">Loading…</p>
        ) : signups.length === 0 ? (
          <p className="text-offwhite/60">No signups yet.</p>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedSignups.map((s) => (
                <article
                  key={s.id}
                  className="border border-offwhite/20 bg-offwhite/5 p-5 rounded text-offwhite"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                    <h2 className="text-lg font-semibold text-lime">{s.name}</h2>
                    <time className="text-offwhite/50 text-sm">{formatDate(s.created_at)}</time>
                  </div>
                  <dl className="grid gap-1 text-sm">
                    <div>
                      <span className="text-offwhite/50">Email: </span>
                      <a href={`mailto:${s.email}`} className="text-lime hover:underline">
                        {s.email}
                      </a>
                    </div>
                    <div>
                      <span className="text-offwhite/50">Cell: </span>
                      <a href={`tel:${s.cell}`} className="text-offwhite hover:underline">
                        {s.cell}
                      </a>
                    </div>
                  </dl>
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
