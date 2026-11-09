import React, { useState } from 'react';
import { X, ListMusic, Plus } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSongId?: string;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  initialSongId,
}) => {
  const { createPlaylist, showToast, navigateToPlaylist } = useMusic();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      showToast('Please enter a playlist title');
      return;
    }

    const newPlaylist = createPlaylist(trimmedTitle, description.trim(), initialSongId);
    showToast(`Created playlist "${newPlaylist.title}"`);
    setTitle('');
    setDescription('');
    onClose();
    navigateToPlaylist(newPlaylist.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="w-full max-w-sm bg-[#181818] border border-[#282828] rounded-2xl overflow-hidden shadow-2xl text-white animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#242424] bg-[#141414]">
          <div className="flex items-center gap-2">
            <ListMusic size={18} className="text-[#1ed760]" />
            <h3 className="text-base font-bold text-white tracking-tight">New Playlist</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#a7a7a7] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#a7a7a7]">
              Playlist Name *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My Sacred Mezmur Favorites"
              autoFocus
              required
              className="w-full h-11 px-3.5 rounded-lg bg-[#242424] text-white text-sm placeholder-[#777] border border-[#333] focus:outline-none focus:border-[#1ed760]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#a7a7a7]">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Give your playlist a peaceful description"
              rows={2}
              className="w-full p-3 rounded-lg bg-[#242424] text-white text-xs placeholder-[#777] border border-[#333] focus:outline-none focus:border-[#1ed760] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-[#a7a7a7] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-[#1ed760] text-black font-bold text-xs hover:bg-[#1fdf64] transition-colors"
            >
              Create Playlist
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
