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

    controller.storage.links
      .find(query, function(err, links) {
        if (err) {
          debug('Error: could not retrieve links:', err);

          res.send("There was an error retrieving your RSS Feed.");
        }

        const { teamName, teamUrl } = links[0];

        let feedTitle = `${teamName} Slack RSS Feed`;

        if (channelName) {
          feedTitle = `${feedTitle} for #${channelName}`;
        }

        let feedDescription = `Links posted in the`;

        if (channelName) {
          feedDescription = `${feedDescription} #${channelName} channel.`
        } else {
          feedDescription = `${feedDescription} ${teamName} Slack.`
        }

        let feedUrl = getFeed(teamId, channelName);

        const categories = [...new Set(links.map(({ categories }) => [...categories]).flat())];

        const feed = new RSS({
          title: feedTitle,
          description: feedDescription,
          feed_url: feedUrl,
          site_url: teamUrl,
          categories,
        });

        links.forEach(({ item }) => {
          feed.item(item);
        });

        res.send(feed.xml());
      })
      .sort({
        shareDate: -1
      })
      .limit(10)
    ;
  });
}
