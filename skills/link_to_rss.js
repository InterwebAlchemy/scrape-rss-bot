module.exports = function(controller) {
  controller.on('bot_channel_join', function(bot, message) {
    bot.reply(message, 'Hey there! I\'m here to scrape links and generate an RSS feed for you.');
  });

  controller.hears(['(https?://)?(\w+\.)?(\w)+\.\w+\/?'], 'message, message.channels', function(bot, message) {
    console.log('heard a URL:', message);
    bot.reply(message, 'There was a URL in there.');
  });
}
