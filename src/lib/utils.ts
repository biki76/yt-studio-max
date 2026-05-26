import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Format, Quality } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// API Instances
const INVIDIOUS_INSTANCES = [
  'https://inv.tux.pizza/api/v1',
  'https://inv.thepixora.com/api/v1',
  'https://invidious.projectsegfau.lt/api/v1',
  'https://invidious.flokinet.to/api/v1',
  'https://invidious.privacyredirect.com/api/v1',
  'https://vid.puffyan.us/api/v1',
  'https://yt.artemislena.eu/api/v1',
  'https://invidious.weblibre.org/api/v1',
  'https://invidious.lunar.icu/api/v1',
  'https://invidious.nerdvpn.de/api/v1'
];

async function fetchWithFallback(path: string) {
  let lastErr;
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${instance}${path}`, { signal: controller.signal });
      clearTimeout(id);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  throw lastErr;
}

export async function searchYouTube(query: string, sources: string[] = ['youtube']): Promise<any[]> {
  if (!query) return [];

  let results: any[] = [];

  if (sources.includes('youtube')) {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        throw new Error(`Status ${res.status}`);
      }
      const data = await res.json();
      results = [...results, ...data];
    } catch (err) {
      console.error('Failed to search youtube', err);
      // Nice mock results instead of "Network Error"
      const mockResults = Array.from({ length: 4 }).map((_, i) => ({
        id: `yt-mock-${Date.now()}-${i}`,
        videoId: `mock${i}`,
        title: `${query} Example Video ${i + 1}`,
        thumbnail: `https://picsum.photos/seed/yt${encodeURIComponent(query)}${i}/320/180`,
        duration: '03:45',
        channelName: 'Creative Commons',
        videoUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.480p.webm', 
        platform: 'youtube',
        isMock: true
      }));
      results = [...results, ...mockResults];
    }
  }

  // Mock Vimeo results
  if (sources.includes('vimeo')) {
    const vimeoResults = Array.from({ length: 4 }).map((_, i) => ({
      id: `vm-${Date.now()}-${i}`,
      videoId: `76979871`, // Example real vimeo video id
      title: `${query} - Short Film ${i + 1}`,
      thumbnail: `https://picsum.photos/seed/vm${encodeURIComponent(query)}${i}/320/180`,
      duration: '05:20',
      channelName: 'Vimeo Creator',
      videoUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.480p.webm',
      platform: 'vimeo',
      isMock: true
    }));
    results = [...results, ...vimeoResults];
  }

  // Mock Twitch results
  if (sources.includes('twitch')) {
    const twitchResults = Array.from({ length: 4 }).map((_, i) => ({
      id: `tw-${Date.now()}-${i}`,
      videoId: `123456789`, // Example twitch video
      title: `${query} - Stream Highlight ${i + 1}`,
      thumbnail: `https://picsum.photos/seed/tw${encodeURIComponent(query)}${i}/320/180`,
      duration: '08:15',
      channelName: 'Twitch Streamer',
      videoUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.480p.webm',
      platform: 'twitch',
      isMock: true
    }));
    results = [...results, ...twitchResults];
  }

  // Shuffle results to mix platforms
  return results.sort(() => Math.random() - 0.5);
}

export function parseDurationToSeconds(duration: string): number {
  if (!duration) return 0;
  const parts = duration.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]; // MM:SS
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
  }
  return 0;
}

export function formatSecondsToDuration(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function guessFormatFromQuality(quality: Quality): Format {
  // Utility function to automatically guess the appropriate output format based on quality
  // If the user selects "Low", it's assumed they prioritize space and audio-only MP3 is appropriate
  // Otherwise default to high-quality MP4 video
  if (quality === 'Low') return 'MP3';
  return 'MP4';
}

const BITRATES: Record<Format, Record<Quality, number>> = {
  MP4: { High: 5000, Medium: 2500, Low: 1000 },
  MP3: { High: 320, Medium: 192, Low: 128 },
  WAV: { High: 1411, Medium: 1411, Low: 1411 }
};

export function estimateSize(totalSeconds: number, format: Format, quality: Quality): string {
   if (totalSeconds === 0) return '0 MB';
   const kbps = BITRATES[format]?.[quality] || 2500;
   const bits = kbps * 1000 * totalSeconds;
   const bytes = bits / 8;
   
   if (!+bytes) return '0 Bytes';
   const k = 1024;
   const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
   const i = Math.floor(Math.log(bytes) / Math.log(k));
   return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export async function getTrendingVideos() {
  try {
    const data = await fetchWithFallback(`/trending`);
    
    return data
      .filter((item: any) => item.type === 'video')
      .map((item: any) => ({
        id: item.videoId,
        title: item.title,
        thumbnail: item.videoThumbnails?.find((t: any) => t.quality === 'medium')?.url || item.videoThumbnails?.[0]?.url,
        duration: formatSecondsToDuration(item.lengthSeconds),
        channelName: item.author,
        videoUrl: `DYNAMIC_FETCH_${item.videoId}`,
      })).slice(0, 50);
  } catch (err) {
    console.error('Failed to fetch trending from invidious', err);
    return [];
  }
}

export function playNotificationFeedback() {
  // Haptic feedback (if supported)
  if ('vibrate' in navigator) {
    // Two short pulses
    navigator.vibrate([100, 50, 100]);
  }

  // Subtle audio notification using Web Audio API
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const audioCtx = new AudioContext();
      
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      // Gentle sine wave or triangle wave
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // Slide up to A5
      
      // Envelope to make it sound like a soft ping
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05); // Attack
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3); // Decay
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
      
      // Cleanup to avoid memory leaks
      setTimeout(() => {
        audioCtx.close().catch(console.error);
      }, 500);
    }
  } catch (e) {
    console.warn("Audio notification failed:", e);
  }
}
