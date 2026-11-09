import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { CreatePlaylistModal } from './CreatePlaylistModal';
import { CoverArtTile } from '../Common/CoverArtTile';

export const AddToPlaylistModal: React.FC = () => {
  const {
    isAddToPlaylistOpen,
    closeAddToPlaylistModal,
    songToAddToPlaylist,
    playlists,
    addSongToPlaylist,
    removeSongFromPlaylist,
    showToast,
  } = useMusic();

  const [isCreatingNew, setIsCreatingNew] = useState(false);

  if (!isAddToPlaylistOpen || !songToAddToPlaylist) return null;

  const handleToggleSongInPlaylist = (playlistId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const existingIndex = playlist.song_ids.indexOf(songToAddToPlaylist.id);
    if (existingIndex !== -1) {
      removeSongFromPlaylist(playlistId, existingIndex);
      showToast(`Removed from "${playlist.title}"`);
    } else {
      addSongToPlaylist(playlistId, songToAddToPlaylist.id);
      showToast(`Added to "${playlist.title}"`);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 select-none">
        <div className="w-full sm:max-w-md bg-[#181818] border border-[#282828] rounded-t-2xl sm:rounded-2xl overflow-hidden pb-safe flex flex-col max-h-[85vh] text-white">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#242424] bg-[#141414]">
            <div className="min-w-0 flex-1 pr-3">
              <h3 className="text-base font-bold text-white tracking-tight">Add to Playlist</h3>
              <p className="text-xs text-[#1ed760] truncate font-medium mt-0.5">
                {songToAddToPlaylist.title}
                {songToAddToPlaylist.artist_name ? ` · ${songToAddToPlaylist.artist_name}` : ''}
              </p>
            </div>
            <button
              onClick={closeAddToPlaylistModal}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#a7a7a7] hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* List of Playlists */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
            {/* Create New Playlist Button */}
            <button
              onClick={() => setIsCreatingNew(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#242424] hover:bg-[#2c2c2c] transition-colors border border-[#333]"
            >
              <div className="w-10 h-10 rounded-lg bg-[#1ed760] text-black flex items-center justify-center shrink-0">
                <Plus size={20} className="stroke-[2.5]" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <div className="text-sm font-bold text-white">New Playlist</div>
                <div className="text-[11px] text-[#a7a7a7]">Create with this song</div>
              </div>
            </button>

            {/* Playlists */}
            <div className="pt-2 space-y-1">
              {playlists.map((playlist) => {
                const isContained = playlist.song_ids.includes(songToAddToPlaylist.id);
                return (
                  <button
                    key={playlist.id}
                    onClick={() => handleToggleSongInPlaylist(playlist.id)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-[#242424] transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-11 h-11 shrink-0">
                        <CoverArtTile
                          src={playlist.cover_art_url}
                          title={playlist.title}
                          type="playlist"
                          className="w-11 h-11"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-sm font-semibold truncate ${
                            isContained ? 'text-[#1ed760]' : 'text-white'
                          }`}
                        >
                          {playlist.title}
                        </div>
                        <div className="text-xs text-[#a7a7a7] truncate">
                          {playlist.song_ids.length} {playlist.song_ids.length === 1 ? 'song' : 'songs'}
                        </div>
                      </div>
                    </div>

                    <div className="pl-3">
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                          isContained
                            ? 'bg-[#1ed760] border-[#1ed760] text-black'
                            : 'border-[#555] group-hover:border-white'
                        }`}
                      >
                        {isContained && <Check size={14} className="stroke-[3]" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Nested Create Playlist modal with initial song */}
      {isCreatingNew && (
        <CreatePlaylistModal
          isOpen={isCreatingNew}
          onClose={() => {
            setIsCreatingNew(false);
            closeAddToPlaylistModal();
          }}
          initialSongId={songToAddToPlaylist.id}
        />
      )}
    </>
  );
};
