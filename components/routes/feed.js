var debug = require('debug')('rss:feed');

module.exports = function(webserver, controller) {
  debug('Configured /feed url');

  webserver.get('/feed/:channel?', function(req, res) {
    controller.storage.links.all(function(err, links) {
      if (err) {
        debug('Error: could not retrieve links:', err);

        res.status(404);
      }

      console.log(links);

      res.status(200);
    });
  });
}
