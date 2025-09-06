const CACHE_NAME = "offline-v135";

const urlsToCache = [
    "/",
    "/js/dt.main.js",
    "/balance",
    "/js/balance.js",
    "/deals",
    "/profile",
    "/install",
    "/brochure",
    "/js/profile.js",
    "/salesletter",
    "/js/salesletter.js",
    "/marketing",
    "/js/marketing.js",
    "/splashpage",
    "/signup",
     "/js/signup.js",
    "/img/jm.svg",
    "/img/tt.svg",
    "/img/bb.svg",
    "/img/gy.svg",
    "/img/kn.svg",
    "/img/ky.svg",
    "/topup",
    "/js/topup.js",
    "/manifest.json",
    "/img/AllPreepwaapp.png",
    "/404.html"
];

let activeSheetUrl = null;

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
    "docs.google.com",
    "raw.githubusercontent.com",
    "googleapis.com"
];

self.addEventListener("fetch", event => {
    const url = new URL(event.request.url);

    // ✅ Only cache the currently active takeover sheet from opensheet
if (url.hostname === "opensheet.elk.sh") {
    event.respondWith(
        caches.open(CACHE_NAME).then(cache =>
            fetch(event.request)
                .then(networkResponse => {
                    if (networkResponse && networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                })
                .catch(() =>
                    cache.match(event.request).then(cached =>
                        cached || new Response("[]", {
                            headers: { "Content-Type": "application/json" }
                        })
                    )
                )
        )
    );
    return;
}



    if (
        url.origin !== self.location.origin ||
        neverCacheHosts.some(host => url.hostname.includes(host))
    ) {
        event.respondWith(fetch(event.request));
        return;
    }

    if (doNotCacheList.includes(url.pathname)) {
        event.respondWith(fetch(event.request));
        return;
    }

    if (url.pathname.endsWith(".css") || url.pathname.endsWith(".js")) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache =>
                cache.match(event.request).then(cachedResponse => {
                    const fetchPromise = fetch(event.request).then(networkResponse => {
                        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => cachedResponse);
                    return cachedResponse || fetchPromise;
                })
            )
        );
        return;
    }

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

self.addEventListener("message", event => {
    if (event.data?.type === "CLEANUP_IMAGES") {
        const currentImageUrls = event.data.currentImageUrls || [];
        event.waitUntil(cleanupUnusedImages(currentImageUrls));
    }

    if (event.data?.type === "CLEANUP_SHEET_CACHE") {
        const keepList = event.data.keepSheets || [];
        event.waitUntil(cleanupOldSheets(keepList));
    }

    // ✅ Receive the active opensheet URL from frontend
    if (event.data?.type === "SET_ACTIVE_SHEET") {
        activeSheetUrl = event.data.url || null;
        cleanupOldSheets(activeSheetUrl ? [activeSheetUrl] : []);
    }
});

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

async function cleanupOldSheets(keepList = []) {
    const cache = await caches.open(CACHE_NAME);
    const cachedRequests = await cache.keys();
    const keepSet = new Set(keepList);

    for (const request of cachedRequests) {
        if (request.url.includes("opensheet.elk.sh") && !keepSet.has(request.url)) {
            await cache.delete(request);
            console.log("Deleted stale sheet:", request.url);
        }
    }
}
