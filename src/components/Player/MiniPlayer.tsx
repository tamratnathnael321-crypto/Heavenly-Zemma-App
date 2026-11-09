import React from 'react';
import { Play, Pause, SkipForward, Heart } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { CoverArtTile } from '../Common/CoverArtTile';

export const MiniPlayer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    playNextSong,
    isFavorite,
    toggleFavorite,
    setIsNowPlayingOpen,
  } = useMusic();

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
  const isFav = isFavorite(currentSong.id);

  return (
    <div
      onClick={() => setIsNowPlayingOpen(true)}
      className="fixed bottom-14 left-2 right-2 z-30 mb-1 max-w-lg mx-auto bg-[#242424] text-white rounded-lg cursor-pointer overflow-hidden shadow-lg select-none hover:bg-[#282828] transition-colors border border-[#333333]"
      role="button"
      tabIndex={0}
      aria-label={`Now playing: ${currentSong.title}. Tap to open full player.`}
    >
      {/* Sleek Top Progress Bar */}
      <div className="w-full h-0.5 bg-[#3a3a3a]">
        <div
          className="h-full bg-[#1ed760] transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-3 py-2 gap-3">
        {/* Track Info & Art */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 shrink-0">
            <CoverArtTile
              src={currentSong.cover_art_url}
              title={currentSong.title}
              type="song"
              className="w-10 h-10"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-white truncate">
              {currentSong.title}
            </div>
            {currentSong.artist_name && (
              <div className="text-[11px] text-[#a7a7a7] truncate">
                {currentSong.artist_name}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Favorite heart */}
          <button
            onClick={() => toggleFavorite(currentSong.id)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-[#a7a7a7] hover:text-white active:scale-95 transition-transform"
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              size={18}
              className={isFav ? 'text-[#1ed760] fill-[#1ed760]' : 'text-[#a7a7a7]'}
            />
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-transform"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={17} className="fill-black" />
            ) : (
              <Play size={17} className="fill-black translate-x-0.5" />
            )}
          </button>

          {/* Next Button */}
          <button
            onClick={playNextSong}
            className="w-9 h-9 flex items-center justify-center rounded-full text-[#a7a7a7] hover:text-white active:scale-95 transition-transform"
            aria-label="Next song"
          >
            <SkipForward size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
