module.exports = function(controller) {
  controller.hears('(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?', 'message, message.channels', function(bot, message) {
    console.log('heard a URL:', message);
    bot.reply(message, 'There was a URL in there.');
  });
}
