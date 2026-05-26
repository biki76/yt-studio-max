import ytdl from '@distube/ytdl-core';
ytdl.getInfo('UyAWtjtuKvU')
  .then(info => { console.log(info.formats.length); })
  .catch(err => { console.error('YTDL ERROR:', err.message); });
