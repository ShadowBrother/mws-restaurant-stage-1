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
        console.log('openDatabase');
        return idb.open('test-db', 1, function (upgradeDb) {
            var store = upgradeDb.createObjectStore('keyValStore', {
                keyPath: 'id'
            });
            console.log('keyValStore: ', store);
            //store.createIndex('by-date', 'time');
        });
    }

    static get dbPromise() {
        console.log('dbPromise');
        return DBHelper.openDatabase();
    }


    /**
     * Fetch all restaurants.
     */
      /*
    static fetchRestaurants(callback) {
      let xhr = new XMLHttpRequest();
      xhr.open('GET', DBHelper.DATABASE_URL);
      xhr.onload = () => {
        if (xhr.status === 200) { // Got a success response from server!
          const json = JSON.parse(xhr.responseText);
          const restaurants = json.restaurants;
          callback(null, restaurants);
        } else { // Oops!. Got an error from server.
          const error = (`Request failed. Returned status of ${xhr.status}`);
          callback(error, null);
        }
      };
      xhr.send();
    }
    */
      /**
      * Fetch all restaurants using fetch.
      */
    static fetchRestaurants(callback) {
        console.log(DBHelper.dbPromise);
        return fetch(DBHelper.API_URL)
        .then(response => {
            //console.log("fetchRestuarants: ",response.clone().json());
            return response.json();
        })
        .then(json => {
            //console.log("fetchRestaurants .then json: ", json);
            callback(null, json);
        })        
        .catch(err => callback(err, null));
    }

    /**
  * Fetch all restaurants using fetch, without using a callback
  */
    static FetchRestaurants(){
        return fetch(DBHelper.API_URL)
            .then(response => {
                return response.json();
                //callback(null, response.json().restaurants);
            })
            .catch(err =>{
                console.log(err);
                return err;

            });
    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback){
        return fetch(DBHelper.API_URL + `/${id}`)
        .then(response => {
            return response.json();
        }).
        then(json => callback(null, json))
        .catch(err => callback(err, null));
        
    }

    /*
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }
  */

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
    static imageSrcsetForRestaurant(restaurant){
        const imgSizes = [640, 768, 1024, 1366, 1600, 1920];
        const img = restaurant.photograph || restaurant.id;
        //const fileRX = /(.+)(\.[\w]{3,4})/;
        //const [,imgName, imgExt] = fileRX.exec(img);
        const imgName = img;
        const imgExt  ='.jpg';
        //console.log(imgName,imgExt);
        let imgStr = "";
        for(let size of imgSizes) {
            imgStr += '/img/' + imgName + '-' + size + imgExt + " " + size + 'w, ';
        }
        //console.log(imgStr);
        return imgStr.slice(0,-1);//remove extra ',';
    }
    /**
   * Restaurant image urls.
   */
    static imgUrlsArrayForRestaurants(restaurant){
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
            animation: google.maps.Animation.DROP}
        );
        return marker;
    }

}
