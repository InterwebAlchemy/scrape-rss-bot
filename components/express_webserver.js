var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var querystring = require('querystring');
var debug = require('debug')('botkit:webserver');
var http = require('http');
var hbs = require('express-hbs');

module.exports = function(controller) {

  /*function errorHandler (err, req, res, next) {
    if (res.headersSent) {
      return next(err);
    }

    res
      .status(500)
      .render('500')
    ;
  }

  function error404Handler (req, res) {
    res
      .status(404)
      .render('404')
    ;
  }*/

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

  var server = http.createServer(webserver);

  server.listen(port, null, function() {
    console.log(`Express webserver configured and listening at http://localhost:${port}`);
  });

  // import all the pre-defined routes that are present in /components/routes
  var normalizedPath = require("path").join(__dirname, "routes");

  require("fs").readdirSync(normalizedPath).forEach(function(file) {
    require("./routes/" + file)(webserver, controller);
  });

  /*webserver.use(error404Handler);

  webserver.use(errorHandler);*/

  controller.webserver = webserver;
  controller.httpserver = server;

  return webserver;
}
