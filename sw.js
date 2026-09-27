// The Kangra Dham Co. - Service Worker
// Provides offline support and caching

const CACHE_NAME = 'kangra-dham-v4';
const OFFLINE_URL = 'offline.html';

const PRECACHE_URLS = [
    './',
    'index.html',
    'menu.html',
    'about.html',
    'privacy.html',
    'css/style.css',
    'js/main.js',
    'js/menu-data.js',
    'js/analytics.js',
    'manifest.json',
    'icons/icon-192.png',
    'icons/icon-512.png'
];

// Install: precache essential files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(PRECACHE_URLS);
        }).then(() => self.skipWaiting())
    );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: network-first for HTML, cache-first for assets
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // API responses may be private or time-sensitive; never persist them in the PWA cache.
    if (url.origin === location.origin && url.pathname.startsWith('/api/')) return;

    // Skip external requests (CDNs, analytics, etc.)
    if (url.origin !== location.origin) {
        // For images from Wikimedia/Pexels, try cache then network
        if (request.destination === 'image') {
            event.respondWith(
                caches.match(request).then(cached => {
                    if (cached) return cached;
                    return fetch(request).then(response => {
                        if (response.ok) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                        }
                        return response;
                    }).catch(() => new Response('', { status: 404 }));
                })
            );
        }
        return;
    }

    // HTML pages: network first, fall back to cache
    if (request.destination === 'document' || url.pathname.endsWith('.html')) {
        event.respondWith(
            fetch(request).then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                return response;
            }).catch(() => {
                return caches.match(request).then(cached => cached || caches.match(OFFLINE_URL));
            })
        );
        return;
    }

    // CSS/JS/Images: cache first, fall back to network
    event.respondWith(
        caches.match(request).then(cached => {
            if (cached) return cached;
            return fetch(request).then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                }
                return response;
            });
        })
    );
});
