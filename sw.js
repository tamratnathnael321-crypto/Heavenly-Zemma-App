const SHELL_CACHE = 'aurum-shell-v1';
const PUBLIC_CACHE = 'aurum-public-v1';
const SUPABASE_ORIGIN = 'https://ezelziniylvkzffuxvzc.supabase.co';
const SHELL_FILES = [
  new URL('./music-player-supabase-new-ui.html', self.registration.scope).href,
  new URL('./manifest.webmanifest', self.registration.scope).href,
  new URL('./aurum-icon.svg', self.registration.scope).href
];
const OPTIONAL_FILES = [
  'https://cdnjs.cloudflare.com/ajax/libs/jsmediatags/3.9.5/jsmediatags.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(SHELL_FILES);
    await Promise.allSettled(OPTIONAL_FILES.map(async url => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      try {
        const response = await fetch(url, { mode: 'cors', signal: controller.signal });
        if (response.ok && response.type !== 'opaque') await cache.put(url, response);
      } catch (error) {
        console.warn('An optional Heavenly Zemma offline asset was not cached:', url, error);
      } finally {
        clearTimeout(timeout);
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('aurum-') && ![SHELL_CACHE, PUBLIC_CACHE].includes(name)).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function networkFirst(request, fallbackUrl = request) {
  const cache = await caches.open(PUBLIC_CACHE);
  const keyUrl = new URL(request.url);
  const range = request.headers.get('Range');
  if (range) keyUrl.searchParams.set('__aurum_range', range);
  const cacheKey = new Request(keyUrl.href);
  try {
    const response = await fetch(request);
    if (response.ok && response.type !== 'opaque') {
      try {
        let cachedResponse = response.clone();
        if (cachedResponse.status === 206) {
          const headers = new Headers(cachedResponse.headers);
          headers.delete('content-range');
          headers.delete('content-length');
          cachedResponse = new Response(await cachedResponse.arrayBuffer(), { status: 200, headers });
        }
        await cache.put(cacheKey, cachedResponse);
      } catch (error) {
        console.warn('Could not cache public Heavenly Zemma data:', error);
      }
    }
    return response;
  } catch (error) {
    const cached = await cache.match(cacheKey) || await cache.match(fallbackUrl);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(PUBLIC_CACHE);
  const cached = await cache.match(request) || await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type !== 'opaque') {
    try {
      await cache.put(request, response.clone());
    } catch (error) {
      console.warn('Could not cache a public Heavenly Zemma image:', error);
    }
  }
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate' && url.origin === self.location.origin) {
    const appUrl = new URL('./music-player-supabase-new-ui.html', self.registration.scope).href;
    event.respondWith(networkFirst(request, appUrl));
    return;
  }

  if (url.origin === SUPABASE_ORIGIN && /^\/rest\/v1\/(songs|artists|albums|global_song_stream_counts|global_album_stream_counts)$/.test(url.pathname)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.origin === SUPABASE_ORIGIN && url.pathname.startsWith('/storage/v1/object/public/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.origin === self.location.origin && SHELL_FILES.includes(request.url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (OPTIONAL_FILES.includes(request.url)) {
    event.respondWith(cacheFirst(request));
  }
});
