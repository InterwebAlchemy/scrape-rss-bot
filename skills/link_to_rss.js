const scrape = require('../utils/scrape');
const getFeed = require('../utils/rss-link');
const getChannel = require('../utils/get-channel-name');

module.exports = function(controller) {
  controller.on('bot_channel_join', function(bot, message) {
    getChannel(bot, message, (channelName) => {
      bot.reply(message, `Hey there! I\'m here to scrape links and generate an RSS feed for #${channelName}.`);
    });
  });

  controller.hears(['((https?:\\/\\/)?(\\w+\\.)?(\\w+\\.)(\\w+)\\.?(\\w+)?\\/?[-/+=&;%@?#.\\w_]*)'], 'ambient', function(bot, message) {
    const url = message.match[0];

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
                "text": `+ Add to RSS Feed`,
                "value": url,
                "type": "button",
              },
            ]
          }
        ]
      };

      bot.whisper(message, content);
    });
  });

  controller.on('interactive_message_callback', function(bot, message) {
    if (message.callback_id === 'ADD_TO_RSS') {
      getChannel(bot, message, (channelName) => {
        const url = message.actions[0].value;

        scrape(url)
          .then((meta) => {
            const item = Object.assign({}, meta, { categories: [`#${channelName}`] });

            bot.replyInteractive(message, `:+1: I've added this link to the RSS Feed.`);

            const link = {
              team: bot.team_info.id,
              channel: channelName,
              item,
            };

            controller.storage.links.save(link, function(err, id) {
              if (err) {
                debug('Error: could not save link record:', err);
              }
            });
          })
        ;
      });
    }
  });
}
