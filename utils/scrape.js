const unfurl = require('unfurl.js');

const getMeta = (property, data) => {
  if (data) {
    if (data.open_graph && data.open_graph[property]) {
      return data.open_graph[property];
    }

    if (data.twitter_card && data.twitter_card[property]) {
      return data.twitter_card[property];
    }

    return data[property] || '';
  }

  return '';
}

module.exports = function(url = '') {
  if (url.length) {
    return unfurl(url)
      .then((response) => {
        const title = getMeta('title', response);
        const description = getMeta('description', response);

        return { title, description, url };
      })
      .catch((error) => {
        console.error('ERROR SCRAPING URL:', url, error);
      })
    ;
  }

  return '';
}
