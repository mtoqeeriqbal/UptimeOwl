const fs = require('fs');
const fetch = require('node-fetch');
const pLimit = require('p-limit');
const websites = require('./websites.json');

// Configuration
const CONCURRENCY = 10; // Number of parallel checks
const TIMEOUT = 10000; // 10 seconds timeout

async function checkWebsite(url) {
  const start = Date.now();
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'UptimeOwl/1.0' },
      timeout: TIMEOUT
    });
    const time = Date.now() - start;
    return {
      url,
      status: 'UP',
      statusCode: response.status,
      responseTime: time,
      error: ''
    };
  } catch (err) {
    const time = Date.now() - start;
    let errorType = err.message;
    if (err.type === 'request-timeout') errorType = 'Timeout';
    else if (err.code === 'ENOTFOUND') errorType = 'DNS Error';
    else if (err.code === 'ECONNREFUSED') errorType = 'Connection Refused';

    return {
      url,
      status: 'DOWN',
      statusCode: 0,
      responseTime: time,
      error: errorType
    };
  }
}

(async function () {
  console.log(`🚀 Starting audit for ${websites.length} websites...`);

  const limit = pLimit(CONCURRENCY);
  const tasks = websites.map(url => limit(() => checkWebsite(url)));

  const results = await Promise.all(tasks);

  // Generate CSV
  const csvHeader = 'URL,Status,StatusCode,ResponseTime(ms),Error\n';
  const csvRows = results.map(r =>
    `"${r.url}","${r.status}",${r.statusCode},${r.responseTime},"${r.error}"`
  ).join('\n');

  const csvContent = csvHeader + csvRows;

  fs.writeFileSync('audit_report.csv', csvContent);

  console.log(`✅ Audit complete! Report saved to audit_report.csv`);

  // Summary log
  const up = results.filter(r => r.status === 'UP').length;
  const down = results.filter(r => r.status === 'DOWN').length;
  console.log(`📊 Summary: ${up} UP, ${down} DOWN`);
})();