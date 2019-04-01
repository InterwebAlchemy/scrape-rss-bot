const unfurl = require('unfurl.js');

module.exports = function(url = '') {
  if (url.length) {
    return unfurl(url)
      .then((response) => {
        const title = response.open_graph.title || response.twitter_card.title || response.title;
        const description = response.open_graph.description || response.twitter_card.description || response.description;

        return { title, description, url };
      })
      .catch((error) => {
        console.error('ERROR SCRAPING URL:', url, error);
      })
    ;
  }

  return '';
}
