var debug = require('debug')('botkit:onboarding');

module.exports = function(controller) {
  controller.on('onboard', function(bot) {
    debug('Starting an onboarding experience!');
    bot.startPrivateConversation({user: bot.config.createdBy},function(err,convo) {
      if (err) {
        console.log(err);
      } else {
        convo.say('Hey there! I\'m here to help you out.');
        convo.say('Just `/invite` me to a channel so I can start building an RSS Feed when links are posted.');
      }
    });
  });
}
