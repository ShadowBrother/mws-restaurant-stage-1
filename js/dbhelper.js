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
        return `http://localhost:${port}`;
    }

    static get RESTAURANT_URL(){
        return DBHelper.API_URL + '/restaurants';
    }

    static get REVIEW_URL() {
        return DBHelper.API_URL + '/reviews';
    }

    static openDatabase() {
        // If the browser doesn't support service worker,
        // we don't care about having a database
        if (!navigator.serviceWorker) {
            return Promise.resolve();
        }
        //console.log('openDatabase');
        return idb.open('restaurant-db', 2, function (upgradeDB) {
            switch(upgradeDB.oldVersion){
                case 0:
        
                    let restaurantStore = upgradeDB.createObjectStore('restaurants', {
            keyPath: 'id'});

                    console.log('restaurantStore: ', restaurantStore);
                    restaurantStore.createIndex('by-id', 'id');
                case 1:

                    let reviewStore = upgradeDB.createObjectStore('reviews', {
            keyPath: 'id'});
                    console.log('reviewStore: ', reviewStore);
                    reviewStore.createIndex('by-id', 'id');
                    reviewStore.createIndex('by-restaurant-id', 'restaurant_id');
            }
        });
    }

    static get dbPromise() {
        //console.log('dbPromise');
        return DBHelper.openDatabase();
    }

    
    //idb code adapted from https://github.com/jakearchibald/idb

    static getVal(store, key){
        return DBHelper.dbPromise.then(db => {
           //console.log('getVal', key, typeof key);
           return db.transaction(store).objectStore(store).get(key);
           
        });
    }

    static setVal(store, val){
        return DBHelper.dbPromise.then(db => {
            const tx = db.transaction(store, 'readwrite');
            tx.objectStore(store).put(val);
            return tx.complete;
        });
    }

    static deleteVal(store, key) {
        return DBHelper.dbPromise.then(db => {
            const tx = db.transaction(store, 'readwrite');
            tx.objectStore(store).delete(key);
            return tx.complete;
        });
    }

    static clearStore(store) {
        return DBHelper.dbPromise.then(db => {
            const tx = db.transaction(store, 'readwrite');
            tx.objectStore(store).clear();
            return tx.complete;
        });
    }

    static getKeys(storeName) {
        
        return DBHelper.dbPromise.then(db => {
            
            const tx = db.transaction(storeName);
            const keys = [];
            const store = tx.objectStore(storeName);

            (store.iterateKeyCursor || store.iterateCursor).call(store, cursor => {
                if(!cursor) return;
                keys.push(cursor.key);
                cursor.continue();
            });
            return tx.complete.then(() => keys);
        });
    }

    /**
     * Set restaurant favorite status
     */

    static setFavorite(id, isFavorite) {

        fetch(`${DBHelper.RESTAURANT_URL}/${id}/?is_favorite=${isFavorite}`, { method: 'PUT' })//update is_favorite for restaurant
        .catch(err => console.log(err));
        
        DBHelper.getVal('restaurants', id).then(val => {//update idb
            val.is_favorite = isFavorite;
            DBHelper.setVal('restaurants', val)
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
    }

    /**
     * Post  new restaurant review
     */

    static postReview(data) {

        fetch(DBHelper.REVIEW_URL, {
            method: 'POST',
            body: data
        }).catch(err => console.log(err));
    }

    /**
    * Fetch all restaurants using fetch.
    */
    static fetchRestaurants(callback) {
        
       
        let keys = DBHelper.getKeys('restaurants');
        console.log("keys: ", keys);
        
        let vals = keys.then(keys => keys.map(key => DBHelper.getVal('restaurants', key)));
        //console.log("vals: ", vals);
        vals.then(vals => {
            if (vals.length > 0) {//restaurant data is in idb
                //console.log('fetchRestaurants returning from idb ', vals);
                
                Promise.all(vals).then(vals => {
                    callback(null, vals);//use data in callback

                });

            }//still fetch data, in case more/newer data in api
            return fetch(DBHelper.RESTAURANT_URL)//fetch data from api, store in idb
            .then(response => {
                //console.log("fetchRestuarants: ",response.clone().json());
                return response.json();
            })
            .then(json => {
                //console.log("fetchRestaurants .then json: ", json);
                callback(null, json);
                for (let restaurant of json) {
                    //console.log(`putting ${restaurant.name} in idb: `, restaurant);
                    DBHelper.setVal('restaurants', restaurant);
                }
                
            })
            .catch(err => callback(err, null));
        });
        
    }

   /**
    * Fetch all restaurants using fetch, without using a callback
    */
    static FetchRestaurants() {
        return fetch(DBHelper.RESTAURANT_URL)
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
        
        DBHelper.getVal('restaurants', parseInt(id)).then(restaurant => {//check idb for restaurant

            //console.log('fetchRestaurantById',restaurant);
        
            if (restaurant) {//if restaurant in idb, use it
                //console.log('fetchRestaurantById found in idb');
                return Promise.resolve(restaurant).then(callback(null, restaurant));
            }

            //console.log('fetchRestaurantById fetching from API');
            return fetch(DBHelper.RESTAURANT_URL + `/${id}`)//restaurant not in idb, fetch from api
            .then(response => {

                return response.json();
            })
            .then(json => {//store restaurant in idb
                //console.log('fetchRestaurantById adding restaurant to idb', json);
                DBHelper.setVal('restaurants', json);
                callback(null, json);
            })
            .catch(err => { console.log(err); callback(err, null); });
        }).catch(err => { console.log(err); callback(err, null); });
     }

    /**
     * Fetch a review by its ID.
     */

    static fetchReviewById(id, callback) {

        DBHelper.getVal('review', parseInt(id)).then(review => {//check idb for review

            if (review) {//if review is in idb, use it
                return Promise.resolve(review).then(callback(null, restaurant));
            }

            return fetch(DBHelper.REVIEW_URL + `/${id}`)//review not in idb, fetch from api
            .then(response => {
                return response.json();
            })
            .then(json => {//store review in idb
                json.restaurant_id = parseInt(json.restaurant_id);//convert restaurant_id to number
                DBHelper.setVal('review', json);
                callback(null, json);
            })
            .catch(err => { console.log(err); callback(err, null); });
        }).catch(err => { console.log(err); callback(err, null); });
    }

    /**
     * Fetch reviews by restaurant id
     */

    static fetchReviewsByRestaurantId(id, callback) {

        DBHelper.dbPromise.then(db => {
            let store = db.transaction('reviews', 'readonly').objectStore('reviews');
            let index = store.index('by-restaurant-id', { unique: false });
            return index.getAll(id);
        })
        .then(reviews => {
            console.log('fetchReviewsByRestaurantId idb reviews: ', reviews);
            return Promise.all(reviews)
        })
        .then(reviews => {
            console.log('fetchReviewsByRestaurantId reviews: ', reviews);
            
           if (reviews.length > 0) {//reviews in idb, callback with reviews
                callback(null, reviews);
                
            }
            return fetch(DBHelper.REVIEW_URL + `/?restaurant_id=${id}`)//fetch reviews from api
            .then(response => response.json())
            .then(json => {
                console.log('fetchReviewsByRestaurantId fetched reviews: ', json);
                console.log('reviews from idb', reviews);
                if (!DBHelper.compareReviews(reviews, json)) {//fetched data contains data that wasn't in idb
                    console.log('new data fetched');
                    let changes = DBHelper.getUpdatedReviews(reviews,json);
                    callback(null, changes);//callback with new reviews
                    for (let review of changes) {//put reviews in idb
                        review.restaurant_id = parseInt(review.restaurant_id);//convert restaurant_id to number
                        DBHelper.setVal('reviews', review);
                    }
                }
            }).catch(err => { console.log(err); callback(err, null); });
        }).catch(err => { console.log(err); callback(err, null); });
        
    }

    /**
     * Compare review data from idb and fetch, returns true if data is same, else false
     */

    static compareReviews(idb, fetch) {

        console.log("compareReviews",idb, fetch);
        if (idb.length !== fetch.length) {
            console.log('different lengths, not the same');
            return false;
        }

        for (let fetch_review of fetch) {
            let idb_review = idb.find(x => x.id === fetch_review.id);
            console.log('fetch_review.id idb_review', fetch_review.id, idb_review);
            if (idb_review) {//idb has a review with matching id
                console.log("fetch update, idb update", Date(fetch_review.updatedAt), Date(idb_review.updatedAt), (Date(fetch_review.updatedAt) == Date(idb_review.updatedAt)) ? "true" : "false");
                if (Date(fetch_review.updatedAt) !== Date(idb_review.updatedAt)) return false;//different update dates
            }
            else return false;//missmatched data
        }
        return true;
    }

    /**
    * Find updated reviews, returns array of new or updated reviews
    */
    static getUpdatedReviews(idb, fetch) {
        console.log("getUpdatedReviews",idb, fetch);

        let changes = [];

        for (let fetch_review of fetch) {
            let idb_review = idb.find(x => x.id === fetch_review.id);
            console.log('fetch_review.id idb_review', fetch_review.id, idb_review);
            if (idb_review) {//idb has a review with matching id
                console.log("fetch update, idb update", Date(fetch_review.updatedAt), Date(idb_review.updatedAt), (Date(fetch_review.updatedAt) == Date(idb_review.updatedAt)) ? "true" : "false");
                if (Date(fetch_review.updatedAt) !== Date(idb_review.updatedAt)) changes.push(fetch_review);//updated data, add review to changes
            }
            else {
                changes.push(fetch_review);//missing data, add review to changes
            }
        
        }
        return changes;
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
