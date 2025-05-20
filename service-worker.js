const CACHE_NAME = "offline-v67";

// Preload core assets
const preLoad = () => {
    return caches.open(CACHE_NAME).then(cache => {
        return cache.addAll([
            "/deals",
            "/marketing",
            "/splashpage",
            "/partner/",           
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
    "docs.google.com",
    "raw.githubusercontent.com",
    "googleapis.com"
];

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Handle dynamic sheet or deal data: Network-first, fallback to cache if offline
  const isDynamicData =
    url.hostname === "opensheet.elk.sh" ||
    url.pathname === "/deals";

  if (isDynamicData) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // Optional: cache a copy for offline fallback
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback from cache
          return caches.match(event.request).then(cached => {
            if (cached) {
              console.log("🌐 Offline: Serving from cache", url.href);
              return cached;
            }
            return caches.match("/404.html");
          });
        })
    );
    return;
  }

  // Never cache external third-party resources
  if (
    url.origin !== self.location.origin ||
    neverCacheHosts.some(host => url.hostname.includes(host))
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Skip caching specific images
  if (doNotCacheList.includes(url.pathname)) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Default static asset handler: Cache-first, fallback to network
  event.respondWith(
    caches.match(event.request).then(cached => {
      return (
        cached ||
        fetch(event.request).then(networkResponse => {
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
        }).catch(() => caches.match("/404.html"))
      );
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
self.addEventListener("message", event => {
  if (event.data && event.data.type === "CLEANUP_SHEETS") {
    const usedSheetUrls = event.data.usedSheetUrls || [];
    cleanupUnusedSheets(usedSheetUrls);
  }
});

async function cleanupUnusedSheets(usedSheetUrls = []) {
  const cache = await caches.open(CACHE_NAME);
  const cachedRequests = await cache.keys();
  const keepSet = new Set(usedSheetUrls.map(url => new URL(url).href));

  for (const request of cachedRequests) {
    const isSheetUrl = request.url.includes("opensheet.elk.sh");
    if (isSheetUrl && !keepSet.has(request.url)) {
      await cache.delete(request);
      console.log("Deleted unused sheet URL from cache:", request.url);
    }
  }
}
