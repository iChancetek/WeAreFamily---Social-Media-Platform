importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
    console.log(`[PWA] Workbox is loaded`);

    // Skip waiting to activate immediately
    workbox.core.skipWaiting();
    workbox.core.clientsClaim();

    // Cache names
    const CACHE_NAME_ASSETS = 'famio-assets-v1';
    const CACHE_NAME_API = 'famio-api-v1';
    const CACHE_NAME_MEDIA = 'famio-media-v1';

    // 1. Cache Pages & Statics (StaleWhileRevalidate)
    // This covers JS, CSS, and the main HTML document
    workbox.routing.registerRoute(
        ({ request }) => request.destination === 'document' ||
            request.destination === 'script' ||
            request.destination === 'style',
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: CACHE_NAME_ASSETS,
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 50,
                    maxAgeSeconds: 24 * 60 * 60, // 1 day
                }),
            ],
        })
    );

    // 2. Cache Images (CacheFirst)
    workbox.routing.registerRoute(
        ({ request }) => request.destination === 'image',
        new workbox.strategies.CacheFirst({
            cacheName: CACHE_NAME_MEDIA,
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 100,
                    maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
                }),
            ],
        })
    );

    // 3. Cache API Calls (NetworkFirst - optimize for fresh content but fallback offline)
    workbox.routing.registerRoute(
        ({ url }) => url.pathname.startsWith('/api/'),
        new workbox.strategies.NetworkFirst({
            cacheName: CACHE_NAME_API,
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 50,
                    maxAgeSeconds: 5 * 60, // 5 minutes
                }),
            ],
        })
    );

    // Background Sync for Mutations (POST/PUT/DELETE)
    const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('famio-queue', {
        maxRetentionTime: 24 * 60, // Retry for 24 Hours
    });

    workbox.routing.registerRoute(
        ({ url, request }) => url.pathname.startsWith('/api/') && request.method !== 'GET',
        new workbox.strategies.NetworkOnly({
            plugins: [bgSyncPlugin],
        }),
        'POST'
    );
    workbox.routing.registerRoute(
        ({ url, request }) => url.pathname.startsWith('/api/') && request.method !== 'GET',
        new workbox.strategies.NetworkOnly({
            plugins: [bgSyncPlugin],
        }),
        'PUT'
    );
    workbox.routing.registerRoute(
        ({ url, request }) => url.pathname.startsWith('/api/') && request.method !== 'GET',
        new workbox.strategies.NetworkOnly({
            plugins: [bgSyncPlugin],
        }),
        'DELETE'
    );

} else {
    console.log(`[PWA] Workbox didn't load`);
}
