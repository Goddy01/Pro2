import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Headphones, Video, ExternalLink } from 'lucide-react';
import SEO from '../components/SEO';
import { apiUrl } from '../lib/api';
import { optimizeImageUrl } from '../lib/images';
import '../App.css';

type PlatformLinks = {
  youtube?: string;
  spotify?: string;
  apple?: string;
  website?: string;
};

type Show = {
  slug: string;
  name: string;
  description: string | null;
  hero_image_url: string | null;
  platform_links: PlatformLinks | null;
};

type PodcastEpisode = {
  id: number;
  title: string;
  description: string | null;
  duration_label: string | null;
  guests: string | null;
  audio_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  show_name: string | null;
  created_at: string;
};

type WatchItem = {
  id?: number;
  title: string;
  videoId: string | null;
  videoUrl: string | null;
  duration: string;
  show_name?: string | null;
};

export default function ShowDetail() {
  const { showSlug } = useParams();
  const [show, setShow] = useState<Show | null>(null);
  const [loadingShow, setLoadingShow] = useState(true);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [videos, setVideos] = useState<WatchItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingShow(true);
    setShow(null);
    setEpisodes([]);
    setVideos([]);
    fetch(apiUrl(`/api/shows/${encodeURIComponent(showSlug || '')}`))
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error((data as { error?: string })?.error || 'Show not found');
        return data;
      })
      .then((data) => {
        if (!cancelled) setShow(data as Show);
      })
      .catch(() => {
        if (!cancelled) setShow(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingShow(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showSlug]);

  useEffect(() => {
    if (!show?.name) return;
    let cancelled = false;
    setLoadingMedia(true);
    const name = show.name;
    Promise.all([
      fetch(apiUrl(`/api/podcast?show=${encodeURIComponent(name)}`))
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch(apiUrl(`/api/watch?show=${encodeURIComponent(name)}`))
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ])
      .then(([pod, wat]) => {
        if (cancelled) return;
        setEpisodes(Array.isArray(pod) ? (pod as PodcastEpisode[]) : []);
        setVideos(Array.isArray(wat) ? (wat as WatchItem[]) : []);
      })
      .finally(() => {
        if (!cancelled) setLoadingMedia(false);
      });
    return () => {
      cancelled = true;
    };
  }, [show?.name]);

  const hero = useMemo(() => {
    if (!show?.hero_image_url) return '';
    return optimizeImageUrl(show.hero_image_url, { width: 1400, quality: 70 });
  }, [show?.hero_image_url]);

  const links = show?.platform_links || {};
  const anyLinks = !!(links.youtube || links.spotify || links.apple || links.website);

  const title = show?.name ? `${show.name} – Shows` : 'Show';

  return (
    <div className="relative">
      <SEO
        title={title}
        description={show?.description || 'Show details, episodes, and videos.'}
        canonicalPath={show?.slug ? `/shows/${show.slug}` : '/shows'}
      />
      <section className="section-premium py-20">
        <div className="w-full px-6 lg:px-12 max-w-6xl mx-auto">
          <div className="mb-8">
            <Link to="/shows" className="inline-flex items-center gap-2 text-offwhite/70 hover:text-lime transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              Back to shows
            </Link>
          </div>

          {loadingShow ? (
            <p className="text-offwhite/60 text-center py-12">Loading…</p>
          ) : !show ? (
            <p className="text-offwhite/60 text-center py-12">Show not found.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start mb-14">
                <div className="min-w-0">
                  <span className="label-mono text-lime mb-4 block">Show</span>
                  <h1 className="headline-section text-offwhite text-4xl lg:text-5xl mb-4 break-words">
                    {show.name}
                  </h1>
                  {show.description ? (
                    <p className="body-large text-offwhite/70 mb-6 whitespace-pre-wrap break-words">
                      {show.description}
                    </p>
                  ) : (
                    <p className="body-large text-offwhite/60 mb-6">More details coming soon.</p>
                  )}

                  {anyLinks && (
                    <div className="flex flex-wrap gap-3">
                      {links.youtube && (
                        <a href={links.youtube} target="_blank" rel="noopener noreferrer" className="btn-outline-premium inline-flex items-center gap-2">
                          YouTube <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {links.spotify && (
                        <a href={links.spotify} target="_blank" rel="noopener noreferrer" className="btn-outline-premium inline-flex items-center gap-2">
                          Spotify <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {links.apple && (
                        <a href={links.apple} target="_blank" rel="noopener noreferrer" className="btn-outline-premium inline-flex items-center gap-2">
                          Apple Podcasts <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {links.website && (
                        <a href={links.website} target="_blank" rel="noopener noreferrer" className="btn-outline-premium inline-flex items-center gap-2">
                          Website <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="relative">
                  {hero ? (
                    <div className="aspect-video overflow-hidden border border-offwhite/10 bg-offwhite/5">
                      <img
                        src={hero}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video border border-offwhite/10 bg-offwhite/5" aria-hidden />
                  )}
                </div>
              </div>

              <div className="h-px w-full bg-offwhite/10 mb-12" aria-hidden />

              {loadingMedia ? (
                <p className="text-offwhite/60 text-center py-10">Loading episodes &amp; videos…</p>
              ) : (
                <>
                  {episodes.length > 0 && (
                    <div className="mb-14">
                      <h2 className="flex items-center gap-2 text-lime font-display font-bold text-lg uppercase tracking-wider mb-6">
                        <Headphones className="w-4 h-4" />
                        Episodes
                      </h2>
                      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {episodes.map((ep) => {
                          const thumb = ep.thumbnail_url
                            ? optimizeImageUrl(ep.thumbnail_url, { width: 700, quality: 70 })
                            : '';
                          return (
                            <li key={ep.id} className="card-editorial overflow-hidden group bg-offwhite/5 border border-offwhite/10">
                              {thumb ? (
                                <div className="aspect-video relative overflow-hidden">
                                  <img
                                    src={thumb}
                                    alt=""
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                </div>
                              ) : (
                                <div className="aspect-video bg-offwhite/5 border-b border-offwhite/10" aria-hidden />
                              )}
                              <div className="p-5">
                                <h3 className="text-offwhite font-display font-bold text-lg mb-2 line-clamp-2">
                                  {ep.title}
                                </h3>
                                {ep.duration_label && (
                                  <p className="text-offwhite/50 text-sm mb-2">{ep.duration_label}</p>
                                )}
                                {ep.guests && (
                                  <p className="text-offwhite/60 text-sm mb-3 line-clamp-2">
                                    Guests: {ep.guests.split(',').map((s) => s.trim()).filter(Boolean).join(', ')}
                                  </p>
                                )}
                                {ep.description && (
                                  <p className="text-offwhite/60 text-sm line-clamp-3 mb-4">{ep.description}</p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                  {ep.audio_url && (
                                    <a
                                      href={ep.audio_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 bg-lime text-forest px-3 py-1.5 text-xs font-semibold uppercase tracking-wide hover:bg-lime/90 transition-colors"
                                    >
                                      Listen
                                    </a>
                                  )}
                                  {ep.video_url && (
                                    <a
                                      href={ep.video_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 bg-offwhite/10 text-offwhite border border-offwhite/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide hover:bg-offwhite/20 transition-colors"
                                    >
                                      Watch
                                    </a>
                                  )}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {videos.length > 0 && (
                    <div className="mb-6">
                      <h2 className="flex items-center gap-2 text-lime font-display font-bold text-lg uppercase tracking-wider mb-6">
                        <Video className="w-4 h-4" />
                        Videos
                      </h2>
                      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {videos.map((v, idx) => {
                          const youtubeThumb = v.videoId ? `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg` : '';
                          const thumb = youtubeThumb ? youtubeThumb : '';
                          return (
                            <li key={(v.id ?? v.videoId ?? idx).toString()} className="card-editorial overflow-hidden group bg-offwhite/5 border border-offwhite/10">
                              {thumb ? (
                                <div className="aspect-video relative overflow-hidden">
                                  <img
                                    src={thumb}
                                    alt=""
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                </div>
                              ) : (
                                <div className="aspect-video bg-offwhite/5 border-b border-offwhite/10" aria-hidden />
                              )}
                              <div className="p-5">
                                <h3 className="text-offwhite font-display font-bold text-lg mb-2 line-clamp-2">
                                  {v.title}
                                </h3>
                                {v.duration && (
                                  <p className="text-offwhite/50 text-sm mb-4">{v.duration}</p>
                                )}
                                {(v.videoUrl || v.videoId) && (
                                  <a
                                    href={v.videoUrl || (v.videoId ? `https://www.youtube.com/watch?v=${v.videoId}` : '#')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 bg-offwhite/10 text-offwhite border border-offwhite/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide hover:bg-offwhite/20 transition-colors"
                                  >
                                    Watch
                                  </a>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {episodes.length === 0 && videos.length === 0 && (
                    <p className="text-offwhite/60 text-center py-8">
                      No episodes or videos are assigned to this show yet.
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

