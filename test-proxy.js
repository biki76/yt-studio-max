import https from 'https';

https.get('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://inv.thepixora.com/api/v1/search?q=test'), (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(data.substring(0, 500));
  });
});
