import React, { useState } from 'react';
import {
  X,
  Home,
  Search,
  Library,
  Heart,
  Moon,
  LogOut,
  Radio,
  ListMusic,
  Plus,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { CreatePlaylistModal } from '../Playlist/CreatePlaylistModal';

export const DrawerMenu: React.FC = () => {
  const {
    isDrawerOpen,
    setIsDrawerOpen,
    setActiveScreen,
    setSelectedArtistId,
    setSelectedAlbumId,
    setSelectedPlaylistId,
    navigateToPlaylist,
    playlists,
    setIsSleepTimerOpen,
    sleepTimerRemaining,
    currentUser,
    isGuest,
    signOutUser,
    favorites,
  } = useMusic();

  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);

  if (!isDrawerOpen) return null;

  const handleNav = (screen: 'home' | 'search' | 'library' | 'settings') => {
    setSelectedArtistId(null);
    setSelectedAlbumId(null);
    setActiveScreen(screen);
    setIsDrawerOpen(false);
  };

  const handleLikedSongsNav = () => {
    setSelectedArtistId(null);
    setSelectedAlbumId(null);
    setActiveScreen('library');
    setIsDrawerOpen(false);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setIsDrawerOpen(false)}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* Slide-out Menu Sheet */}
      <aside
        className="fixed top-0 bottom-0 left-0 z-50 w-80 max-w-[85vw] bg-[#121212] border-r border-[#242424] flex flex-col pt-safe pb-safe shadow-2xl animate-in slide-in-from-left duration-200"
        role="dialog"
        aria-label="Navigation drawer"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#222222]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1ed760] text-black font-black flex items-center justify-center text-lg">
              HZ
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight leading-tight">
                Heavenly Zemma
              </h2>
              <span className="text-[11px] text-[#a7a7a7]">Sacred Music Streaming</span>
            </div>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-[#a7a7a7] hover:text-white hover:bg-[#222222]"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 bg-[#181818] border-b border-[#222222] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#282828] text-white flex items-center justify-center text-sm font-semibold shrink-0">
              {currentUser?.full_name ? currentUser.full_name[0].toUpperCase() : 'G'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">
                {currentUser?.full_name || 'Guest Listener'}
              </div>
              <div className="text-[11px] text-[#a7a7a7] truncate">
                {isGuest ? 'Guest Session' : currentUser?.email}
              </div>
            </div>
          </div>

          {isGuest ? (
            <button
              onClick={() => handleNav('settings')}
              className="text-xs text-[#1ed760] font-semibold hover:underline shrink-0"
            >
              Sign In
            </button>
          ) : (
            <button
              onClick={signOutUser}
              className="text-[#a7a7a7] hover:text-white p-1.5 rounded"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 text-sm no-scrollbar">
          {/* Main destinations */}
          <div className="pb-3 mb-2 border-b border-[#222222] space-y-1">
            <button
              onClick={() => handleNav('home')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white hover:bg-[#202020] transition-colors"
            >
              <Home size={18} className="text-[#a7a7a7]" />
              <span className="font-medium">Home</span>
            </button>
            <button
              onClick={() => handleNav('search')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white hover:bg-[#202020] transition-colors"
            >
              <Search size={18} className="text-[#a7a7a7]" />
              <span className="font-medium">Search & Explore</span>
            </button>
            <button
              onClick={() => handleNav('library')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white hover:bg-[#202020] transition-colors"
            >
              <Library size={18} className="text-[#a7a7a7]" />
              <span className="font-medium">Your Library</span>
            </button>
            <button
              onClick={handleLikedSongsNav}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-white hover:bg-[#202020] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Heart size={18} className="text-[#1ed760] fill-[#1ed760]" />
                <span className="font-medium">Liked Songs</span>
              </div>
              <span className="text-xs text-[#a7a7a7]">{favorites.length}</span>
            </button>
          </div>

          {/* Custom Playlists Section */}
          <div className="pb-3 mb-2 border-b border-[#222222] space-y-1">
            <div className="flex items-center justify-between px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#777]">
              <span>Your Playlists ({playlists.length})</span>
              <button
                onClick={() => setIsCreatePlaylistOpen(true)}
                className="text-[#1ed760] hover:underline flex items-center gap-1 font-bold lowercase first-letter:uppercase"
              >
                <Plus size={13} />
                <span>New</span>
              </button>
            </div>

            {playlists.slice(0, 5).map((pl) => (
              <button
                key={pl.id}
                onClick={() => {
                  navigateToPlaylist(pl.id);
                  setIsDrawerOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-white hover:bg-[#202020] transition-colors text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <ListMusic size={16} className="text-[#a7a7a7] shrink-0" />
                  <span className="truncate text-xs font-medium">{pl.title}</span>
                </div>
                <span className="text-[10px] text-[#777] shrink-0 pl-2">
                  {pl.song_ids.length}
                </span>
              </button>
            ))}
          </div>

          {/* Playback & Controls Section */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#777]">
              Playback & Settings
            </div>
            <button
              onClick={() => {
                setIsSleepTimerOpen(true);
                setIsDrawerOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-white hover:bg-[#202020] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Moon size={18} className="text-[#a7a7a7]" />
                <span className="font-medium">Sleep Timer</span>
              </div>
              {sleepTimerRemaining !== null ? (
                <span className="text-xs font-mono text-[#1ed760] font-semibold">
                  {formatTimer(sleepTimerRemaining)}
                </span>
              ) : (
                <span className="text-xs text-[#777]">Off</span>
              )}
            </button>

            <button
              onClick={() => handleNav('settings')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white hover:bg-[#202020] transition-colors"
            >
              <Radio size={18} className="text-[#a7a7a7]" />
              <span className="font-medium">Settings & Account</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-[#222222] bg-[#0c0c0c] text-center text-xs text-[#777]">
          <span>Heavenly Zemma · Spotify Style</span>
        </div>
      </aside>

      {/* Create Playlist Modal */}
      {isCreatePlaylistOpen && (
        <CreatePlaylistModal
          isOpen={isCreatePlaylistOpen}
          onClose={() => setIsCreatePlaylistOpen(false)}
        />
      )}
    </>
  );
};
