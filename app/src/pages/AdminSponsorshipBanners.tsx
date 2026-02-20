import { useState, useEffect, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../lib/api';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import '../App.css';

type Banner = {
  id: number;
  sponsorName: string;
  imageUrl: string | null;
  linkUrl: string | null;
  showUntil: string | null;
  enabled: boolean;
  sortOrder: number;
};

const inputClass = 'w-full px-4 py-3 bg-offwhite/5 border border-offwhite/20 text-offwhite placeholder:text-offwhite/40 focus:outline-none focus:border-lime rounded';
const labelClass = 'text-offwhite text-sm font-medium mb-2 block';

const DURATION_OPTIONS = [
  { value: '', label: 'No end date' },
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
];

function formatShowUntil(s: string | null) {
  if (!s) return 'No end date';
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
  } catch {
    return s ?? '—';
  }
}

export default function AdminSponsorshipBanners() {
  const { token, isAuthenticated } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formSponsorName, setFormSponsorName] = useState('');
  const [formDurationDays, setFormDurationDays] = useState('');
  const [formLinkUrl, setFormLinkUrl] = useState('');
  const [formEnabled, setFormEnabled] = useState(false);
  const [formImage, setFormImage] = useState<File | null>(null);

  function fetchBanners() {
    if (!token) return;
    setError('');
    fetch(apiUrl('/api/sponsorship/admin/banners'), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error || res.statusText);
        }
        return res.json();
      })
      .then((data) => setBanners(Array.isArray(data) ? data : []))
      .catch((err) => setError(err?.message || 'Failed to load banners'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchBanners();
  }, [token]);

  function clearMessages() {
    setError('');
    setSuccess('');
  }

  function openAdd() {
    clearMessages();
    setEditingId(null);
    setFormSponsorName('');
    setFormDurationDays('');
    setFormLinkUrl('');
    setFormEnabled(false);
    setFormImage(null);
    setAdding(true);
  }

  function openEdit(b: Banner) {
    clearMessages();
    setAdding(false);
    setEditingId(b.id);
    setFormSponsorName(b.sponsorName);
    setFormDurationDays('');
    setFormLinkUrl(b.linkUrl || '');
    setFormEnabled(b.enabled);
    setFormImage(null);
  }

  function cancelForm() {
    setAdding(false);
    setEditingId(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearMessages();
    if (!formSponsorName.trim()) {
      setError('Sponsor name is required');
      return;
    }
    if (editingId === null && !formImage) {
      setError('Please upload a banner image for new entries.');
      return;
    }
    try {
      const form = new FormData();
      form.append('sponsor_name', formSponsorName.trim());
      form.append('duration_days', formDurationDays || '0');
      form.append('link_url', formLinkUrl.trim());
      form.append('enabled', String(formEnabled));
      if (formImage) form.append('image', formImage);

      if (editingId !== null) {
        const res = await fetch(apiUrl(`/api/sponsorship/admin/banners/${editingId}`), {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError((data as { error?: string }).error || 'Failed to update banner');
          return;
        }
        setSuccess('Banner updated.');
        setBanners((prev) => prev.map((b) => (b.id === editingId ? { ...b, ...data } : b)));
      } else {
        const res = await fetch(apiUrl('/api/sponsorship/admin/banners'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError((data as { error?: string }).error || 'Failed to add banner');
          return;
        }
        setSuccess('Banner added.');
        setBanners((prev) => [...prev, data]);
      }
      cancelForm();
      setFormImage(null);
      fetchBanners();
    } catch {
      setError('Could not connect to server');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this sponsor banner?')) return;
    clearMessages();
    try {
      const res = await fetch(apiUrl(`/api/sponsorship/admin/banners/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || 'Failed to delete');
        return;
      }
      setSuccess('Banner deleted.');
      setBanners((prev) => prev.filter((b) => b.id !== id));
      if (editingId === id) cancelForm();
    } catch {
      setError('Could not connect to server');
    }
  }

  if (!isAuthenticated) return <Navigate to="/superuser" replace />;

  return (
    <div className="min-h-screen bg-forest px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link to="/admin/sponsorship" className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Sponsorship
          </Link>
        </div>
        <h1 className="text-offwhite font-editorial font-bold text-2xl mb-2">Sponsor banners</h1>
        <p className="text-offwhite/60 text-sm mb-6">
          Manage company banners shown at the top of the site. Add, edit, or remove sponsor banners.
        </p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        {success && <p className="text-lime text-sm mb-4">{success}</p>}

        {loading ? (
          <p className="text-offwhite/60">Loading…</p>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className="border border-offwhite/15 rounded-lg bg-offwhite/5 overflow-hidden"
                >
                  {editingId === b.id ? (
                    <form onSubmit={handleSubmit} className="p-4 space-y-3">
                      <label className="block">
                        <span className={labelClass}>Sponsor name</span>
                        <input
                          type="text"
                          value={formSponsorName}
                          onChange={(e) => setFormSponsorName(e.target.value)}
                          className={inputClass}
                          required
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>Show for (from now)</span>
                        <select value={formDurationDays} onChange={(e) => setFormDurationDays(e.target.value)} className={inputClass}>
                          {DURATION_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <p className="text-offwhite/40 text-xs mt-1">Leave &quot;No end date&quot; to keep current end date.</p>
                      </label>
                      <label className="block">
                        <span className={labelClass}>Banner image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFormImage(e.target.files?.[0] ?? null)}
                          className={`${inputClass} file:mr-4 file:py-2 file:px-4 file:bg-lime file:text-forest file:border-0`}
                        />
                        <p className="text-offwhite/40 text-xs mt-1">Leave empty to keep current image.</p>
                      </label>
                      <label className="block">
                        <span className={labelClass}>Link URL (optional)</span>
                        <input type="url" value={formLinkUrl} onChange={(e) => setFormLinkUrl(e.target.value)} className={inputClass} placeholder="https://..." />
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" checked={formEnabled} onChange={(e) => setFormEnabled(e.target.checked)} className="w-4 h-4 accent-lime" />
                        <span className="text-offwhite text-sm">Show on site</span>
                      </label>
                      <div className="flex gap-2">
                        <button type="submit" className="px-4 py-2 bg-lime text-forest font-medium text-sm hover:bg-lime/90">Save</button>
                        <button type="button" onClick={cancelForm} className="px-4 py-2 border border-offwhite/30 text-offwhite text-sm">Cancel</button>
                        <button type="button" onClick={() => handleDelete(b.id)} className="px-4 py-2 text-red-400 border border-red-400/50 text-sm hover:bg-red-400/10">Delete</button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center gap-4 p-4">
                      {b.imageUrl ? (
                        <img src={b.imageUrl} alt={b.sponsorName} className="w-24 h-16 object-cover rounded border border-offwhite/20 shrink-0" />
                      ) : (
                        <div className="w-24 h-16 rounded border border-offwhite/20 bg-offwhite/10 flex items-center justify-center text-offwhite/40 text-xs shrink-0">No image</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-offwhite font-medium truncate">{b.sponsorName}</p>
                        <p className="text-offwhite/50 text-sm">Shows until: {formatShowUntil(b.showUntil)}</p>
                        <p className="text-offwhite/40 text-xs">{b.enabled ? 'Visible on site' : 'Hidden'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => openEdit(b)} className="p-2 text-offwhite/70 hover:text-lime transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => handleDelete(b.id)} className="p-2 text-offwhite/70 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {adding ? (
              <form onSubmit={handleSubmit} className="border border-offwhite/15 rounded-lg p-4 space-y-3 mb-8">
                <h3 className="text-offwhite font-medium">New sponsor banner</h3>
                <label className="block">
                  <span className={labelClass}>Sponsor name</span>
                  <input type="text" value={formSponsorName} onChange={(e) => setFormSponsorName(e.target.value)} className={inputClass} required />
                </label>
                <label className="block">
                  <span className={labelClass}>Show for</span>
                  <select value={formDurationDays} onChange={(e) => setFormDurationDays(e.target.value)} className={inputClass}>
                    {DURATION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass}>Banner image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormImage(e.target.files?.[0] ?? null)}
                    className={`${inputClass} file:mr-4 file:py-2 file:px-4 file:bg-lime file:text-forest file:border-0`}
                    required
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Link URL (optional)</span>
                  <input type="url" value={formLinkUrl} onChange={(e) => setFormLinkUrl(e.target.value)} className={inputClass} placeholder="https://..." />
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={formEnabled} onChange={(e) => setFormEnabled(e.target.checked)} className="w-4 h-4 accent-lime" />
                  <span className="text-offwhite text-sm">Show on site</span>
                </label>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-lime text-forest font-medium text-sm hover:bg-lime/90">Add banner</button>
                  <button type="button" onClick={cancelForm} className="px-4 py-2 border border-offwhite/30 text-offwhite text-sm">Cancel</button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={openAdd}
                className="inline-flex items-center gap-2 px-4 py-2 border border-offwhite/20 text-offwhite hover:border-lime hover:text-lime text-sm"
              >
                <Plus className="w-4 h-4" />
                Add sponsor banner
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
