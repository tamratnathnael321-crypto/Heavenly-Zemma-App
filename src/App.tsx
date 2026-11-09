import React from 'react';
import { MusicProvider, useMusic } from './context/MusicContext';
import { Header } from './components/Navigation/Header';
import { BottomTabBar } from './components/Navigation/BottomTabBar';
import { DrawerMenu } from './components/Navigation/DrawerMenu';
import { MiniPlayer } from './components/Player/MiniPlayer';
import { NowPlayingModal } from './components/Player/NowPlayingModal';
import { Toast, OfflineBanner } from './components/Common/Toast';
import { ShareModal } from './components/Share/ShareModal';
import { AddToPlaylistModal } from './components/Playlist/AddToPlaylistModal';
import { HomeScreen } from './screens/HomeScreen';
import { SearchScreen } from './screens/SearchScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { ArtistScreen } from './screens/ArtistScreen';
import { AlbumScreen } from './screens/AlbumScreen';
import { PlaylistScreen } from './screens/PlaylistScreen';
import { SettingsScreen } from './screens/SettingsScreen';

const MainAppContent: React.FC = () => {
  const { activeScreen, selectedArtistId, selectedAlbumId, selectedPlaylistId } = useMusic();

  const renderActiveScreen = () => {
    if (selectedPlaylistId) {
      return <PlaylistScreen />;
    }
    if (selectedArtistId) {
      return <ArtistScreen />;
    }
    if (selectedAlbumId) {
      return <AlbumScreen />;
    }

    switch (activeScreen) {
      case 'home':
        return <HomeScreen />;
      case 'search':
        return <SearchScreen />;
      case 'library':
        return <LibraryScreen />;
      case 'artist':
        return <ArtistScreen />;
      case 'album':
        return <AlbumScreen />;
      case 'playlist':
        return <PlaylistScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="relative h-screen w-full bg-black text-white flex flex-col overflow-hidden select-none">
      {/* Toast notifications */}
      <Toast />

      {/* Slide-out Drawer */}
      <DrawerMenu />

      {/* Top Header */}
      <Header />

      {/* Offline Status Banner */}
      <OfflineBanner />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar bg-black">
        {renderActiveScreen()}
      </main>

      {/* Mini Player */}
      <MiniPlayer />

      {/* Fixed Bottom Tab Bar */}
      <BottomTabBar />

      {/* Full-Screen Now Playing Modal */}
      <NowPlayingModal />

      {/* Social & In-App Share Sheet */}
      <ShareModal />

      {/* Add Song to Playlist Bottom Sheet */}
      <AddToPlaylistModal />
    </div>
  );
};

export default function App() {
  return (
    <MusicProvider>
      <MainAppContent />
    </MusicProvider>
  );
}
