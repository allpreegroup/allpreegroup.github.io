var CACHE_NAME = "offline-v18";

var preLoad = function () {
    console.log("Installing web app...");
    return caches.open(CACHE_NAME).then(function (cache) {
        console.log("Caching important routes...");
        return cache.addAll([
            "/",
            "/balance/",
            "/manifest.json",
            "/img/AllPreepwaapp.png",
            "/404.html" // Ensure this file actually exists on your server
        ]).catch(err => console.error("Cache error:", err));
    });
};

// Install event: Cache important assets
self.addEventListener("install", function (event) {
    console.log("Service Worker installing...");
    event.waitUntil(preLoad());
    self.skipWaiting(); // Activate immediately
});

// Activate event: Clean up old caches
self.addEventListener("activate", function (event) {
    console.log("Service Worker activating...");
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cache) {
                    if (cache !== CACHE_NAME) {
                        console.log("Deleting old cache:", cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Ensure control over open pages
});

// Fetch event: Serve from cache, fallback to network
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
