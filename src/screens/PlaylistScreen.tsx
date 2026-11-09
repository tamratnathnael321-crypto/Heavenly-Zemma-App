import React, { useState } from 'react';
import {
  Play,
  Pause,
  Shuffle,
  Share2,
  Trash2,
  Edit2,
  Clock,
  Heart,
  ChevronUp,
  ChevronDown,
  ListMusic,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Song } from '../types';
import { CoverArtTile } from '../components/Common/CoverArtTile';

export const PlaylistScreen: React.FC = () => {
  const {
    selectedPlaylistId,
    playlists,
    songs,
    playSong,
    currentSong,
    isPlaying,
    togglePlay,
    isFavorite,
    toggleFavorite,
    openShareModal,
    updatePlaylist,
    deletePlaylist,
    removeSongFromPlaylist,
    reorderPlaylistSongs,
    setActiveScreen,
    showToast,
  } = useMusic();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const playlist = playlists.find((p) => p.id === selectedPlaylistId) || playlists[0];
  if (!playlist) {
    return (
      <div className="py-24 text-center text-[#a7a7a7] space-y-3">
        <p>Playlist not found.</p>
        <button
          onClick={() => setActiveScreen('library')}
          className="px-4 py-2 rounded-full bg-[#242424] text-white text-xs font-bold"
        >
          Back to Library
        </button>
      </div>
    );
  }

  // Resolve playlist songs in stored order
  const playlistSongs: Song[] = playlist.song_ids
    .map((id) => songs.find((s) => s.id === id))
    .filter((s): s is Song => Boolean(s));

  const totalDuration = playlistSongs.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);

  const formatTotalTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    return `${mins} min`;
  };

  const formatDuration = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const remaining = Math.floor(secs % 60);
    return `${mins}:${remaining.toString().padStart(2, '0')}`;
  };

  const isCurrentPlaylistPlaying =
    isPlaying && currentSong && playlistSongs.some((s) => s.id === currentSong.id);

  const handlePlayAll = () => {
    if (playlistSongs.length === 0) {
      showToast('Playlist is empty. Add songs first.');
      return;
    }
    if (isCurrentPlaylistPlaying) {
      togglePlay();
    } else {
      playSong(playlistSongs[0], playlistSongs);
    }
  };

  const handleShufflePlay = () => {
    if (playlistSongs.length === 0) return;
    const shuffled = [...playlistSongs].sort(() => Math.random() - 0.5);
    playSong(shuffled[0], shuffled);
    showToast(`Shuffling "${playlist.title}"`);
  };

  const handleOpenEdit = () => {
    setEditTitle(playlist.title);
    setEditDesc(playlist.description || '');
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    updatePlaylist(playlist.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
    });
    setIsEditing(false);
    showToast('Playlist updated');
  };

  const handleDelete = () => {
    deletePlaylist(playlist.id);
    setShowDeleteConfirm(false);
    setActiveScreen('library');
  };

  const handleSharePlaylist = () => {
    openShareModal({
      type: 'playlist',
      id: playlist.id,
      title: playlist.title,
      subtitle: `${playlistSongs.length} songs · Created by ${playlist.created_by || 'You'}`,
      image_url: playlist.cover_art_url || playlistSongs[0]?.cover_art_url || undefined,
    });
  };

  const coverImage = playlist.cover_art_url || playlistSongs[0]?.cover_art_url;

  return (
    <div className="pb-36 px-4 sm:px-6 pt-2 space-y-6 max-w-5xl mx-auto select-none text-white">
      {/* Playlist Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 pt-2">
        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl overflow-hidden shadow-2xl bg-[#181818] border border-[#242424] shrink-0 relative group">
          <CoverArtTile
            src={coverImage}
            title={playlist.title}
            type="playlist"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Metadata Details */}
        <div className="space-y-2 text-center sm:text-left min-w-0 flex-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1ed760]">
            Playlist
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            {playlist.title}
          </h1>

          {playlist.description && (
            <p className="text-xs sm:text-sm text-[#b3b3b3] line-clamp-2 leading-relaxed">
              {playlist.description}
            </p>
          )}

          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-[#d1d5db] pt-1">
            <span className="font-bold text-white">{playlist.created_by || 'You'}</span>
            <span>·</span>
            <span>
              {playlistSongs.length} {playlistSongs.length === 1 ? 'song' : 'songs'}
            </span>
            {playlistSongs.length > 0 && (
              <>
                <span>·</span>
                <span>{formatTotalTime(totalDuration)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Controls Row */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayAll}
            disabled={playlistSongs.length === 0}
            className="w-14 h-14 rounded-full bg-[#1ed760] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl shrink-0 disabled:opacity-40"
            aria-label="Play all songs"
          >
            {isCurrentPlaylistPlaying ? (
              <Pause size={24} className="fill-black" />
            ) : (
              <Play size={24} className="fill-black translate-x-0.5" />
            )}
          </button>

          <button
            onClick={handleShufflePlay}
            disabled={playlistSongs.length === 0}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#a7a7a7] hover:text-white hover:bg-[#222] transition-colors disabled:opacity-40"
            title="Shuffle play"
          >
            <Shuffle size={20} />
          </button>

          <button
            onClick={handleSharePlaylist}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#a7a7a7] hover:text-[#1ed760] hover:bg-[#222] transition-colors"
            title="Share Playlist"
          >
            <Share2 size={19} />
          </button>

          <button
            onClick={handleOpenEdit}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#a7a7a7] hover:text-white hover:bg-[#222] transition-colors"
            title="Edit Playlist details"
          >
            <Edit2 size={17} />
          </button>
        </div>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-xs text-[#a7a7a7] hover:text-red-400 p-2 flex items-center gap-1.5 transition-colors"
          title="Delete Playlist"
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline">Delete Playlist</span>
        </button>
      </div>

      {/* Tracklist Table */}
      <div className="space-y-1 pt-2">
        <div className="flex items-center justify-between text-xs font-semibold text-[#a7a7a7] px-3 py-2 border-b border-[#242424]">
          <div className="flex items-center gap-4">
            <span className="w-6 text-center">#</span>
            <span>Title</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hidden sm:inline text-[11px]">Reorder / Actions</span>
            <Clock size={15} />
          </div>
        </div>

        {playlistSongs.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-[#141414] rounded-xl border border-[#242424] mt-2">
            <ListMusic size={36} className="mx-auto text-[#666]" />
            <h3 className="text-base font-bold text-white">This playlist is empty</h3>
            <p className="text-xs text-[#a7a7a7] max-w-xs mx-auto">
              Add songs from Home, Search, or Albums to listen here.
            </p>
            <button
              onClick={() => setActiveScreen('search')}
              className="px-4 py-2 rounded-full bg-[#1ed760] text-black font-bold text-xs hover:bg-[#1fdf64] transition-colors"
            >
              Search & Add Songs
            </button>
          </div>
        ) : (
          playlistSongs.map((song: Song, idx: number) => {
            const isCurrent = currentSong?.id === song.id;
            const isFav = isFavorite(song.id);

            return (
              <div
                key={`${song.id}-${idx}`}
                className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-[#202020] transition-colors"
              >
                <div
                  onClick={() => playSong(song, playlistSongs)}
                  className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                >
                  <span
                    className={`text-xs font-mono w-6 text-center shrink-0 ${
                      isCurrent ? 'text-[#1ed760] font-bold' : 'text-[#777]'
                    }`}
                  >
                    {isCurrent && isPlaying ? (
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1ed760] animate-pulse" />
                    ) : (
                      idx + 1
                    )}
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

                <div className="flex items-center gap-2 pl-3">
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => reorderPlaylistSongs(playlist.id, idx, idx - 1)}
                      disabled={idx === 0}
                      className="p-1 text-[#777] hover:text-white disabled:opacity-20 transition-colors"
                      title="Move up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => reorderPlaylistSongs(playlist.id, idx, idx + 1)}
                      disabled={idx === playlistSongs.length - 1}
                      className="p-1 text-[#777] hover:text-white disabled:opacity-20 transition-colors"
                      title="Move down"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>

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
                      size={15}
                      className={isFav ? 'text-[#1ed760] fill-[#1ed760]' : ''}
                    />
                  </button>

                  <button
                    onClick={() => removeSongFromPlaylist(playlist.id, idx)}
                    className="p-1.5 text-[#777] hover:text-red-400 transition-colors"
                    title="Remove from playlist"
                  >
                    <Trash2 size={15} />
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

      {/* Edit Playlist Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 select-none">
          <div className="w-full max-w-sm bg-[#181818] border border-[#282828] rounded-2xl overflow-hidden shadow-2xl text-white">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#242424] bg-[#141414]">
              <h3 className="text-base font-bold text-white tracking-tight">Edit Details</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#a7a7a7] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#a7a7a7]">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full h-10 px-3.5 rounded-lg bg-[#242424] text-white text-xs placeholder-[#777] border border-[#333] focus:outline-none focus:border-[#1ed760]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#a7a7a7]">
                  Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-lg bg-[#242424] text-white text-xs placeholder-[#777] border border-[#333] focus:outline-none focus:border-[#1ed760] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#a7a7a7] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#1ed760] text-black font-bold text-xs hover:bg-[#1fdf64] transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 select-none">
          <div className="w-full max-w-sm bg-[#181818] border border-[#282828] rounded-2xl p-5 text-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle size={24} />
              <h3 className="text-base font-bold text-white">Delete this playlist?</h3>
            </div>
            <p className="text-xs text-[#b3b3b3]">
              Are you sure you want to delete <span className="text-white font-semibold">"{playlist.title}"</span>? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#a7a7a7] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
