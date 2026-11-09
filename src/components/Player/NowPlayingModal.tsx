import React, { useState } from 'react';
import {
  ChevronDown,
  Heart,
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  Repeat1,
  Moon,
  ListMusic,
  Share2,
  Volume2,
  Plus,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { SleepTimerModal } from './SleepTimerModal';
import { QueueSheet } from './QueueSheet';
import { CoverArtTile } from '../Common/CoverArtTile';

export const NowPlayingModal: React.FC = () => {
  const {
    isNowPlayingOpen,
    setIsNowPlayingOpen,
    currentSong,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    playNextSong,
    playPreviousSong,
    seek,
    isShuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    isFavorite,
    toggleFavorite,
    sleepTimerRemaining,
    setIsSleepTimerOpen,
    setIsQueueOpen,
    navigateToArtist,
    navigateToAlbum,
    openShareModal,
    openAddToPlaylistModal,
  } = useMusic();

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekVal, setSeekVal] = useState(0);

  if (!isNowPlayingOpen || !currentSong) return null;

  const isFav = isFavorite(currentSong.id);
  const effectiveTime = isSeeking ? seekVal : currentTime;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const mins = Math.floor(secs / 60);
    const remaining = Math.floor(secs % 60);
    return `${mins}:${remaining.toString().padStart(2, '0')}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekVal(parseFloat(e.target.value));
  };

  const handleSeekCommit = () => {
    seek(seekVal);
    setIsSeeking(false);
  };

  const handleShare = () => {
    openShareModal({
      type: 'song',
      id: currentSong.id,
      title: currentSong.title,
      subtitle: currentSong.artist_name,
      image_url: currentSong.cover_art_url || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#121212] flex flex-col pt-safe pb-safe select-none text-white"
      role="dialog"
      aria-label="Now Playing"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-5 py-3">
        <button
          onClick={() => setIsNowPlayingOpen(false)}
          className="w-10 h-10 flex items-center justify-center rounded-full text-white hover:bg-[#282828] active:scale-95"
          aria-label="Collapse player"
        >
          <ChevronDown size={28} />
        </button>

        <div className="flex flex-col items-center max-w-[200px] truncate text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#a7a7a7]">
            Playing from Album
          </span>
          {currentSong.album_id && currentSong.album_title ? (
            <button
              onClick={() => {
                navigateToAlbum(currentSong.album_id);
                setIsNowPlayingOpen(false);
              }}
              className="text-xs font-semibold text-white hover:underline truncate w-full"
            >
              {currentSong.album_title}
            </button>
          ) : (
            <span className="text-xs font-semibold text-white truncate w-full">
              {currentSong.album_title || 'Now Playing'}
            </span>
          )}
        </div>

        <button
          onClick={handleShare}
          className="w-10 h-10 flex items-center justify-center rounded-full text-white hover:bg-[#282828] active:scale-95"
          aria-label="Share song"
        >
          <Share2 size={20} />
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col justify-between px-6 py-4 max-w-md mx-auto w-full">
        {/* Large Album Artwork with Neutral Gradient Fallback */}
        <div className="w-full aspect-square my-auto flex items-center justify-center">
          <div className="w-full h-full max-w-[340px] max-h-[340px] mx-auto rounded-lg overflow-hidden border border-[#242424] bg-[#181818] shadow-2xl">
            <CoverArtTile
              src={currentSong.cover_art_url}
              title={currentSong.title}
              type="song"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Track Title, Artist, & Favorite Row */}
        <div className="flex items-center justify-between mt-4">
          <div className="min-w-0 flex-1 pr-3">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
              {currentSong.title}
            </h1>
            {currentSong.artist_name && (
              <button
                onClick={() => {
                  if (currentSong.artist_id) {
                    navigateToArtist(currentSong.artist_id);
                    setIsNowPlayingOpen(false);
                  }
                }}
                className="text-sm font-medium text-[#b3b3b3] hover:text-white hover:underline truncate mt-0.5 block text-left"
              >
                {currentSong.artist_name}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => openAddToPlaylistModal(currentSong)}
              className="w-11 h-11 flex items-center justify-center rounded-full text-[#a7a7a7] hover:text-[#1ed760] active:scale-90 transition-transform"
              title="Add to Playlist"
              aria-label="Add to Playlist"
            >
              <Plus size={24} />
            </button>

            <button
              onClick={() => toggleFavorite(currentSong.id)}
              className="w-11 h-11 flex items-center justify-center rounded-full text-[#a7a7a7] hover:text-white active:scale-90 transition-transform"
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                size={24}
                className={isFav ? 'text-[#1ed760] fill-[#1ed760]' : 'text-[#a7a7a7]'}
              />
            </button>
          </div>
        </div>

        {/* Seek Scrubber */}
        <div className="mt-5 space-y-1">
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={effectiveTime}
              onMouseDown={() => setIsSeeking(true)}
              onTouchStart={() => setIsSeeking(true)}
              onChange={handleSeekChange}
              onMouseUp={handleSeekCommit}
              onTouchEnd={handleSeekCommit}
              className="spotify-slider w-full cursor-pointer"
              aria-label="Seek track"
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-[#a7a7a7] pt-1">
            <span>{formatTime(effectiveTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls Row: Shuffle, Prev, Big Play, Next, Repeat */}
        <div className="flex items-center justify-between mt-3 px-2">
          {/* Shuffle Button */}
          <button
            onClick={toggleShuffle}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors active:scale-95 ${
              isShuffle ? 'text-[#1ed760]' : 'text-[#a7a7a7] hover:text-white'
            }`}
            aria-label={isShuffle ? 'Shuffle enabled' : 'Shuffle disabled'}
          >
            <Shuffle size={20} />
          </button>

          {/* Previous Track */}
          <button
            onClick={playPreviousSong}
            className="w-12 h-12 flex items-center justify-center rounded-full text-white hover:scale-105 active:scale-95 transition-transform"
            aria-label="Previous song"
          >
            <SkipBack size={26} className="fill-white" />
          </button>

          {/* Main Play / Pause Circle */}
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={28} className="fill-black" />
            ) : (
              <Play size={28} className="fill-black translate-x-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={playNextSong}
            className="w-12 h-12 flex items-center justify-center rounded-full text-white hover:scale-105 active:scale-95 transition-transform"
            aria-label="Next song"
          >
            <SkipForward size={26} className="fill-white" />
          </button>

          {/* Repeat Button */}
          <button
            onClick={toggleRepeat}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors active:scale-95 ${
              repeatMode !== 'off' ? 'text-[#1ed760]' : 'text-[#a7a7a7] hover:text-white'
            }`}
            aria-label={`Repeat mode: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 size={22} /> : <Repeat size={20} />}
          </button>
        </div>

        {/* Bottom Actions Row: Audio status, Sleep timer, Queue */}
        <div className="flex items-center justify-between pt-5 mt-2 border-t border-[#222222]">
          <div className="flex items-center gap-2 text-xs text-[#1ed760]">
            <Volume2 size={16} />
            <span className="font-medium">Live Supabase Audio</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Sleep timer button */}
            <button
              onClick={() => setIsSleepTimerOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors ${
                sleepTimerRemaining !== null
                  ? 'bg-[#1ed760]/20 text-[#1ed760] font-semibold'
                  : 'text-[#a7a7a7] hover:text-white'
              }`}
              title="Sleep Timer"
            >
              <Moon size={16} />
              {sleepTimerRemaining !== null && (
                <span className="font-mono text-[11px]">
                  {Math.ceil(sleepTimerRemaining / 60)}m
                </span>
              )}
            </button>

            {/* Queue sheet button */}
            <button
              onClick={() => setIsQueueOpen(true)}
              className="p-2 text-[#a7a7a7] hover:text-white"
              title="Queue"
              aria-label="Open queue"
            >
              <ListMusic size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Nested Modals */}
      <SleepTimerModal />
      <QueueSheet />
    </div>
  );
};
