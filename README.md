# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 3

For the **Restaurant Reviews** projects, I incrementally converted a static webpage to a mobile-ready web application. In 
**Stage One**, I took a static design that lacks accessibility and converted the design to be responsive on different sized 
displays and accessible for screen reader use. I also added a service worker to begin the process of creating a seamless 
offline experience for users.

For **Stage Two**, I made use of given sails API server to fetch data, and cached responses using IndexedDB as well as
making necessary changes for site to pass lighthouse audit

For **Stage Three**, I made use of the new sails API to fetch reviews from separate endpoints and implemented a form
for creating new reviews. I also added a heart icon button that toggles favorite/not favorite status. Both of these features
work offline, updating the page and then storing the data in IDB to be used while offline and then sent to the server when
the page reconnects to the internet. Additional steps taken to reach new lighthouse audit targets.

### How to run

1. Run 'npm install' to install dependencies.

2. Run 'gulp' to run default gulp tasks

3. cd to newly created 'build' folder

4. In this folder, start up a simple HTTP server to serve up the site files on your local computer. Python has some simple tools to 
do this, and you don't even need to know Python. For most people, it's already installed on your computer. 

In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m 
SimpleHTTPServer 8000` (Use port 8000 specifically!!) For Python 3.x, you can use `python3 -m http.server 
8000`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the 
software.

5. In separate terminal, navigate to location of API server and start the sails server by running 'node server'.

6. Go to localhost:8000 in your browser.