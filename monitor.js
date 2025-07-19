// Traditional CommonJS require (works in all Node versions)
const fetch = require('node-fetch');
const websites = require('./websites.json');

async function checkWebsite(url) {
  try {
    const start = Date.now();
    const response = await fetch(url, {
      headers: { 'User-Agent': 'UptimeOwl/1.0' },
      timeout: 5000
    });
    const time = Date.now() - start;
    console.log(`✅ ${url} - UP (${time}ms)`);
  } catch (err) {
    console.log(`❌ ${url} - DOWN (${err.message})`);
  }
}

// Proper async wrapper for CommonJS
(async function() {
  for (const url of websites) {
    await checkWebsite(url);
    await new Promise(r => setTimeout(r, 1000)); // 1s delay
  }
})();