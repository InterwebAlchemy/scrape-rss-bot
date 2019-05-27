const shortId = require('shortid');

const scrape = require('../utils/scrape');
const getFeed = require('../utils/get-feed-url');
const getChannel = require('../utils/get-channel-name');
const updateFeed = require('../utils/update-feed');

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
    bot.whisper(message, Object.assign({}, { token: bot.config.bot.app_token, thread_ts, as_user: true }, content));
  // otherwise just reply as normal
  } else {
    bot.whisper(message, Object.assign({}, { token: bot.config.bot.app_token, as_user: true }, content));
  }
};

module.exports = function(controller) {
  controller.on('bot_channel_join', function(bot, message) {
    getChannel(bot, message, (channelName, channelId) => {
      bot.reply(message, `Hey there! I\'m here to generate an RSS Feed from links posted to #${channelName}.`);
      bot.reply(message, `*RSS Feed for #${channelName}*: <${getFeed(bot.team_info.id, channelId)}>`);
      bot.reply(message, 'You can get the feed URL for this channel at any time by using the `/rssfeed` command.');
      bot.reply(message, `If you get tired of my RSS Feed, use \`/rssquit\` to ask me to stop generating a feed for #${channelName}.`);
      bot.reply(message, 'If you need help, use `/rsshelp`.');

      updateFeed(controller, bot, bot.team_info.id, channelId);
    });
  });

  controller.on('slash_command',function(bot, message) {
    getChannel(bot, message, (channelName, channelId) => {
      const { command } = message;

      if (command === '/rssfeed') {
        if (channelName && channelId) {
          bot.api.users.conversations({ user: bot.config.bot.user_id }, (err, { channels }) => {
            if (err) {
              console.error('ERROR:', err);

              // TODO: Add ephemeral error message for user

              return;
            }

            const botChannels = channels.map(({ id }) => id);

            if (!botChannels.includes(channelId)) {
              console.warn('WARNING:', `Tried to get feed URL from #${channelName}, but @RSS bot is not in channel`);

              bot.replyPrivate(message, `Sorry, I'm not in this channel, but if you \`/invite @RSS bot\` I can start creating an RSS Feed for #${channelName}.`);
            } else {
              bot.replyPrivate(message, `*#${channelName} RSS Feed*: <${getFeed(bot.team_info.id, channelId)}>`);
            }
          });
        } else {
          bot.replyPrivate(message, `Sorry, this doesn't appear to be a channel. If you need any help please reach out to <https://www.rssbot.app/help|@RSS bot Support>.`);
        }
      } else if (command === '/rssquit') {
        if (channelName && channelId) {
          bot.api.channels.kick({ token: bot.config.bot.app_token, channel: channelId, user: bot.config.bot.user_id }, (err, response) => {
            if (err) {
              bot.replyPrivate(message, 'I\'m sorry. It looks like your account doesn\'t have permission to kick users. Please contact your nearest Slack admin to have me removed from this channel.');
            }

            controller.storage.feeds.delete(`${bot.team_info.id}::${channelId}`, (err) => {
              if (err) {
                console.error('ERROR: could not delete feed:', err);
              }

              console.log(`Deleting feed ${bot.team_info.id}::${channelId} #${channelName}...`);

              controller.storage.links.find({ channelId, teamId: bot.team_info.id }, (err, links) => {
                if (err) {
                  console.error(`ERROR: could not delete links for #${channelName}:`, err);
                }

                links.forEach((link) => {
                  controller.storage.links.delete(link.id, (err) => {
                    if (err) {
                      console.error('ERROR: could not delete old link:', err);
                    }
                  });
                });

                bot.replyAcknowledge();
              });
            });

            // TODO: clean up feed from FeedPress if they add /feeds/delete.json endpoint
          });
        } else {
          bot.replyPrivate(message, `Sorry, this doesn't appear to be a channel. If you need any help please reach out to <https://www.rssbot.app/help|@RSS bot Support>.`);
        }
      } else if (command === '/rsshelp') {
        bot.replyPrivate(message, `Hey there, \`/invite\` me to a channel to get started. If you need any help please reach out to <https://www.rssbot.app/help|@RSS bot Support>.`);
      }
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

  controller.on('message_action', function(bot, message) {
    const channel = message.raw_message.channel;
    const timestamp = message.raw_message.message.ts;

    bot.api.users.conversations({ user: bot.config.bot.user_id }, (err, { channels }) => {
      if (err) {
        console.error('ERROR:', err);

        // TODO: Add ephemeral error message for user

        return;
      }

      if (message.callback_id === 'ADD_TO_FEED') {
        const botChannels = channels.map(({ id }) => id);

        bot.api.channels.history({ token: bot.config.bot.app_token, channel: channel.id, latest: timestamp, count: 1, inclusive: true }, (err, messageResponse) => {
          if (err) {
            console.error('ERROR:', err);

            // TODO: add ephemeral error message for user

            return;
          }

          const originalMessage = messageResponse.messages[0];

          if (!botChannels.includes(channel.id)) {
            console.warn('WARNING:', `Tried to add message from channel #${channel.name}, but @RSS is not in channel`);

            // TODO: figure out why this message can't self-destruct
            bot.replyInteractive(message, `Sorry, I'm not in this channel, but if you \`/invite @RSS\` I can start creating an RSS Feed for #${channel.name}.`);
          } else {
            // TODO: DRY up the handling of adding items to the feed

            // TODO: replace with native String.prototype.matchAll() when possible
            const checkForMultipleUrls = originalMessage.text.match(GLOBAL_URL_REGEX);

            if (!checkForMultipleUrls) {
              // TODO: figure out why this message can't self-destruct
              bot.replyInteractive(message, `Sorry, there don't seem to be any URLs in that message to add to the RSS Feed.`);
            } else {
              checkForMultipleUrls.forEach((foundUrl) => {
                const url = URL_REGEX.exec(foundUrl)[1];

                controller.storage.links.find({ url, timestamp, channelId: channel.id }, (err, link) => {
                  if (err) {
                    console.error('ERROR:', err);
                  }

                  if (link.length) {
                      bot.replyInteractive(message, `Sorry, that link has already been added to the feed.`);
                  } else {
                    scrape(url)
                      .then(({ description, logo, image, video, audio, ...meta}) => {

                        const date = Date.now();
                        const guid = shortId.generate();

                        let formattedDescription = (description) ? `<p>${description}</p>` : '';

                        if (originalMessage && originalMessage.text) {
                          bot.api.users.info({ user: originalMessage.user }, (err, sharedBy) => {
                            if (err) {
                              console.error('ERROR:', 'Could not find user name for message');
                            }

                            let user;

                            if (sharedBy && sharedBy.user) {
                              user = sharedBy.user.profile.display_name;
                            }

                            const formattedMessageText = originalMessage.text.replace(GLOBAL_URL_REGEX, '<a href="$1">$1</a>');

                            formattedDescription = `<p>From #${channel.name}: <blockquote>${(user) ? `@${user}: ` : ''}${formattedMessageText}</blockquote></p>${formattedDescription}`;

                            formattedDescription = `${formattedDescription}<p><a href="${url}">Read More</a></p>`;

                            if (image) {
                              formattedDescription = `<p><a href="${url}"><img src="${image}" /></a><p>${formattedDescription}`;
                            }

                            const item = Object.assign({}, meta, { categories: [`#${channel.name}`], date, guid, description: formattedDescription });

                            const link = {
                              id: guid,
                              url,
                              timestamp,
                              teamId: bot.team_info.id,
                              shareDate: date,
                              channelName: channel.name,
                              channelId: channel.id,
                              item,
                            };

                            controller.storage.links.save(link, function(err, id) {
                              if (err) {
                                debug('Error: could not save link record:', err);
                              }

                              updateFeed(controller, bot, bot.team_info.id, channel.id);

                              bot.api.reactions.add({ channel: channel.id, name: 'book', timestamp });
                            });
                          });
                        }
                      })
                      .catch((error) => {
                        console.error('ERROR: error scraping url:', error);
                        console.log(message);
                      })
                    ;
                  }
                });
              });
            }
          }
        });
      }
    });
  });

  controller.on('interactive_message_callback', (bot, message) => {
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
          bot.api.channels.history({ token: bot.config.bot.app_token, channel: channelId, latest: timestamp, count: 1, inclusive: true }, (err, messageResponse) => {
            if (err) {
              console.error('ERROR: ', err);

              // TODO: add ephemeral error message for user

              return;
            }

            bot.replyInteractive(message, `Adding to RSS Feed...`);

            scrape(url)
              .then(({ description, logo, image, video, audio, ...meta}) => {

                const date = Date.now();
                const guid = shortId.generate();

                let formattedDescription = (description) ? `<p>${description}</p>` : '';

                const originalMessage = messageResponse.messages[0];

                if (originalMessage && originalMessage.text) {
                  bot.api.users.info({ user: originalMessage.user }, (err, sharedBy) => {
                    if (err) {
                      console.error('ERROR:', 'Could not find user name for message');
                    }

                    let user;

                    if (sharedBy && sharedBy.user) {
                      user = sharedBy.user.profile.display_name;
                    }

                    const formattedMessageText = originalMessage.text.replace(GLOBAL_URL_REGEX, '<a href="$1">$1</a>');

                    formattedDescription = `<p>From #${channelName}: <blockquote>${(user) ? `@${user}: ` : ''}${formattedMessageText}</blockquote></p>${formattedDescription}`;

                    formattedDescription = `${formattedDescription}<p><a href="${url}">Read More</a></p>`;

                    if (image) {
                      formattedDescription = `<p><a href="${url}"><img src="${image}" /></a><p>${formattedDescription}`;
                    }

                    const item = Object.assign({}, meta, { categories: [`#${channelName}`], date, guid, description: formattedDescription });

                    const link = {
                      id: guid,
                      url,
                      timestamp,
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
                        } else {
                          updateFeed(controller, bot, bot.team_info.id, channelId);
                        }
                      }, timeoutInterval);
                    });
                  });
                }
              })
              .catch((error) => {
                console.error('ERROR: error scraping url:', error);
                console.log(message);
              })
            ;
          });
        });
      }
    }
  });
}
