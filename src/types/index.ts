export interface Artist {
  id: string;
  name: string;
  bio?: string | null;
  photo?: string | null;
  photo_url?: string | null;
  image_url?: string | null;
  verified?: boolean | null;
  created_at?: string;
}

export interface Album {
  id: string;
  title: string;
  release_type?: string | null;
  release_date?: string | null;
  cover_art_url?: string | null;
  artist_id: string;
  artist_name?: string;
  created_at?: string;
}

export interface Song {
  id: string;
  title: string;
  track_number: number;
  duration_seconds: number;
  is_explicit?: boolean;
  file_url: string;
  artist_id: string;
  album_id: string;
  artist_name?: string;
  album_title?: string;
  cover_art_url?: string | null;
  created_at?: string;
}

export interface RecommendedSong {
  id: string;
  song_id: string;
  score?: number | null;
  reason?: string | null;
  song?: Song;
}

export interface FeaturedArtist {
  id: string;
  artist_id: string;
  display_order?: number | null;
  artist?: Artist;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface UserSongFavorite {
  id?: string;
  user_id: string;
  song_id: string;
  created_at?: string;
  song?: Song;
}

export interface UserSongPlay {
  id?: string;
  user_id?: string | null;
  song_id: string;
  duration_played?: number;
  played_at?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  cover_art_url?: string | null;
  song_ids: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_public?: boolean;
}

export interface ShareTarget {
  type: 'song' | 'album' | 'artist' | 'playlist';
  id: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  url?: string;
}

export interface InAppShareMessage {
  id: string;
  target: ShareTarget;
  senderName: string;
  recipientName: string;
  timestamp: number;
  note?: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlaybackState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: Song[];
  queueIndex: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  sleepTimerRemaining: number | null; // seconds
}

export type ActiveScreen = 'home' | 'search' | 'library' | 'artist' | 'album' | 'settings' | 'playlist';

export interface OTAStatus {
  isChecking: boolean;
  updateAvailable: boolean;
  downloadProgress: number; // 0-100
  version: string;
  lastChecked: string | null;
  statusMessage: string;
}
