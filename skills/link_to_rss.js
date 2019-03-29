module.exports = function(controller) {
  controller.on('bot_channel_join', function(bot, message) {
    bot.reply(message, 'Hey there! I\'m here to scrape links and generate an RSS feed for you.');
  });

  controller.hears(['((https?:\\/\\/)?(\\w+\\.)?(\\w+\\.)(\\w+)\\.?(\\w+)?\\/?[-/+=&;%@?#.\\w_]*)'], 'ambient', function(bot, message) {
    bot.reply(message, `I think I found a link: ${message.match[0]}`);

    console.log('heard a URL:', message);
  });
}
