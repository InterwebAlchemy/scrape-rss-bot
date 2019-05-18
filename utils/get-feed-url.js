const getFeed = require('./rss-link');

module.exports = (teamId, channelId) => {
  if (!teamId || !channelId) {
    return '';
  }

  const usingFeedPress = (process.env.ANALYTICS === 'TRUE');
  const usingHostName = (process.env.FEEDPRESS_HOSTNAME);

  return (usingFeedPress) ? `${(usingHostName) ? process.env.FEEDPRESS_HOSTNAME : process.env.FEEDPRESS_FEED_URL}/${teamId}-${channelId}` : getFeed(teamId, channelId);
};
