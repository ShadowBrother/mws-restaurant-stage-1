const io = new IntersectionObserver(
    entries => {
        console.log('io entries: ', entries);
        for(let img of entries) {
            if (img.isIntersecting) {//find img that just became visible
                img.target.src = img.target.srcVal;//set src 
                img.target.srcset = img.target.srcsetVal;//set srcset
                io.unobserve(img.target);//no longer need to observe img
            }
        }
    });