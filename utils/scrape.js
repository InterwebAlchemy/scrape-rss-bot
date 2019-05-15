const metascraper = require('metascraper')([
  require('metascraper-youtube')(),
  require('metascraper-soundcloud')(),
  require('metascraper-amazon')(),
  require('metascraper-author')(),
  require('metascraper-date')(),
  require('metascraper-description')(),
  require('metascraper-image')(),
  require('metascraper-clearbit-logo')(),
  require('metascraper-logo')(),
  require('metascraper-logo-favicon')(),
  require('metascraper-publisher')(),
  require('metascraper-title')(),
  require('metascraper-url')(),
]);

const got = require('got');

const URL_REGEX = require('../vendor/regex-weburl');

module.exports = async (target = '') => {
  if (target.length && URL_REGEX.test(target)) {
    console.log(`Scraping ${target}...`);

    const { body: html, url } = await got(target);

    const meta = await metascraper({ html, url });

    return meta;
  } else {
    console.error(`ERROR: Could not scrape ${target}...`);
  }
};
