import React from 'react';
import { Home, Search, Library } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ActiveScreen } from '../../types';

export const BottomTabBar: React.FC = () => {
  const {
    activeScreen,
    setActiveScreen,
    setSelectedArtistId,
    setSelectedAlbumId,
    setSelectedPlaylistId,
    setIsNowPlayingOpen,
  } = useMusic();

  const handleTabClick = (screen: ActiveScreen) => {
    setSelectedArtistId(null);
    setSelectedAlbumId(null);
    setSelectedPlaylistId(null);
    setActiveScreen(screen);
    setIsNowPlayingOpen(false);
  };

  const tabs = [
    {
      id: 'home' as ActiveScreen,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'search' as ActiveScreen,
      label: 'Search',
      icon: Search,
    },
    {
      id: 'library' as ActiveScreen,
      label: 'Your Library',
      icon: Library,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#000000] border-t border-[#222222] pb-safe select-none">
      <div className="grid grid-cols-3 h-14 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeScreen === tab.id &&
            // If viewing album or artist, tab might still be highlighted or library
            (tab.id !== 'home' || activeScreen === 'home');

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors duration-150 active:scale-95"
              aria-label={tab.label}
            >
              <Icon
                size={22}
                className={`transition-colors ${
                  isActive ? 'text-[#1ed760] stroke-[2.4]' : 'text-[#a7a7a7] stroke-[1.8]'
                }`}
              />
              <span
                className={`text-[11px] font-medium tracking-tight mt-1 transition-colors ${
                  isActive ? 'text-white font-semibold' : 'text-[#a7a7a7]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
