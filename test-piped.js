const https = require('https');
https.get('https://pipedapi.kavin.rocks/search?q=test&filter=all', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(data.substring(0, 500));
  });
});
