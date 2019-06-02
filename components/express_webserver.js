var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var querystring = require('querystring');
var debug = require('debug')('botkit:webserver');
var http = require('http');
var hbs = require('express-hbs');

module.exports = function(controller) {

    const port = process.env.PORT || 3000;

    var webserver = express();
    webserver.use(function(req, res, next) {
        req.rawBody = '';

        req.on('data', function(chunk) {
            req.rawBody += chunk;
        });

        next();
    });
    webserver.use(cookieParser());
    webserver.use(bodyParser.json());
    webserver.use(bodyParser.urlencoded({ extended: true }));

    // set up handlebars ready for tabs
    webserver.engine('hbs', hbs.express4({
      partialsDir: __dirname + '/../views/partials',
    }));
    webserver.set('view engine', 'hbs');
    webserver.set('views', __dirname + '/../views/');

    // Register sync helper
    hbs.registerHelper('processEnv', function(property, isEqualTo, exists) {
      if (exists) {
        return !!process.env[property];
      }

      if (isEqualTo) {
        return process.env[property] === isEqualTo;
      }

      return process.env[property];
    });

    webserver.use(express.static('public'));

    //Handling 404
    webserver.use(function(req, res) {
      res
        .status(404)
        .sendFile(__dirname + '../public/404.html')
      ;
    });


    // Handling 500
    webserver.use(function(error, req, res, next) {
      console.error('ERROR:', error);

      res
        .status(500)
        .sendFile(__dirname + '../public/404.html')
      ;
    });


    var server = http.createServer(webserver);

    server.listen(port, null, function() {

        console.log(`Express webserver configured and listening at http://localhost:${port}`);

    });

    // import all the pre-defined routes that are present in /components/routes
    var normalizedPath = require("path").join(__dirname, "routes");
    require("fs").readdirSync(normalizedPath).forEach(function(file) {
      require("./routes/" + file)(webserver, controller);
    });

    controller.webserver = webserver;
    controller.httpserver = server;

    return webserver;

}
