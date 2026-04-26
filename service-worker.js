/* service-worker.js — kodesignengineer v2 (offline-first for shell) */
const CACHE = 'ko-engineer-v2-2026.04';
const SHELL = [
    '/',
    '/index.html',
    '/portfolio.html',
    '/certificates.html',
    '/drawings.html',
    '/css/style.css',
    '/js/main.js',
    '/js/calculator.js',
    '/js/form-brief.js',
    '/js/lead-magnet.js',
    '/js/hero-3d.js',
    '/manifest.json',
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    if (e.request.method !== 'GET') return;
    if (url.origin !== self.location.origin) return; // skip cross-origin (CDN, fonts) — let browser handle

    // Network-first for HTML, cache-first for the rest
    if (e.request.headers.get('accept')?.includes('text/html')) {
        e.respondWith(
            fetch(e.request).then((res) => {
                const copy = res.clone();
                caches.open(CACHE).then((c) => c.put(e.request, copy));
                return res;
            }).catch(() => caches.match(e.request).then((r) => r || caches.match('/index.html')))
        );
    } else {
        e.respondWith(
            caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
                const copy = res.clone();
                caches.open(CACHE).then((c) => c.put(e.request, copy));
                return res;
            }))
        );
    }
});
