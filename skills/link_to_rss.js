module.exports = function(controller) {
  controller.on('message.channels', function(bot, message) {
    console.log(message);
    bot.reply(message, 'Message Received.');
  });
}
