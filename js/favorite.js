/*heart svg from https://css-tricks.com/hearts-in-html-and-css/ */

toggleFavorite = function (e) {
    let heart = e.target;
    if(!heart.classList.contains('heart')){//make sure we have the svg element, not the path child element
        heart = e.target.parentElement;
    }
        
    if(heart.classList.contains('favorite')){
        heart.classList.remove('favorite');
        DBHelper.setFavorite(parseInt(heart.parentElement.getAttribute("id")), false);
        
    }
    else {        
        heart.classList.add('favorite');   
        DBHelper.setFavorite(parseInt(heart.parentElement.getAttribute("id")), true);
    }

   
};

createHeart = function (id, favorite = false) {

    const heart = document.createElement('span');
    heart.innerHTML = `<svg class="heart" viewBox="0 0 32 29.6">
  <path d="M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4c0,9.4,9.5,11.9,16,21.2
  c6.1-9.3,16-12.1,16-21.2C32,3.8,28.2,0,23.6,0z"/>
</svg>`;
    heart.setAttribute('id', `${id}`);
    
    if(favorite == true || favorite == 'true') {
        heart.firstChild.classList.add('favorite');
    }
    
    heart.onclick = toggleFavorite;

    return heart;
};