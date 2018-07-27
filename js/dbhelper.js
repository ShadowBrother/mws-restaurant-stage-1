/**
 * Common database helper functions.
 */
class DBHelper {

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */

    static get DATABASE_URL() {
        const port = 8000; // Change this to your server port
        return `http://localhost:${port}/data/restaurants.json`;
    }

    static get API_URL() {
        const port = 1337; // Change this to your server port
        return `http://localhost:${port}/restaurants`;
    }

    static openDatabase() {
        // If the browser doesn't support service worker,
        // we don't care about having a database
        if (!navigator.serviceWorker) {
            return Promise.resolve();
        }
        //console.log('openDatabase');
        return idb.open('restaurant-db', 1, function (upgradeDb) {
            var store = upgradeDb.createObjectStore('keyval', {
                keyPath: 'id'
            });
            //console.log('keyval: ', store);
            store.createIndex('by-id', 'id');
        });
    }

    static get dbPromise() {
        //console.log('dbPromise');
        return DBHelper.openDatabase();
    }

    
    //idb code adapted from https://github.com/jakearchibald/idb

    static getVal(key){
        return DBHelper.dbPromise.then(db => {
           //console.log('getVal', key, typeof key);
           return db.transaction('keyval').objectStore('keyval').get(key);
           
        });
    }

    static setVal(val){
        return DBHelper.dbPromise.then(db => {
            const tx = db.transaction('keyval', 'readwrite');
            tx.objectStore('keyval').put(val);
            return tx.complete;
        });
    }

    static deleteVal(key) {
        return dbPromise.then(db => {
            const tx = db.transaction('keyval', 'readwrite');
            tx.objectStore('keyval').delete(key);
            return tx.complete;
        });
    }

    static clearStore() {
        return dbPromise.then(db => {
            const tx = db.transaction('keyval', 'readwrite');
            tx.objectStore('keyval').clear();
            return tx.complete;
        });
    }

    static getKeys(){
        return DBHelper.dbPromise.then(db => {
            const tx = db.transaction('keyval');
            const keys = [];
            const store = tx.objectStore('keyval');

            (store.iterateKeyCursor || store.iterateCursor).call(store, cursor => {
                if(!cursor) return;
                keys.push(cursor.key);
                cursor.continue();
            });
            return tx.complete.then(() => keys);
        });
    }


    /**
    * Fetch all restaurants using fetch.
    */
    static fetchRestaurants(callback) {
        
        //console.log(DBHelper.getKeys());
        let keys = DBHelper.getKeys();
        //console.log("keys: ", keys);
        
        let vals = keys.then(keys => keys.map(key => DBHelper.getVal(key)));
        //console.log("vals: ", vals);
        vals.then(vals => {
            if (vals.length > 0) {//restaurant data is in idb
                //console.log('fetchRestaurants returning from idb ', vals);
                
                Promise.all(vals).then(vals => {
                    callback(null, vals);//use data in callback

                });

            }//still fetch data, in case more/newer data in api
            return fetch(DBHelper.API_URL)//fetch data from api, store in idb
            .then(response => {
                //console.log("fetchRestuarants: ",response.clone().json());
                return response.json();
            })
            .then(json => {
                //console.log("fetchRestaurants .then json: ", json);
                for (let restaurant of json) {
                    //console.log(`putting ${restaurant.name} in idb: `, restaurant);
                    DBHelper.setVal(restaurant);
                }
                callback(null, json);
            })
            .catch(err => callback(err, null));
        });
        
    }

   /**
    * Fetch all restaurants using fetch, without using a callback
    */
    static FetchRestaurants() {
        return fetch(DBHelper.API_URL)
            .then(response => {
                return response.json();
                //callback(null, response.json().restaurants);
            })
            .catch(err => {
                console.log(err);
                return err;

            });
    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        
        DBHelper.getVal(parseInt(id)).then(restaurant => {//check idb for restaurant

            //console.log('fetchRestaurantById',restaurant);
        
            if (restaurant) {//if restaurant in idb, use it
                //console.log('fetchRestaurantById found in idb');
                return Promise.resolve(restaurant).then(callback(null, restaurant));
            }

            //console.log('fetchRestaurantById fetching from API');
            return fetch(DBHelper.API_URL + `/${id}`)//restaurant not in idb, fetch from idb
            .then(response => {

                return response.json();
            }).
            then(json => {//store restaurant in idb
                //console.log('fetchRestaurantById adding restaurant to idb', json);
                DBHelper.setVal(json);
                callback(null, json);
            })
            .catch(err => { console.log(err); callback(err, null); });
        }).catch(err => { console.log(err); callback(err, null); });
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */
    static fetchRestaurantByCuisine(cuisine, callback) {
        // Fetch all restaurants  with proper error handling
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given cuisine type
                const results = restaurants.filter(r => r.cuisine_type == cuisine);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
    static fetchRestaurantByNeighborhood(neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given neighborhood
                const results = restaurants.filter(r => r.neighborhood == neighborhood);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                let results = restaurants;
                if (cuisine != 'all') { // filter by cuisine
                    results = results.filter(r => r.cuisine_type == cuisine);
                }
                if (neighborhood != 'all') { // filter by neighborhood
                    results = results.filter(r => r.neighborhood == neighborhood);
                }
                callback(null, results);
            }
        });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static fetchNeighborhoods(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                //console.log("fetchNeighborhoods restaurants: ", restaurants);
                // Get all neighborhoods from all restaurants
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
                callback(null, uniqueNeighborhoods);
            }
        });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static fetchCuisines(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
                callback(null, uniqueCuisines);
            }
        });
    }

    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant) {
        return (`/img/${restaurant.photograph || restaurant.id}.jpg`);
    }
    /**
     * Restaurant image srcset.
     */
    static imageSrcsetForRestaurant(restaurant) {
        const imgSizes = [640, 768, 1024, 1366, 1600, 1920];
        const img = restaurant.photograph || restaurant.id;
        //const fileRX = /(.+)(\.[\w]{3,4})/;
        //const [,imgName, imgExt] = fileRX.exec(img);
        const imgName = img;
        const imgExt = '.jpg';
        //console.log(imgName,imgExt);
        let imgStr = "";
        for(let size of imgSizes) {
            imgStr += '/img/' + imgName + '-' + size + imgExt + " " + size + 'w, ';
        }
        //console.log(imgStr);
        return imgStr.slice(0, -1);//remove extra ',';
    }
    /**
    * Restaurant image urls.
    */
    static imgUrlsArrayForRestaurants(restaurant) {
        const imgSizes = [640, 768, 1024, 1366, 1600, 1920];
        const img = restaurant.photograph || restaurant.id;
        const fileRX = /(.+)(\.[\w]{3,4})/;
        //const [,imgName, imgExt] = fileRX.exec(img);
        const imgName = img;
        const imgExt = '.jpg';
        //console.log(imgName,imgExt);
        let imgArray = [DBHelper.imageUrlForRestaurant(restaurant)];
        for(let size of imgSizes) {
            imgArray.push('/img/' + imgName + '-' + size + imgExt);
        }
        //console.log(imgArray);
        return imgArray;
    }
    /**
     * Map marker for a restaurant.
     */
    static mapMarkerForRestaurant(restaurant, map) {
        const marker = new google.maps.Marker({
            position: restaurant.latlng,
            title: restaurant.name,
            url: DBHelper.urlForRestaurant(restaurant),
            map: map,
            animation: google.maps.Animation.DROP
        }
        );
        return marker;
    }

}
