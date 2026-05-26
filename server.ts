import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import ytSearch from 'yt-search';
import ytdl from '@distube/ytdl-core';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  // API route for YouTube search
  app.get('/api/search', async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) {
        return res.status(400).json({ error: 'Query parameter q is required' });
      }

      const opts = { query: q, pageStart: 1, pageEnd: 1 };
      const searchResults = await ytSearch(opts);
      
      const vids = searchResults.videos.slice(0, 15).map(v => ({
        id: `yt-${v.videoId}`,
        videoId: v.videoId,
        title: v.title,
        thumbnail: v.thumbnail || v.image,
        duration: v.timestamp,
        channelName: v.author.name,
        videoUrl: `DYNAMIC_FETCH_${v.videoId}`,
        platform: 'youtube',
        isMock: false
      }));

      res.json(vids);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Failed to perform search' });
    }
  });

  // API route for YouTube video resolution
  app.get('/api/resolve', async (req, res) => {
    try {
      const videoId = req.query.v as string;
      const type = req.query.type as string || 'video'; // 'video' or 'audio'
      if (!videoId) {
        return res.status(400).json({ error: 'Video ID parameter v is required' });
      }

      const info = await ytdl.getInfo(videoId);
      
      let url = '';
      if (type === 'audio') {
        const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
        url = audioFormat.url;
      } else {
        const videoFormat = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'videoandaudio' });
        if (videoFormat) {
          url = videoFormat.url;
        } else {
          // Fallback to highest video only if no combined stream
          const fallbackFormat = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' });
          url = fallbackFormat.url;
        }
      }

      res.json({ url });
    } catch (error) {
      console.error('Resolve error:', error);
      res.status(500).json({ error: 'Failed to resolve stream URL' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
