/* ═══════════════════════════════════════════════════════════════════
   sw.js — Interview Handbook service worker
   ───────────────────────────────────────────────────────────────────
   • Precaches the app shell on install.
   • Stale-while-revalidate for on-demand topic data files (data/**).
   • Cache-first for vendored libs and static assets.
   • Navigation fallback to the cached index.html (hash-routed SPA).
   • Versioned cache; old versions are removed on activate.

   Bump CACHE_VERSION when shipping changes so clients pick them up.
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

const CACHE_VERSION = 'ih-cache-v4';

// App shell — everything needed to boot and run offline (minus lazy data).
const APP_SHELL = [
    './',
    './index.html',
    './manifest.webmanifest',
    './assets/icon.svg',
    // CSS
    './css/tokens.css',
    './css/base.css',
    './css/layout.css',
    './css/components.css',
    './css/pages.css',
    // JS
    './js/icons.js',
    './js/sitemap.js',
    './js/theme.js',
    './js/navigation.js',
    './js/search.js',
    './js/progress.js',
    './js/interview-progress.js',
    './js/scrollspy.js',
    './js/keyboard.js',
    './js/page-loader.js',
    './js/code-blocks.js',
    './js/quiz.js',
    './js/lazy-loader.js',
    './js/app.js',
    // Data registry (topic modules load on demand)
    './data/page-data.js',
    // Vendored library
    './vendor/mermaid.min.js',
];

// ─── install: precache the shell ───────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            // Individually so one missing optional file never fails the whole install.
            .then((cache) => Promise.allSettled(
                APP_SHELL.map((url) => cache.add(new Request(url, { cache: 'reload' })))
            ))
            .then(() => self.skipWaiting())
    );
});

// ─── activate: drop old cache versions ─────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

// ─── helpers ───────────────────────────────────────────────────────
function isCacheable(response) {
    return response && response.status === 200 && response.type !== 'opaque';
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(request, { ignoreSearch: true });
    const network = fetch(request)
        .then((response) => {
            if (isCacheable(response)) cache.put(request, response.clone());
            return response;
        })
        .catch(() => null);
    return cached || (await network) || new Response('', { status: 504, statusText: 'Offline' });
}

async function cacheFirst(request) {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (isCacheable(response)) cache.put(request, response.clone());
        return response;
    } catch (e) {
        return new Response('', { status: 504, statusText: 'Offline' });
    }
}

async function navigationFallback(request) {
    try {
        const response = await fetch(request);
        if (isCacheable(response)) {
            const cache = await caches.open(CACHE_VERSION);
            cache.put('./index.html', response.clone());
        }
        return response;
    } catch (e) {
        const cache = await caches.open(CACHE_VERSION);
        return (await cache.match('./index.html')) ||
               (await cache.match('./')) ||
               new Response('Offline', { status: 504 });
    }
}

// ─── fetch routing ─────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return; // don't touch cross-origin

    // SPA navigations → network first, fall back to cached shell.
    if (request.mode === 'navigate') {
        event.respondWith(navigationFallback(request));
        return;
    }

    // On-demand topic data → stale-while-revalidate.
    if (url.pathname.includes('/data/')) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    // Everything else (css, js, vendor, assets) → cache-first.
    event.respondWith(cacheFirst(request));
});
