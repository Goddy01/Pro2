import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiUrl, authenticatedFetch } from '../lib/api';
import '../App.css';

const QUESTION_TYPES = ['short_text', 'long_text', 'dropdown'] as const;
const ROLES = [
  { value: '', label: 'None' },
  { value: 'email', label: 'Email' },
  { value: 'name', label: 'Name' },
  { value: 'business_name', label: 'Business name' },
  { value: 'phone', label: 'Phone' },
  { value: 'message', label: 'Message' },
] as const;

type Question = {
  id: number;
  question_text: string;
  position: number;
  is_required: boolean;
  is_active: boolean;
  question_type?: string;
  options?: string[] | null;
  role?: string | null;
  created_at?: string;
  updated_at?: string;
};

const inputClass =
  'w-full px-4 py-3 bg-offwhite/5 border border-offwhite/20 text-offwhite placeholder:text-offwhite/40 focus:outline-none focus:border-lime rounded';
const labelClass = 'text-offwhite text-sm font-medium mb-2 block';

export default function AdminSponsorshipDiscoveryQuestions() {
  const { token, isAuthenticated } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newText, setNewText] = useState('');
  const [newRequired, setNewRequired] = useState(true);
  const [newType, setNewType] = useState<typeof QUESTION_TYPES[number]>('short_text');
  const [newOptions, setNewOptions] = useState<string[]>(['']);
  const [newRole, setNewRole] = useState('');
  const [savingId, setSavingId] = useState<number | 'new' | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    authenticatedFetch(apiUrl('/api/sponsorship-discovery-questions/admin'), {}, token)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error || 'Failed to load questions');
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setQuestions(Array.isArray(data) ? data : []);
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

  function clearMessages() {
    setError('');
    setSuccess('');
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    const text = newText.trim();
    if (!text) {
      setError('Question text is required');
      return;
    }
    if (newType === 'dropdown') {
      const opts = newOptions.map((o) => o.trim()).filter(Boolean);
      if (opts.length === 0) {
        setError('Dropdown questions must have at least one option');
        return;
      }
    }
    clearMessages();
    setSavingId('new');
    try {
      const position = questions.length ? Math.max(...questions.map((q) => q.position || 0)) + 1 : 0;
      const payload: Record<string, unknown> = {
        question_text: text,
        is_required: newRequired,
        position,
        question_type: newType,
        role: newRole && ROLES.some((r) => r.value === newRole) ? newRole : null,
      };
      if (newType === 'dropdown') {
        payload.options = newOptions.map((o) => o.trim()).filter(Boolean);
      }
      const res = await authenticatedFetch(
        apiUrl('/api/sponsorship-discovery-questions/admin'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        token
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || 'Failed to add question');
        return;
      }
      setQuestions((prev) => [...prev, data as Question].sort((a, b) => a.position - b.position || a.id - b.id));
      setNewText('');
      setNewRequired(true);
      setNewType('short_text');
      setNewOptions(['']);
      setNewRole('');
      setSuccess('Question added.');
    } catch {
      setError('Could not connect to server');
    } finally {
      setSavingId(null);
    }
  }

  async function updateQuestion(id: number, patch: Partial<Question>) {
    if (!token) return;
    clearMessages();
    setSavingId(id);
    try {
      const res = await authenticatedFetch(
        apiUrl(`/api/sponsorship-discovery-questions/admin/${id}`),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        },
        token
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || 'Failed to save changes');
        return;
      }
      setQuestions((prev) =>
        prev
          .map((q) => (q.id === id ? ({ ...q, ...(data as Question) } as Question) : q))
          .sort((a, b) => a.position - b.position || a.id - b.id)
      );
      setSuccess('Saved.');
    } catch {
      setError('Could not connect to server');
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!token || !window.confirm('Remove this question? This cannot be undone.')) return;
    clearMessages();
    setSavingId(id);
    try {
      const res = await authenticatedFetch(
        apiUrl(`/api/sponsorship-discovery-questions/admin/${id}`),
        { method: 'DELETE' },
        token
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || 'Failed to delete question');
        return;
      }
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setSuccess('Question removed.');
    } catch {
      setError('Could not connect to server');
    } finally {
      setSavingId(null);
    }
  }

  function moveQuestion(id: number, direction: 'up' | 'down') {
    setQuestions((prev) => {
      const index = prev.findIndex((q) => q.id === id);
      if (index === -1) return prev;
      const swapWith = direction === 'up' ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= prev.length) return prev;
      const copy = [...prev];
      const tmp = copy[index];
      copy[index] = copy[swapWith];
      copy[swapWith] = tmp;
      // Re-normalize positions locally; we will persist on next change
      return copy.map((q, i) => ({ ...q, position: i }));
    });
  }

  async function persistOrder() {
    if (!token) return;
    clearMessages();
    try {
      await Promise.all(
        questions.map((q, idx) =>
          authenticatedFetch(
            apiUrl(`/api/sponsorship-discovery-questions/admin/${q.id}`),
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ position: idx }),
            },
            token
          )
        )
      );
      setSuccess('Order saved.');
    } catch {
      setError('Could not connect to server');
    }
  }

  return (
    <div className="min-h-screen bg-forest px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <Link
            to="/admin/sponsorship"
            className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sponsorship
          </Link>
        </div>

        <h1 className="text-offwhite font-editorial font-bold text-2xl mb-2">Sponsor discovery questions</h1>
        <p className="text-offwhite/60 text-sm mb-6">
          These questions appear on the Sponsorship page. Sponsors will answer them along with their contact
          information.
        </p>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        {success && <p className="text-lime text-sm mb-4">{success}</p>}

        {loading ? (
          <p className="text-offwhite/60">Loading…</p>
        ) : (
          <>
            <section className="mb-10 space-y-3">
              {questions.length === 0 ? (
                <p className="text-offwhite/60 text-sm">No questions yet. Add your first one below.</p>
              ) : (
                <>
                  <p className="text-offwhite/60 text-sm mb-2">
                    Drag order with the arrows. Required questions are marked with * and must be answered before
                    submission.
                  </p>
                  <ul className="space-y-3">
                    {questions.map((q, idx) => (
                      <li
                        key={q.id}
                        className="flex items-start gap-3 border border-offwhite/20 bg-offwhite/5 rounded px-3 py-2"
                      >
                        <div className="flex flex-col items-center gap-1 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              moveQuestion(q.id, 'up');
                            }}
                            disabled={idx === 0}
                            className="p-1 text-offwhite/50 hover:text-lime disabled:opacity-30"
                            aria-label="Move up"
                          >
                            ▲
                          </button>
                          <GripVertical className="w-4 h-4 text-offwhite/30" />
                          <button
                            type="button"
                            onClick={() => {
                              moveQuestion(q.id, 'down');
                            }}
                            disabled={idx === questions.length - 1}
                            className="p-1 text-offwhite/50 hover:text-lime disabled:opacity-30"
                            aria-label="Move down"
                          >
                            ▼
                          </button>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start gap-2">
                            <span className="text-offwhite/50 text-xs mt-1">Q{idx + 1}</span>
                            <textarea
                              value={q.question_text}
                              onChange={(e) =>
                                setQuestions((prev) =>
                                  prev.map((qq) =>
                                    qq.id === q.id ? { ...qq, question_text: e.target.value } : qq
                                  )
                                )
                              }
                              onBlur={() =>
                                q.question_text.trim() &&
                                updateQuestion(q.id, { question_text: q.question_text.trim() })
                              }
                              rows={2}
                              className={`${inputClass} text-sm`}
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-3 pl-7 mt-2">
                            <label className="block text-xs text-offwhite/70">
                              Type
                              <select
                                value={q.question_type || 'short_text'}
                                onChange={(e) => {
                                  const value = e.target.value as typeof QUESTION_TYPES[number];
                                  setQuestions((prev) =>
                                    prev.map((qq) =>
                                      qq.id === q.id
                                        ? { ...qq, question_type: value, options: value === 'dropdown' ? qq.options || [''] : null }
                                        : qq
                                    )
                                  );
                                  updateQuestion(q.id, {
                                    question_type: value,
                                    options: value === 'dropdown' ? (q.options && q.options.length ? q.options : ['Option 1']) : null,
                                  });
                                }}
                                className="ml-1 mt-0.5 px-2 py-1 bg-offwhite/10 border border-offwhite/20 text-offwhite text-xs rounded"
                              >
                                <option value="short_text">Short text</option>
                                <option value="long_text">Long text</option>
                                <option value="dropdown">Dropdown</option>
                              </select>
                            </label>
                            {(q.question_type || 'short_text') === 'dropdown' && (
                              <div className="w-full pl-7 mt-1 space-y-1">
                                <span className="text-xs text-offwhite/60 block">Options</span>
                                {(Array.isArray(q.options) ? q.options : ['']).map((opt, oi) => (
                                  <div key={oi} className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) =>
                                        setQuestions((prev) =>
                                          prev.map((qq) => {
                                            if (qq.id !== q.id) return qq;
                                            const opts = Array.isArray(qq.options) ? [...qq.options] : [''];
                                            opts[oi] = e.target.value;
                                            return { ...qq, options: opts };
                                          })
                                        )
                                      }
                                      onBlur={() => {
                                        const opts = (Array.isArray(q.options) ? q.options : ['']).map((o) => o.trim()).filter(Boolean);
                                        if (opts.length) updateQuestion(q.id, { options: opts });
                                      }}
                                      className={`${inputClass} text-sm py-1.5 flex-1 max-w-xs`}
                                      placeholder={`Option ${oi + 1}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const opts = (Array.isArray(q.options) ? q.options : ['']).filter((_, i) => i !== oi);
                                        setQuestions((prev) =>
                                          prev.map((qq) => (qq.id === q.id ? { ...qq, options: opts.length ? opts : [''] } : qq))
                                        );
                                        updateQuestion(q.id, { options: opts.length ? opts : ['Option 1'] });
                                      }}
                                      className="text-offwhite/60 hover:text-red-400 text-xs"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const opts = [...(Array.isArray(q.options) ? q.options : ['']), ''];
                                    setQuestions((prev) =>
                                      prev.map((qq) => (qq.id === q.id ? { ...qq, options: opts } : qq))
                                    );
                                  }}
                                  className="text-xs text-lime hover:underline"
                                >
                                  + Add option
                                </button>
                              </div>
                            )}
                            <label className="block text-xs text-offwhite/70">
                              Role
                              <select
                                value={q.role || ''}
                                onChange={(e) => {
                                  const value = e.target.value || null;
                                  setQuestions((prev) =>
                                    prev.map((qq) => (qq.id === q.id ? { ...qq, role: value } : qq))
                                  );
                                  updateQuestion(q.id, { role: value || null });
                                }}
                                className="ml-1 mt-0.5 px-2 py-1 bg-offwhite/10 border border-offwhite/20 text-offwhite text-xs rounded"
                                title="Email is used to send the submitter a thank-you and is required for submissions."
                              >
                                {ROLES.map((r) => (
                                  <option key={r.value || 'none'} value={r.value}>
                                    {r.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="flex items-center gap-2 text-xs text-offwhite/80">
                              <input
                                type="checkbox"
                                checked={q.is_required}
                                onChange={(e) => {
                                  const value = e.target.checked;
                                  setQuestions((prev) =>
                                    prev.map((qq) =>
                                      qq.id === q.id ? { ...qq, is_required: value } : qq
                                    )
                                  );
                                  updateQuestion(q.id, { is_required: value });
                                }}
                                className="w-4 h-4 accent-lime"
                              />
                              <span>Required *</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs text-offwhite/80">
                              <input
                                type="checkbox"
                                checked={q.is_active}
                                onChange={(e) => {
                                  const value = e.target.checked;
                                  setQuestions((prev) =>
                                    prev.map((qq) =>
                                      qq.id === q.id ? { ...qq, is_active: value } : qq
                                    )
                                  );
                                  updateQuestion(q.id, { is_active: value });
                                }}
                                className="w-4 h-4 accent-lime"
                              />
                              <span>Show on site</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleDelete(q.id)}
                              disabled={savingId === q.id}
                              className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-offwhite/70 hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={persistOrder}
                    className="mt-3 inline-flex items-center gap-2 px-3 py-2 border border-offwhite/20 text-offwhite text-xs hover:border-lime hover:text-lime"
                  >
                    Save order
                  </button>
                </>
              )}
            </section>

            <section>
              <h2 className="text-offwhite font-semibold text-lg mb-3">Add new question</h2>
              <form onSubmit={handleAdd} className="space-y-3 border border-offwhite/20 bg-offwhite/5 rounded p-4">
                <label className="block">
                  <span className={labelClass}>Question text</span>
                  <textarea
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    rows={2}
                    className={inputClass}
                    placeholder="e.g. What are your primary goals for partnering with Sideline Sports & Entertainment?"
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Type</span>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as typeof QUESTION_TYPES[number])}
                    className={inputClass}
                  >
                    <option value="short_text">Short text</option>
                    <option value="long_text">Long text</option>
                    <option value="dropdown">Dropdown</option>
                  </select>
                </label>
                {newType === 'dropdown' && (
                  <label className="block">
                    <span className={labelClass}>Options (one per line or add rows)</span>
                    <div className="space-y-2">
                      {newOptions.map((opt, oi) => (
                        <div key={oi} className="flex gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const next = [...newOptions];
                              next[oi] = e.target.value;
                              setNewOptions(next);
                            }}
                            className={inputClass}
                            placeholder={`Option ${oi + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => setNewOptions((prev) => prev.filter((_, i) => i !== oi))}
                            className="px-2 text-offwhite/60 hover:text-red-400 shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setNewOptions((prev) => [...prev, ''])}
                        className="text-sm text-lime hover:underline"
                      >
                        + Add option
                      </button>
                    </div>
                  </label>
                )}
                <label className="block">
                  <span className={labelClass}>Role (optional)</span>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className={inputClass}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value || 'none'} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-offwhite/50 text-xs mt-1">
                    Email is used to send the submitter a thank-you and is required for submissions.
                  </p>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newRequired}
                    onChange={(e) => setNewRequired(e.target.checked)}
                    className="w-4 h-4 accent-lime"
                  />
                  <span className="text-offwhite text-sm">Required</span>
                </label>
                <button
                  type="submit"
                  disabled={savingId === 'new'}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-lime text-forest font-medium text-sm hover:bg-lime/90 disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  Add question
                </button>
              </form>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

