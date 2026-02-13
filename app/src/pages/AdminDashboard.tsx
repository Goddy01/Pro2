import { useState, useRef, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, LogOut } from 'lucide-react';
import '../App.css';

export default function AdminDashboard() {
  const { token, logout, isAuthenticated } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Features');
  const [author, setAuthor] = useState('Sideline Sports & Entertainment Team');
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  if (!isAuthenticated) return <Navigate to="/superuser" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!content.trim()) {
      setError('Content is required');
      return;
    }
    if (!image) {
      setError('Image is required');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('title', title.trim());
      form.append('content', content.trim());
      form.append('category', category);
      form.append('author', author);
      form.append('image', image);

      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to publish article');
        return;
      }
      setSuccess('Article published successfully');
      setTitle('');
      setContent('');
      setCategory('Features');
      setAuthor('Sideline Sports & Entertainment Team');
      setImage(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
    } catch (err) {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-forest px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to site
          </Link>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>

        <h1 className="text-offwhite font-editorial font-bold text-2xl mb-2">Publish Article</h1>
        <p className="text-offwhite/60 text-sm mb-8">Only admin can publish articles.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-lime text-sm">{success}</p>}

          <label className="block">
            <span className="text-offwhite text-sm font-medium mb-2 block">Title *</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-offwhite/5 border border-offwhite/20 text-offwhite placeholder:text-offwhite/40 focus:outline-none focus:border-lime"
              placeholder="Article title"
              required
            />
          </label>

          <label className="block">
            <span className="text-offwhite text-sm font-medium mb-2 block">Image *</span>
            <input
              ref={imageInputRef}
              id="image-input"
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full px-4 py-3 bg-offwhite/5 border border-offwhite/20 text-offwhite file:mr-4 file:py-2 file:px-4 file:bg-lime file:text-forest file:border-0"
              required
            />
          </label>

          <label className="block">
            <span className="text-offwhite text-sm font-medium mb-2 block">Content *</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 bg-offwhite/5 border border-offwhite/20 text-offwhite placeholder:text-offwhite/40 focus:outline-none focus:border-lime resize-y"
              placeholder="Article content..."
              required
            />
          </label>

          <label className="block">
            <span className="text-offwhite text-sm font-medium mb-2 block">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-offwhite/5 border border-offwhite/20 text-offwhite focus:outline-none focus:border-lime"
            >
              <option value="Features">Features</option>
              <option value="Analysis">Analysis</option>
              <option value="Events">Events</option>
              <option value="Podcast">Podcast</option>
              <option value="Video">Video</option>
            </select>
          </label>

          <label className="block">
            <span className="text-offwhite text-sm font-medium mb-2 block">Author</span>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-4 py-3 bg-offwhite/5 border border-offwhite/20 text-offwhite placeholder:text-offwhite/40 focus:outline-none focus:border-lime"
              placeholder="Author name"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-premium py-4 px-8 disabled:opacity-50"
          >
            {loading ? 'Publishing...' : 'Publish Article'}
          </button>
        </form>
      </div>
    </div>
  );
}
