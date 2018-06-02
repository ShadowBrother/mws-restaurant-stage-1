let staticCache = 'restaurant-static-v2';
let imgCache = 'restaurant-imgs';

let allCaches = [staticCache, imgCache];

self.addEventListener('install', event => {
    console.log('service worker installing');
    event.waitUntil(
        caches.open(staticCache).then(cache => {
            return cache.addAll([
                '/js/main.js',
                '/js/restaurant_info.js',
                '/css/styles.min.css',
                'data/restaurants.json'
                
            ]);
        }))
});

self.addEventListener('activate', event => {
    console.log('service worker activating');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName.startsWith('restaurant-') && !allCaches.includes(cacheName);
                }).map(cacheName => {
                    return caches.delete(cacheName);
                }))
        }))
});

self.addEventListener('fetch', event => {
    console.log('service worker fetching');
    let requestUrl = new URL(event.request.url);

    console.log("request origin", requestUrl.origin);
    if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname.startsWith('img/')) {
            event.respondWith(serveImg(event.request));
            return;
        }
    }
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        }));
});

const serveImg = request => {

    console.log("serveImg");
    let storageUrl = request.url.replace(/-\d+px\.jpg$/, '');

    return caches.open(imgCache).then(cache => {
        return cache.match(storageUrl).then(response => {
            if (response) {
                console.log("img matched in cache ", response);
                return response;
            }
            return fetch(request).then(netResponse => {
                cache.put(storageUrl, netResponse.clone());
                console.log("getting img from net", request);
                return netReponse;
            });
        })
    });

}