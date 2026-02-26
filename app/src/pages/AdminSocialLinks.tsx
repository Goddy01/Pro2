import { useState, useEffect, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl, authenticatedFetch } from '../lib/api';
import { ArrowLeft } from 'lucide-react';
import '../App.css';

const inputClass = 'w-full px-4 py-3 bg-offwhite/5 border border-offwhite/20 text-offwhite placeholder:text-offwhite/40 focus:outline-none focus:border-lime rounded';
const labelClass = 'text-offwhite text-sm font-medium mb-2 block';

type SocialLinks = { x: string; instagram: string; tiktok: string; youtube: string };

export default function AdminSocialLinks() {
  const { token, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<SocialLinks>({ x: '', instagram: '', tiktok: '', youtube: '' });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    authenticatedFetch(apiUrl('/api/social-links/admin'), {}, token)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setForm({
            x: data.x ?? '',
            instagram: data.instagram ?? '',
            tiktok: data.tiktok ?? '',
            youtube: data.youtube ?? '',
          });
        }
      })
      .catch(() => { if (!cancelled) setError('Could not load social links'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!token) return;
    try {
      const res = await authenticatedFetch(apiUrl('/api/social-links/admin'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x: form.x.trim() || null,
          instagram: form.instagram.trim() || null,
          tiktok: form.tiktok.trim() || null,
          youtube: form.youtube.trim() || null,
        }),
      }, token);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || 'Failed to save');
        return;
      }
      setSuccess('Social links updated. They appear in the site footer.');
      setForm({
        x: data.x ?? '',
        instagram: data.instagram ?? '',
        tiktok: data.tiktok ?? '',
        youtube: data.youtube ?? '',
      });
    } catch {
      setError('Could not connect to server');
    }
  }

  if (!isAuthenticated) return <Navigate to="/superuser" replace />;

  return (
    <div className="min-h-screen bg-forest px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link to="/admin" className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
        </div>
        <h1 className="text-offwhite font-editorial font-bold text-2xl mb-2">Site social links</h1>
        <p className="text-offwhite/60 text-sm mb-6">
          Update the social media links shown in the website footer. Leave a field empty to hide that icon on the site.
        </p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        {success && <p className="text-lime text-sm mb-4">{success}</p>}

        {loading ? (
          <p className="text-offwhite/60">Loading…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className={labelClass}>X (Twitter)</span>
              <input
                type="url"
                value={form.x}
                onChange={(e) => setForm((p) => ({ ...p, x: e.target.value }))}
                className={inputClass}
                placeholder="https://x.com/username"
              />
            </label>
            <label className="block">
              <span className={labelClass}>Instagram</span>
              <input
                type="url"
                value={form.instagram}
                onChange={(e) => setForm((p) => ({ ...p, instagram: e.target.value }))}
                className={inputClass}
                placeholder="https://www.instagram.com/username"
              />
            </label>
            <label className="block">
              <span className={labelClass}>TikTok</span>
              <input
                type="url"
                value={form.tiktok}
                onChange={(e) => setForm((p) => ({ ...p, tiktok: e.target.value }))}
                className={inputClass}
                placeholder="https://www.tiktok.com/@username"
              />
            </label>
            <label className="block">
              <span className={labelClass}>YouTube</span>
              <input
                type="url"
                value={form.youtube}
                onChange={(e) => setForm((p) => ({ ...p, youtube: e.target.value }))}
                className={inputClass}
                placeholder="https://www.youtube.com/@channel"
              />
            </label>
            <button type="submit" className="px-4 py-2 bg-lime text-forest font-medium text-sm hover:bg-lime/90">
              Save social links
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
