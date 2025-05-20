const CACHE_NAME = "offline-v62";

const urlsToCache = [
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
];

// Preload core assets individually with error handling
const preLoad = async () => {
    const cache = await caches.open(CACHE_NAME);
    for (const url of urlsToCache) {
        try {
            await cache.add(url);
        } catch (err) {
            console.warn(`Failed to cache ${url}:`, err);
        }
    }
};

self.addEventListener("install", event => {
    event.waitUntil(preLoad());
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames.map(name => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            )
        )
    );
    self.clients.claim();
});

const doNotCacheList = [
    "/img/newp.jpg"
];

const neverCacheHosts = [
    "opensheet.elk.sh",
    "docs.google.com",
    "raw.githubusercontent.com",
    "googleapis.com"
];

self.addEventListener("fetch", event => {
    const url = new URL(event.request.url);

    // Always fetch live data from specific hostname or path
    if (url.hostname === "opensheet.elk.sh" || url.pathname === "/deals") {
        event.respondWith(fetch(event.request));
        return;
    }

    // Never cache third-party or live sheet data
    if (
        url.origin !== self.location.origin ||
        neverCacheHosts.some(host => url.hostname.includes(host))
    ) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Skip specific images
    if (doNotCacheList.includes(url.pathname)) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Optional: Stale-while-revalidate for CSS and JS files
    if (url.pathname.endsWith(".css") || url.pathname.endsWith(".js")) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache =>
                cache.match(event.request).then(cachedResponse => {
                    const fetchPromise = fetch(event.request).then(networkResponse => {
                        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => cachedResponse); // fallback to cache on fetch error

                    return cachedResponse || fetchPromise;
                })
            )
        );
        return;
    }

    // Cache-first strategy for everything else
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) {
                return cached;
            }
            return fetch(event.request)
                .then(networkResponse => {
                    if (
                        !networkResponse ||
                        networkResponse.status !== 200 ||
                        networkResponse.type !== "basic"
                    ) {
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
                })
                .catch(() => caches.match("/404.html"));
        })
    );
});

// Listen for frontend message to cleanup images
self.addEventListener("message", event => {
    if (event.data && event.data.type === "CLEANUP_IMAGES") {
        const currentImageUrls = event.data.currentImageUrls || [];
        event.waitUntil(cleanupUnusedImages(currentImageUrls));
    }
});

// Remove cached images no longer in use
async function cleanupUnusedImages(currentImageUrls = []) {
    const cache = await caches.open(CACHE_NAME);
    const cachedRequests = await cache.keys();
    const keepSet = new Set(
        currentImageUrls.map(url => new URL(url, self.location.origin).href)
    );

    for (const request of cachedRequests) {
        const isProductImage = request.url.includes("/products/images/");
        if (isProductImage && !keepSet.has(request.url)) {
            await cache.delete(request);
            console.log("Deleted unused image:", request.url);
        }
    }
}
