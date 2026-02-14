import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Share2 } from 'lucide-react';
import { apiUrl } from '../lib/api';
import '../App.css';

type Article = {
  id: number;
  title: string;
  image: string;
  content: string;
  category: string;
  author: string;
  created_at: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'long' });
  } catch {
    return iso;
  }
}

export default function StoryDetail() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareCopied, setShareCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';

  async function handleShare() {
    const url = shareUrl || `${window.location.origin}/stories/${id}`;
    const title = article?.title ?? 'Article';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title,
          url,
          text: `Read "${title}" on Sideline Sports & Entertainment`,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch (err) {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    }
  }

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    fetch(apiUrl(`/api/articles/${id}`))
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? 'Article not found' : 'Failed to load');
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setArticle(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load article');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-forest flex items-center justify-center">
        <p className="text-offwhite/60">Loading…</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-forest px-6 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-red-400 mb-4">{error || 'Article not found'}</p>
          <Link to="/stories" className="text-lime hover:underline inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Stories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forest">
      <article className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/stories" className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Stories
        </Link>

        <header className="mb-10">
          <span className="tag-premium mb-4 inline-block">{article.category}</span>
          <h1 className="headline-section text-offwhite text-3xl lg:text-4xl mb-4">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-offwhite/60 text-sm">
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {article.author}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(article.created_at)}
            </span>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 text-offwhite/60 hover:text-lime transition-colors"
              title="Share article link"
              aria-label="Share article link"
            >
              <Share2 className="w-4 h-4" />
              {shareCopied ? 'Link copied!' : 'Share'}
            </button>
          </div>
        </header>

        {article.image && (
          <div className="relative overflow-hidden rounded-lg mb-10 h-[320px] lg:h-[420px]">
            <img
              src={article.image}
              alt=""
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        )}

        <div
          className="prose-editorial prose prose-invert max-w-none text-offwhite/90 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-lime [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-offwhite/70 [&_a]:text-lime [&_a]:underline [&_img]:rounded-lg"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>
    </div>
  );
}
