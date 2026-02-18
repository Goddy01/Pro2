import { useState, useEffect } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../lib/api';
import { ArrowLeft, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import '../App.css';

const PAGE_SIZE_CATEGORIES = 10;
const PAGE_SIZE_IMAGES = 12;
type Category = { id: number; name: string; slug: string; coverImageUrl: string | null };
type GalleryImage = { id: number; src: string; caption: string | null };

export default function AdminGalleryList() {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [categoryPage, setCategoryPage] = useState(1);
  const [imagePage, setImagePage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    Promise.all([
      fetch(apiUrl('/api/gallery/categories')).then((r) => r.json()),
      fetch(apiUrl('/api/gallery')).then((r) => r.json()),
    ])
      .then(([catData, imgData]) => {
        if (!cancelled) {
          setCategories(Array.isArray(catData) ? catData.map((c: Category) => ({ id: c.id, name: c.name, slug: c.slug, coverImageUrl: c.coverImageUrl ?? null })) : []);
          setImages(Array.isArray(imgData) ? imgData.map((g: { id: number; src: string; caption?: string }) => ({ id: g.id, src: g.src, caption: g.caption ?? null })) : []);
        }
      })
      .catch(() => { if (!cancelled) setError('Could not load gallery'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  const catTotalPages = Math.max(1, Math.ceil(categories.length / PAGE_SIZE_CATEGORIES));
  const catSafePage = Math.min(categoryPage, catTotalPages);
  const catStart = (catSafePage - 1) * PAGE_SIZE_CATEGORIES;
  const pageCategories = categories.slice(catStart, catStart + PAGE_SIZE_CATEGORIES);

  const imgTotalPages = Math.max(1, Math.ceil(images.length / PAGE_SIZE_IMAGES));
  const imgSafePage = Math.min(imagePage, imgTotalPages);
  const imgStart = (imgSafePage - 1) * PAGE_SIZE_IMAGES;
  const pageImages = images.slice(imgStart, imgStart + PAGE_SIZE_IMAGES);

  useEffect(() => {
    if (categoryPage > catTotalPages && catTotalPages >= 1) setCategoryPage(1);
  }, [categories.length, catTotalPages, categoryPage]);
  useEffect(() => {
    if (imagePage > imgTotalPages && imgTotalPages >= 1) setImagePage(1);
  }, [images.length, imgTotalPages, imagePage]);

  async function deleteCategory(id: number) {
    if (!confirm('Delete this category? Images in it will become uncategorized.')) return;
    try {
      const res = await fetch(apiUrl(`/api/gallery/categories/${id}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to delete');
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError('Could not connect to server');
    }
  }

  async function deleteImage(id: number) {
    if (!confirm('Remove this image from the gallery?')) return;
    try {
      const res = await fetch(apiUrl(`/api/gallery/${id}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to delete');
        return;
      }
      setImages((prev) => prev.filter((g) => g.id !== id));
    } catch {
      setError('Could not connect to server');
    }
  }

  if (!isAuthenticated) return <Navigate to="/superuser" replace />;

  return (
    <div className="min-h-screen bg-forest px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link to="/admin" className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
          <Link to="/admin" state={{ openTab: 'gallery' }} className="px-3 py-2 bg-lime text-forest text-sm font-medium hover:bg-lime/90 transition-colors">
            Add category / Upload images
          </Link>
        </div>
        <h1 className="text-offwhite font-editorial font-bold text-2xl mb-2">Gallery</h1>
        <p className="text-offwhite/60 text-sm mb-6">Manage categories and images.</p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        {loading ? (
          <p className="text-offwhite/60">Loading…</p>
        ) : (
          <>
            <section className="mb-10">
              <h2 className="text-offwhite font-semibold mb-3">Categories</h2>
              {categories.length === 0 ? (
                <p className="text-offwhite/50 text-sm">No categories yet. Add one from the <Link to="/admin" state={{ openTab: 'gallery' }} className="text-lime hover:underline">Admin dashboard</Link>.</p>
              ) : (
                <>
                <ul className="space-y-2">
                  {pageCategories.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-4 py-2 border-b border-offwhite/10">
                      <div className="flex items-center gap-3 min-w-0">
                        {c.coverImageUrl && <img src={c.coverImageUrl} alt="" className="w-12 h-12 object-cover border border-offwhite/20 shrink-0" />}
                        <span className="text-offwhite font-medium">{c.name}</span>
                        <span className="text-offwhite/50 text-sm">/{c.slug}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => navigate('/admin', { state: { openTab: 'gallery', editCategoryId: c.id } })} className="p-2 text-offwhite/70 hover:text-lime transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                        <button type="button" onClick={() => deleteCategory(c.id)} className="p-2 text-offwhite/70 hover:text-red-400 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </li>
                  ))}
                </ul>
                {categories.length > PAGE_SIZE_CATEGORIES && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-offwhite/10 pt-4">
                    <p className="text-offwhite/60 text-sm">Showing {catStart + 1}–{Math.min(catStart + PAGE_SIZE_CATEGORIES, categories.length)} of {categories.length}</p>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setCategoryPage((p) => Math.max(1, p - 1))} disabled={catSafePage <= 1} className="p-2 text-offwhite/70 hover:text-lime disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>
                      <span className="text-offwhite/80 text-sm min-w-[6rem] text-center">Page {catSafePage} of {catTotalPages}</span>
                      <button type="button" onClick={() => setCategoryPage((p) => Math.min(catTotalPages, p + 1))} disabled={catSafePage >= catTotalPages} className="p-2 text-offwhite/70 hover:text-lime disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Next page"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
                </>
              )}
            </section>
            <section>
              <h2 className="text-offwhite font-semibold mb-3">Images</h2>
              {images.length === 0 ? (
                <p className="text-offwhite/50 text-sm">No images yet. <Link to="/admin" state={{ openTab: 'gallery' }} className="text-lime hover:underline">Upload from Admin</Link>.</p>
              ) : (
                <>
                <ul className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {pageImages.map((g) => (
                    <li key={g.id} className="relative group">
                      <img src={g.src} alt="" className="w-full aspect-square object-cover border border-offwhite/20" />
                      <p className="text-offwhite/60 text-xs mt-1 truncate">{g.caption || '—'}</p>
                      <div className="flex gap-1 mt-1">
                        <button type="button" onClick={() => navigate('/admin', { state: { openTab: 'gallery', editGalleryId: g.id } })} className="p-1.5 text-offwhite/70 hover:text-lime transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={() => deleteImage(g.id)} className="p-1.5 text-offwhite/70 hover:text-red-400 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </li>
                  ))}
                </ul>
                {images.length > PAGE_SIZE_IMAGES && (
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-offwhite/10 pt-4">
                    <p className="text-offwhite/60 text-sm">Showing {imgStart + 1}–{Math.min(imgStart + PAGE_SIZE_IMAGES, images.length)} of {images.length}</p>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setImagePage((p) => Math.max(1, p - 1))} disabled={imgSafePage <= 1} className="p-2 text-offwhite/70 hover:text-lime disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>
                      <span className="text-offwhite/80 text-sm min-w-[6rem] text-center">Page {imgSafePage} of {imgTotalPages}</span>
                      <button type="button" onClick={() => setImagePage((p) => Math.min(imgTotalPages, p + 1))} disabled={imgSafePage >= imgTotalPages} className="p-2 text-offwhite/70 hover:text-lime disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Next page"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
                </>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
