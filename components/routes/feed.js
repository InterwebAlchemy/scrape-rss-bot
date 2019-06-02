const acceptableAgents = /^Feed(?:Validator|Press).+$/;

const shouldRedirect = (req, res, next) => {
  const { teamId, channelId } = req.params;

  const agent = req.get('User-Agent');

  const shouldRedirect = !acceptableAgents.test(agent) && process.env.ANALYTICS === 'TRUE' && process.env.FEEDPRESS_FEED_URL;

  if (shouldRedirect) {
    return res.redirect(302, `${process.env.FEEDPRESS_FEED_URL}/${teamId}-${channelId}`);
  }

  return next();
}

const hasParams = (req, res, next) => {
  const { teamId, channelId } = req.params;

  // make sure we were sent the team id and channel id
  if (!teamId || !channelId) {
    return res
      .redirect(404, '/404.html')
    ;
  }

  return next();
}

module.exports = function(webserver, controller) {
  webserver.get('/feed/:teamId/:channelId', hasParams, shouldRedirect, function(req, res, next) {
    const { teamId, channelId } = req.params;

    controller.storage.feeds.get(`${teamId}::${channelId}`, function(err, cachedFeed) {
      if (err) {
        console.error('ERROR: Could not load cached feed:', err);
      }

      if (cachedFeed && cachedFeed.feed) {
        res
          .set('Content-Type', 'application/rss+xml')
          .status(200)
          .send(cachedFeed.feed)
          .end()
        ;

        return next();
      } else {
        return res
          .redirect(404, '/404.html')
        ;
      }
    });
  });
}
