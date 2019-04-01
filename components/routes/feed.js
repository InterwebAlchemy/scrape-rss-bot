var debug = require('debug')('feed');

module.exports = function(webserver, controller) {
  debug('Configured /feed url');

  webserver.post('/feed/:channel?', function(req, res) {
    controller.storage.links.all(function(err, links) {
      console.log(links);

      res.status(200);
    });
  });
}
