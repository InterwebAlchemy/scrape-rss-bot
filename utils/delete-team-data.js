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
        controller.storage.feeds.delete(feed.id, (err) => {
          if (err) {
            console.error(`ERROR: could not delete feed ${teamId}::${feed.id}:`, err);
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
