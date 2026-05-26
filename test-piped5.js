const pipedUrl = 'https://pipedapi.kavin.rocks/streams/UyAWtjtuKvU';
import https from 'https';
https.get(pipedUrl, res => {
  let data = ''; res.on('data', c => data+=c);
  res.on('end', () => console.log(data.substring(0,200)));
});
