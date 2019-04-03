const RSS = require('rss');

const getFeed = require('../../utils/rss-link');

module.exports = function(webserver, controller) {
  webserver.get('/feed/:teamId/:channel', function(req, res, next) {
    const { teamId, channel } = req.params;

    // make sure we were sent the team id and channel id
    if (!teamId || !channel) {
      res.sendStatus(404);

      return next([new Error("Feed not found.")]);
    }

    // let's check to see if we already have a valid cached feed
    controller.storage.feeds.get(`${teamId}::${channel}`, function(err, feed) {
      if (err) {
        console.error('ERROR: Could not load cached feed:', err);
      }

      if (feed) {
        const { pubDate } = feed.feed;

        const lastestPostQuery = {
          $query: {
            teamId,
            channelName: channel,
          },
          limit: 1,
          $orderBy: {
            shareDate: 1,
          },
        };

        controller.storage.links.find(lastestPostQuery, function(err, links) {
          if (err) {
            console.error('ERROR: no recent posts:', err);

            res.sendStatus(404);

            return next([new Error('No posts to populate feed.')]);
          }

          if (links.length) {
            const { shareDate } = links[0];

            console.log(shareDate, pubDate);

            if (shareDate <= pubDate) {
              console.log(`Retrieving ${teamId}::${channel} from cache`);

              const cachedFeed = new RSS(feed.feed);

              res
                .set('Content-Type', 'application/rss+xml')
                .status(200)
                .send(cachedFeed.xml())
              ;

              return next();
            } else {
              console.log(`New posts for ${teamId}::${channel}`);
            }
          }
        });
      } else {
        const postsQuery = {
          $query: {
            teamId,
            channelName: channel,
          },
          limit: 20,
          $orderBy: {
            shareDate: -1,
          },
        };

        controller.storage.links.find(postsQuery, function(err, links) {
          if (err) {
            console.error('ERROR: could not retrieve links for feed:', err);

            res.sendStatus(404);

            return next([new Error("Could not retrieve posts for feed.")]);
          }

          // gather categories from all posts
          // concat them into a single Array
          // convert them to a Set to deduplicate the Array
          // convert the Set back to an Array because that's what we actually need
          // NOTE: at present, only the #channel is used as a category, but we
          // may need to support other categories in the future
          const categories = [...new Set([].concat.apply([], links.map(({ item: { categories }}) => categories)))];

          console.log(categories);

          controller.storage.teams.get(teamId, function(err, team) {
            const { url: teamUrl, name: teamName } = team;

            const feedTitle = `#${channel} ${teamName} Slack RSS Feed`;

            const feedDescription = `Links posted in the ${channel} channel in the ${teamName} Slack and gathered by @RSS.`;

            const feedUrl = getFeed(teamId, channel);

            const feed = new RSS({
              title: feedTitle,
              description: feedDescription,
              feed_url: feedUrl,
              site_url: teamUrl,
              categories,
              pubDate: (links.length) ? links[links.length - 1].shareDate : Date.now(),
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

            const cache = {
              id: `${teamId}::${channel}`,
              feed,
            };

            controller.storage.feeds.save(cache, function(err, id) {
              if (err) {
                console.error('ERROR: could not cache feed:', err);
              }

              console.log(`${teamId}::${channel} feed cached.`);
            });

            res
              .set('Content-Type', 'application/rss+xml')
              .status(200)
              .send(feed.xml())
            ;

            return next();
          });
        });
      }
    });
  });
}
