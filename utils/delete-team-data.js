module.exports = function(controller, teamId) {
  controller.storage.teams.delete(teamId, (err) => {
    if (err) {
      console.error(`ERROR: could not delete team ${teamId}:`, err);
    }

    controller.storage.feeds.find({ teamId }, (err, feeds) => {
      if (err) {
        console.error(`ERROR: could not find feeds for team ${teamId}`, err);
      }

      feeds.forEach((feed) => {
        const { channelId } = feed;

        controller.storage.feeds.delete(feed.id, (err) => {
          if (err) {
            console.error(`ERROR: could not delete feed ${teamId}::${feed.id}:`, err);
          } else {
            if (process.env.ANALYTICS === 'TRUE') {
              const pingFeedRequest = {
                method: 'GET',
                url: `${process.env.FEEDPRESS_API_URL}/feeds/ping.json`,
                data: stringify({
                  feed: `${teamId}-${channelId}`,
                }),
                params: {
                  key: process.env.FEEDPRESS_API_KEY,
                  token: process.env.FEEDPRESS_API_TOKEN,
                  feed: `${teamId}-${channelId}`,
                },
              };

              axios(pingFeedRequest)
                .then(({ data }) => {
                  if (data.errors && data.errors.length) {
                    data.errors.forEach((err) => console.error('ERROR:', err));
                  }
                })
                .catch((error) => {
                  console.error('ERROR: could not ping feed for refresh:', error);
                })
              ;
            }
          }
        })
      });
    });

    controller.storage.links.find({ teamId }, (err, links) => {
      if (err) {
        console.error(`ERROR: could not delete links for team ${teamId}:`, err);
      }

      links.forEach((link) => {
        controller.storage.links.delete(link.id, (err) => {
          if (err) {
            console.error(`ERROR: could not delete link ${teamId}::${link.id}`);
          }
        });
      });
    });
  });
};
