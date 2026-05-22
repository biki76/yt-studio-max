import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { useRef, useState, useEffect } from 'react';

export function useFFmpeg() {
  const [loaded, setLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const ffmpeg = new FFmpeg();
        
        // Single threaded core for broader compatibility without headers
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        
        // Check for SharedArrayBuffer Support (Required for core-mt multithreading)
        if (typeof SharedArrayBuffer === 'undefined') {
          console.warn(
            'SharedArrayBuffer is not available. Please ensure your server sends Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers required by FFmpeg multithreading. Falling back to single-threaded core.'
          );
        }

        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        
        ffmpegRef.current = ffmpeg;
        setLoaded(true);
      } catch (err: any) {
        setLoadingError(err.message || 'Failed to load FFmpeg. Need SharedArrayBuffer or proper CORS?');
        console.error('FFmpeg Load Error:', err);
      }
    };

    load();
  }, []);

  return { ffmpeg: ffmpegRef.current, loaded, loadingError };
}
