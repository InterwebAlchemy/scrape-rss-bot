const unfurl = require('unfurl.js');

module.exports = function(url = '') {
  if (url.length) {
    unfurl(url)
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.error('ERROR SCRAPING URL:', url, error);
      })
    ;
  }
}
