module.exports = function(webserver, controller) {
  webserver.get('/feed/:teamId/:channelId', function(req, res, next) {
    const { teamId, channelId } = req.params;

    // make sure we were sent the team id and channel id
    if (!teamId || !channelId) {
      res.sendStatus(404);

      return next([new Error("Feed not found.")]);
    }

    controller.storage.feeds.get(`${teamId}::${channelId}`, function(err, cachedFeed) {
      if (err) {
        console.error('ERROR: Could not load cached feed:', err);
      }

      if (cachedFeed && cachedFeed.feed) {
        res
          .set('Content-Type', 'application/rss+xml')
          .status(200)
          .send(cachedFeed.feed)
        ;

        return next();
      } else {
        res.sendStatus(404);

        return next([new Error("Feed not found.")]);
      }
    });
  });
}
