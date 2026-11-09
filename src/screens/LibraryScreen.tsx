import React, { useState } from 'react';
import {
  Heart,
  Play,
  Plus,
  CheckCircle2,
  ListMusic,
  Share2,
  Users,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { CreatePlaylistModal } from '../components/Playlist/CreatePlaylistModal';
import { CoverArtTile } from '../components/Common/CoverArtTile';

export const LibraryScreen: React.FC = () => {
  const {
    songs,
    albums,
    artists,
    favorites,
    playlists,
    inAppShares,
    playSong,
    currentSong,
    navigateToArtist,
    navigateToAlbum,
    navigateToPlaylist,
    openShareModal,
    openAddToPlaylistModal,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'all' | 'playlists' | 'liked' | 'albums' | 'artists' | 'shared'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const likedSongList = songs.filter((s) => favorites.includes(s.id));

  const formatDuration = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const remaining = Math.floor(secs % 60);
    return `${mins}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div className="pb-36 px-4 sm:px-6 pt-3 space-y-6 max-w-5xl mx-auto select-none text-white">
      {/* Screen Title & Action */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Your Library
        </h1>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1ed760] text-black font-bold text-xs hover:bg-[#1fdf64] transition-colors"
        >
          <Plus size={15} className="stroke-[2.5]" />
          <span>New Playlist</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'all', label: 'All' },
          { id: 'playlists', label: `Playlists (${playlists.length})` },
          { id: 'liked', label: `Liked Songs (${favorites.length})` },
          { id: 'albums', label: `Albums (${albums.length})` },
          { id: 'artists', label: `Artists (${artists.length})` },
          { id: 'shared', label: `Shared with You (${inAppShares.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-black font-bold shadow-sm'
                : 'bg-[#242424] text-white hover:bg-[#2e2e2e]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Playlists Section (Shown in 'all' or 'playlists') */}
      {(activeTab === 'all' || activeTab === 'playlists') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <ListMusic size={18} className="text-[#1ed760]" />
              <span>Custom Playlists</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Create Playlist Shortcut Tile */}
            <div
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-3.5 p-3 rounded-xl bg-[#1e1e1e] hover:bg-[#282828] border border-[#2a2a2a] border-dashed cursor-pointer transition-colors group"
            >
              <div className="w-12 h-12 rounded-lg bg-[#282828] group-hover:bg-[#1ed760] group-hover:text-black text-[#1ed760] flex items-center justify-center transition-colors shrink-0">
                <Plus size={22} className="stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white group-hover:text-[#1ed760] transition-colors">
                  Create Playlist
                </div>
                <div className="text-xs text-[#a7a7a7]">Build your own playlist</div>
              </div>
            </div>

            {/* Playlists List */}
            {playlists.map((playlist) => {
              const count = playlist.song_ids.length;
              const firstSong = songs.find((s) => s.id === playlist.song_ids[0]);
              const cover = playlist.cover_art_url || firstSong?.cover_art_url;

              return (
                <div
                  key={playlist.id}
                  onClick={() => navigateToPlaylist(playlist.id)}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#181818] hover:bg-[#222222] border border-[#242424] cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-12 h-12 shrink-0">
                      <CoverArtTile
                        src={cover}
                        title={playlist.title}
                        type="playlist"
                        className="w-12 h-12"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-white group-hover:text-[#1ed760] truncate transition-colors">
                        {playlist.title}
                      </div>
                      <div className="text-xs text-[#a7a7a7] truncate mt-0.5">
                        Playlist · {count} {count === 1 ? 'song' : 'songs'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 pl-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() =>
                        openShareModal({
                          type: 'playlist',
                          id: playlist.id,
                          title: playlist.title,
                          subtitle: `${count} songs · Created by ${playlist.created_by || 'You'}`,
                          image_url: cover || undefined,
                        })
                      }
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#777] hover:text-[#1ed760] hover:bg-[#2c2c2c] transition-colors"
                      title="Share playlist"
                    >
                      <Share2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Liked Songs Tile (Shown in 'all' or 'liked') */}
      {(activeTab === 'all' || activeTab === 'liked') && (
        <div
          onClick={() => {
            if (likedSongList.length > 0) {
              playSong(likedSongList[0], likedSongList);
            }
          }}
          className="p-5 rounded-xl bg-gradient-to-br from-indigo-800 via-indigo-950 to-[#181818] border border-[#2b2b2b] flex items-center justify-between cursor-pointer group shadow-lg"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center shrink-0 shadow-md">
              <Heart size={26} className="text-white fill-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white tracking-tight">Liked Songs</h2>
              <p className="text-xs text-[#d1d5db] mt-0.5">
                {favorites.length} saved {favorites.length === 1 ? 'song' : 'songs'}
              </p>
            </div>
          </div>

          {likedSongList.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                playSong(likedSongList[0], likedSongList);
              }}
              className="w-11 h-11 rounded-full bg-[#1ed760] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0 shadow-lg"
              aria-label="Play liked songs"
            >
              <Play size={20} className="fill-black translate-x-0.5" />
            </button>
          )}
        </div>
      )}

      {/* Liked Songs Detailed Tracklist (if 'liked' tab selected) */}
      {activeTab === 'liked' && (
        <div className="space-y-1">
          {likedSongList.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#777]">
              No liked songs yet. Tap the heart icon on any song to save it here.
            </div>
          ) : (
            likedSongList.map((song, idx) => {
              const isCurrent = currentSong?.id === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => playSong(song, likedSongList)}
                  className="group flex items-center justify-between p-2 rounded-lg hover:bg-[#202020] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xs font-mono text-[#777] w-5 text-center">
                      {idx + 1}
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
                      {song.artist_name && (
                        <div className="text-xs text-[#a7a7a7] truncate">
                          {song.artist_name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-2" onClick={(e) => e.stopPropagation()}>
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
                      <Share2 size={16} />
                    </button>

                    {song.duration_seconds > 0 && (
                      <span className="text-xs font-mono text-[#a7a7a7] pl-1">
                        {formatDuration(song.duration_seconds)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* In-App Shared With You Section */}
      {(activeTab === 'shared' || (activeTab === 'all' && inAppShares.length > 0)) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Users size={18} className="text-[#1ed760]" />
              <span>Shared with You ({inAppShares.length})</span>
            </h2>
          </div>

          {inAppShares.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#777] bg-[#141414] rounded-xl border border-[#242424]">
              No items shared with you yet. Tap Share on any song, album, or playlist to send to other listeners.
            </div>
          ) : (
            <div className="space-y-2">
              {inAppShares.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3.5 rounded-xl bg-[#181818] border border-[#282828] flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-12 h-12 shrink-0">
                      <CoverArtTile
                        src={msg.target.image_url}
                        title={msg.target.title}
                        type={msg.target.type}
                        className="w-12 h-12"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[11px] text-[#1ed760] font-semibold">
                        <span>From {msg.senderName}</span>
                        <span className="text-[#666]">·</span>
                        <span className="text-[#888] capitalize">{msg.target.type}</span>
                      </div>
                      <div className="text-sm font-bold text-white truncate mt-0.5">
                        {msg.target.title}
                      </div>
                      {msg.note && (
                        <p className="text-xs text-[#a7a7a7] italic truncate mt-0.5">
                          "{msg.note}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        if (msg.target.type === 'song') {
                          const s = songs.find((song) => song.id === msg.target.id);
                          if (s) playSong(s);
                        } else if (msg.target.type === 'album') {
                          navigateToAlbum(msg.target.id);
                        } else if (msg.target.type === 'artist') {
                          navigateToArtist(msg.target.id);
                        } else if (msg.target.type === 'playlist') {
                          navigateToPlaylist(msg.target.id);
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-[#1ed760] text-black font-bold text-xs hover:bg-[#1fdf64] transition-colors"
                    >
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Albums Section (Shown in 'all' or 'albums') */}
      {(activeTab === 'all' || activeTab === 'albums') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">Albums & Collections</h2>
          </div>

          {albums.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No albums yet.
            </div>
          ) : (
            <div className="space-y-1">
              {albums.map((album) => (
                <div
                  key={album.id}
                  onClick={() => navigateToAlbum(album.id)}
                  className="group flex items-center justify-between p-2 rounded-lg hover:bg-[#202020] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 shrink-0">
                      <CoverArtTile
                        src={album.cover_art_url}
                        title={album.title}
                        type="album"
                        className="w-12 h-12"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-white group-hover:text-[#1ed760] truncate transition-colors">
                        {album.title}
                      </div>
                      <div className="text-xs text-[#a7a7a7] truncate">
                        {[album.release_type, album.artist_name].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
                      className="p-1.5 text-[#777] hover:text-[#1ed760] transition-colors"
                      title="Share album"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Artists Section (Shown in 'all' or 'artists') */}
      {(activeTab === 'all' || activeTab === 'artists') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">Artists</h2>
          </div>

          {artists.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No artists yet.
            </div>
          ) : (
            <div className="space-y-1">
              {artists.map((artist) => (
                <div
                  key={artist.id}
                  onClick={() => navigateToArtist(artist.id)}
                  className="group flex items-center justify-between p-2 rounded-lg hover:bg-[#202020] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 shrink-0">
                      <CoverArtTile
                        src={artist.image_url}
                        title={artist.name}
                        type="artist"
                        shape="circle"
                        className="w-12 h-12"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-white group-hover:text-[#1ed760] truncate transition-colors flex items-center gap-1">
                        <span>{artist.name}</span>
                        {artist.verified && <CheckCircle2 size={13} className="text-[#1ed760]" />}
                      </div>
                      <div className="text-xs text-[#a7a7a7]">Artist</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() =>
                        openShareModal({
                          type: 'artist',
                          id: artist.id,
                          title: artist.name,
                          subtitle: 'Artist',
                          image_url: artist.image_url || undefined,
                        })
                      }
                      className="p-1.5 text-[#777] hover:text-[#1ed760] transition-colors"
                      title="Share artist profile"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Playlist Modal */}
      {isCreateOpen && (
        <CreatePlaylistModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      )}
    </div>
  );
};
