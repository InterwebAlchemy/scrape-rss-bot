const RSS = require('rss');
const getFeed = require('../../utils/rss-link');

module.exports = function(webserver, controller) {
  webserver.get('/feed/:teamId/:channelName', function(req, res, next) {
    const { teamId, channelName } = req.params;

    if (!teamId || !channelName) {
      res.sendStatus(404);

      return next([new Error("Feed not found.")]);
    }

    const query = {
      $query: {
        teamId,
        channelName,
      },
      limit: 20,
      $orderBy: {
        shareDate: -1
      }
    };

    controller.storage.links.find(query, function(err, links) {
      if (err) {
        console.error('ERROR: could not retrieve links for feed:', err);

        res.sendStatus(404);

        return next([new Error("Could not retrieve links for feed.")]);
      }

      const categories = [...new Set(links.map(({ categories }) => categories))];

      controller.storage.teams.get(teamId, function(err, team) {
        const { url: teamUrl, name: teamName } = team;

        const feedTitle = `#${channelName} ${teamName} Slack RSS Feed`;

        const feedDescription = `Links posted in the ${channelName} channel in the ${teamName} Slack and gathered by @RSS.`;

        const feedUrl = getFeed(teamId, channelName);

        const feed = new RSS({
          title: feedTitle,
          description: feedDescription,
          feed_url: feedUrl,
          site_url: teamUrl,
          categories,
          pubDate: new Date().toISOString(),
          ttl: 60,
          custom_namespaces: {
            'webfeeds': 'http://webfeeds.org/rss/1.0',
          },
          custom_elements: [
            { 'webfeeds:logo': `https://${process.env.HEROKU_APP_NAME}.herokuapp.com/feed-logo.svg` },
            { 'webfeeds:accentColor': '#2F6C8F' }
          ]
        });

        links.forEach(({ item }) => {
          feed.item(item);
        });

        res
          .status(200)
          .set('Content-Type', 'application/rss+xml')
          .send(feed.xml())
        ;
      });
    });
  });
}
