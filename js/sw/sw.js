importScripts('dbhelper.js');

let staticCache = 'restaurant-static-v14';
let imgCache = 'restaurant-imgs-v5';
let mapCache = 'restaurant-map-v2';
let mapUrl = "https://maps.googleapis.com/maps/api/js?key=AIzaSyCfUFYugCYuCXWWUINNPx8sMiWUN1CgZNc&libraries=places&callback=initMap";
let allCaches = [staticCache, imgCache, mapCache];

self.addEventListener('install', event => {
    console.log('service worker installing');
    event.waitUntil(
        caches.open(staticCache).then(cache => {
            return cache.addAll([
                '/',
                '/js/main.js',
                '/js/restaurant_info.js',
                '/css/styles.css',
                'dbhelper.js',
                'sw.js',
                '/js/idb.js',
                'restaurant.html',
                'manifest.webmanifest'


            ]);

        }).then(caches.open(mapCache).then(cache => fetch(mapUrl, { mode: 'no-cors' })
            .then(response => { return cache.put(mapUrl, response); })))
        /*.then(caches.open(imgCache).then(cache => {
            return DBHelper.FetchRestaurants().then(json => {
                let restaurants = json;
                //console.log('cache imgs, restaurants: ', restaurants);
                let imgCacheStr = restaurants.map(restaurant => {
                    let imgUrls = DBHelper.imgUrlsArrayForRestaurants(restaurant, 'webp');
                    //console.log(`cache imgs, ${restaurant}: ${imgUrls}`);
                    return imgUrls;
                }).reduce((a, b) => a.concat(b));
                //console.log(imgCacheStr);
                return cache.addAll(imgCacheStr);
            });
        }))*/.catch(err => console.log(err)));});

self.addEventListener('activate', event => {
    console.log('service worker activating');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName.startsWith('restaurant-') && !allCaches.includes(cacheName);
                }).map(cacheName => {
                    return caches.delete(cacheName);
                }));
        }));
});

self.addEventListener('fetch', event => {
    //console.log('service worker fetching');
    let requestUrl = new URL(event.request.url);
        
    //console.log("request origin", requestUrl.origin);
    if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname.startsWith('/img/')) {
            //console.log("img");
            event.respondWith(serveImg(event.request));
            return;
        }
    }
    
    event.respondWith(
        caches.match(event.request, { ignoreSearch: true }).then(response => {
            return response || fetch(event.request);
        }));
});

const serveImg = request => {

    //console.log("serveImg");
    //let storageUrl = request.url.replace(/-\d+px\.jpg$/, '');
    let storageUrl = request.url;
    return caches.open(imgCache).then(cache => {
        return cache.match(storageUrl).then(response => {
            if (response) {
                //console.log("img matched in cache ", response);
                return response;
            }
            return fetch(request).then(netResponse => {
                cache.put(storageUrl, netResponse.clone());
                //console.log("getting img from net", request);
                return netResponse;
            });
        });
    });

};