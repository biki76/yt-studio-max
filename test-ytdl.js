import ytdl from '@distube/ytdl-core';
ytdl.getInfo('UyAWtjtuKvU').then(info => {
    const videoFormat = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'videoandaudio' });
    console.log(videoFormat.url.substring(0, 50));
}).catch(console.error);
