import { useEffect, useState } from 'react';
import { Headphones, Video } from 'lucide-react';
import { apiUrl } from '../lib/api';
import '../App.css';

type PodcastEpisode = {
  id: number;
  title: string;
  description: string | null;
  duration_label: string | null;
  guests: string | null;
  audio_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
};

type WatchItem = {
  title: string;
  videoId: string | null;
  videoUrl: string | null;
  duration: string;
};

export default function ListenWatch() {
  const [podcastEpisodes, setPodcastEpisodes] = useState<PodcastEpisode[]>([]);
  const [watchVideos, setWatchVideos] = useState<WatchItem[]>([]);
  const [loadingPodcast, setLoadingPodcast] = useState(true);
  const [loadingWatch, setLoadingWatch] = useState(true);

  useEffect(() => {
    fetch(apiUrl('/api/podcast'))
      .then((r) => r.json())
      .then((data) => {
        setPodcastEpisodes(Array.isArray(data) ? data : []);
      })
      .catch(() => setPodcastEpisodes([]))
      .finally(() => setLoadingPodcast(false));
  }, []);

  useEffect(() => {
    fetch(apiUrl('/api/watch'))
      .then((r) => r.json())
      .then((data) => {
        setWatchVideos(Array.isArray(data) ? data : []);
      })
      .catch(() => setWatchVideos([]))
      .finally(() => setLoadingWatch(false));
  }, []);

  const hasPodcast = podcastEpisodes.length > 0;
  const hasWatch = watchVideos.length > 0;
  const loading = loadingPodcast || loadingWatch;
  const empty = !loading && !hasPodcast && !hasWatch;

  return (
    <div className="relative">
      <section className="section-premium py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="text-center mb-16">
            <span className="label-mono text-lime mb-4 block">Listen & Watch</span>
            <h1 className="headline-section text-offwhite text-4xl lg:text-5xl mb-4">
              Podcast &amp; Video
            </h1>
            <p className="body-large text-offwhite/60 max-w-2xl mx-auto">
              Episodes and videos uploaded by Sideline Sports &amp; Entertainment.
            </p>
          </div>

          {loading && (
            <p className="text-offwhite/60 text-center py-12">Loading…</p>
          )}

          {empty && (
            <p className="text-offwhite/60 text-center py-12">
              No podcast episodes or videos yet. Check back soon.
            </p>
          )}

          {!loading && hasPodcast && (
            <div className="mb-20">
              <h2 className="flex items-center gap-2 text-lime font-display font-bold text-xl uppercase tracking-wider mb-8">
                <Headphones className="w-5 h-5" />
                Podcast
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {podcastEpisodes.map((ep) => (
                  <li key={ep.id} className="card-editorial overflow-hidden group bg-offwhite/5 border border-offwhite/10">
                    {ep.thumbnail_url && (
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={ep.thumbnail_url}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="text-offwhite font-display font-bold text-lg mb-2 line-clamp-2">
                        {ep.title}
                      </h3>
                      {ep.duration_label && (
                        <p className="text-offwhite/50 text-sm mb-2">{ep.duration_label}</p>
                      )}
                      {ep.guests && (
                        <p className="text-offwhite/60 text-sm mb-3">
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
                ))}
              </ul>
            </div>
          )}

          {!loading && hasWatch && (
            <div>
              <h2 className="flex items-center gap-2 text-lime font-display font-bold text-xl uppercase tracking-wider mb-8">
                <Video className="w-5 h-5" />
                Watch
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {watchVideos.map((video, i) => {
                  const isYoutube = video.videoId && /^[a-zA-Z0-9_-]{11}$/.test(video.videoId);
                  const href = isYoutube
                    ? `https://www.youtube.com/watch?v=${video.videoId}`
                    : video.videoUrl || '#';
                  const thumb = isYoutube
                    ? `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`
                    : null;
                  return (
                    <li key={`${video.title}-${i}`} className="card-editorial overflow-hidden group bg-offwhite/5 border border-offwhite/10">
                      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
                        {thumb ? (
                          <div className="aspect-video relative overflow-hidden">
                            <img
                              src={thumb}
                              alt=""
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video bg-offwhite/10 flex items-center justify-center">
                            <Video className="w-12 h-12 text-offwhite/30" />
                          </div>
                        )}
                        <div className="p-5">
                          <h3 className="text-offwhite font-display font-bold text-lg mb-2 line-clamp-2 group-hover:text-lime transition-colors">
                            {video.title}
                          </h3>
                          <p className="text-offwhite/50 text-sm">{video.duration}</p>
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
