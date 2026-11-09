import { Song, Artist, Album, RecommendedSong, FeaturedArtist, Playlist, InAppShareMessage } from '../types';

export interface CachedMusicData {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  recommendedSongs: RecommendedSong[];
  featuredArtists: FeaturedArtist[];
  lastUpdated: number;
}

// Initial empty cached state - only real data fetched from the live Supabase database is ever stored here
export const EMPTY_CACHE: CachedMusicData = {
  songs: [],
  albums: [],
  artists: [],
  recommendedSongs: [],
  featuredArtists: [],
  lastUpdated: 0,
};

const CACHE_KEY = 'hz_cached_music_data_v2';
const PLAYBACK_KEY = 'hz_last_playback_state';
const FAVORITES_KEY = 'hz_local_favorites';
const PLAYLISTS_KEY = 'hz_user_playlists_v2';
const SHARES_KEY = 'hz_in_app_shares_v2';

export const saveCachedMusicData = (data: CachedMusicData): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to cache music data in localStorage:', err);
  }
};

export const loadCachedMusicData = (): CachedMusicData => {
  if (typeof window === 'undefined') return EMPTY_CACHE;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return EMPTY_CACHE;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.songs)) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load cached music data:', err);
  }
  return EMPTY_CACHE;
};

export const saveLastPlayback = (songId: string, currentTime: number): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PLAYBACK_KEY, JSON.stringify({ songId, currentTime, timestamp: Date.now() }));
  } catch {
    // ignore
  }
};

export const loadLastPlayback = (): { songId: string; currentTime: number } | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PLAYBACK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
};

export const saveLocalFavorites = (favorites: string[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch {
    // ignore
  }
};

export const loadLocalFavorites = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
};

export const getStorageUsageEstimate = (): string => {
  if (typeof window === 'undefined') return '0 KB';
  try {
    let totalBytes = 0;
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key) && key.startsWith('hz_')) {
        totalBytes += (localStorage[key]?.length || 0) * 2;
      }
    }
    if (totalBytes < 1024) return `${totalBytes} B`;
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
    return `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
  } catch {
    return '0 KB';
  }
};

export const clearLocalMusicCache = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(PLAYBACK_KEY);
  } catch {
    // ignore
  }
};

export const saveLocalPlaylists = (playlists: Playlist[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  } catch (err) {
    console.warn('Failed to save playlists to localStorage:', err);
  }
};

export const loadLocalPlaylists = (): Playlist[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PLAYLISTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load playlists from localStorage:', err);
  }
  return [];
};

export const saveInAppShares = (shares: InAppShareMessage[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SHARES_KEY, JSON.stringify(shares));
  } catch {
    // ignore
  }
};

export const loadInAppShares = (): InAppShareMessage[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SHARES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
};
