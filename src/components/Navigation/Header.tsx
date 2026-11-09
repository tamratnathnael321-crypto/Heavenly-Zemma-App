import React from 'react';
import { Menu, ChevronLeft, Wifi, WifiOff, RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack = false }) => {
  const {
    setIsDrawerOpen,
    activeScreen,
    setActiveScreen,
    selectedArtistId,
    setSelectedArtistId,
    selectedAlbumId,
    setSelectedAlbumId,
    selectedPlaylistId,
    setSelectedPlaylistId,
    isOnline,
    isRealtimeConnected,
    isLoading,
    refreshCatalog,
  } = useMusic();

  const handleBack = () => {
    if (selectedPlaylistId) {
      setSelectedPlaylistId(null);
      setActiveScreen('library');
      return;
    }
    if (selectedArtistId) {
      setSelectedArtistId(null);
      return;
    }
    if (selectedAlbumId) {
      setSelectedAlbumId(null);
      return;
    }
    if (activeScreen !== 'home') {
      setActiveScreen('home');
      return;
    }
  };

  const getDisplayTitle = () => {
    if (title) return title;
    if (selectedPlaylistId) return 'Playlist';
    if (activeScreen === 'search') return 'Search';
    if (activeScreen === 'library') return 'Your Library';
    if (activeScreen === 'settings') return 'Settings';
    return 'Heavenly Zemma';
  };

  const isNested = showBack || selectedArtistId !== null || selectedAlbumId !== null || selectedPlaylistId !== null;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-black/95 border-b border-[#222222] pt-safe select-none">
      <div className="flex items-center gap-3">
        {isNested ? (
          <button
            onClick={handleBack}
            className="w-10 h-10 -ml-1 flex items-center justify-center rounded-full text-white hover:bg-[#282828] active:scale-95 transition-transform"
            aria-label="Go back"
          >
            <ChevronLeft size={26} />
          </button>
        ) : (
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="w-10 h-10 -ml-1 flex items-center justify-center rounded-full text-white hover:bg-[#282828] active:scale-95 transition-transform"
            aria-label="Open slide menu"
          >
            <Menu size={24} />
          </button>
        )}

        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-white truncate max-w-[200px]">
            {getDisplayTitle()}
          </span>
          {activeScreen === 'home' && !isNested && (
            <span className="text-[11px] text-[#a7a7a7] -mt-0.5 flex items-center gap-1.5">
              <span>Sacred Gospel & Praise</span>
              {isRealtimeConnected && (
                <>
                  <span className="text-[#555]">·</span>
                  <span className="text-[#1ed760] font-medium">Live sync</span>
                </>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Sync / Refresh button */}
        <button
          onClick={() => refreshCatalog()}
          disabled={isLoading}
          className="w-9 h-9 flex items-center justify-center rounded-full text-[#a7a7a7] hover:text-white hover:bg-[#282828] active:scale-95 transition-transform"
          aria-label="Refresh catalog"
          title="Refresh catalog from Supabase"
        >
          <RefreshCw size={17} className={isLoading ? 'animate-spin text-[#1ed760]' : ''} />
        </button>

        {/* Network indicator */}
        <div
          className="w-8 h-8 flex items-center justify-center text-[#a7a7a7]"
          title={isOnline ? 'Online - Live Supabase connected' : 'Offline - Local cache mode'}
        >
          {isOnline ? (
            <Wifi size={17} className={isRealtimeConnected ? 'text-[#1ed760]' : 'text-[#a7a7a7]'} />
          ) : (
            <WifiOff size={17} className="text-amber-500" />
          )}
        </div>

        {/* Settings shortcut button */}
        <button
          onClick={() => setActiveScreen('settings')}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
            activeScreen === 'settings'
              ? 'text-[#1ed760] bg-[#222222]'
              : 'text-[#a7a7a7] hover:text-white hover:bg-[#282828]'
          }`}
          aria-label="Settings"
        >
          <SettingsIcon size={18} />
        </button>
      </div>
    </header>
  );
};
