var preLoad = function () {
    console.log("Installing web app");
    return caches.open("offline").then(function (cache) {
        console.log("Caching index and important routes");
        return cache.addAll([
            "https://www.allpree.com/balance/",
            "/404.html" // Ensure this file exists in your root directory
        ]).catch(err => console.error("Cache error:", err));
    });
};

self.addEventListener("install", function (event) {
    event.waitUntil(preLoad());
});

self.addEventListener("fetch", function (event) {
    event.respondWith(
        checkResponse(event.request).catch(function () {
            return returnFromCache(event.request);
        })
    );
    event.waitUntil(addToCache(event.request));
});

var checkResponse = function (request) {
    return fetch(request).then(function (response) {
        if (response.status !== 404) {
            return response;
        } else {
            return Promise.reject();
        }
    });
};

var addToCache = function (request) {
    return caches.open("offline").then(function (cache) {
        return fetch(request).then(function (response) {
            console.log(response.url + " was cached");
            cache.put(request, response.clone()); // Clone response before caching
            return response;
        }).catch(err => console.warn("Caching failed:", err));
    });
};

var returnFromCache = function (request) {
    return caches.open("offline").then(function (cache) {
        return cache.match(request).then(function (matching) {
            if (!matching || matching.status == 404) {
                return cache.match("/404.html"); // Return 404 fallback
            } else {
                return matching;
            }
        });
    });
};
