const RSS = require('rss');
const axios = require('axios');
const { stringify } = require('qs');

const getDefaultFeed = require('./rss-link');
const getFeed = require('./get-feed-url');
const getDomain = require('./get-domain');

const NEW_SORT = -1;
const OLD_SORT = 1;

const FEED_SORT = NEW_SORT; // -1 Newest First; 1 Oldest First
const FEED_ITEMS = 10;

// This is a gross hack until botkit-storage-mongo supports passing options for
// our collection.find() query to sort and limit our queries
const trimAndSortLinks = (links, sort = {}, limit = FEED_ITEMS) => {
  let newLinks = [...links];

  if (Object.keys(sort).length) {
    const [ sortField, sortOrder ] = Object.entries(sort)[0];

    newLinks = newLinks.sort((a, b) => (sortOrder === NEW_SORT) ? b[sortField] - a[sortField] : a[sortField] - b[sortField]);
  }

  if (limit) {
    return newLinks.splice(0, limit);
  }

  return newLinks;
};

const getPubDate = (links) => {
  const newestIndex = (FEED_SORT === OLD_SORT) ? links.length - 1 : 0;

  return (links.length) ? links[newestIndex].shareDate : Date.now();
};

module.exports = (controller, bot, teamId, channelId) => {
  const plainFeedUrl = getDefaultFeed(teamId, channelId);
  const feedUrl = getFeed(teamId, channelId);

  bot.api.channels.info({ channel: channelId }, function(err, { channel }) {
    controller.storage.feeds.get(`${teamId}::${channelId}`, (err, oldFeed) => {
      const postsQuery = {
        teamId,
        channelId,
      };

      controller.storage.links.find(postsQuery, function(err, feedLinks) {
        if (err) {
          console.error('ERROR: could not retrieve links for feed:', err);

          return;
        }

        const links = trimAndSortLinks(feedLinks, { shareDate: FEED_SORT }, FEED_ITEMS);

        // gather categories from all posts
        // concat them into a single Array
        // convert them to a Set to deduplicate the Array
        // convert the Set back to an Array because that's what we actually need
        // NOTE: at present, only the #channel is used as a category, but we
        // may need to support other categories in the future
        const categories = (links.length) ? [...new Set([].concat.apply([], links.map(({ item: { categories }}) => categories)))] : [];

        controller.storage.teams.get(teamId, function(err, team) {
          const { url: teamUrl, name: teamName } = team;

          const feedTitle = `#${channel.name} ${teamName} Slack RSS Feed`;

          const feedDescription = `Links posted in the #${channel.name} channel in the ${teamName} Slack and gathered by @RSS bot.`;

          const pubDate = getPubDate(links);

          const feed = new RSS({
            title: feedTitle,
            description: feedDescription,
            feed_url: plainFeedUrl,
            site_url: teamUrl,
            categories,
            pubDate,
            ttl: 60,
            language: 'en-US',
            custom_namespaces: {
              'webfeeds': 'http://webfeeds.org/rss/1.0',
              'sy': 'http://web.resource.org/rss/1.0/modules/syndication/',
            },
            custom_elements: [
              { 'webfeeds:logo': `${getDomain()}/feed-logo.svg` },
              { 'webfeeds:accentColor': '#2F6C8F' },
              { 'sy:updatePeriod': 'hourly' },
              { 'sy:updateFrequency': 1 },
            ]
          });

          feed.generator = `Aggregated by https://www.rssbot.app | ${feed.generator}`;

          links.forEach((link) => {
            feed.item(link.item);
          });

          const feedXml = feed.xml();

          const cache = {
            id: `${teamId}::${channelId}`,
            url: feedUrl,
            feed: feedXml,
          };

          controller.storage.feeds.save(cache, function(err, id) {
            if (err) {
              console.error('ERROR: could not cache feed:', err);
            }

            console.log(`${teamId}::${channelId} #${channel.name} feed cached.`);

            // clean up old links
            feedLinks.forEach((link) => {
              if (links.indexOf(link) === -1) {
                controller.storage.links.delete(link.id, (err) => {
                  if (err) {
                    console.error('ERROR: could not delete old link:', err);
                  }
                });
              }
            });

            if (!oldFeed) {
              console.log(`No previous feed found for ${teamId}::${channelId} #${channel.name}...`);

              if (process.env.ANALYTICS === 'TRUE') {
                console.log(`Registering ${teamId}::${channelId} #${channel.name} feed with FeedPress...`);

                const createFeedRequest = {
                  method: 'POST',
                  baseURL: process.env.FEEDPRESS_API_URL,
                  url: '/feeds/create.json',
                  params: {
                    key: process.env.FEEDPRESS_API_KEY,
                    token: process.env.FEEDPRESS_API_TOKEN,
                    alias: `${teamId}-${channelId}`,
                    url: plainFeedUrl,
                  },
                  data: stringify({
                    url: plainFeedUrl,
                    alias: `${teamId}-${channelId}`,
                  }),
                };

                axios(createFeedRequest)
                  .then((response) => {
                    const { data } = response;

                    if (data.errors && data.errors.length) {
                      data.errors.forEach((err) => console.error('ERROR:', err));
                      console.log(response);
                    } else {
                      console.log(data);
                    }

                    if (process.env.FEEDPRESS_HOSTNAME && process.env.FEEDPRESS_HOSTNAME_ID) {
                      console.log(`Registering ${process.env.FEEDPRESS_HOSTNAME}/${teamId}/${channelId} with FeedPress...`);

                      const createHostnameRequest = {
                        method: 'POST',
                        url: `${process.env.FEEDPRESS_API_URL}/hostnames/record.json`,
                        data: stringify({
                          hostname_id: process.env.FEEDPRESS_HOSTNAME_ID,
                          type: 'feed',
                          destination: `${teamId}-${channelId}`,
                          path: `/${teamId}-${channelId}`
                        }),
                        params: {
                          key: process.env.FEEDPRESS_API_KEY,
                          token: process.env.FEEDPRESS_API_TOKEN,
                          hostname_id: process.env.FEEDPRESS_HOSTNAME_ID,
                          path: `/${teamId}-${channelId}`,
                          type: 'feed',
                          destination: `${teamId}-${channelId}`,
                        },
                      };

                      axios(createHostnameRequest)
                        .then(({ data }) => {
                          if (data.errors && data.errors.length) {
                            data.errors.forEach((err) => console.error('ERROR:', err));
                          }
                        })
                        .catch((error) => {
                          console.error('ERROR: Could not register feed with hostname:', error);
                        })
                      ;
                    }
                  })
                  .catch((error) => {
                    console.error('ERROR: Could not create feed with FeedPress:', error);
                  })
                ;
              }
            } else {
              const pingFeedRequest = {
                method: 'GET',
                url: `${process.env.FEEDPRESS_API_URL}/feeds/ping.json`,
                data: stringify({
                  feed: `${teamId}-${channelId}`,
                }),
                params: {
                  key: process.env.FEEDPRESS_API_KEY,
                  token: process.env.FEEDPRESS_API_TOKEN,
                  feed: `${teamId}-${channelId}`,
                },
              };

              axios(pingFeedRequest)
                .then(({ data }) => {
                  if (data.errors && data.errors.length) {
                    data.errors.forEach((err) => console.error('ERROR:', err));
                  }
                })
                .catch((error) => {
                  console.error('ERROR: could not ping feed for refresh:', error);
                })
              ;
            }
          });
        });
      });
    });
  });
};
