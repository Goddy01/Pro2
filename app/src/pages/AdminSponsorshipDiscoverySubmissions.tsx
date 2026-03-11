import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiUrl, authenticatedFetch } from '../lib/api';
import '../App.css';

type Answer = {
  questionId: number;
  questionText: string;
  answer: string;
};

type Submission = {
  id: number;
  sponsor_name: string;
  business_name: string;
  email: string;
  phone: string;
  message: string | null;
  answers: Answer[];
  created_at: string;
  followup_due_at: string;
  followup_completed_at: string | null;
  followup_email_sent_at: string | null;
};

const PER_PAGE = 10;

export default function AdminSponsorshipDiscoverySubmissions() {
  const { token, isAuthenticated } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'needs-followup' | 'completed'>('all');
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('status', filter);
    authenticatedFetch(apiUrl(`/api/sponsorship-discovery-submissions/admin?${params.toString()}`), {}, token)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error || 'Failed to load submissions');
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          const list = Array.isArray(data) ? data : [];
          setSubmissions(
            list.map((s) => ({
              ...s,
              answers: Array.isArray(s.answers)
                ? s.answers
                : (() => {
                    try {
                      return JSON.parse(s.answers || '[]');
                    } catch {
                      return [];
                    }
                  })(),
            }))
          );
          setPage(1);
        }
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
  }, [token, filter]);

  if (!isAuthenticated) return <Navigate to="/superuser" replace />;

  const formatDateTime = (s: string | null) => {
    if (!s) return '';
    try {
      return new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return s;
    }
  };

  const totalPages = Math.max(1, Math.ceil(submissions.length / PER_PAGE));
  const start = (page - 1) * PER_PAGE;
  const paginated = submissions.slice(start, start + PER_PAGE);

  async function toggleFollowup(id: number, completed: boolean) {
    if (!token) return;
    setSavingId(id);
    setError('');
    try {
      const res = await authenticatedFetch(
        apiUrl(`/api/sponsorship-discovery-submissions/admin/${id}/followup`),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed }),
        },
        token
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || 'Failed to update follow-up status');
        return;
      }
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, followup_completed_at: (data as { followup_completed_at?: string }).followup_completed_at ?? null } : s
        )
      );
    } catch {
      setError('Could not connect to server');
    } finally {
      setSavingId(null);
    }
  }

  const needsFollowupCount = submissions.filter((s) => !s.followup_completed_at).length;

  return (
    <div className="min-h-screen bg-forest px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <Link
            to="/admin/sponsorship"
            className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sponsorship
          </Link>
        </div>

        <h1 className="text-offwhite font-editorial font-bold text-2xl mb-2">Sponsor discovery submissions</h1>
        <p className="text-offwhite/60 text-sm mb-6">
          Responses from the discovery questions on the Sponsorship page. Mark follow-up as complete after you have
          contacted the sponsor.
        </p>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-6">
          <span className="text-offwhite/60 text-sm">Filter</span>
          <button
            type="button"
            onClick={() => {
              setFilter('all');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors w-fit ${
              filter === 'all' ? 'bg-lime text-forest' : 'bg-offwhite/10 text-offwhite/80 hover:bg-offwhite/20'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter('needs-followup');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors w-fit ${
              filter === 'needs-followup'
                ? 'bg-lime text-forest'
                : 'bg-offwhite/10 text-offwhite/80 hover:bg-offwhite/20'
            }`}
          >
            Needs follow-up ({needsFollowupCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter('completed');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors w-fit ${
              filter === 'completed'
                ? 'bg-lime text-forest'
                : 'bg-offwhite/10 text-offwhite/80 hover:bg-offwhite/20'
            }`}
          >
            Follow-up completed
          </button>
        </div>

        {loading ? (
          <p className="text-offwhite/60">Loading…</p>
        ) : submissions.length === 0 ? (
          <p className="text-offwhite/60">No submissions yet.</p>
        ) : (
          <>
            <div className="space-y-6">
              {paginated.map((s) => {
                const dueLabel = formatDateTime(s.followup_due_at);
                const createdLabel = formatDateTime(s.created_at);
                const completedLabel = formatDateTime(s.followup_completed_at);
                const overdue =
                  !s.followup_completed_at && new Date(s.followup_due_at).getTime() < Date.now();

                return (
                  <article
                    key={s.id}
                    className={`border rounded text-offwhite p-4 sm:p-5 min-w-0 overflow-hidden ${
                      s.followup_completed_at
                        ? 'border-offwhite/15 bg-offwhite/5'
                        : overdue
                          ? 'border-red-400/60 bg-red-500/10'
                          : 'border-lime/40 bg-offwhite/10'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-lime leading-snug break-words">
                          {s.business_name || '—'}
                        </h2>
                        <p className="text-offwhite/80 text-sm mt-1 break-words">{s.sponsor_name || '—'}</p>
                        <time className="text-offwhite/50 text-xs mt-1 block">
                          Submitted {createdLabel}
                        </time>
                        <time className="text-offwhite/50 text-xs block">
                          Follow-up due {dueLabel}
                        </time>
                        {s.followup_email_sent_at && (
                          <time className="text-offwhite/40 text-xs block">
                            Reminder email sent {formatDateTime(s.followup_email_sent_at)}
                          </time>
                        )}
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {s.followup_completed_at ? (
                          <button
                            type="button"
                            onClick={() => toggleFollowup(s.id, false)}
                            disabled={savingId === s.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-offwhite/30 text-offwhite hover:border-lime hover:text-lime disabled:opacity-50"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Reopen follow-up
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleFollowup(s.id, true)}
                            disabled={savingId === s.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-lime text-forest hover:bg-lime/90 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark follow-up complete
                          </button>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                            s.followup_completed_at
                              ? 'bg-lime/20 text-lime'
                              : overdue
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-amber-400/20 text-amber-200'
                          }`}
                        >
                          {s.followup_completed_at ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Done {completedLabel}
                            </>
                          ) : overdue ? (
                            <>
                              <Clock3 className="w-3 h-3" />
                              Overdue
                            </>
                          ) : (
                            <>
                              <Clock3 className="w-3 h-3" />
                              Needs follow-up
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <dl className="text-sm space-y-2 mb-3">
                      <div className="flex flex-wrap gap-x-2 gap-y-1">
                        <span className="text-offwhite/50">Email</span>
                        {s.email && s.email !== '—' ? (
                          <a
                            href={`mailto:${s.email}`}
                            className="text-lime hover:underline break-all"
                          >
                            {s.email}
                          </a>
                        ) : (
                          <span className="text-offwhite/60">—</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-2 gap-y-1">
                        <span className="text-offwhite/50">Phone</span>
                        {s.phone && s.phone !== '—' ? (
                          <a
                            href={`tel:${s.phone}`}
                            className="text-offwhite hover:underline break-all"
                          >
                            {s.phone}
                          </a>
                        ) : (
                          <span className="text-offwhite/60">—</span>
                        )}
                      </div>
                    </dl>

                    {(s.message && s.message !== '—') && (
                      <div className="mt-3 pt-3 border-t border-offwhite/15">
                        <span className="text-offwhite/60 text-sm block mb-1">Message</span>
                        <p className="text-offwhite whitespace-pre-wrap break-words text-sm">
                          {s.message}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-offwhite/15">
                      <h3 className="text-offwhite text-sm font-semibold mb-2">
                        Discovery questions &amp; answers
                      </h3>
                      {(!s.answers || s.answers.length === 0) ? (
                        <p className="text-offwhite/60 text-sm">No answers stored.</p>
                      ) : (
                        <ol className="space-y-2 text-sm">
                          {s.answers.map((a, idx) => (
                            <li key={`${a.questionId}-${idx}`} className="min-w-0">
                              <p className="text-offwhite/70 font-medium break-words">
                                {idx + 1}. {a.questionText}
                              </p>
                              <p className="text-offwhite break-words whitespace-pre-wrap mt-0.5">
                                {a.answer}
                              </p>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </article>
                );
              })}
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

