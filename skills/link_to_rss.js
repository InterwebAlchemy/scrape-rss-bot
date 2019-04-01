const scrape = require('../utils/scrape');
const getFeed = require('../utils/rss-link');
const getChannel = require('../utils/get-channel-name');

module.exports = function(controller) {
  controller.on('bot_channel_join', function(bot, message) {
    bot.reply(message, 'Hey there! I\'m here to scrape links and generate an RSS feed for you.');
  });

  controller.hears(['((https?:\\/\\/)?(\\w+\\.)?(\\w+\\.)(\\w+)\\.?(\\w+)?\\/?[-/+=&;%@?#.\\w_]*)'], 'ambient', function(bot, message) {
    const url = message.match[0];

    console.log(message);

    bot.api.channels.info({ channel: message.channel }, function(err,response) {
      console.log(response);
    });

    //const channelName = getChannel(message);

    const blocks = [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `Would you like to add this link to the RSS Feed?`,
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Add to RSS Feed",
            "emoji": true
          },
          "value": `ADD_TO_RSS|:|${url}`
        }
      }
    ];

    bot.whisper(message, { blocks });
    bot.reply(message, { blocks });

    /*scrape(url);

    const meta = {};

    const link = {
      url,
      channelName,
      meta,
    }

    controller.storage.links.save(link, function(err, id) {
      if (err) {
        debug('Error: could not save link record:', err);
      }
    });
    */
  });

  // create special handlers for certain actions in buttons
  // if the button action is 'say', act as if user said that thing
  controller.middleware.receive.use(function(bot, message, next) {
    if (message.type == 'interactive_message_callback') {
      if (message.actions[0].name.match(/^ADD_TO_RSS|:|.+$/)) {

        console.log('Adding to RSS');

        scrape(url);

        const [ action, url ] = message.actions[0].name.split('|:|');

        const reply = `:+1: I've added that link to the RSS Feed.`

        bot.replyInteractive(message, reply);
      }
    }

    next();
  });
}
