const request = require('request-promise');
const $ = require('cheerio');

module.exports = function(url = '') {
  if (url.length) {
    request(url)
      .then((response) => {
        console.log($('head', response));
      })
      .catch((error) => {
        console.error('ERROR SCRAPING URL:', url, error)
      })
    ;
  }
}
