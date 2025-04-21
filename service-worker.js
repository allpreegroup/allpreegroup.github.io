const CACHE_NAME = "offline-v50";

// Preload core assets
const preLoad = () => {
    return caches.open(CACHE_NAME).then(cache => {
        return cache.addAll([
            "/",
            "/balance/",
            "/storeapp/",
            "/howitwork/",
            "/menu/",
            "/marketing",
            "/splashpage",
            "/partner/",
            "/vouchers/",
            "/manifest.json",
            "/img/AllPreepwaapp.png",
            "/404.html"
        ]).catch(err => {
            console.error("Cache preload error:", err);
        });
    });
};

// Install: Pre-cache core files
self.addEventListener("install", event => {
    event.waitUntil(preLoad());
    self.skipWaiting();
});

// Activate: Clear old caches
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(name => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch: Network-first for live data, cache-first for others
self.addEventListener("fetch", event => {
    const url = new URL(event.request.url);

    // Always fetch from network for live-data or any other dynamic endpoint
    if (url.pathname === "/deals") {
        event.respondWith(
            fetch(event.request)
                .catch(() => new Response("Live data unavailable offline", {
                    status: 503,
                    statusText: "Service Unavailable"
                }))
        );
        return;
    }

    // Default: Try cache first, fallback to network
    event.respondWith(
        caches.match(event.request).then(cached => {
            return cached || fetch(event.request)
                .then(networkResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                })
                .catch(() => caches.match("/404.html"));
        })
    );
});
