import { FFmpeg } from '@ffmpeg/ffmpeg';
import { useRef, useState, useEffect } from 'react';
import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';

export function useFFmpeg() {
  const [loaded, setLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const ffmpeg = new FFmpeg();
        
        // Check for SharedArrayBuffer Support
        if (typeof SharedArrayBuffer === 'undefined') {
          console.warn(
            'SharedArrayBuffer is not available. Falling back to single-threaded ffmpeg-core.'
          );
        }

        await ffmpeg.load({
          coreURL,
          wasmURL
        });
        
        if (mounted) {
          ffmpegRef.current = ffmpeg;
          setLoaded(true);
        }
      } catch (err: any) {
        if (mounted) {
          setLoadingError(err.message || 'Failed to load FFmpeg. Need SharedArrayBuffer or proper CORS?');
          console.error('FFmpeg Load Error:', err);
        }
      }
    };

    if (!ffmpegRef.current && !loaded && !loadingError) {
      load();
    }

    return () => {
      mounted = false;
    };
  }, [loaded, loadingError]);

  return { ffmpeg: ffmpegRef.current, loaded, loadingError };
}
