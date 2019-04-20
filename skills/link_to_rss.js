const shortId = require('shortid');

const scrape = require('../utils/scrape');
const getFeed = require('../utils/rss-link');
const getChannel = require('../utils/get-channel-name');

const GLOBAL_URL_REGEX = /<(https?:\/\/[-A-Z0-9._~:\/?#[\]@!$&'()*+,;=]+)>/igm;
const URL_REGEX = /<(https?:\/\/[-A-Z0-9._~:\/?#[\]@!$&'()*+,;=]+)>/i;

const URLS_TO_ADD = [];

const processQueue = () => {
  if (URLS_TO_ADD.length) {
    const { url, message, channelName } = URLS_TO_ADD.shift();

    addUrlToFeed(url, message, channelName);
  }
}

const addUrlToFeed = (url, message, channelName) => {
  const content = {
    attachments:[
      {
        title: `Would you like to add ${url} to the #${channelName} RSS Feed?`,
        callback_id: 'ADD_TO_RSS',
        attachment_type: 'default',
        actions: [
          {
            "name": "add_to_rss",
            "text": `+ Add to RSS Feed`,
            "value": `${message.ts}:|:${url}`,
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

  // check to see if we are in a thread
  if (message.thread_ts) {
    // if we are, let's grab the thread's timestamp, so we can reply inline
    const { thread_ts } = message;

    // reply ephemerally inline
    bot.whisper(message, Object.assign({}, { thread_ts }, content));
  // otherwise just reply as normal
  } else {
    bot.whisper(message, content);
  }
};

module.exports = function(controller) {
  controller.on('bot_channel_join', function(bot, message) {
    getChannel(bot, message, (channelName, channelId) => {
      bot.reply(message, `Hey there! I\'m here to generate an RSS Feed from links posted to #${channelName}.`);
      bot.reply(message, `*RSS Feed for #${channelName}*: <${getFeed(bot.team_info.id, channelName)}>`);
      bot.reply(message, 'You can get the feed URL at any time by typing `/rssfeed`');
    });
  });

  controller.on('slash_command',function(bot, message) {
    getChannel(bot, message, (channelName, channelId) => {
      bot.replyPrivate(message, `*#${channelName} RSS Feed*: <${getFeed(bot.team_info.id, channelName)}>`);
    });
  });

  controller.hears(['<(https?:\\/\\/[-A-Za-z0-9\\._~:\\/?#[\\]@!$&\'()\\*\\+,;=]+)>'], 'ambient', function(bot, message) {
    getChannel(bot, message, (channelName, channelId) => {
      // TODO: replace with native String.prototype.matchAll() when possible
      const checkForMultipleUrls = message.text.match(GLOBAL_URL_REGEX);

      checkForMultipleUrls.forEach((foundUrl) => {
        const url = URL_REGEX.exec(foundUrl)[1];

        if (url) {
          URLS_TO_ADD.push({ url, message, channelName });
        }
      });

      processQueue();
    });
  });

  controller.on('interactive_message_callback', function(bot, message) {
    if (message.callback_id === 'ADD_TO_RSS') {
      const value = message.actions[0].value;

      if (value === 'NO') {
        bot.replyInteractive(message, {
          'response_type': 'ephemeral',
          'text': '',
          'replace_original': true,
          'delete_original': true
        });

        processQueue();
      } else {
        const [ timestamp, url ] = value.split(':|:');

        getChannel(bot, message, (channelName, channelId) => {
          bot.replyInteractive(message, `Adding to RSS Feed...`);

          scrape(url)
            .then((meta) => {
              const date = Date.now();
              const guid = shortId.generate();

              const item = Object.assign({}, meta, { categories: [`#${channelName}`], date, guid });

              const link = {
                id: guid,
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

                let timeoutInterval = 1500;
                let nextIteration;

                bot.replyInteractive(message, `:+1: I've added this link to the <${getFeed(bot.team_info.id, channelId)}|#${channelName} RSS Feed>.`);

                bot.api.reactions.add({ channel: message.channel, name: 'book', timestamp });

                if (URLS_TO_ADD.length) {
                  timeoutInterval = 500;

                  nextIteration = processQueue();
                }

                setTimeout(function() {
                  bot.replyInteractive(message, {
                    'response_type': 'ephemeral',
                    'text': '',
                    'replace_original': true,
                    'delete_original': true
                  });

                  if (typeof nextIteration === 'function') {
                    nextIteration();
                  }
                }, timeoutInterval);
              });
            })
            .catch((error) => {
              console.error('ERROR: error scraping url:', error);
              console.log(message);
            })
          ;
        });
      }
    }
  });
}
