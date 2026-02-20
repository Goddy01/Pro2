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
      <div className="flex flex-wrap items-stretch justify-center gap-4 px-4 py-4 max-h-[220px] overflow-hidden">
        {banners.map((b) => {
          const alt = b.sponsorName ? `Sponsor: ${b.sponsorName}` : 'Sponsorship';
          const img = (
            <img
              src={b.imageUrl}
              alt={alt}
              className="w-full h-full object-contain object-center max-h-[180px]"
            />
          );
          const isExternal = b.linkUrl?.startsWith('http');
          const wrapperClass = 'block h-full min-h-[100px] max-h-[180px] focus:outline-none focus-visible:ring-2 focus-visible:ring-lime rounded overflow-hidden flex items-center justify-center bg-offwhite/5';
          const inner = b.linkUrl ? (
            isExternal ? (
              <a href={b.linkUrl} target="_blank" rel="noopener noreferrer" className={wrapperClass}>
                {img}
              </a>
            ) : (
              <Link to={b.linkUrl} className={wrapperClass}>
                {img}
              </Link>
            )
          ) : (
            <div className={wrapperClass}>{img}</div>
          );
          return (
            <div key={b.id} className="flex-1 min-w-[200px] max-w-[400px] flex flex-col">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
