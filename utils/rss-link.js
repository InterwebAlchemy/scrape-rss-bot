const getDomain = require('./get-domain');

module.exports = function(teamId, channelId = '') {
  if (!teamId || !channelId) {
    return '';
  }

  return `https://${getDomain()}/feed/${teamId}/${channelId}`;
}
