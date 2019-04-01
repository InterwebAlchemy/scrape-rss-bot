module.exports = function(teamId, channelName = '') {
  if (!teamId) {
    return '';
  }

  let feedUrl = `https://${process.env.HEROKU_APP_NAME}.herokuapp.com/feed/${teamId}`;

  if (channelName) {
    feedUrl = `${feedUrl}/${channelName}`;
  }

  return feedUrl;
}
