import React, { useState } from 'react';
import {
  Play,
  Pause,
  Heart,
  Clock,
  CheckCircle2,
  Share2,
  Plus,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Song } from '../types';
import { CoverArtTile } from '../components/Common/CoverArtTile';

export const AlbumScreen: React.FC = () => {
  const {
    selectedAlbumId,
    albums,
    songs,
    playSong,
    currentSong,
    isPlaying,
    togglePlay,
    isFavorite,
    toggleFavorite,
    navigateToArtist,
    openShareModal,
    openAddToPlaylistModal,
    showToast,
  } = useMusic();

  const [isAlbumSaved, setIsAlbumSaved] = useState(false);

  const album = albums.find((a) => a.id === selectedAlbumId) || (selectedAlbumId ? null : albums[0]);
  if (!album) {
    return (
      <div className="py-24 text-center text-neutral-400 select-none">
        <p className="text-sm">Album not found or loading...</p>
      </div>
    );
  }

  // Pure query: songs belonging to this album, sorted strictly by track_number
  const albumSongs = songs
    .filter((s) => s.album_id === album.id)
    .sort((a, b) => a.track_number - b.track_number);

  const isCurrentAlbumPlaying =
    isPlaying && currentSong && albumSongs.some((s) => s.id === currentSong.id);

  const totalDuration = albumSongs.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
  const formatTotalTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    return `${mins} min`;
  };

  const formatDuration = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const remaining = Math.floor(secs % 60);
    return `${mins}:${remaining.toString().padStart(2, '0')}`;
  };

  const handlePlayAlbum = () => {
    if (albumSongs.length === 0) return;
    if (isCurrentAlbumPlaying) {
      togglePlay();
    } else {
      playSong(albumSongs[0], albumSongs);
    }
  };

  const handleToggleSaveAlbum = () => {
    setIsAlbumSaved((prev) => !prev);
    showToast(!isAlbumSaved ? `Saved "${album.title}" to library` : `Removed "${album.title}"`);
  };

  return (
    <div className="pb-32 px-4 sm:px-6 pt-2 space-y-6 max-w-5xl mx-auto select-none text-white">
      {/* Header with Album Cover & Metadata */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 pt-2">
        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-lg overflow-hidden shadow-2xl bg-[#181818] border border-[#242424] shrink-0">
          <CoverArtTile
            src={album.cover_art_url}
            title={album.title}
            type="album"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-1.5 text-center sm:text-left min-w-0 flex-1">
          {album.release_type && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#a7a7a7]">
              {album.release_type}
            </span>
          )}
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            {album.title}
          </h1>
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-[#d1d5db] pt-1">
            {album.artist_name && (
              <button
                onClick={() => {
                  if (album.artist_id) navigateToArtist(album.artist_id);
                }}
                className="font-bold text-white hover:underline"
              >
                {album.artist_name}
              </button>
            )}
            {album.release_date && (
              <>
                <span>·</span>
                <span>{album.release_date.slice(0, 4)}</span>
              </>
            )}
            {albumSongs.length > 0 && (
              <>
                <span>·</span>
                <span>
                  {albumSongs.length} {albumSongs.length === 1 ? 'song' : 'songs'}
                  {totalDuration > 0 ? `, ${formatTotalTime(totalDuration)}` : ''}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Controls: Big Play, Heart, Downloaded badge */}
      <div className="flex items-center gap-4 pt-2">
        {albumSongs.length > 0 && (
          <button
            onClick={handlePlayAlbum}
            className="w-14 h-14 rounded-full bg-[#1ed760] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl shrink-0"
            aria-label="Play album"
          >
            {isCurrentAlbumPlaying ? (
              <Pause size={24} className="fill-black" />
            ) : (
              <Play size={24} className="fill-black translate-x-0.5" />
            )}
          </button>
        )}

        <button
          onClick={handleToggleSaveAlbum}
          className="w-10 h-10 flex items-center justify-center rounded-full text-[#a7a7a7] hover:text-white transition-colors"
          aria-label={isAlbumSaved ? 'Saved album' : 'Save album'}
        >
          <Heart
            size={22}
            className={isAlbumSaved ? 'text-[#1ed760] fill-[#1ed760]' : ''}
          />
        </button>

        <button
          onClick={() =>
            openShareModal({
              type: 'album',
              id: album.id,
              title: album.title,
              subtitle: album.artist_name,
              image_url: album.cover_art_url || undefined,
            })
          }
          className="w-10 h-10 flex items-center justify-center rounded-full text-[#a7a7a7] hover:text-[#1ed760] transition-colors"
          title="Share album"
        >
          <Share2 size={20} />
        </button>
      </div>

      {/* Tracklist Table */}
      <div className="space-y-1 pt-2">
        {/* Table Header */}
        <div className="flex items-center justify-between text-xs font-semibold text-[#a7a7a7] px-3 py-2 border-b border-[#242424]">
          <div className="flex items-center gap-4">
            <span className="w-5 text-center">#</span>
            <span>Title</span>
          </div>
          <Clock size={15} />
        </div>

        {albumSongs.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            No songs found for this album in the database.
          </div>
        ) : (
          albumSongs.map((song: Song, idx: number) => {
            const isCurrent = currentSong?.id === song.id;
            const isFav = isFavorite(song.id);

            return (
              <div
                key={song.id}
                onClick={() => playSong(song, albumSongs)}
                className="group flex items-center justify-between p-3 rounded-lg hover:bg-[#202020] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <span
                    className={`text-xs font-mono w-5 text-center shrink-0 ${
                      isCurrent ? 'text-[#1ed760] font-bold' : 'text-[#777]'
                    }`}
                  >
                    {isCurrent && isPlaying ? (
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1ed760] animate-pulse" />
                    ) : (
                      song.track_number || idx + 1
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm font-medium truncate flex items-center gap-1.5 ${
                        isCurrent ? 'text-[#1ed760] font-bold' : 'text-white'
                      }`}
                    >
                      <span>{song.title}</span>
                      {song.is_explicit && (
                        <span className="text-[9px] bg-[#3a3a3a] text-[#b3b3b3] px-1 rounded font-bold">
                          E
                        </span>
                      )}
                    </div>
                    {song.artist_name && (
                      <div className="text-xs text-[#a7a7a7] truncate">
                        {song.artist_name}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className="flex items-center gap-1.5 pl-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => openAddToPlaylistModal(song)}
                    className="p-1.5 text-[#777] hover:text-[#1ed760] transition-colors"
                    title="Add to playlist"
                  >
                    <Plus size={16} />
                  </button>

                  <button
                    onClick={() =>
                      openShareModal({
                        type: 'song',
                        id: song.id,
                        title: song.title,
                        subtitle: song.artist_name || album.artist_name,
                        image_url: song.cover_art_url || album.cover_art_url || undefined,
                      })
                    }
                    className="p-1.5 text-[#777] hover:text-[#1ed760] transition-colors"
                    title="Share song"
                  >
                    <Share2 size={15} />
                  </button>

                  <button
                    onClick={() => toggleFavorite(song.id)}
                    className="p-1.5 text-[#777] hover:text-white"
                  >
                    <Heart
                      size={16}
                      className={isFav ? 'text-[#1ed760] fill-[#1ed760]' : ''}
                    />
                  </button>
                  {song.duration_seconds > 0 && (
                    <span className="text-xs font-mono text-[#a7a7a7] w-10 text-right">
                      {formatDuration(song.duration_seconds)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
