module.exports = function(controller) {
  controller.on('message', function(bot, message) {
    bot.reply(message, 'Message Received.');
  });
}
