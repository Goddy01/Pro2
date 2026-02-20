import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiUrl } from '../lib/api';

type BannerItem = {
  id: number;
  imageUrl: string;
  linkUrl: string | null;
  sponsorName: string | null;
};

export default function SponsorshipBanner() {
  const [banners, setBanners] = useState<BannerItem[]>([]);

  useEffect(() => {
    fetch(apiUrl('/api/sponsorship/banner'))
      .then((r) => r.json())
      .then((d) => setBanners(Array.isArray(d?.banners) ? d.banners : []))
      .catch(() => setBanners([]));
  }, []);

  if (banners.length === 0) return null;

  return (
    <div className="w-full bg-offwhite/5 border-b border-offwhite/10">
      <div className="flex flex-col sm:flex-row flex-wrap sm:items-center justify-center gap-3 sm:gap-4 px-3 py-3 sm:px-4 sm:py-4">
        {banners.map((b) => {
          const alt = b.sponsorName ? `Sponsor: ${b.sponsorName}` : 'Sponsorship';
          const isExternal = b.linkUrl?.startsWith('http');
          const linkClass = 'block w-full h-full min-h-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-lime rounded overflow-hidden bg-offwhite/5 flex items-center justify-center';
          const imgClass = 'w-full h-full object-contain object-center';
          const content = (
            <img
              src={b.imageUrl}
              alt={alt}
              className={imgClass}
              loading="lazy"
            />
          );
          const inner = b.linkUrl ? (
            isExternal ? (
              <a href={b.linkUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {content}
              </a>
            ) : (
              <Link to={b.linkUrl} className={linkClass}>
                {content}
              </Link>
            )
          ) : (
            <div className={linkClass}>{content}</div>
          );
          return (
            <div
              key={b.id}
              className="w-full sm:flex-1 sm:min-w-[200px] sm:max-w-[400px] aspect-[3/1] sm:aspect-[16/9] max-h-[120px] sm:max-h-[180px] min-h-0 flex shrink-0"
            >
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
