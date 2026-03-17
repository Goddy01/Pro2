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
  const [episodePage, setEpisodePage] = useState(1);
  const [expandedEpisodeId, setExpandedEpisodeId] = useState<number | null>(null);

  const EPISODES_PER_PAGE = 9;

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
    setEpisodePage(1);
    setExpandedEpisodeId(null);
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

  const totalEpisodePages = Math.max(1, Math.ceil(episodes.length / EPISODES_PER_PAGE));
  const safeEpisodePage = Math.min(episodePage, totalEpisodePages);
  const episodeStart = (safeEpisodePage - 1) * EPISODES_PER_PAGE;
  const pagedEpisodes = episodes.slice(episodeStart, episodeStart + EPISODES_PER_PAGE);

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
              {/* Hero image first (full content width) */}
              {hero ? (
                <div className="mb-10">
                  <div className="aspect-video overflow-hidden border border-offwhite/10 bg-offwhite/5 rounded-sm">
                    <img
                      src={hero}
                      alt=""
                      className="w-full h-full object-cover object-top"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              ) : null}

              {/* Title + links + description */}
              <div className="mb-14">
                <span className="label-mono text-lime mb-4 block">Show</span>
                <h1 className="headline-section text-offwhite text-4xl lg:text-5xl mb-4 break-words">
                  {show.name}
                </h1>

                {anyLinks && (
                  <div className="flex flex-wrap gap-3 mb-6">
                    {links.youtube && (
                      <a
                        href={links.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline-premium inline-flex items-center gap-2"
                      >
                        YouTube <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {links.spotify && (
                      <a
                        href={links.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline-premium inline-flex items-center gap-2"
                      >
                        Spotify <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {links.apple && (
                      <a
                        href={links.apple}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline-premium inline-flex items-center gap-2"
                      >
                        Apple Podcasts <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}

                {show.description ? (
                  <p className="body-large text-offwhite/70 whitespace-pre-wrap break-words">
                    {show.description}
                  </p>
                ) : (
                  <p className="body-large text-offwhite/60">More details coming soon.</p>
                )}
              </div>

              <div className="h-px w-full bg-offwhite/10 mb-12" aria-hidden />

              {loadingMedia ? (
                <p className="text-offwhite/60 text-center py-10">Loading episodes &amp; videos…</p>
              ) : (
                <>
                  {episodes.length > 0 && (
                    <div className="mb-14">
                      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
                        <h2 className="flex items-center gap-2 text-lime font-display font-bold text-lg uppercase tracking-wider">
                          <Headphones className="w-4 h-4" />
                          Episodes
                        </h2>
                        <p className="text-offwhite/50 text-sm">
                          Showing {episodes.length === 0 ? 0 : episodeStart + 1}–{Math.min(episodeStart + EPISODES_PER_PAGE, episodes.length)} of {episodes.length}
                        </p>
                      </div>
                      <div className="border border-offwhite/10 bg-offwhite/5 rounded-sm overflow-hidden">
                        <ul className="divide-y divide-offwhite/10">
                          {pagedEpisodes.map((ep) => {
                            const open = expandedEpisodeId === ep.id;
                            const headerId = `ep-header-${ep.id}`;
                            const panelId = `ep-panel-${ep.id}`;
                            return (
                              <li key={ep.id} className="min-w-0">
                                <button
                                  type="button"
                                  id={headerId}
                                  aria-expanded={open}
                                  aria-controls={panelId}
                                  onClick={() => setExpandedEpisodeId((cur) => (cur === ep.id ? null : ep.id))}
                                  className="w-full text-left px-4 sm:px-5 py-4 hover:bg-offwhite/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-forest"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                      <p className="text-offwhite font-display font-bold text-base sm:text-lg leading-snug break-words">
                                        {ep.title}
                                      </p>
                                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-offwhite/55">
                                        {ep.duration_label ? <span>{ep.duration_label}</span> : null}
                                        {ep.guests ? (
                                          <span className="truncate">
                                            Guests: {ep.guests.split(',').map((s) => s.trim()).filter(Boolean).join(', ')}
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                    <span className="text-offwhite/60 text-sm shrink-0">
                                      {open ? '−' : '+'}
                                    </span>
                                  </div>
                                </button>

                                {open && (
                                  <div
                                    id={panelId}
                                    role="region"
                                    aria-labelledby={headerId}
                                    className="px-4 sm:px-5 pb-5 pt-2"
                                  >
                                    {ep.description ? (
                                      <p className="text-offwhite/70 text-sm whitespace-pre-wrap break-words mb-4">
                                        {ep.description}
                                      </p>
                                    ) : (
                                      <p className="text-offwhite/50 text-sm mb-4">
                                        No description provided.
                                      </p>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                      {ep.audio_url && (
                                        <a
                                          href={ep.audio_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 bg-lime text-forest px-3 py-2 text-xs font-semibold uppercase tracking-wide hover:bg-lime/90 transition-colors"
                                        >
                                          Listen
                                        </a>
                                      )}
                                      {ep.video_url && (
                                        <a
                                          href={ep.video_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 bg-offwhite/10 text-offwhite border border-offwhite/20 px-3 py-2 text-xs font-semibold uppercase tracking-wide hover:bg-offwhite/20 transition-colors"
                                        >
                                          Watch
                                        </a>
                                      )}
                                      {!ep.audio_url && !ep.video_url ? (
                                        <span className="text-offwhite/50 text-sm">No links available.</span>
                                      ) : null}
                                    </div>
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      {totalEpisodePages > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-4">
                          <button
                            type="button"
                            onClick={() => setEpisodePage((p) => Math.max(1, p - 1))}
                            disabled={safeEpisodePage <= 1}
                            className="px-4 py-2 border border-offwhite/30 text-offwhite disabled:opacity-40 disabled:cursor-not-allowed hover:border-lime hover:text-lime transition-colors"
                          >
                            Previous
                          </button>
                          <span className="text-offwhite/70 text-sm">
                            Page {safeEpisodePage} of {totalEpisodePages}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEpisodePage((p) => Math.min(totalEpisodePages, p + 1))}
                            disabled={safeEpisodePage >= totalEpisodePages}
                            className="px-4 py-2 border border-offwhite/30 text-offwhite disabled:opacity-40 disabled:cursor-not-allowed hover:border-lime hover:text-lime transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      )}
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
                            <li key={(v.id ?? v.videoId ?? idx).toString()} className="card-editorial overflow-hidden group bg-offwhite/5 border border-offwhite/10 rounded-sm">
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

