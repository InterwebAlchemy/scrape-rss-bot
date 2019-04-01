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
            title: `Would you like to add that <${url}|link> to the <${getFeed(bot.team_info.id, channelName)}|#${channelName} RSS Feed>?`,
            callback_id: 'ADD_TO_RSS',
            attachment_type: 'default',
            actions: [
              {
                "name": "add_to_rss",
                "text": `+ Add to RSS Feed`,
                "value": url,
                "type": "button",
              },
              {
                "name": "not_to_rss",
                "text": `No`,
                "value": 'NO',
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

      const url = message.actions[0].value;

      if (url === 'NO') {
        bot.replyInteractive(message, {
          'response_type': 'ephemeral',
          'text': '',
          'replace_original': true,
          'delete_original': true
        });
      } else {
        getChannel(bot, message, (channelName) => {
          bot.replyInteractive(message, `Adding to RSS Feed...`);

          const date = new Date();

          scrape(url)
            .then((meta) => {
              const item = Object.assign({}, meta, { categories: [`#${channelName}`], date: date.toISOString() });

              const link = {
                id: url,
                teamId: bot.team_info.id,
                teamName: bot.team_info.name,
                teamUrl: bot.team_info.url,
                shareDate: date.getTime(),
                channelName,
                item,
              };

              controller.storage.links.save(link, function(err, id) {
                if (err) {
                  debug('Error: could not save link record:', err);
                }

                bot.replyInteractive(message, `:+1: I've added this link to the <${getFeed(bot.team_info.id, channelName)}|#${channelName} RSS Feed>.`);
              });
            })
          ;
        });
      }
    }
  });
}
