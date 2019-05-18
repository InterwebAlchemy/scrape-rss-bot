const getFeed = require('./rss-link');

module.exports = (teamId, channelId) => {
  if (!teamId || !channelId) {
    return '';
  }

  const usingFeedPress = (process.env.ANALYTICS === 'TRUE');
  const usingHostName = (usingFeedPress && process.env.FEEDPRESS_HOSTNAME);

  return (usingHostName) ? `${process.env.FEEDPRESS_HOSTNAME}/${teamId}-${channelId}` : getFeed(teamId, channelId);
};
