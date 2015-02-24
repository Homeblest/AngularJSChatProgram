# Getting Started

Make sure you have the following installed on your system:
* Gulp
* Node
* Python
* Bower
* NPM

Open your favorite Terminal and run these commands.

##First Tab:
```sh
$ bower install
$ npm install
```
* This will install all bower dependencies specified in bower.json
* And all node dependencies specified in package.json

```sh
$ gulp js
```
* This runs jshint on all the javascript files, concats, and minifies them into dist/js/app.js.

Second Tab:
```sh
$ python -m SimpleHTTPServer 8000
```
* This runs a simple server that out application can run on

Third Tab:
```sh
$ node chatserver
```
* This runs our chatserver.js file, our app is now ready to use!

Open your web browser of choice (preferrably the latest Chrome or Firefox versions).

-   Navigate to [localhost:8000/src]

###Finished! Now you can use our application!



[localhost:8000/src]:localhost:8000/src
