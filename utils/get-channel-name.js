module.exports = function(bot, message, callback) {
  bot.api.channels.info({ channel: message.channel }, function(err, response) {
    callback(response.channel.name);
  });
}
