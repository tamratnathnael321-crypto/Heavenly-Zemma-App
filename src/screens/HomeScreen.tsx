import React from 'react';
import { Play, Heart, CheckCircle2, ChevronRight, Share2, KeyRound } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { SongCardSkeleton } from '../components/Common/Toast';
import { CoverArtTile } from '../components/Common/CoverArtTile';
import { isSupabaseConfigured } from '../services/supabase';

export const HomeScreen: React.FC = () => {
  const {
    songs,
    albums,
    artists,
    recommendedSongs,
    featuredArtists,
    playSong,
    currentSong,
    isPlaying,
    togglePlay,
    navigateToArtist,
    navigateToAlbum,
    openShareModal,
    setActiveScreen,
    isLoading,
  } = useMusic();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Quick shortcuts (first 6 songs from live database)
  const quickItems = songs.slice(0, 6);

  // Recommended tracks: built strictly from recommended_songs query joined with songs
  const recommendedTracks = recommendedSongs
    .map((rec) => rec.song || songs.find((s) => s.id === rec.song_id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  // Featured artists: built strictly from featured_artists query joined with artists
  const featuredArtistList = featuredArtists
    .map((feat) => feat.artist || artists.find((a) => a.id === feat.artist_id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  // Hero feature track (first song from database if available)
  const heroSong = songs[0];

  const hasConfiguredKey = isSupabaseConfigured();

  return (
    <div className="pb-32 px-4 sm:px-6 pt-2 space-y-7 max-w-5xl mx-auto select-none">
      {/* Time Greeting */}
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {getGreeting()}
        </h1>
      </div>

      {/* Supabase Anon Key Notice if not configured in environment */}
      {!hasConfiguredKey && (
        <div className="p-4 rounded-xl bg-[#181818] border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-[#1ed760] flex items-center justify-center shrink-0">
              <KeyRound size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Live Supabase Connection</p>
              <p className="text-xs text-neutral-400">
                Connect your Supabase anon key in Settings or via SUPABASE_ANON_KEY to stream live music.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveScreen('settings')}
            className="px-4 py-1.5 rounded-full bg-[#1ed760] text-black text-xs font-bold hover:scale-105 active:scale-95 transition-transform shrink-0"
          >
            Configure Key
          </button>
        </div>
      )}

      {/* 6-Grid Quick Shortcuts */}
      {quickItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* Liked songs quick card */}
          <div
            onClick={() => setActiveScreen('library')}
            className="group flex items-center bg-[#1e1e1e] hover:bg-[#282828] rounded-md overflow-hidden transition-colors cursor-pointer border border-[#282828]"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-emerald-500 flex items-center justify-center shrink-0">
              <Heart size={20} className="text-white fill-white" />
            </div>
            <span className="text-xs font-bold text-white px-3 truncate flex-1">
              Liked Songs
            </span>
          </div>

          {quickItems.map((song) => {
            const isCurrentActive = currentSong?.id === song.id;
            return (
              <div
                key={song.id}
                onClick={() => playSong(song, songs)}
                className="group flex items-center justify-between bg-[#1e1e1e] hover:bg-[#282828] rounded-md overflow-hidden transition-colors cursor-pointer border border-[#282828] pr-2"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <div className="w-12 h-12 shrink-0">
                    <CoverArtTile
                      src={song.cover_art_url}
                      title={song.title}
                      type="song"
                      className="w-12 h-12 rounded-none"
                    />
                  </div>
                  <span
                    className={`text-xs font-bold px-3 truncate flex-1 ${
                      isCurrentActive ? 'text-[#1ed760]' : 'text-white'
                    }`}
                  >
                    {song.title}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isCurrentActive) {
                      togglePlay();
                    } else {
                      playSong(song, songs);
                    }
                  }}
                  className={`w-8 h-8 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-md transition-all shrink-0 ${
                    isCurrentActive && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  aria-label="Play song"
                >
                  <Play size={15} className="fill-black translate-x-0.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Hero Spotlight Card (Only rendered when live songs exist in the database) */}
      {heroSong && (
        <div className="relative rounded-xl overflow-hidden border border-[#282828] bg-[#141414] group">
          <div className="relative h-48 sm:h-56 w-full overflow-hidden">
            <CoverArtTile
              src={heroSong.cover_art_url}
              title={heroSong.title}
              type="song"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between">
            <div className="min-w-0 flex-1 pr-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1ed760] flex items-center gap-1.5 mb-1">
                <span>Featured Track</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                {heroSong.title}
              </h2>
              {(heroSong.artist_name || heroSong.album_title) && (
                <p className="text-xs text-[#b3b3b3] truncate mt-0.5">
                  {[heroSong.artist_name, heroSong.album_title].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() =>
                  openShareModal({
                    type: 'song',
                    id: heroSong.id,
                    title: heroSong.title,
                    subtitle: [heroSong.artist_name, heroSong.album_title].filter(Boolean).join(' · '),
                    image_url: heroSong.cover_art_url || undefined,
                  })
                }
                className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors border border-white/20"
                title="Share track"
              >
                <Share2 size={18} />
              </button>

              <button
                onClick={() => playSong(heroSong, songs)}
                className="w-12 h-12 rounded-full bg-[#1ed760] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl"
                aria-label={`Play ${heroSong.title}`}
              >
                <Play size={22} className="fill-black translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Horizontal Rail: Recommended Songs (Read purely from recommended_songs) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Recommended Songs
          </h2>
          {recommendedTracks.length > 0 && (
            <button
              onClick={() => setActiveScreen('search')}
              className="text-xs text-[#a7a7a7] hover:text-white font-semibold flex items-center gap-0.5"
            >
              <span>See all</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {isLoading && recommendedTracks.length === 0 ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SongCardSkeleton key={i} />
            ))}
          </div>
        ) : recommendedTracks.length === 0 ? (
          <div className="p-6 rounded-lg bg-[#121212] border border-[#202020] text-center">
            <p className="text-sm font-semibold text-neutral-400">No recommended songs yet</p>
            <p className="text-xs text-neutral-500 mt-1">
              Add rows to the recommended_songs table in your Supabase database.
            </p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
            {recommendedTracks.map((song) => {
              const isCurrent = currentSong?.id === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => playSong(song, recommendedTracks)}
                  className="group relative w-36 sm:w-44 shrink-0 p-3 rounded-lg bg-[#181818] hover:bg-[#242424] transition-colors cursor-pointer border border-[#202020]"
                >
                  <div className="relative w-full aspect-square rounded-md overflow-hidden bg-[#121212] mb-3">
                    <CoverArtTile
                      src={song.cover_art_url}
                      title={song.title}
                      type="song"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playSong(song, recommendedTracks);
                      }}
                      className={`absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-lg transition-all ${
                        isCurrent && isPlaying
                          ? 'opacity-100 translate-y-0'
                          : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                      }`}
                      aria-label="Play track"
                    >
                      <Play size={18} className="fill-black translate-x-0.5" />
                    </button>
                  </div>

                  <div className="text-sm font-bold text-white truncate">{song.title}</div>
                  {song.artist_name && (
                    <div className="text-xs text-[#a7a7a7] truncate mt-0.5">
                      {song.artist_name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Horizontal Rail: Featured Artists (Read purely from featured_artists) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Featured Artists
          </h2>
          {featuredArtistList.length > 0 && (
            <button
              onClick={() => setActiveScreen('search')}
              className="text-xs text-[#a7a7a7] hover:text-white font-semibold flex items-center gap-0.5"
            >
              <span>See all</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {isLoading && featuredArtistList.length === 0 ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SongCardSkeleton key={i} />
            ))}
          </div>
        ) : featuredArtistList.length === 0 ? (
          <div className="p-6 rounded-lg bg-[#121212] border border-[#202020] text-center">
            <p className="text-sm font-semibold text-neutral-400">No featured artists yet</p>
            <p className="text-xs text-neutral-500 mt-1">
              Add rows to the featured_artists table in your Supabase database.
            </p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
            {featuredArtistList.map((artist) => (
              <div
                key={artist.id}
                onClick={() => navigateToArtist(artist.id)}
                className="group w-32 sm:w-36 shrink-0 p-3 rounded-lg bg-[#181818] hover:bg-[#242424] transition-colors cursor-pointer border border-[#202020] text-center"
              >
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full overflow-hidden bg-[#121212] mb-3 border border-[#2e2e2e]">
                  <CoverArtTile
                    src={artist.image_url}
                    title={artist.name}
                    type="artist"
                    shape="circle"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center justify-center gap-1">
                  <span>{artist.name}</span>
                  {artist.verified && (
                    <CheckCircle2 size={13} className="text-[#1ed760] shrink-0" />
                  )}
                </div>
                <div className="text-[11px] text-[#a7a7a7] mt-0.5">Artist</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Horizontal Rail: New Albums (Read purely from albums ordered by release_date) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Newest Albums
          </h2>
        </div>

        {isLoading && albums.length === 0 ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SongCardSkeleton key={i} />
            ))}
          </div>
        ) : albums.length === 0 ? (
          <div className="p-6 rounded-lg bg-[#121212] border border-[#202020] text-center">
            <p className="text-sm font-semibold text-neutral-400">No albums yet</p>
            <p className="text-xs text-neutral-500 mt-1">
              Add rows to the albums table in your Supabase database.
            </p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
            {albums.map((album) => (
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
      </section>
    </div>
  );
};
