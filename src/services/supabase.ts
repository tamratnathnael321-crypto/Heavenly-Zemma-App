import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Song, Artist, Album, RecommendedSong, FeaturedArtist, UserSongPlay } from '../types';

const getSupabaseUrl = (): string => {
  return (
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.SUPABASE_URL ||
    'https://ezelziniylvkzffuxvzc.supabase.co'
  );
};

export const SUPABASE_URL = getSupabaseUrl();

// Client supabase instance strictly for auth (OAuth / email login)
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  // We use public anon placeholder or unblocked public key for client auth session if needed,
  // while data queries are routed securely through the backend proxy /api/supabase/*
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key-placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const isSupabaseConfigured = (): boolean => {
  return true;
};

// Storage URL Resolvers via Backend Proxy
export const resolveAudioUrl = (filePath?: string | null): string => {
  if (!filePath || !filePath.trim()) return '';
  const trimmed = filePath.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  return `/api/supabase/storage-url?bucket=Songs&path=${encodeURIComponent(trimmed)}`;
};

export const resolveCoverArtUrl = (filePath?: string | null): string => {
  if (!filePath || !filePath.trim()) return '';
  const trimmed = filePath.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  return `/api/supabase/storage-url?bucket=Album%20Arts&path=${encodeURIComponent(trimmed)}`;
};

/**
 * Secure Backend Proxy Database API Functions
 */

export const fetchSongsFromSupabase = async (): Promise<Song[]> => {
  try {
    const res = await fetch('/api/supabase/songs');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    const data = json.data || [];
    return data.map((song: any) => ({
      ...song,
      file_url: resolveAudioUrl(song.file_url),
    }));
  } catch (err) {
    console.warn('Fetch songs proxy error:', err);
    return [];
  }
};

export const fetchArtistsFromSupabase = async (): Promise<Artist[]> => {
  try {
    const res = await fetch('/api/supabase/artists');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    const data = json.data || [];
    return data.map((artist: any) => {
      const rawImage = artist.photo || artist.photo_url || artist.image_url;
      return {
        ...artist,
        image_url: resolveCoverArtUrl(rawImage),
      };
    });
  } catch (err) {
    console.warn('Fetch artists proxy error:', err);
    return [];
  }
};

export const fetchAlbumsFromSupabase = async (): Promise<Album[]> => {
  try {
    const res = await fetch('/api/supabase/albums');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    const data = json.data || [];
    return data.map((album: any) => ({
      ...album,
      cover_art_url: resolveCoverArtUrl(album.cover_art_url),
    }));
  } catch (err) {
    console.warn('Fetch albums proxy error:', err);
    return [];
  }
};

export const fetchRecommendedSongsFromSupabase = async (): Promise<RecommendedSong[]> => {
  try {
    const res = await fetch('/api/supabase/recommended_songs');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('Fetch recommended songs proxy error:', err);
    return [];
  }
};

export const fetchFeaturedArtistsFromSupabase = async (): Promise<FeaturedArtist[]> => {
  try {
    const res = await fetch('/api/supabase/featured_artists');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('Fetch featured artists proxy error:', err);
    return [];
  }
};

export const searchSupabaseLive = async (
  query: string
): Promise<{ songs: Song[]; albums: Album[]; artists: Artist[] }> => {
  const clean = query.trim();
  if (!clean) return { songs: [], albums: [], artists: [] };

  try {
    const res = await fetch(`/api/supabase/search?q=${encodeURIComponent(clean)}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();

    const songs: Song[] = (json.songs || []).map((s: any) => ({
      ...s,
      file_url: resolveAudioUrl(s.file_url),
    }));

    const albums: Album[] = (json.albums || []).map((a: any) => ({
      ...a,
      cover_art_url: resolveCoverArtUrl(a.cover_art_url),
    }));

    const artists: Artist[] = (json.artists || []).map((art: any) => {
      const rawImage = art.photo || art.photo_url || art.image_url;
      return {
        ...art,
        image_url: resolveCoverArtUrl(rawImage),
      };
    });

    return { songs, albums, artists };
  } catch (err) {
    console.warn('Search proxy error:', err);
    return { songs: [], albums: [], artists: [] };
  }
};

export const fetchUserFavoritesFromSupabase = async (userId: string): Promise<string[]> => {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('user_song_favorites')
      .select('song_id')
      .eq('user_id', userId);

    if (error) return [];
    return (data || []).map((fav: any) => fav.song_id);
  } catch {
    return [];
  }
};

export const toggleSongFavoriteInSupabase = async (
  userId: string,
  songId: string,
  isFavorite: boolean
): Promise<void> => {
  if (!userId || !songId) return;

  if (isFavorite) {
    await supabase.from('user_song_favorites').insert([{ user_id: userId, song_id: songId }]);
  } else {
    await supabase.from('user_song_favorites').delete().match({ user_id: userId, song_id: songId });
  }
};

export const recordSongPlayInSupabase = async (
  userId: string | null,
  songId: string,
  durationPlayedSeconds: number
): Promise<void> => {
  if (!songId) return;
  try {
    await fetch('/api/supabase/plays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId || null,
        song_id: songId,
        duration_played: durationPlayedSeconds,
      }),
    });
  } catch (err) {
    console.warn('Error recording song play:', err);
  }
};
