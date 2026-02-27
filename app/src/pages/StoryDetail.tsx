import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, User, Share2 } from 'lucide-react';
import { apiUrl } from '../lib/api';
import { decodeArticleId } from '../lib/articleId';
import { encodeArticleId } from '../lib/articleId';
import { SITE_URL } from '../lib/site';
import SEO from '../components/SEO';
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

function formatRelativeTime(iso: string) {
  try {
    const date = new Date(iso);
    const now = new Date();
    const sec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (sec < 60) return 'Just now';
    if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)} hour ago`;
    if (sec < 604800) return `${Math.floor(sec / 86400)} days ago`;
    return formatDate(iso);
  } catch {
    return iso;
  }
}

function readingTimeMinutes(html: string) {
  const text = (html || '').replace(/<[^>]*>/g, '');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function articleExcerpt(html: string, maxLen = 160) {
  const text = (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length <= maxLen ? text : text.slice(0, maxLen) + '…';
}

export default function StoryDetail() {
  const { id: idHash } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareCopied, setShareCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';

  async function handleShare() {
    const url = shareUrl || (idHash ? `${window.location.origin}/stories/${idHash}` : '');
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
    } catch {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    }
  }

  const numericId = idHash ? decodeArticleId(idHash) : null;
  const invalidLink = !idHash || numericId == null || numericId < 1;

  useEffect(() => {
    if (invalidLink) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError('');
      }
    });
    fetch(apiUrl(`/api/articles/${numericId!}`))
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? 'Article not found' : 'Failed to load');
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setArticle(data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load article');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [idHash, invalidLink, numericId]);

  if (invalidLink) {
    return (
      <div className="min-h-screen bg-forest px-6 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-red-400 mb-4">{!idHash ? 'Invalid link' : 'Article not found'}</p>
          <Link to="/stories" className="text-lime hover:underline inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Articles
          </Link>
        </div>
      </div>
    );
  }

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
            Back to Articles
          </Link>
        </div>
      </div>
    );
  }

  const readMins = readingTimeMinutes(article.content);
  const slug = idHash || (article.id != null ? encodeArticleId(article.id) : '');
  const canonicalPath = slug ? `/stories/${slug}` : '/stories';
  const articleUrl = slug ? `${SITE_URL}/stories/${slug}` : SITE_URL + '/stories';
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: articleExcerpt(article.content, 160),
    image: article.image || undefined,
    datePublished: article.created_at,
    dateModified: article.created_at,
    author: { '@type': 'Person', name: article.author },
    publisher: { '@type': 'Organization', name: 'Sideline Sports & Entertainment', logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo-180.png` } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
  };

  return (
    <div className="min-h-screen bg-forest">
      <SEO
        title={article.title}
        description={articleExcerpt(article.content, 160)}
        canonicalPath={canonicalPath}
        image={article.image || undefined}
        ogType="article"
        articlePublishedTime={article.created_at}
        articleModifiedTime={article.created_at}
        articleAuthor={article.author}
        articleSection={article.category || undefined}
        jsonLd={articleJsonLd}
      />
      <article className="max-w-5xl lg:max-w-6xl mx-auto px-6 py-8 lg:py-10">
        <Link
          to="/stories"
          className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Articles
        </Link>

        {/* Title – large, centered feel */}
        <h1 className="headline-section text-offwhite text-3xl lg:text-4xl font-bold mb-4 leading-tight">
          {article.title}
        </h1>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-lime/20 text-lime border border-lime/40">
            {article.category || 'Article'}
          </span>
        </div>

        {/* Two-column: sidebar (author, date, read time) + main (image, body). On mobile, author block first. */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 lg:gap-12">
          {/* Left sidebar – contributor card; on mobile appears before article with extra spacing below */}
          <aside className="lg:w-48 flex-shrink-0 order-1 lg:order-1 pb-12 mb-6 lg:pb-0 lg:mb-0 border-b border-offwhite/10 lg:border-b-0">
            <div className="flex lg:flex-col items-center lg:items-start gap-5 lg:gap-5">
              <div className="w-12 h-12 rounded-full bg-offwhite/10 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-offwhite/60" />
              </div>
              <div className="min-w-0 flex flex-row flex-wrap items-center gap-x-3 gap-y-1 lg:flex-col lg:items-start lg:gap-0">
                <p className="text-offwhite font-medium truncate">{article.author}</p>
                <p className="text-offwhite/50 text-sm lg:mt-2">{formatRelativeTime(article.created_at)}</p>
                <p className="text-offwhite/50 text-sm flex items-center gap-1.5 lg:mt-2">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>{readMins} min read</span>
                </p>
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 text-offwhite/60 hover:text-lime transition-colors text-sm lg:mt-5 self-start"
                  title="Share article link"
                  aria-label="Share article link"
                >
                  <Share2 className="w-4 h-4" />
                  {shareCopied ? 'Link copied!' : 'Share'}
                </button>
              </div>
            </div>
          </aside>

          {/* Main content – hero image then body; on mobile appears after author block */}
          <div className="order-2 lg:order-2 min-w-0">
            {/* Hero image – rounded frame, full width of content column */}
            {article.image && (
              <div className="rounded-xl overflow-hidden bg-forest/30 mb-8 w-full aspect-[16/10] min-h-[260px] max-h-[420px]">
                <img
                  src={article.image}
                  alt=""
                  className="w-full h-full object-cover object-top"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
              </div>
            )}

            {/* Article body */}
            <div
              className="prose-editorial prose prose-invert max-w-none text-offwhite/90 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-lime [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-offwhite/70 [&_a]:text-lime [&_a]:underline [&_img]:rounded-lg"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        </div>
      </article>
    </div>
  );
}
