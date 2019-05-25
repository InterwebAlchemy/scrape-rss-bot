# RSS Bot for Slack

`@RSS bot` was built using [Botkit](https://botkit.ai).

Once you add `@RSS bot` to a channel in your Slack Workspace, it
will listen for any links that are posted.

When a user posts a link, they will be asked if they want to
add that link to the RSS Feed for that channel.

Each channel that `@RSS bot` is in will get it's own RSS Feed.

Any user can get the RSS Feed URL for the current channel by
using the `/rssfeed` slash command.

Users can ask `@RSS bot` to leave via the `/stoprss`
slash command.
