const getFeed = require('./rss-link');

module.exports = (teamId, channelId) => {
  if (!teamId || !channelId) {
    return '';
  }

  return (process.env.ANALYTICS === 'TRUE') ? `${process.env.FEEDPRESS_FEED_URL}/${teamId}-${channelId}` : getFeed(teamId, channelId);
};
