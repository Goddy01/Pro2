import { useState, useEffect, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../lib/api';
import { ArrowLeft, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import '../App.css';

type Benefit = { id: number; text: string; sortOrder: number };
type Tier = {
  id: number;
  slug: string;
  name: string;
  price: number;
  tagline: string;
  accent: string;
  sortOrder: number;
  benefits: Benefit[];
};

const inputClass = 'w-full px-4 py-3 bg-offwhite/5 border border-offwhite/20 text-offwhite placeholder:text-offwhite/40 focus:outline-none focus:border-lime rounded';
const labelClass = 'text-offwhite text-sm font-medium mb-2 block';

const ACCENT_OPTIONS = [
  { value: 'from-lime/40 via-lime/20 to-transparent', label: 'Lime' },
  { value: 'from-amber-400/30 via-amber-400/10 to-transparent', label: 'Gold' },
  { value: 'from-offwhite/20 via-offwhite/5 to-transparent', label: 'Silver' },
  { value: 'from-amber-700/30 via-amber-700/10 to-transparent', label: 'Bronze' },
];

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function AdminSponsorship() {
  const { token, isAuthenticated } = useAuth();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedTierId, setExpandedTierId] = useState<number | null>(null);
  const [editingTierId, setEditingTierId] = useState<number | null>(null);
  const [editingBenefitId, setEditingBenefitId] = useState<number | null>(null);
  const [newTierForm, setNewTierForm] = useState(false);
  const [newBenefitTierId, setNewBenefitTierId] = useState<number | null>(null);

  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formAccent, setFormAccent] = useState(ACCENT_OPTIONS[0].value);
  const [formBenefits, setFormBenefits] = useState<string[]>(['']);
  const [formBenefitText, setFormBenefitText] = useState('');

  function fetchData() {
    if (!token) return;
    setError('');
    fetch(apiUrl('/api/sponsorship/admin/tiers'), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (tiersRes) => {
        if (!tiersRes.ok) {
          const msg = (await tiersRes.json().catch(() => ({})) as { error?: string }).error || tiersRes.statusText;
          throw new Error(msg || `Tiers: ${tiersRes.status}`);
        }
        const tiersData = await tiersRes.json();
        setTiers(Array.isArray(tiersData) ? tiersData : []);
      })
      .catch((err) => {
        const message = err?.message || '';
        if (message.includes('401') || message.toLowerCase().includes('unauthorized')) {
          setError('Session expired or not logged in. Go to Admin and sign in again.');
        } else if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
          setError('Could not reach the server. Is the backend running? Check VITE_API_URL if using a separate API.');
        } else {
          setError(message || 'Could not load sponsorship data.');
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchData();
  }, [token]);

  function clearMessages() {
    setError('');
    setSuccess('');
  }

  async function handleSaveTier(e: FormEvent) {
    e.preventDefault();
    clearMessages();
    if (!formName.trim()) {
      setError('Tier name is required');
      return;
    }
    const tierId = editingTierId;
    try {
      const body: Record<string, unknown> = {
        name: formName.trim(),
        price: parseInt(formPrice, 10) || 0,
        tagline: formTagline.trim() || null,
        accent: formAccent,
      };
      const url = tierId
        ? apiUrl(`/api/sponsorship/admin/tiers/${tierId}`)
        : apiUrl('/api/sponsorship/admin/tiers');
      const res = await fetch(url, {
        method: tierId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || 'Failed to save tier');
        return;
      }
      const savedId = tierId ?? (data as { id?: number }).id;
      const benefitTexts = formBenefits.map((s) => s.trim()).filter(Boolean);

      if (tierId && savedId) {
        const tier = tiers.find((t) => t.id === tierId);
        if (tier) {
          for (const b of tier.benefits) {
            await fetch(apiUrl(`/api/sponsorship/admin/benefits/${b.id}`), {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        }
      }

      if (savedId && benefitTexts.length > 0) {
        for (const text of benefitTexts) {
          await fetch(apiUrl(`/api/sponsorship/admin/tiers/${savedId}/benefits`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ benefit_text: text }),
          });
        }
      }

      setSuccess(tierId ? 'Tier updated.' : 'Tier added.');
      setEditingTierId(null);
      setNewTierForm(false);
      setFormName('');
      setFormPrice('');
      setFormTagline('');
      setFormAccent(ACCENT_OPTIONS[0].value);
      setFormBenefits(['']);
      fetchData();
    } catch {
      setError('Could not connect to server');
    }
  }

  async function handleDeleteTier(id: number) {
    if (!confirm('Delete this tier? All its benefits will be removed.')) return;
    try {
      const res = await fetch(apiUrl(`/api/sponsorship/admin/tiers/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || 'Failed to delete');
        return;
      }
      setSuccess('Tier deleted.');
      setTiers((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError('Could not connect to server');
    }
  }

  async function handleAddBenefit(e: FormEvent) {
    e.preventDefault();
    if (!newBenefitTierId || !formBenefitText.trim()) return;
    clearMessages();
    try {
      const res = await fetch(apiUrl(`/api/sponsorship/admin/tiers/${newBenefitTierId}/benefits`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ benefit_text: formBenefitText.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || 'Failed to add benefit');
        return;
      }
      setSuccess('Benefit added.');
      setFormBenefitText('');
      setNewBenefitTierId(null);
      fetchData();
    } catch {
      setError('Could not connect to server');
    }
  }

  async function handleUpdateBenefit(e: FormEvent) {
    e.preventDefault();
    if (!editingBenefitId || !formBenefitText.trim()) return;
    clearMessages();
    try {
      const res = await fetch(apiUrl(`/api/sponsorship/admin/benefits/${editingBenefitId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ benefit_text: formBenefitText.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || 'Failed to update benefit');
        return;
      }
      setSuccess('Benefit updated.');
      setEditingBenefitId(null);
      setFormBenefitText('');
      fetchData();
    } catch {
      setError('Could not connect to server');
    }
  }

  async function handleDeleteBenefit(id: number) {
    if (!confirm('Remove this benefit?')) return;
    try {
      const res = await fetch(apiUrl(`/api/sponsorship/admin/benefits/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || 'Failed to delete');
        return;
      }
      setSuccess('Benefit removed.');
      setTiers((prev) =>
        prev.map((t) => ({
          ...t,
          benefits: t.benefits.filter((b) => b.id !== id),
        }))
      );
      fetchData();
    } catch {
      setError('Could not connect to server');
    }
  }

  if (!isAuthenticated) return <Navigate to="/superuser" replace />;

  return (
    <div className="min-h-screen bg-forest px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <Link to="/admin" className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
          <div className="flex gap-4">
            <Link to="/admin/sponsorship-inquiries" className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm">
              Sponsorship inquiries
            </Link>
            <Link to="/admin/sponsorship-banners" className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm">
              Manage sponsor banners
            </Link>
          </div>
        </div>
        <h1 className="text-offwhite font-editorial font-bold text-2xl mb-2">Sponsorship Tiers &amp; Banner</h1>
        <p className="text-offwhite/60 text-sm mb-8">
          Manage sponsorship tiers and benefits. Sponsor banners are managed on the banner list page.
        </p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        {success && <p className="text-lime text-sm mb-4">{success}</p>}

        {loading ? (
          <p className="text-offwhite/60">Loading…</p>
        ) : (
          <>
            <section className="mb-12">
              <h2 className="text-offwhite font-semibold text-lg mb-4">Sponsorship Tiers</h2>
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="border border-offwhite/15 rounded mb-4 bg-offwhite/5 overflow-hidden"
                >
                  <div
                    className="flex items-center justify-between gap-4 p-4 cursor-pointer"
                    onClick={() => setExpandedTierId(expandedTierId === tier.id ? null : tier.id)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedTierId === tier.id ? (
                        <ChevronUp className="w-5 h-5 text-offwhite/60" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-offwhite/60" />
                      )}
                      <span className="text-offwhite font-medium">{tier.name}</span>
                      <span className="text-lime">{formatPrice(tier.price)}</span>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTierId(tier.id);
                          setFormName(tier.name);
                          setFormPrice(String(tier.price));
                          setFormTagline(tier.tagline || '');
                          setFormAccent(tier.accent || ACCENT_OPTIONS[0].value);
                          setFormBenefits(tier.benefits.length ? tier.benefits.map((b) => b.text) : ['']);
                          setExpandedTierId(tier.id);
                        }}
                        className="p-2 text-offwhite/70 hover:text-lime transition-colors"
                        title="Edit tier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTier(tier.id)}
                        className="p-2 text-offwhite/70 hover:text-red-400 transition-colors"
                        title="Delete tier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {expandedTierId === tier.id && (
                    <div className="px-4 pb-4 border-t border-offwhite/10 pt-4">
                      {editingTierId === tier.id ? (
                        <form onSubmit={handleSaveTier} className="space-y-3 mb-4">
                          <label className="block">
                            <span className={labelClass}>Tier name</span>
                            <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className={inputClass} placeholder="e.g. Platinum Sponsor" required />
                          </label>
                          <label className="block">
                            <span className={labelClass}>Price ($)</span>
                            <input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className={inputClass} min={0} step={1} />
                          </label>
                          <label className="block">
                            <span className={labelClass}>Tagline (optional)</span>
                            <input type="text" value={formTagline} onChange={(e) => setFormTagline(e.target.value)} className={inputClass} placeholder="Optional" />
                          </label>
                          <label className="block">
                            <span className={labelClass}>Accent color</span>
                            <select value={formAccent} onChange={(e) => setFormAccent(e.target.value)} className={inputClass}>
                              {ACCENT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </label>
                          <div>
                            <span className={labelClass}>Benefits</span>
                            <div className="space-y-2 mt-2">
                              {formBenefits.map((text, i) => (
                                <div key={i} className="flex gap-2">
                                  <input
                                    type="text"
                                    value={text}
                                    onChange={(e) => setFormBenefits((prev) => {
                                      const next = [...prev];
                                      next[i] = e.target.value;
                                      return next;
                                    })}
                                    className={inputClass}
                                    placeholder="Benefit description"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setFormBenefits((prev) => prev.filter((_, j) => j !== i))}
                                    className="p-2 text-offwhite/70 hover:text-red-400 shrink-0"
                                    title="Remove benefit"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => setFormBenefits((prev) => [...prev, ''])}
                                className="text-sm text-lime hover:underline flex items-center gap-1"
                              >
                                <Plus className="w-4 h-4" /> Add benefit
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button type="submit" className="px-4 py-2 bg-lime text-forest font-medium text-sm hover:bg-lime/90">
                              Save
                            </button>
                            <button type="button" onClick={() => setEditingTierId(null)} className="px-4 py-2 border border-offwhite/30 text-offwhite text-sm hover:border-lime">
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <p className="text-offwhite/60 text-sm mb-4">{tier.tagline || '—'}</p>
                          <h3 className="text-offwhite text-sm font-medium mb-2">Benefits</h3>
                          <ul className="space-y-2 mb-4">
                            {tier.benefits.map((b) =>
                              editingBenefitId === b.id ? (
                                <li key={b.id}>
                                  <form onSubmit={handleUpdateBenefit} className="flex gap-2">
                                    <input
                                      type="text"
                                      value={formBenefitText}
                                      onChange={(e) => setFormBenefitText(e.target.value)}
                                      className={inputClass}
                                      autoFocus
                                    />
                                    <button type="submit" className="px-3 py-1.5 bg-lime text-forest text-xs">Save</button>
                                    <button type="button" onClick={() => setEditingBenefitId(null)} className="px-3 py-1.5 border border-offwhite/30 text-offwhite text-xs">
                                      Cancel
                                    </button>
                                  </form>
                                </li>
                              ) : (
                                <li key={b.id} className="flex items-center justify-between gap-2 py-1">
                                  <span className="text-offwhite/85 text-sm">{b.text}</span>
                                  <div className="flex gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingBenefitId(b.id);
                                        setFormBenefitText(b.text);
                                      }}
                                      className="p-1.5 text-offwhite/60 hover:text-lime"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" onClick={() => handleDeleteBenefit(b.id)} className="p-1.5 text-offwhite/60 hover:text-red-400">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </li>
                              )
                            )}
                          </ul>
                          {newBenefitTierId === tier.id ? (
                            <form onSubmit={handleAddBenefit} className="flex gap-2">
                              <input
                                type="text"
                                value={formBenefitText}
                                onChange={(e) => setFormBenefitText(e.target.value)}
                                className={inputClass}
                                placeholder="New benefit..."
                                autoFocus
                              />
                              <button type="submit" className="px-3 py-1.5 bg-lime text-forest text-xs">Add</button>
                              <button type="button" onClick={() => setNewBenefitTierId(null)} className="px-3 py-1.5 border border-offwhite/30 text-offwhite text-xs">
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setNewBenefitTierId(tier.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-offwhite/80 border border-offwhite/20 hover:border-lime hover:text-lime"
                            >
                              <Plus className="w-4 h-4" />
                              Add benefit
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {newTierForm ? (
                <form onSubmit={handleSaveTier} className="border border-offwhite/15 rounded p-4 space-y-3">
                  <h3 className="text-offwhite font-medium">New tier</h3>
                  <label className="block">
                    <span className={labelClass}>Tier name</span>
                    <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className={inputClass} placeholder="e.g. Platinum Sponsor" required />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Price ($)</span>
                    <input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className={inputClass} min={0} step={1} />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Tagline (optional)</span>
                    <input type="text" value={formTagline} onChange={(e) => setFormTagline(e.target.value)} className={inputClass} placeholder="Optional" />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Accent color</span>
                    <select value={formAccent} onChange={(e) => setFormAccent(e.target.value)} className={inputClass}>
                      {ACCENT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </label>
                  <div>
                    <span className={labelClass}>Benefits</span>
                    <div className="space-y-2 mt-2">
                      {formBenefits.map((text, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            value={text}
                            onChange={(e) => setFormBenefits((prev) => {
                              const next = [...prev];
                              next[i] = e.target.value;
                              return next;
                            })}
                            className={inputClass}
                            placeholder="Benefit description"
                          />
                          <button
                            type="button"
                            onClick={() => setFormBenefits((prev) => prev.filter((_, j) => j !== i))}
                            className="p-2 text-offwhite/70 hover:text-red-400 shrink-0"
                            title="Remove benefit"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormBenefits((prev) => [...prev, ''])}
                        className="text-sm text-lime hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Add benefit
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-lime text-forest font-medium text-sm">Add tier</button>
                    <button type="button" onClick={() => setNewTierForm(false)} className="px-4 py-2 border border-offwhite/30 text-offwhite text-sm">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                  setFormName('');
                  setFormPrice('');
                  setFormTagline('');
                  setFormAccent(ACCENT_OPTIONS[0].value);
                  setFormBenefits(['']);
                  setNewTierForm(true);
                }}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-offwhite/20 text-offwhite hover:border-lime hover:text-lime text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add tier
                </button>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
