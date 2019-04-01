module.exports = function(message) {
  return message.channel._client.channels[message.body.channel].name;
}
