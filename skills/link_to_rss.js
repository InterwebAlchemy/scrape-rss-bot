const shortId = require('shortid');

const scrape = require('../utils/scrape');
const getFeed = require('../utils/rss-link');
const getChannel = require('../utils/get-channel-name');

module.exports = function(controller) {
  controller.on('bot_channel_join', function(bot, message) {
    getChannel(bot, message, (channelName, channelId) => {
      bot.reply(message, `Hey there! I\'m here to generate an RSS Feed from links posted to #${channelName}.`);
      bot.reply(message, `*RSS Feed for #${channelName}*: <${getFeed(bot.team_info.id, channelName)}>`);
      bot.reply(message, 'You can get the feed URL at any time by typing `/rssfeed`');
    });
  });

  controller.on('slash_command',function(bot, message) {
    getChannel(bot, message, (channelName, channelName) => {
      bot.replyPrivate(message, `*#${channelName} RSS Feed*: <${getFeed(bot.team_info.id, channelId)}>`);
    });
  });

  controller.hears(['((https?:\\/\\/)?(\\w+\\.)?(\\w+\\.)(\\w+)\\.?(\\w+)?\\/?[-/+=&;%@?#.\\w_]*)'], 'ambient', function(bot, message) {
    const url = message.match[0];

    getChannel(bot, message, (channelName, channelId) => {
      const content = {
        attachments:[
          {
            title: `Would you like to add this link to the <${getFeed(bot.team_info.id, channelName)}|#${channelName} RSS Feed>?`,
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
                "text": `No Thanks`,
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
        getChannel(bot, message, (channelName, channelId) => {
          bot.replyInteractive(message, `Adding to RSS Feed...`);

          scrape(url)
            .then((meta) => {
              const date = Date.now();

              const item = Object.assign({}, meta, { categories: [`#${channelName}`], date, guid: shortId.generate() });

              const link = {
                url,
                teamId: bot.team_info.id,
                shareDate: date,
                channelName,
                channelId,
                item,
              };

              controller.storage.links.save(link, function(err, id) {
                if (err) {
                  debug('Error: could not save link record:', err);
                }

                bot.replyInteractive(message, `:+1: I've added this link to the <${getFeed(bot.team_info.id, channelId)}|#${channelName} RSS Feed>.`);

                setTimeout(function() {
                  bot.replyInteractive(message, {
                    'response_type': 'ephemeral',
                    'text': '',
                    'replace_original': true,
                    'delete_original': true
                  });
                }, 2500);
              });
            })
          ;
        });
      }
    }
  });
}
