const CACHE_NAME = "offline-v66";

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

// Fetch: Smart caching strategy with image deduplication
self.addEventListener("fetch", event => {
    const url = new URL(event.request.url);

    // Always fetch live data
    if (url.hostname === "opensheet.elk.sh" || url.pathname === "/deals") {
        event.respondWith(fetch(event.request));
        return;
    }

    // Never cache third-party or live sheet data
    if (url.origin !== self.location.origin ||
        neverCacheHosts.some(host => url.hostname.includes(host))) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Skip specific images
    if (doNotCacheList.includes(url.pathname)) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Cache-first strategy, avoid duplicate cache
    event.respondWith(
        caches.match(event.request).then(cached => {
            return cached || fetch(event.request).then(networkResponse => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
                    return networkResponse;
                }

                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.match(event.request).then(existing => {
                        if (!existing) {
                            cache.put(event.request, responseClone);
                        }
                    });
                });

                return networkResponse;
            }).catch(() => caches.match("/404.html"));
        })
    );
});

// 🔁 Image cleanup from frontend trigger
self.addEventListener("message", event => {
    if (event.data && event.data.type === "CLEANUP_IMAGES") {
        const currentImageUrls = event.data.currentImageUrls || [];
        cleanupUnusedImages(currentImageUrls);
    }
});

// 🧹 Remove images no longer in use
async function cleanupUnusedImages(currentImageUrls = []) {
    const cache = await caches.open(CACHE_NAME);
    const cachedRequests = await cache.keys();
    const keepSet = new Set(currentImageUrls.map(url => new URL(url, self.location.origin).href));

    for (const request of cachedRequests) {
        const isProductImage = request.url.includes("/products/images/");
        if (isProductImage && !keepSet.has(request.url)) {
            await cache.delete(request);
            console.log("Deleted unused image:", request.url);
        }
    }
}
