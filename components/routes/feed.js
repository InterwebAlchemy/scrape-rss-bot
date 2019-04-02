const RSS = require('rss');
const getFeed = require('../../utils/rss-link');

var debug = require('debug')('rss:feed');

module.exports = function(webserver, controller) {
  debug('Configured /feed url');

  webserver.get('/feed/:teamId/:channelName?', function(req, res) {
    res.status(200);

    const { teamId, channelName } = req.params;

    const query = {
      teamId
    };

    if (channelName) {
      query.channelName = channelName;
    }

    controller.storage.links.find(query, function(err, links) {
      if (err) {
        debug('Error: could not retrieve links:', err);

        res.send("There was an error retrieving your RSS Feed.");
      }

      const categories = [...new Set(links.map(({ categories }) => categories))];

      const feedItems = links.sort((a, b) => b.shareDate - a.shareDate).slice(0, 10);

      controller.storage.teams.get(teamId, function(err, team) {
        const { url: teamUrl, name: teamName } = team;

        let feedTitle = `${teamName} Slack RSS Feed`;

        if (channelName) {
          feedTitle = `${feedTitle} for #${channelName}`;
        }

        let feedDescription = `Links posted in the`;

        if (channelName) {
          feedDescription = `${feedDescription} #${channelName} channel`;
        } else {
          feedDescription = `${feedDescription} ${teamName} Slack`;
        }

        feedDescription = `${feedDescription} and gathered by @RSS.`;

        let feedUrl = getFeed(teamId, channelName);

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

        feedItems.forEach(({ item }) => {
          feed.item(item);
        });

        res.send(feed.xml());
      });
    });
  });
}
