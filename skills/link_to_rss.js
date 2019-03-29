module.exports = function(controller) {
  controller.on('message.channels', function(bot, message) {
    bot.reply(message, 'Message Received.');
  });
}
