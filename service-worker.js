const CACHE_NAME = "offline-v59";

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

// List of specific images to never cache
const doNotCacheList = [
    "/img/newp.jpg"
];

// Domains to always fetch fresh (no caching)
const neverCacheHosts = [
    "opensheet.elk.sh",
    "docs.google.com",
    "raw.githubusercontent.com",
    "googleapis.com"
];

// Fetch: Smart caching strategy
self.addEventListener("fetch", event => {
    const url = new URL(event.request.url);

    // Live data: skip cache completely
    if (url.hostname === "opensheet.elk.sh" || url.pathname === "/deals") {
        event.respondWith(fetch(event.request));
        return;
    }

    // Skip third-party domains (cross-origin)
    if (url.origin !== self.location.origin || 
        neverCacheHosts.some(host => url.hostname.includes(host))) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Skip caching specific local assets
    if (doNotCacheList.includes(url.pathname)) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Default: Cache-first strategy
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
