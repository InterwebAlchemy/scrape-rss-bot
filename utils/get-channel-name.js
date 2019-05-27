module.exports = function(bot, message, callback) {
  bot.api.channels.info({ channel: message.channel }, function(err, response) {
    if (err) {
      console.error('ERROR: could not retrieve channel info', err);
    }

    if (response.channel) {
      callback(response.channel.name, response.channel.id);
    } else {
      callback();
    }
  });
}
