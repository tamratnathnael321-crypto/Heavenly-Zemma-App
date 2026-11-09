import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  Song,
  Artist,
  Album,
  RecommendedSong,
  FeaturedArtist,
  RepeatMode,
  ActiveScreen,
  OTAStatus,
  UserProfile,
  Playlist,
  ShareTarget,
  InAppShareMessage,
} from '../types';
import {
  supabase,
  fetchSongsFromSupabase,
  fetchAlbumsFromSupabase,
  fetchArtistsFromSupabase,
  fetchRecommendedSongsFromSupabase,
  fetchFeaturedArtistsFromSupabase,
  fetchUserFavoritesFromSupabase,
  toggleSongFavoriteInSupabase,
  recordSongPlayInSupabase,
} from '../services/supabase';
import {
  loadCachedMusicData,
  saveCachedMusicData,
  loadLastPlayback,
  saveLastPlayback,
  loadLocalFavorites,
  saveLocalFavorites,
  loadLocalPlaylists,
  saveLocalPlaylists,
  loadInAppShares,
  saveInAppShares,
} from '../services/offlineCache';
import { initOtaService, checkForOTAUpdate, getOTAVersionInfo } from '../services/otaService';
import { App as CapacitorApp } from '@capacitor/app';

interface MusicContextType {
  // Navigation & Screens
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  selectedArtistId: string | null;
  setSelectedArtistId: (id: string | null) => void;
  selectedAlbumId: string | null;
  setSelectedAlbumId: (id: string | null) => void;
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (id: string | null) => void;
  isNowPlayingOpen: boolean;
  setIsNowPlayingOpen: (open: boolean) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
  isSleepTimerOpen: boolean;
  setIsSleepTimerOpen: (open: boolean) => void;
  navigateToArtist: (artistId: string) => void;
  navigateToAlbum: (albumId: string) => void;
  navigateToPlaylist: (playlistId: string) => void;

  // Music Catalog Data (Real database rows only)
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  recommendedSongs: RecommendedSong[];
  featuredArtists: FeaturedArtist[];
  favorites: string[];
  toggleFavorite: (songId: string) => void;
  isFavorite: (songId: string) => boolean;

  // Playlists
  playlists: Playlist[];
  createPlaylist: (title: string, description?: string, initialSongId?: string) => Playlist;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  deletePlaylist: (id: string) => void;
  addSongToPlaylist: (playlistId: string, songId: string) => void;
  removeSongFromPlaylist: (playlistId: string, songIndex: number) => void;
  reorderPlaylistSongs: (playlistId: string, fromIndex: number, toIndex: number) => void;

  // Add to Playlist Modal
  isAddToPlaylistOpen: boolean;
  songToAddToPlaylist: Song | null;
  openAddToPlaylistModal: (song: Song) => void;
  closeAddToPlaylistModal: () => void;

  // Social & In-App Sharing
  shareTarget: ShareTarget | null;
  openShareModal: (target: ShareTarget) => void;
  closeShareModal: () => void;
  inAppShares: InAppShareMessage[];
  sendInAppShare: (target: ShareTarget, recipientName: string, note?: string) => void;

  // Playback Engine
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  queue: Song[];
  queueIndex: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  playSong: (song: Song, customQueue?: Song[]) => void;
  togglePlay: () => void;
  playNextSong: () => void;
  playPreviousSong: () => void;
  seek: (seconds: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (song: Song) => void;
  playNextInQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;

  // Sleep Timer
  sleepTimerRemaining: number | null;
  setSleepTimer: (minutes: number | null | 'end_of_song') => void;

  // Live State & Connectivity
  isOnline: boolean;
  isRealtimeConnected: boolean;
  isLoading: boolean;
  refreshCatalog: () => Promise<void>;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // OTA Updates
  otaStatus: OTAStatus;
  triggerOTACheck: () => Promise<void>;

  // Auth & User Profile
  currentUser: UserProfile | null;
  isGuest: boolean;
  signInAsGuest: () => void;
  signOutUser: () => Promise<void>;
}

const MusicContext = createContext<MusicContextType | null>(null);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);

  // Cached initial state (strictly cached from previous real Supabase fetch, never fake seed data)
  const cached = useRef(loadCachedMusicData()).current;
  const [songs, setSongs] = useState<Song[]>(cached.songs || []);
  const [albums, setAlbums] = useState<Album[]>(cached.albums || []);
  const [artists, setArtists] = useState<Artist[]>(cached.artists || []);
  const [recommendedSongs, setRecommendedSongs] = useState<RecommendedSong[]>(cached.recommendedSongs || []);
  const [featuredArtists, setFeaturedArtists] = useState<FeaturedArtist[]>(cached.featuredArtists || []);
  const [favorites, setFavorites] = useState<string[]>(() => loadLocalFavorites());

  // Custom Playlists state
  const [playlists, setPlaylists] = useState<Playlist[]>(() => loadLocalPlaylists());

  // Add to Playlist Modal state
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<Song | null>(null);

  // Sharing state
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
  const [inAppShares, setInAppShares] = useState<InAppShareMessage[]>(() => loadInAppShares());

  // Player state
  const [currentSong, setCurrentSong] = useState<Song | null>(() => {
    const last = loadLastPlayback();
    if (last && cached.songs && cached.songs.length > 0) {
      const found = cached.songs.find((s) => s.id === last.songId);
      if (found) return found;
    }
    return cached.songs && cached.songs.length > 0 ? cached.songs[0] : null;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(currentSong ? currentSong.duration_seconds : 0);
  const [queue, setQueue] = useState<Song[]>(cached.songs || []);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');

  // Sleep Timer
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [sleepAtEndOfSong, setSleepAtEndOfSong] = useState(false);

  // Connectivity & Status
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // OTA
  const [otaStatus, setOtaStatus] = useState<OTAStatus>({
    isChecking: false,
    updateAvailable: false,
    downloadProgress: 0,
    version: getOTAVersionInfo().version,
    lastChecked: null,
    statusMessage: 'Ready',
  });

  // User Auth
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isGuest, setIsGuest] = useState(true);

  // Audio HTML5 Reference
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playTimeTracked = useRef<number>(0);
  const playRecordedForSong = useRef<string | null>(null);

  // Toast Helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3800);
  }, []);

  // Initialize Audio
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      playTimeTracked.current += 0.25;

      // Track play if user listens for > 8 seconds
      if (
        currentSong &&
        audio.currentTime > 8 &&
        playRecordedForSong.current !== currentSong.id
      ) {
        playRecordedForSong.current = currentSong.id;
        recordSongPlayInSupabase(currentUser?.id || null, currentSong.id, Math.floor(audio.currentTime));
      }

      // Persist resume position every 5s
      if (currentSong && Math.floor(audio.currentTime) % 5 === 0) {
        saveLastPlayback(currentSong.id, audio.currentTime);
      }
    };

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      if (sleepAtEndOfSong) {
        setIsPlaying(false);
        setSleepAtEndOfSong(false);
        setSleepTimerRemaining(null);
        showToast('Sleep timer reached end of track.');
        return;
      }

      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        playNextSong();
      }
    };

    const onError = (e: Event) => {
      console.warn('Audio playback error for stream:', e);
      setIsPlaying(false);
      showToast('Audio stream unavailable or loading.');
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
    };
  }, [currentSong, currentUser, repeatMode, sleepAtEndOfSong, showToast]);

  // Setup Media Session API (Background playback & Lock Screen controls)
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !currentSong) return;

    try {
      const artworkList: { src: string; sizes: string; type: string }[] = [];
      if (currentSong.cover_art_url) {
        artworkList.push(
          { src: currentSong.cover_art_url, sizes: '96x96', type: 'image/jpeg' },
          { src: currentSong.cover_art_url, sizes: '256x256', type: 'image/jpeg' },
          { src: currentSong.cover_art_url, sizes: '512x512', type: 'image/jpeg' }
        );
      }

      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist_name || 'Heavenly Zemma',
        album: currentSong.album_title || 'Heavenly Zemma',
        artwork: artworkList,
      });

      navigator.mediaSession.setActionHandler('play', () => {
        togglePlay();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        togglePlay();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        playPreviousSong();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        playNextSong();
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          seek(details.seekTime);
        }
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        seek(Math.min((audioRef.current?.currentTime || 0) + (details.seekOffset || 10), duration));
      });
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        seek(Math.max((audioRef.current?.currentTime || 0) - (details.seekOffset || 10), 0));
      });
    } catch (err) {
      console.warn('MediaSession handler error:', err);
    }
  }, [currentSong, duration]);

  // Sleep Timer Countdown Interval
  useEffect(() => {
    if (sleepTimerRemaining === null) return;
    if (sleepTimerRemaining <= 0) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      setSleepTimerRemaining(null);
      showToast('Sleep timer expired. Music paused.');
      return;
    }

    const interval = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev === null || prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerRemaining, showToast]);

  // Handle OTA Service and check on start
  useEffect(() => {
    initOtaService((updateMsg) => {
      showToast(updateMsg);
    });
  }, [showToast]);

  // Deep-linking URL query params detection on app boot
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const params = new URLSearchParams(window.location.search);
      const songParam = params.get('song');
      const albumParam = params.get('album');
      const artistParam = params.get('artist');
      const playlistParam = params.get('playlist');

      if (songParam) {
        const foundSong = songs.find((s) => s.id === songParam);
        if (foundSong) {
          playSong(foundSong);
          setIsNowPlayingOpen(true);
          showToast(`Playing shared song: "${foundSong.title}"`);
        }
      } else if (albumParam) {
        setSelectedAlbumId(albumParam);
        setSelectedArtistId(null);
        setSelectedPlaylistId(null);
        setActiveScreen('album');
        showToast('Opened shared album');
      } else if (artistParam) {
        setSelectedArtistId(artistParam);
        setSelectedAlbumId(null);
        setSelectedPlaylistId(null);
        setActiveScreen('artist');
        showToast('Opened shared artist profile');
      } else if (playlistParam) {
        setSelectedPlaylistId(playlistParam);
        setSelectedAlbumId(null);
        setSelectedArtistId(null);
        setActiveScreen('playlist');
        showToast('Opened shared playlist');
      }
    } catch (err) {
      console.warn('Deep link parsing error:', err);
    }
  }, [songs]);

  // Supabase Data Fetcher & Local Cache Writer (Pure database rows)
  const refreshCatalog = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedSongs, fetchedAlbums, fetchedArtists, fetchedRecs, fetchedFeat] =
        await Promise.allSettled([
          fetchSongsFromSupabase(),
          fetchAlbumsFromSupabase(),
          fetchArtistsFromSupabase(),
          fetchRecommendedSongsFromSupabase(),
          fetchFeaturedArtistsFromSupabase(),
        ]);

      let newSongs: Song[] = [];
      let newAlbums: Album[] = [];
      let newArtists: Artist[] = [];
      let newRecs: RecommendedSong[] = [];
      let newFeat: FeaturedArtist[] = [];

      if (fetchedSongs.status === 'fulfilled') {
        newSongs = fetchedSongs.value;
      }
      if (fetchedAlbums.status === 'fulfilled') {
        newAlbums = fetchedAlbums.value;
      }
      if (fetchedArtists.status === 'fulfilled') {
        newArtists = fetchedArtists.value;
      }
      if (fetchedRecs.status === 'fulfilled') {
        newRecs = fetchedRecs.value;
      }
      if (fetchedFeat.status === 'fulfilled') {
        newFeat = fetchedFeat.value;
      }

      // Enrich song metadata with real album & artist names if found in the database
      const enrichedSongs = newSongs.map((s) => {
        const album = newAlbums.find((a) => a.id === s.album_id);
        const artist = newArtists.find((ar) => ar.id === s.artist_id);
        return {
          ...s,
          album_title: s.album_title || album?.title || undefined,
          artist_name: s.artist_name || artist?.name || undefined,
          cover_art_url: s.cover_art_url || album?.cover_art_url || undefined,
        };
      });

      // Enrich recommended songs with real song rows
      const enrichedRecs = newRecs.map((rec) => {
        const found = enrichedSongs.find((s) => s.id === rec.song_id);
        return {
          ...rec,
          song: found,
        };
      });

      // Enrich featured artists with real artist rows
      const enrichedFeat = newFeat.map((feat) => {
        const found = newArtists.find((a) => a.id === feat.artist_id);
        return {
          ...feat,
          artist: found,
        };
      });

      setSongs(enrichedSongs);
      setAlbums(newAlbums);
      setArtists(newArtists);
      setRecommendedSongs(enrichedRecs);
      setFeaturedArtists(enrichedFeat);

      // Save real data to local cache for instant cold starts
      saveCachedMusicData({
        songs: enrichedSongs,
        albums: newAlbums,
        artists: newArtists,
        recommendedSongs: enrichedRecs,
        featuredArtists: enrichedFeat,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      console.warn('Catalog refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // LIVE UPDATES: Supabase Realtime (postgres_changes)
  useEffect(() => {
    let channel: any = null;
    try {
      channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'songs' },
          (payload) => {
            console.log('[Realtime] songs change:', payload.eventType);
            refreshCatalog();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'albums' },
          (payload) => {
            console.log('[Realtime] albums change:', payload.eventType);
            refreshCatalog();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'artists' },
          (payload) => {
            console.log('[Realtime] artists change:', payload.eventType);
            refreshCatalog();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'recommended_songs' },
          () => {
            refreshCatalog();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'featured_artists' },
          () => {
            refreshCatalog();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsRealtimeConnected(true);
          } else {
            setIsRealtimeConnected(false);
          }
        });
    } catch (err) {
      console.warn('Realtime subscription error:', err);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [refreshCatalog]);

  // LIVE UPDATES: Refetch when app returns to foreground or network reconnects
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Network connected. Syncing library...');
      refreshCatalog();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('Network offline. Offline music mode enabled.');
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshCatalog();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);

    let capacitorListener: any = null;
    try {
      CapacitorApp.addListener('appStateChange', (state) => {
        if (state.isActive) {
          refreshCatalog();
        }
      }).then((handle) => {
        capacitorListener = handle;
      });
    } catch {
      // not running in native
    }

    // Initial background sync
    refreshCatalog();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (capacitorListener?.remove) capacitorListener.remove();
    };
  }, [refreshCatalog, showToast]);

  // ANDROID BACK BUTTON HANDLING
  useEffect(() => {
    const handleBackButton = () => {
      if (shareTarget) {
        setShareTarget(null);
        return;
      }
      if (isAddToPlaylistOpen) {
        setIsAddToPlaylistOpen(false);
        return;
      }
      if (isNowPlayingOpen) {
        setIsNowPlayingOpen(false);
        return;
      }
      if (isQueueOpen) {
        setIsQueueOpen(false);
        return;
      }
      if (isSleepTimerOpen) {
        setIsSleepTimerOpen(false);
        return;
      }
      if (isDrawerOpen) {
        setIsDrawerOpen(false);
        return;
      }
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

    let backListener: any = null;
    try {
      CapacitorApp.addListener('backButton', () => {
        handleBackButton();
      }).then((handle) => {
        backListener = handle;
      });
    } catch {
      // ignore
    }

    const onPopState = () => {
      handleBackButton();
    };
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('popstate', onPopState);
      if (backListener?.remove) backListener.remove();
    };
  }, [
    shareTarget,
    isAddToPlaylistOpen,
    isNowPlayingOpen,
    isQueueOpen,
    isSleepTimerOpen,
    isDrawerOpen,
    selectedPlaylistId,
    selectedArtistId,
    selectedAlbumId,
    activeScreen,
  ]);

  // Auth User check
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setCurrentUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          full_name: data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || 'Listener',
          avatar_url: data.session.user.user_metadata?.avatar_url,
        });
        setIsGuest(false);
        fetchUserFavoritesFromSupabase(data.session.user.id).then((favs) => {
          if (favs.length > 0) {
            setFavorites(favs);
            saveLocalFavorites(favs);
          }
        });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setCurrentUser({
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Listener',
            avatar_url: session.user.user_metadata?.avatar_url,
          });
          setIsGuest(false);
        } else {
          setCurrentUser(null);
          setIsGuest(true);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Audio Playback Controls
  const playSong = useCallback(
    (song: Song, customQueue?: Song[]) => {
      if (!audioRef.current) return;
      const targetQueue = customQueue || (queue.length > 0 ? queue : songs);
      let foundIndex = targetQueue.findIndex((s) => s.id === song.id);
      if (foundIndex === -1) {
        targetQueue.unshift(song);
        foundIndex = 0;
      }
      setQueue(targetQueue);
      setQueueIndex(foundIndex);
      setCurrentSong(song);

      const audio = audioRef.current;
      audio.src = song.file_url;
      audio.currentTime = 0;
      playTimeTracked.current = 0;
      playRecordedForSong.current = null;

      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn('Audio play request blocked or failed:', err);
          setIsPlaying(false);
        });
    },
    [queue, songs]
  );

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (!audio.src && currentSong) {
        audio.src = currentSong.file_url;
      }
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn('Playback resume failed:', err);
        });
    }
  }, [currentSong, isPlaying]);

  const playNextSong = useCallback(() => {
    if (queue.length === 0) return;
    let nextIdx = queueIndex + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else if (nextIdx >= queue.length) {
      if (repeatMode === 'all') {
        nextIdx = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }
    const nextSong = queue[nextIdx];
    if (nextSong) {
      playSong(nextSong, queue);
      setQueueIndex(nextIdx);
    }
  }, [isShuffle, playSong, queue, queueIndex, repeatMode]);

  const playPreviousSong = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    if (queue.length === 0) return;
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = repeatMode === 'all' ? queue.length - 1 : 0;
    }
    const prevSong = queue[prevIdx];
    if (prevSong) {
      playSong(prevSong, queue);
      setQueueIndex(prevIdx);
    }
  }, [playSong, queue, queueIndex, repeatMode]);

  const seek = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = seconds;
    setCurrentTime(seconds);
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
    showToast(!isShuffle ? 'Shuffle enabled' : 'Shuffle turned off');
  }, [isShuffle, showToast]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') {
        showToast('Repeat all tracks');
        return 'all';
      }
      if (prev === 'all') {
        showToast('Repeat current track');
        return 'one';
      }
      showToast('Repeat off');
      return 'off';
    });
  }, [showToast]);

  const addToQueue = useCallback((song: Song) => {
    setQueue((prev) => [...prev, song]);
    showToast(`Added "${song.title}" to queue`);
  }, [showToast]);

  const playNextInQueue = useCallback((song: Song) => {
    setQueue((prev) => {
      const copy = [...prev];
      copy.splice(queueIndex + 1, 0, song);
      return copy;
    });
    showToast(`"${song.title}" will play next`);
  }, [queueIndex, showToast]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const clearQueue = useCallback(() => {
    if (currentSong) {
      setQueue([currentSong]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(0);
    }
    showToast('Queue cleared');
  }, [currentSong, showToast]);

  // Favorites management
  const toggleFavorite = useCallback(
    (songId: string) => {
      const exists = favorites.includes(songId);
      const updated = exists
        ? favorites.filter((id) => id !== songId)
        : [...favorites, songId];

      setFavorites(updated);
      saveLocalFavorites(updated);
      showToast(exists ? 'Removed from Liked Songs' : 'Saved to Liked Songs');

      if (currentUser?.id) {
        toggleSongFavoriteInSupabase(currentUser.id, songId, !exists);
      }
    },
    [currentUser?.id, favorites, showToast]
  );

  const isFavorite = useCallback(
    (songId: string) => {
      return favorites.includes(songId);
    },
    [favorites]
  );

  // Custom Playlists Operations
  const createPlaylist = useCallback(
    (title: string, description?: string, initialSongId?: string): Playlist => {
      const newPlaylist: Playlist = {
        id: `playlist-${Date.now()}`,
        title,
        description: description || '',
        cover_art_url: null,
        song_ids: initialSongId ? [initialSongId] : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: currentUser?.full_name || 'You',
        is_public: true,
      };

      setPlaylists((prev) => {
        const updated = [newPlaylist, ...prev];
        saveLocalPlaylists(updated);
        return updated;
      });

      return newPlaylist;
    },
    [currentUser?.full_name]
  );

  const updatePlaylist = useCallback((id: string, updates: Partial<Playlist>) => {
    setPlaylists((prev) => {
      const updated = prev.map((p) => {
        if (p.id === id) {
          return { ...p, ...updates, updated_at: new Date().toISOString() };
        }
        return p;
      });
      saveLocalPlaylists(updated);
      return updated;
    });
  }, []);

  const deletePlaylist = useCallback(
    (id: string) => {
      setPlaylists((prev) => {
        const target = prev.find((p) => p.id === id);
        const updated = prev.filter((p) => p.id !== id);
        saveLocalPlaylists(updated);
        showToast(`Deleted playlist "${target?.title || 'Playlist'}"`);
        return updated;
      });
      if (selectedPlaylistId === id) {
        setSelectedPlaylistId(null);
      }
    },
    [selectedPlaylistId, showToast]
  );

  const addSongToPlaylist = useCallback(
    (playlistId: string, songId: string) => {
      setPlaylists((prev) => {
        const updated = prev.map((p) => {
          if (p.id === playlistId) {
            if (p.song_ids.includes(songId)) return p;
            return {
              ...p,
              song_ids: [...p.song_ids, songId],
              updated_at: new Date().toISOString(),
            };
          }
          return p;
        });
        saveLocalPlaylists(updated);
        return updated;
      });
    },
    []
  );

  const removeSongFromPlaylist = useCallback(
    (playlistId: string, songIndex: number) => {
      setPlaylists((prev) => {
        const updated = prev.map((p) => {
          if (p.id === playlistId) {
            const copy = [...p.song_ids];
            copy.splice(songIndex, 1);
            return {
              ...p,
              song_ids: copy,
              updated_at: new Date().toISOString(),
            };
          }
          return p;
        });
        saveLocalPlaylists(updated);
        return updated;
      });
      showToast('Removed song from playlist');
    },
    [showToast]
  );

  const reorderPlaylistSongs = useCallback(
    (playlistId: string, fromIndex: number, toIndex: number) => {
      setPlaylists((prev) => {
        const updated = prev.map((p) => {
          if (p.id === playlistId) {
            if (toIndex < 0 || toIndex >= p.song_ids.length) return p;
            const copy = [...p.song_ids];
            const [moved] = copy.splice(fromIndex, 1);
            copy.splice(toIndex, 0, moved);
            return {
              ...p,
              song_ids: copy,
              updated_at: new Date().toISOString(),
            };
          }
          return p;
        });
        saveLocalPlaylists(updated);
        return updated;
      });
    },
    []
  );

  // Add to Playlist modal triggers
  const openAddToPlaylistModal = useCallback((song: Song) => {
    setSongToAddToPlaylist(song);
    setIsAddToPlaylistOpen(true);
  }, []);

  const closeAddToPlaylistModal = useCallback(() => {
    setIsAddToPlaylistOpen(false);
    setSongToAddToPlaylist(null);
  }, []);

  // Sharing triggers
  const openShareModal = useCallback((target: ShareTarget) => {
    setShareTarget(target);
  }, []);

  const closeShareModal = useCallback(() => {
    setShareTarget(null);
  }, []);

  const sendInAppShare = useCallback(
    (target: ShareTarget, recipientName: string, note?: string) => {
      const newShare: InAppShareMessage = {
        id: `share-${Date.now()}`,
        target,
        senderName: currentUser?.full_name || 'You',
        recipientName,
        timestamp: Date.now(),
        note,
      };

      setInAppShares((prev) => {
        const updated = [newShare, ...prev];
        saveInAppShares(updated);
        return updated;
      });
    },
    [currentUser?.full_name]
  );

  // Sleep Timer Setter
  const setSleepTimer = useCallback(
    (minutes: number | null | 'end_of_song') => {
      if (minutes === null) {
        setSleepTimerRemaining(null);
        setSleepAtEndOfSong(false);
        showToast('Sleep timer turned off');
      } else if (minutes === 'end_of_song') {
        setSleepAtEndOfSong(true);
        setSleepTimerRemaining(null);
        showToast('Sleep timer set to end of current track');
      } else {
        setSleepAtEndOfSong(false);
        setSleepTimerRemaining(minutes * 60);
        showToast(`Sleep timer set for ${minutes} minutes`);
      }
      setIsSleepTimerOpen(false);
    },
    [showToast]
  );

  // OTA Trigger
  const triggerOTACheck = useCallback(async () => {
    setOtaStatus((prev) => ({
      ...prev,
      isChecking: true,
      statusMessage: 'Checking for over-the-air updates...',
    }));

    const result = await checkForOTAUpdate((progress) => {
      setOtaStatus((prev) => ({ ...prev, downloadProgress: progress }));
    });

    setOtaStatus((prev) => ({
      ...prev,
      isChecking: false,
      updateAvailable: result.available,
      statusMessage: result.message,
      lastChecked: new Date().toLocaleTimeString(),
    }));

    showToast(result.message);
  }, [showToast]);

  // Navigation helpers
  const navigateToArtist = useCallback((artistId: string) => {
    setSelectedArtistId(artistId);
    setSelectedAlbumId(null);
    setSelectedPlaylistId(null);
    setActiveScreen('artist');
    setIsDrawerOpen(false);
  }, []);

  const navigateToAlbum = useCallback((albumId: string) => {
    setSelectedAlbumId(albumId);
    setSelectedArtistId(null);
    setSelectedPlaylistId(null);
    setActiveScreen('album');
    setIsDrawerOpen(false);
  }, []);

  const navigateToPlaylist = useCallback((playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setSelectedAlbumId(null);
    setSelectedArtistId(null);
    setActiveScreen('playlist');
    setIsDrawerOpen(false);
  }, []);

  const signInAsGuest = useCallback(() => {
    setIsGuest(true);
    setCurrentUser({
      id: 'guest-user',
      email: '',
      full_name: 'Guest Worshipper',
    });
    showToast('Signed in as Guest');
  }, [showToast]);

  const signOutUser = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setIsGuest(true);
    showToast('Signed out');
  }, [showToast]);

  return (
    <MusicContext.Provider
      value={{
        activeScreen,
        setActiveScreen,
        selectedArtistId,
        setSelectedArtistId,
        selectedAlbumId,
        setSelectedAlbumId,
        selectedPlaylistId,
        setSelectedPlaylistId,
        isNowPlayingOpen,
        setIsNowPlayingOpen,
        isDrawerOpen,
        setIsDrawerOpen,
        isQueueOpen,
        setIsQueueOpen,
        isSleepTimerOpen,
        setIsSleepTimerOpen,
        navigateToArtist,
        navigateToAlbum,
        navigateToPlaylist,

        songs,
        albums,
        artists,
        recommendedSongs,
        featuredArtists,
        favorites,
        toggleFavorite,
        isFavorite,

        playlists,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        addSongToPlaylist,
        removeSongFromPlaylist,
        reorderPlaylistSongs,

        isAddToPlaylistOpen,
        songToAddToPlaylist,
        openAddToPlaylistModal,
        closeAddToPlaylistModal,

        shareTarget,
        openShareModal,
        closeShareModal,
        inAppShares,
        sendInAppShare,

        currentSong,
        isPlaying,
        currentTime,
        duration,
        queue,
        queueIndex,
        isShuffle,
        repeatMode,
        playSong,
        togglePlay,
        playNextSong,
        playPreviousSong,
        seek,
        toggleShuffle,
        toggleRepeat,
        addToQueue,
        playNextInQueue,
        removeFromQueue,
        clearQueue,

        sleepTimerRemaining,
        setSleepTimer,

        isOnline,
        isRealtimeConnected,
        isLoading,
        refreshCatalog,
        toastMessage,
        showToast,

        otaStatus,
        triggerOTACheck,

        currentUser,
        isGuest,
        signInAsGuest,
        signOutUser,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
