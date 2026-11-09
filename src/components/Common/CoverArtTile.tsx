import React, { useState } from 'react';
import { Music, User, Disc3, ListMusic } from 'lucide-react';

interface CoverArtTileProps {
  src?: string | null;
  title: string;
  type?: 'song' | 'album' | 'artist' | 'playlist';
  shape?: 'square' | 'circle';
  className?: string;
  alt?: string;
}

export const CoverArtTile: React.FC<CoverArtTileProps> = ({
  src,
  title,
  type = 'song',
  shape = 'square',
  className = 'w-full h-full',
  alt,
}) => {
  const [imgError, setImgError] = useState(false);

  const initial = (title || '').trim().charAt(0).toUpperCase() || (type === 'artist' ? 'A' : 'M');
  const isCircle = shape === 'circle' || type === 'artist';
  const roundedClass = isCircle ? 'rounded-full' : 'rounded-md';

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={alt || title}
        className={`${className} ${roundedClass} object-cover`}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    );
  }

  // Neutral dark gradient tile with item's initial letter or icon
  // Strict Spotify AMOLED dark palette: from #242424 to #121212 with subtle white border
  return (
    <div
      className={`${className} ${roundedClass} bg-gradient-to-br from-[#262626] to-[#121212] border border-white/10 flex flex-col items-center justify-center select-none overflow-hidden text-neutral-300 font-semibold`}
      aria-label={title || 'Cover'}
    >
      {initial ? (
        <span className="text-base sm:text-lg font-bold tracking-wider text-neutral-200">
          {initial}
        </span>
      ) : type === 'artist' ? (
        <User className="w-1/2 h-1/2 text-neutral-400 stroke-[1.5]" />
      ) : type === 'album' ? (
        <Disc3 className="w-1/2 h-1/2 text-neutral-400 stroke-[1.5]" />
      ) : type === 'playlist' ? (
        <ListMusic className="w-1/2 h-1/2 text-neutral-400 stroke-[1.5]" />
      ) : (
        <Music className="w-1/2 h-1/2 text-neutral-400 stroke-[1.5]" />
      )}
    </div>
  );
};
