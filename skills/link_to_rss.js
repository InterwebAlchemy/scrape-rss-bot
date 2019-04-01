const scrape = require('../utils/scrape');
const getFeed = require('../utils/rss-link');
const getChannel = require('../utils/get-channel-name');

module.exports = function(controller) {
  controller.on('bot_channel_join', function(bot, message) {
    getChannel(bot, message, (channelName) => {
      bot.reply(message, `Hey there! I\'m here to scrape links and generate an RSS feed for #${channelName}.`);
    })
  });

  controller.hears(['((https?:\\/\\/)?(\\w+\\.)?(\\w+\\.)(\\w+)\\.?(\\w+)?\\/?[-/+=&;%@?#.\\w_]*)'], 'ambient', function(bot, message) {
    const url = message.match[0];

    console.log(message);
    const channel = message.channel;

    getChannel(bot, message, (channelName) => {
      const content = {
        attachments:[
          {
            title: `Would you like to add that <${url}|link> to the <${getFeed('skookum', channelName)}|#${channelName} RSS Feed>?`,
            callback_id: 'ADD_TO_RSS',
            attachment_type: 'default',
            actions: [
              {
                "name": "add_to_rss",
                "text": `+ Add to #${channelName} Feed`,
                "value": `ADD_TO_RSS||${url}`,
                "type": "button",
              },
            ]
          }
        ]
      };

      bot.whisper(message, content);
    });

    //const channelName = getChannel(message);

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

  controller.on('block_actions', function(bot, message) {
    console.log('block_actions:', message);
  });

  controller.on('interactive_message_callback', function(bot, message) {
    console.log('interactive_message_callback:', message);
  });
}
