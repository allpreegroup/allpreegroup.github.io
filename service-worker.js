var CACHE_NAME = "offline-v30";

var preLoad = function () {
    return caches.open(CACHE_NAME).then(function (cache) {
        return cache.addAll([
            "/",
            "/balance/",
            "/storeapp/",
            "/howitwork/",
            "/menu/",
            "/marketing/",
            "/partner/",
            "/vouchers/",
            "/manifest.json",
            "/img/AllPreepwaapp.png",
            "/404.html"
        ]).catch(err => {
            console.error("Cache error:", err);
        });
    });
};

// Install event: Cache important assets, no unnecessary logs
self.addEventListener("install", function (event) {
    event.waitUntil(preLoad());
    self.skipWaiting(); // Activate immediately
});

// Activate event: Clean up old caches, no unnecessary logs
self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cache) {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Ensure control over open pages
});

// Fetch event: Serve from cache, fallback to network, no pop-ups
self.addEventListener("fetch", function (event) {
    event.respondWith(
        caches.match(event.request).then(function (cachedResponse) {
            return cachedResponse || fetch(event.request)
                .then(function (networkResponse) {
                    return caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                })
                .catch(function () {
                    return caches.match("/404.html");
                });
        })
    );
});
