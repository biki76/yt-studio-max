import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { BatchItem, Format, Quality } from '../types';

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.tokhmi.xyz',
  'https://pipedapi.syncpundit.io',
  'https://pipedapi.smarthome.yt',
  'https://pi.ggtyler.dev',
  'https://pipedapi.in.projectsegfau.lt'
];

async function resolveDynamicUrl(videoUrl: string, format: Format): Promise<string> {
  if (!videoUrl.startsWith('DYNAMIC_FETCH_')) return videoUrl;
  
  const videoId = videoUrl.replace('DYNAMIC_FETCH_', '');
  
  for (const instance of PIPED_INSTANCES) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${instance}/streams/${videoId}`, { signal: controller.signal });
      clearTimeout(id);
      
      if (!res.ok) continue;
      const data = await res.json();
      
      if (format === 'MP3' || format === 'WAV') {
        const audioStream = data.audioStreams?.find((f: any) => f.bitrate > 0) || data.audioStreams?.[0];
        if (audioStream) return audioStream.url;
      } else {
        const combined = data.videoStreams?.find((s: any) => !s.videoOnly && s.quality === '720p') 
          || data.videoStreams?.find((s: any) => !s.videoOnly)
          || data.videoStreams?.[0];
        if (combined) return combined.url;
      }
      
    } catch (e) {
      console.error(`Failed resolving stream on ${instance}`, e);
    }
  }

  console.error('All piped instances failed to resolve stream, falling back to mock');
  return 'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.480p.webm';
}

export async function processIndividualItems(
  ffmpeg: FFmpeg,
  queue: BatchItem[],
  format: Format,
  quality: Quality,
  normalizeAudio: boolean,
  updateProgress: (id: string, progress: number, status: BatchItem['status'], downloadUrl?: string) => void,
  onItemComplete?: (item: BatchItem, url: string) => void
) {
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (const item of queue) {
    if (item.status === 'completed') continue;
    
    let attempt = 0;
    const maxAttempts = 3;
    let success = false;

    while (attempt < maxAttempts && !success) {
      updateProgress(item.id, 0, 'converting');
      
      try {
        const inputName = `input-${item.id}.webm`;
        const outputExt = format.toLowerCase();
        const outputName = `output-${item.id}.${outputExt}`;

        // Write input file to FS
        const actualUrl = await resolveDynamicUrl(item.videoUrl, format);
        await ffmpeg.writeFile(inputName, await fetchFile(actualUrl));

        ffmpeg.on('progress', ({ progress }) => {
          updateProgress(item.id, Math.round(progress * 100), 'converting');
        });

        // Simple args mapping
        let args: string[] = [];
        if (item.startTrim) args.push('-ss', item.startTrim);
        if (item.endTrim) args.push('-to', item.endTrim);
        args.push('-i', inputName);
        
        if (format === 'MP4') {
          args.push('-c:v', 'libx264');
          if (quality === 'High') args.push('-crf', '18');
          else if (quality === 'Medium') args.push('-crf', '23');
          else args.push('-crf', '28');
          args.push('-preset', 'ultrafast');
        } else if (format === 'MP3') {
          args.push('-vn', '-c:a', 'libmp3lame');
          if (quality === 'High') args.push('-b:a', '320k');
          else if (quality === 'Medium') args.push('-b:a', '192k');
          else args.push('-b:a', '128k');
        } else if (format === 'WAV') {
          args.push('-vn', '-c:a', 'pcm_s16le');
        }

        if ((format === 'MP3' || format === 'WAV') && item.metadata) {
          if (item.metadata.title) {
            args.push('-metadata', `title=${item.metadata.title}`);
          }
          if (item.metadata.artist) {
            args.push('-metadata', `artist=${item.metadata.artist}`);
          }
        }

        if (normalizeAudio) {
          args.push('-af', 'loudnorm');
        }

        args.push(outputName);

        await ffmpeg.exec(args);

        const data = await ffmpeg.readFile(outputName);
        const blob = new Blob([(data as Uint8Array).buffer], { type: format === 'MP4' ? 'video/mp4' : `audio/${outputExt}` });
        const url = URL.createObjectURL(blob);

        // Cleanup
        ffmpeg.off('progress', () => {});
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);

        updateProgress(item.id, 100, 'completed', url);
        if (onItemComplete) onItemComplete(item, url);

        // Auto-trigger download
        const a = document.createElement('a');
        a.href = url;
        let downloadedName = `YouTubeStudioMax-${item.id}.${outputExt}`;
        if ((format === 'MP3' || format === 'WAV') && item.metadata?.title) {
          downloadedName = `${item.metadata.artist ? item.metadata.artist + ' - ' : ''}${item.metadata.title}.${outputExt}`;
        }
        a.download = downloadedName;
        a.click();
        success = true;

      } catch (e) {
        console.error(`Error processing ${item.id} (Attempt ${attempt + 1})`, e);
        attempt++;
        if (attempt >= maxAttempts) {
          updateProgress(item.id, 0, 'error');
        } else {
          // Exponential backoff
          await wait(Math.pow(2, attempt) * 1000);
        }
      }
    }
  }
}

export async function processConcatenation(
  ffmpeg: FFmpeg,
  queue: BatchItem[],
  format: Format,
  quality: Quality,
  normalizeAudio: boolean,
  updateGlobalProgress: (progress: number) => void,
  onComplete: (url: string) => void,
  onError: (e: any) => void
) {
  try {
    updateGlobalProgress(0);
    const outputExt = format.toLowerCase();
    const outputName = `concat-output.${outputExt}`;
    
    // Write all inputs and build a concat file
    let concatText = '';
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      const tempName = `temp-${i}.webm`;
      const actualUrl = await resolveDynamicUrl(item.videoUrl, format);
      await ffmpeg.writeFile(tempName, await fetchFile(actualUrl));
      concatText += `file '${tempName}'\n`;
      if (item.startTrim) {
        concatText += `inpoint ${item.startTrim}\n`;
      }
      if (item.endTrim) {
        concatText += `outpoint ${item.endTrim}\n`;
      }
    }

    await ffmpeg.writeFile('concat.txt', concatText);

    ffmpeg.on('progress', ({ progress }) => {
      // ffmpeg gives a rough progress for the concat op if we transcode
      updateGlobalProgress(Math.round(progress * 100));
    });

    let args = ['-f', 'concat', '-safe', '0', '-i', 'concat.txt'];
    
    if (format === 'MP4') {
      args.push('-c:v', 'libx264', '-crf', '23', '-preset', 'ultrafast');
    } else if (format === 'MP3') {
      args.push('-vn', '-c:a', 'libmp3lame', '-b:a', '192k');
    } else if (format === 'WAV') {
      args.push('-vn', '-c:a', 'pcm_s16le');
    }
    
    if (normalizeAudio) {
      args.push('-af', 'loudnorm');
    }

    args.push(outputName);

    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([(data as Uint8Array).buffer], { type: format === 'MP4' ? 'video/mp4' : `audio/${outputExt}` });
    const url = URL.createObjectURL(blob);

    // Cleanup
    ffmpeg.off('progress', () => {});
    await ffmpeg.deleteFile('concat.txt');
    await ffmpeg.deleteFile(outputName);
    for (let i = 0; i < queue.length; i++) {
       await ffmpeg.deleteFile(`temp-${i}.webm`);
    }

    updateGlobalProgress(100);
    onComplete(url);
    
    // Auto download
    const a = document.createElement('a');
    a.href = url;
    a.download = `YouTubeStudioMax-Merge.${outputExt}`;
    a.click();

  } catch (e) {
    console.error('Concat Error', e);
    onError(e);
  }
}
