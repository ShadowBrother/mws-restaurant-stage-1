const io = new IntersectionObserver(
    entries => {
        console.log('io entries: ', entries);
        for(let pic of entries) {
            if (pic.isIntersecting) {//find img that just became visible
                /*
                let img = pic.target.querySelector('.restaurant-img');
                img.src = img.srcVal;//set src 

                let webp = pic.target.querySelector('.webp');
                webp.srcset = webp.srcsetVal;//set srcset for webp

                let jpg = pic.target.querySelector('.jpg');
                jpg.srcset = jpg.srcsetVal;//set srcset for jpg
                */

                for(let source of pic.target.children) {//go through each source/img element and set srcset/src
                    
                    if (source.classList[0] == 'jpg') source.srcset = source.srcsetVal;//set srcset for jpg
                    else if (source.classList[0] == 'webp') source.srcset = source.srcsetVal;//set srcset for webp
                    else source.src = source.srcVal;//set src
                }


                io.unobserve(pic.target);//no longer need to observe img
            }
        }
    });