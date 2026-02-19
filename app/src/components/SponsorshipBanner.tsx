import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiUrl } from '../lib/api';

export default function SponsorshipBanner() {
  const [banner, setBanner] = useState<{ enabled: boolean; imageUrl?: string; linkUrl?: string | null } | null>(null);

  useEffect(() => {
    fetch(apiUrl('/api/sponsorship/banner'))
      .then((r) => r.json())
      .then((d) => setBanner(d))
      .catch(() => setBanner({ enabled: false }));
  }, []);

  if (!banner?.enabled || !banner.imageUrl) return null;

  const img = (
    <img
      src={banner.imageUrl}
      alt="Sponsorship"
      className="w-full h-full object-cover object-center"
    />
  );

  const isExternal = banner.linkUrl?.startsWith('http');
  const wrapperClass = 'block w-full h-full min-h-[120px] overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-lime';

  return (
    <div className="w-full max-h-[200px] lg:max-h-[240px] overflow-hidden bg-offwhite/5">
      {banner.linkUrl ? (
        isExternal ? (
          <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className={wrapperClass}>
            {img}
          </a>
        ) : (
          <Link to={banner.linkUrl} className={wrapperClass}>
            {img}
          </Link>
        )
      ) : (
        <div className="block w-full h-full min-h-[120px]">{img}</div>
      )}
    </div>
  );
}
