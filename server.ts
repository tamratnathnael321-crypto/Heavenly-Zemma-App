import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ezelziniylvkzffuxvzc.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_ANON_KEY || 'sb_secret_IURLJu03OzeTDAtItMRk0Q_ukbi5GxE';

// Create Supabase admin/server client using secret key safely on backend
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = process.env.PORT || 3000;

  // API Proxy Routes for Supabase Database
  app.get('/api/supabase/songs', async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('songs')
        .select('*')
        .order('track_number', { ascending: true });
      if (error) throw error;
      res.json({ data: data || [] });
    } catch (err: any) {
      console.error('API Error /songs:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/supabase/artists', async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('artists')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      res.json({ data: data || [] });
    } catch (err: any) {
      console.error('API Error /artists:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/supabase/albums', async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('albums')
        .select('*')
        .order('release_date', { ascending: false, nullsFirst: false });
      if (error) throw error;
      res.json({ data: data || [] });
    } catch (err: any) {
      console.error('API Error /albums:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/supabase/recommended_songs', async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('recommended_songs')
        .select('*')
        .order('score', { ascending: false });
      if (error) throw error;
      res.json({ data: data || [] });
    } catch (err: any) {
      console.error('API Error /recommended_songs:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/supabase/featured_artists', async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('featured_artists')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      res.json({ data: data || [] });
    } catch (err: any) {
      console.error('API Error /featured_artists:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/supabase/search', async (req, res) => {
    try {
      const query = (req.query.q as string || '').trim();
      if (!query) {
        return res.json({ songs: [], albums: [], artists: [] });
      }
      const pattern = `%${query}%`;
      const [songsRes, albumsRes, artistsRes] = await Promise.all([
        supabaseAdmin.from('songs').select('*').ilike('title', pattern).limit(20),
        supabaseAdmin.from('albums').select('*').ilike('title', pattern).limit(20),
        supabaseAdmin.from('artists').select('*').ilike('name', pattern).limit(20),
      ]);

      res.json({
        songs: songsRes.data || [],
        albums: albumsRes.data || [],
        artists: artistsRes.data || [],
      });
    } catch (err: any) {
      console.error('API Error /search:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/supabase/plays', async (req, res) => {
    try {
      const { user_id, song_id, duration_played } = req.body;
      const { error } = await supabaseAdmin.from('user_song_plays').insert([
        {
          user_id: user_id || null,
          song_id,
          duration_played: Math.round(duration_played || 0),
          played_at: new Date().toISOString(),
        },
      ]);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Storage public URL resolvers helper endpoint or proxy
  app.get('/api/supabase/storage-url', (req, res) => {
    const { bucket, path: filePath } = req.query;
    if (!bucket || !filePath) {
      return res.status(400).json({ error: 'Missing bucket or path' });
    }
    const { data } = supabaseAdmin.storage.from(String(bucket)).getPublicUrl(String(filePath));
    res.json({ publicUrl: data.publicUrl });
  });

  // Setup Vite middleware in development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
