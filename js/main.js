let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

/**
 * Register service worker
 **/
if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js')
    .then(registration => console.log('Registration successfull', registration.scope))
    .catch(error => console.log('Service worker registration failed, : ', error));
}

/**
 * add online event listener to sync failed review posts/favorite changes
 **/

window.addEventListener('online', () => {
    
        console.log('online event');
        //reattempt to post new reviews
        DBHelper.dbPromise.then(db => {
            let store = db.transaction('requests', 'readonly').objectStore('requests');
            let index = store.index('by-type', { unique: false });
            return index.getAll('newReview');
        }).then(requests => Promise.all(requests))
            .then(requests => {
                for(let request of requests){
                    DBHelper.postReview(request.data);//reattempt to post review
                    DBHelper.deleteVal('requests',request.id);//remove request from requests idb
                }
            }).catch(err => console.log(err));

        //reattempt to put favorite status
        DBHelper.dbPromise.then(db => {
            let store = db.transaction('requests', 'readonly').objectStore('requests');
            let index = store.index('by-type', { unique: false });
            return index.getAll('favorite');
        }).then(requests => Promise.all(requests))
            .then(requests => {
                for(let request of requests){
                    DBHelper.setFavorite(request.restaurant_id, request.is_favorite);//reattempt to post review
                    DBHelper.deleteVal('requests',request.id);//remove request from requests idb
                }
            }).catch(err => console.log(err));
    });

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  //fetchNeighborhoods();
    //fetchCuisines();
    //reduce calls to fetchRestaurants, by fetching restaurants once and filtering for cuisines and neighborhoods from the same results
    DBHelper.fetchRestaurants((err,restaurants) => {
        if(err){
            console.log(err);
            return;
        }
        console.log("DOMContentLoaded restaurants", restaurants );

        //move logic from fetchCuisines/Neighborhoods here, so they can share restaurant data

      // Get all cuisines from all restaurants
      const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
      // Remove duplicates from cuisines
      const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
      // Get all neighborhoods from all restaurants
      const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
      // Remove duplicates from neighborhoods
      const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
      //Call fill cuisines/neighborhoods HTML directly with data
      fillCuisinesHTML(uniqueCuisines);
      fillNeighborhoodsHTML(uniqueNeighborhoods);
  });
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    option.setAttribute("role","option");
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    option.setAttribute("role","option");
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  
  //console.log('fillRestaurantHTML ', restaurants);
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const picture = document.createElement('picture');
  
  //create webp source
  let webp = document.createElement('source');
  webp.type = "image/webp";
  webp.classList.add('webp');
  webp.srcsetVal = DBHelper.imageSrcsetForRestaurant(restaurant, "webp");
  
  //create backup jpg source
  let jpg = document.createElement('source');
  jpg.classList.add('jpg');
  jpg.srcsetVal= DBHelper.imageSrcsetForRestaurant(restaurant, "jpg");
    
  //create img
  let img = document.createElement('img');
  img.srcVal = DBHelper.imageUrlForRestaurant(restaurant);
  img.className = 'restaurant-img';
  img.alt = restaurant.name;

  io.observe(picture);//observe picture for lazyLoading

  picture.appendChild(webp);
  picture.appendChild(jpg);
  picture.appendChild(img);
  li.append(picture);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  
  const heart = createHeart(restaurant.id, restaurant.is_favorite);
  
  name.append(heart);
  li.append(name);


  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
