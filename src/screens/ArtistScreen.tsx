import React, { useState } from 'react';
import {
  Play,
  Pause,
  Heart,
  CheckCircle2,
  Share2,
  Plus,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { CoverArtTile } from '../components/Common/CoverArtTile';

export const ArtistScreen: React.FC = () => {
  const {
    selectedArtistId,
    artists,
    songs,
    albums,
    playSong,
    currentSong,
    isPlaying,
    togglePlay,
    isFavorite,
    toggleFavorite,
    navigateToAlbum,
    openShareModal,
    openAddToPlaylistModal,
    showToast,
  } = useMusic();

  const [isFollowing, setIsFollowing] = useState(false);

  const artist = artists.find((a) => a.id === selectedArtistId) || (selectedArtistId ? null : artists[0]);
  if (!artist) {
    return (
      <div className="py-24 text-center text-neutral-400 select-none">
        <p className="text-sm">Artist not found or loading...</p>
      </div>
    );
  }

  // Pure queries: songs and albums belonging strictly to this artist
  const artistSongs = songs.filter((s) => s.artist_id === artist.id);
  const artistAlbums = albums.filter((al) => al.artist_id === artist.id);

  const isCurrentArtistPlaying =
    isPlaying && currentSong && artistSongs.some((s) => s.id === currentSong.id);

  const handleFollowToggle = () => {
    setIsFollowing((prev) => !prev);
    showToast(!isFollowing ? `Following ${artist.name}` : `Unfollowed ${artist.name}`);
  };

  const handlePlayArtist = () => {
    if (artistSongs.length === 0) return;
    if (isCurrentArtistPlaying) {
      togglePlay();
    } else {
      playSong(artistSongs[0], artistSongs);
    }
  };

  const formatDuration = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const remaining = Math.floor(secs % 60);
    return `${mins}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div className="pb-32 select-none text-white max-w-5xl mx-auto">
      {/* Hero Banner Header */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-[#181818]">
        <CoverArtTile
          src={artist.image_url}
          title={artist.name}
          type="artist"
          shape="square"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 space-y-1">
          {artist.verified && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1ed760]">
              <CheckCircle2 size={16} />
              <span>Verified Artist</span>
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
            {artist.name}
          </h1>
        </div>
      </div>

      <div className="px-4 sm:px-6 pt-5 space-y-7">
        {/* Action Controls Row: Big Play, Follow, Share */}
        <div className="flex items-center gap-4">
          {artistSongs.length > 0 && (
            <button
              onClick={handlePlayArtist}
              className="w-14 h-14 rounded-full bg-[#1ed760] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl shrink-0"
              aria-label="Play artist songs"
            >
              {isCurrentArtistPlaying ? (
                <Pause size={24} className="fill-black" />
              ) : (
                <Play size={24} className="fill-black translate-x-0.5" />
              )}
            </button>
          )}

          <button
            onClick={handleFollowToggle}
            className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
              isFollowing
                ? 'border-white text-white bg-transparent hover:border-red-400 hover:text-red-400'
                : 'border-[#777] text-white hover:border-white'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>

          <button
            onClick={() =>
              openShareModal({
                type: 'artist',
                id: artist.id,
                title: artist.name,
                subtitle: 'Artist Profile',
                image_url: artist.image_url || undefined,
              })
            }
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#a7a7a7] hover:text-[#1ed760] transition-colors"
            title="Share artist profile"
          >
            <Share2 size={19} />
          </button>
        </div>

        {/* Songs List */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-white">Songs</h2>

          {artistSongs.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No songs yet for this artist.
            </div>
          ) : (
            <div className="space-y-1">
              {artistSongs.map((song, idx) => {
                const isCurrent = currentSong?.id === song.id;
                const isFav = isFavorite(song.id);
                return (
                  <div
                    key={song.id}
                    onClick={() => playSong(song, artistSongs)}
                    className="group flex items-center justify-between p-2 rounded-lg hover:bg-[#202020] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className={`text-xs font-mono w-5 text-center shrink-0 ${
                          isCurrent ? 'text-[#1ed760] font-bold' : 'text-[#777]'
                        }`}
                      >
                        {song.track_number || idx + 1}
                      </span>
                      <div className="w-10 h-10 shrink-0">
                        <CoverArtTile
                          src={song.cover_art_url}
                          title={song.title}
                          type="song"
                          className="w-10 h-10"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-sm font-medium truncate ${
                            isCurrent ? 'text-[#1ed760] font-semibold' : 'text-white'
                          }`}
                        >
                          {song.title}
                        </div>
                        {song.album_title && (
                          <div className="text-xs text-[#a7a7a7] truncate">
                            {song.album_title}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1.5 pl-2"
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
                            subtitle: artist.name,
                            image_url: song.cover_art_url || undefined,
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
              })}
            </div>
          )}
        </div>

        {/* Discography / Albums */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-white">Albums</h2>
          {artistAlbums.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No albums yet for this artist.
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
              {artistAlbums.map((album) => (
                <div
                  key={album.id}
                  onClick={() => navigateToAlbum(album.id)}
                  className="group w-36 sm:w-44 shrink-0 p-3 rounded-lg bg-[#181818] hover:bg-[#242424] transition-colors cursor-pointer border border-[#202020]"
                >
                  <div className="w-full aspect-square rounded-md overflow-hidden bg-[#121212] mb-3">
                    <CoverArtTile
                      src={album.cover_art_url}
                      title={album.title}
                      type="album"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform"
                    />
                  </div>
                  <div className="text-sm font-bold text-white truncate">{album.title}</div>
                  {(album.release_type || album.release_date) && (
                    <div className="text-xs text-[#a7a7a7] truncate mt-0.5">
                      {[album.release_type, album.release_date?.slice(0, 4)].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Artist Bio Section */}
        {artist.bio && (
          <div className="p-5 rounded-xl bg-[#181818] border border-[#242424] space-y-2">
            <h3 className="text-base font-bold text-white tracking-tight">About</h3>
            <p className="text-xs sm:text-sm text-[#b3b3b3] leading-relaxed">{artist.bio}</p>
          </div>
        )}
      </div>
    </div>
  );
};
