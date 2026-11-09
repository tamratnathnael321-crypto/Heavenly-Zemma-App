import React, { useState, useEffect, useTransition } from 'react';
import { Search, X, Heart, CheckCircle2, Share2, Plus } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Song, Artist, Album } from '../types';
import { searchSupabaseLive } from '../services/supabase';
import { CoverArtTile } from '../components/Common/CoverArtTile';

export const SearchScreen: React.FC = () => {
  const {
    songs,
    artists,
    albums,
    playSong,
    currentSong,
    isFavorite,
    toggleFavorite,
    navigateToArtist,
    navigateToAlbum,
    openShareModal,
    openAddToPlaylistModal,
  } = useMusic();

  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'songs' | 'artists' | 'albums'>('all');
  const [searchResults, setSearchResults] = useState<{
    songs: Song[];
    artists: Artist[];
    albums: Album[];
  }>({ songs: [], artists: [], albums: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [, startTransition] = useTransition();

  // Execute live search: attempts Supabase direct ilike query first, falls back to live loaded catalog filter
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSearchResults({ songs: [], artists: [], albums: [] });
      setIsSearching(false);
      return;
    }

    let isMounted = true;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const liveRes = await searchSupabaseLive(q);
        if (!isMounted) return;

        if (liveRes.songs.length > 0 || liveRes.albums.length > 0 || liveRes.artists.length > 0) {
          startTransition(() => {
            setSearchResults(liveRes);
            setIsSearching(false);
          });
          return;
        }
      } catch {
        // Fallback to local live catalog search
      }

      if (!isMounted) return;
      const lower = q.toLowerCase();
      const matchedSongs = songs.filter(
        (s) =>
          s.title.toLowerCase().includes(lower) ||
          (s.artist_name && s.artist_name.toLowerCase().includes(lower)) ||
          (s.album_title && s.album_title.toLowerCase().includes(lower))
      );

      const matchedArtists = artists.filter(
        (a) => a.name.toLowerCase().includes(lower) || (a.bio && a.bio.toLowerCase().includes(lower))
      );

      const matchedAlbums = albums.filter(
        (al) =>
          al.title.toLowerCase().includes(lower) ||
          (al.artist_name && al.artist_name.toLowerCase().includes(lower))
      );

      startTransition(() => {
        setSearchResults({
          songs: matchedSongs,
          artists: matchedArtists,
          albums: matchedAlbums,
        });
        setIsSearching(false);
      });
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [albums, artists, query, songs]);

  const hasResults =
    searchResults.songs.length > 0 ||
    searchResults.artists.length > 0 ||
    searchResults.albums.length > 0;

  const formatDuration = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const remaining = Math.floor(secs % 60);
    return `${mins}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div className="pb-32 px-4 sm:px-6 pt-3 space-y-5 max-w-5xl mx-auto select-none">
      {/* Search Input Box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a7a7a7]">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists, or albums..."
          className="w-full h-11 pl-10 pr-10 rounded-full bg-[#242424] text-white placeholder-[#8e8e8e] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#a7a7a7] hover:text-white"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Filter Tabs when Query is Active */}
      {query && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {(['all', 'songs', 'artists', 'albums'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap capitalize transition-colors ${
                filterType === type
                  ? 'bg-white text-black'
                  : 'bg-[#242424] text-white hover:bg-[#2e2e2e]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* Empty Query: Guidance */}
      {!query && (
        <div className="py-12 text-center space-y-2">
          <p className="text-sm font-bold text-white">Find your favorite music</p>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">
            Search live across all songs, artists, and albums in your database.
          </p>
        </div>
      )}

      {/* Query Active: Search Results */}
      {query && (
        <div className="space-y-6">
          {isSearching ? (
            <div className="py-12 text-center text-xs text-neutral-400">Searching...</div>
          ) : !hasResults ? (
            <div className="py-16 text-center space-y-2">
              <h3 className="text-base font-bold text-white">No results found for "{query}"</h3>
              <p className="text-xs text-[#a7a7a7]">
                Try searching by song title, artist name, or album title.
              </p>
            </div>
          ) : (
            <>
              {/* Songs Results */}
              {(filterType === 'all' || filterType === 'songs') &&
                searchResults.songs.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#a7a7a7] px-1">
                      Songs
                    </h3>
                    <div className="space-y-1">
                      {searchResults.songs.map((song) => {
                        const isCurrent = currentSong?.id === song.id;
                        const isFav = isFavorite(song.id);
                        return (
                          <div
                            key={song.id}
                            onClick={() => playSong(song, searchResults.songs)}
                            className="group flex items-center justify-between p-2 rounded-lg hover:bg-[#202020] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
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
                                {song.artist_name && (
                                  <div className="text-xs text-[#a7a7a7] truncate">
                                    {song.artist_name}
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
                                    subtitle: song.artist_name,
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
                  </div>
                )}

              {/* Artists Results */}
              {(filterType === 'all' || filterType === 'artists') &&
                searchResults.artists.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#a7a7a7] px-1">
                      Artists
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {searchResults.artists.map((artist) => (
                        <div
                          key={artist.id}
                          onClick={() => navigateToArtist(artist.id)}
                          className="p-3 rounded-lg bg-[#181818] hover:bg-[#222222] transition-colors cursor-pointer text-center border border-[#202020]"
                        >
                          <div className="w-20 h-20 mx-auto mb-2">
                            <CoverArtTile
                              src={artist.image_url}
                              title={artist.name}
                              type="artist"
                              shape="circle"
                              className="w-20 h-20"
                            />
                          </div>
                          <div className="text-xs font-bold text-white truncate flex items-center justify-center gap-1">
                            <span>{artist.name}</span>
                            {artist.verified && (
                              <CheckCircle2 size={12} className="text-[#1ed760]" />
                            )}
                          </div>
                          <span className="text-[10px] text-[#a7a7a7]">Artist</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Albums Results */}
              {(filterType === 'all' || filterType === 'albums') &&
                searchResults.albums.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#a7a7a7] px-1">
                      Albums
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {searchResults.albums.map((album) => (
                        <div
                          key={album.id}
                          onClick={() => navigateToAlbum(album.id)}
                          className="p-3 rounded-lg bg-[#181818] hover:bg-[#222222] transition-colors cursor-pointer border border-[#202020]"
                        >
                          <div className="w-full aspect-square mb-2">
                            <CoverArtTile
                              src={album.cover_art_url}
                              title={album.title}
                              type="album"
                              className="w-full h-full"
                            />
                          </div>
                          <div className="text-xs font-bold text-white truncate">{album.title}</div>
                          {album.artist_name && (
                            <span className="text-[10px] text-[#a7a7a7] truncate block">
                              {album.artist_name}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
