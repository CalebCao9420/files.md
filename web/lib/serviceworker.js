const CACHE_NAME = 'files-md-v1';
const urlsToCache = [
    '/',           // Instead of '/'
    '/chat.wasm',  // Instead of 'chat.wasm'
    'chat.wasm'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                // Cache each file individually to find the problem
                const cachePromises = urlsToCache.map(url => {
                    console.log('Trying to cache:', url);
                    return cache.add(url)
                        .then(() => console.log('✓ Cached:', url))
                        .catch(err => console.error('✗ Failed to cache:', url, err));
                });
                return Promise.allSettled(cachePromises); // Won't fail if one fails
            })
    );
});

self.addEventListener('fetch', event => {
    console.log('intercepting');
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});