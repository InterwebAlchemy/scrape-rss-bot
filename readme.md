# @RSS bot

[![@RSS bot logo](public/favicon-32x32.png?raw=true)](https://www.rssbot.app/)
[![Add to Slack](https://platform.slack-edge.com/img/add_to_slack.png)](https://www.rssbot.app/login)

`@RSS bot` was built using [Botkit](https://botkit.ai).

![GIF of @RSS bot in asking user to add link to RSS feed](public/rssbot.gif)

Once you add `@RSS bot` to a channel in your Slack Workspace, it
will listen for any links that are posted.

When a user posts a link, they will be asked if they want to
add that link to the RSS Feed for that channel.

Each channel that `@RSS bot` is in will get it's own RSS Feed.

Any user can get the RSS Feed URL for the current channel by
using the `/rssfeed` slash command.

Users can ask `@RSS bot` to leave via the `/stoprss`
slash command.
