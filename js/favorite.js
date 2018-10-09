/*heart svg from https://css-tricks.com/hearts-in-html-and-css/ */

toggleFavorite = function (e) {
    console.log('e', e);
    let heart = e.target;
    console.log('heart = e.target ', heart);
    if(heart.classList.contains('favorite-button')){//check if triggered by button element
        heart = heart.firstChild;//set heart to svg heart
        console.log('clicked button, set heart: ', heart);
    }
    else if(heart.id == 'buttonText'){//check if triggerd by buttonText
        heart = heart.parentElement.firstChild;
        console.log('clicked buttonText, set heart: ', heart);
    }
    else if(!heart.classList.contains('heart')){//make sure we have the svg element, not the path child element
        heart = heart.parentElement;
        console.log('clicked path, set heart: ', heart);
    }
        
    if(heart.classList.contains('favorite')){
        heart.classList.remove('favorite');//toggle heart class to change heart icon fill
        let buttonText = heart.parentElement.querySelector('#buttonText');
        console.log(buttonText);
        buttonText.innerText = 'favorite';
        console.log(buttonText);
        heart.parentElement.appendChild(buttonText);//change button text
        DBHelper.setFavorite(parseInt(heart.parentElement.getAttribute("id")), false);//update API data
        
    }
    else {        
        heart.classList.add('favorite');//toggle heart class to change heart icon fill
        let buttonText = heart.parentElement.querySelector('#buttonText');
        console.log(buttonText);
        buttonText.innerText = 'unfavorite';
        console.log(buttonText);
        heart.parentElement.appendChild(buttonText);//change button text
        DBHelper.setFavorite(parseInt(heart.parentElement.getAttribute("id")), true);//update API data
    }

   
};

createHeart = function (id, favorite = false) {

    const heart = document.createElement('button');
    heart.innerHTML = `<svg class="heart" viewBox="0 0 32 29.6">
  <path d="M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4c0,9.4,9.5,11.9,16,21.2
  c6.1-9.3,16-12.1,16-21.2C32,3.8,28.2,0,23.6,0z"/>
</svg>`;
    heart.setAttribute('id', `${id}`);
    heart.classList.add('favorite-button');
    let buttonText = document.createElement('span');
    buttonText.id = 'buttonText';
    buttonText.classList.add('hidden');
    if(favorite == true || favorite == 'true') {
        heart.firstChild.classList.add('favorite');
        buttonText.innerText = 'unfavorite';
    }
    else{
        buttonText.innerText = 'favorite';
    }
    heart.appendChild(buttonText);
    heart.onclick = toggleFavorite;

    return heart;
};