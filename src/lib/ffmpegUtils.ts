import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { BatchItem, Format, Quality } from '../types';

export async function processIndividualItems(
  ffmpeg: FFmpeg,
  queue: BatchItem[],
  format: Format,
  quality: Quality,
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
        await ffmpeg.writeFile(inputName, await fetchFile(item.videoUrl));

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
      await ffmpeg.writeFile(tempName, await fetchFile(item.videoUrl));
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
