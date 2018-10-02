let restaurant;
var map;

/**
 * Register service worker
 **/
if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js')
    .then(registration => console.log('Registration successfull', registration.scope))
    .catch(error => console.log('Service worker registration failed, : ', error));
}


/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  console.log('fillRestaurantHTML is_favorite: ', restaurant.is_favorite);
  name.append(createHeart(restaurant.id, restaurant.is_favorite));

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  //console.log(DBHelper.imageUrlForRestaurant(restaurant));
  image.srcset = DBHelper.imageSrcsetForRestaurant(restaurant);
  image.alt = restaurant.name;
  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  DBHelper.fetchReviewsByRestaurantId(restaurant.id, fillReviewsHTML);
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (error, reviews) => {
    
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';
    container.appendChild(title);

    if (error){
        console.log(error);
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'Could not fetch reviews and there are no reviews in the cache!';
        container.appendChild(noReviews);
        return;
    }

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);

    
    const button = document.createElement('button');//create button that creates form for adding new reviews
    button.setAttribute("name", "createFormBtn");
    button.classList.add("review-button");
    button.innerHTML = "Add New Review";
    button.onclick = () =>{
        let form = createNewReviewForm(reviews[0].restaurant_id);
        let reviewList = document.getElementById('reviews-list');
        reviewList.appendChild(form);
    };
    
    container.appendChild(button);
 
 
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
    const li = document.createElement('li');
    const name = document.createElement('p');
    name.innerHTML = review.name;
    li.appendChild(name);

    const date = document.createElement('p');
    //console.log('reviewDate raw: ', review, review.updatedAt);
    let reviewDate = new Date(review.updatedAt);
    //console.log('reviewDate: ', reviewDate);
    date.innerHTML = reviewDate.toLocaleDateString("en-US", {month: 'long', day: 'numeric', year: 'numeric'});

    li.appendChild(date);

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    li.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    return li;
};

/**
 * Post review form
 */
postReview = e => {
    console.log('postReview');
    e.preventDefault();

    console.log('postReview e:', e);
    
    const FD = new FormData(e.srcElement);
   
    console.log('FD:');
    for([key, val] of FD){
        console.log('key,val: ',key, val);
    }

    DBHelper.postReview(FD);
};

/**
 * Create review form and add it to the webpage.
 */
createNewReviewForm = (id) => {
    const li = document.createElement('li');
    const form = document.createElement('form');
    form.id = "new-review-form";
    form.onsubmit = postReview;

    const restaurant_id = document.createElement('input');
    restaurant_id.type = "text";
    restaurant_id.name = "restaurant_id";
    restaurant_id.value = id;
    restaurant_id.hidden = true;
    form.appendChild(restaurant_id);

    const name = document.createElement('input');
    name.classList.add("new-review-input");
    name.setAttribute("type", "text");
    name.setAttribute("name","name");
    name.id = "new-review-name";
    
    
    const labelName = document.createElement('label');
    labelName.classList.add("new-review-label");
    labelName.setAttribute("for", "new-review-name");
    labelName.innerHTML = "Name";

    let p = document.createElement('p');
    p.appendChild(labelName);
    p.appendChild(name);
    form.appendChild(p);
    
    const rating = document.createElement('input');
    rating.classList.add("new-review-input");
    rating.id = "new-review-rating";
    rating.setAttribute("type", "number");
    rating.min = 1;
    rating.max = 5;
    rating.setAttribute("name","rating");
    
    
    const labelRating = document.createElement('label');
    labelRating.classList.add("new-review-label");
    labelRating.setAttribute("for", "new-review-rating");
    labelRating.innerHTML = "Rating between 1 and 5";

    p = document.createElement('p');
    p.appendChild(labelRating);
    p.appendChild(rating);
    form.appendChild(p);

    const comments = document.createElement('textarea');
    comments.classList.add("new-review-input");
    comments.id = "new-review-comments";
    //comments.setAttribute("type", "text");
    comments.setAttribute("name", "comments");
    comments.setAttribute("height", "50px");
    

    const labelComments = document.createElement('label');
    labelComments.classList.add("new-review-label");
    labelComments.setAttribute("for", "new-review-comments");
    labelComments.innerHTML = "Comments";

    p = document.createElement('p');
    p.appendChild(labelComments);
    p.appendChild(comments);
    form.appendChild(p);

    const button = document.createElement('input');
    button.type = "submit";
    button.classList.add("review-button");
    button.value = "Submit Review";

    form.appendChild(button);

    li.appendChild(form);
    return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.innerHTML = restaurant.name;
  a.href = location.href;
  a.setAttribute("aria-current", "page");
  li.appendChild(a);
  breadcrumb.appendChild(li);
  console.log(a);
  console.log(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
