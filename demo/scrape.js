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

;(async () => {
  console.log(`Scraping ${process.argv[2]}...`);
  const { body: html, url } = await got(process.argv[2]);
  const metadata = await metascraper({ html, url });
  console.log(metadata);
})();
