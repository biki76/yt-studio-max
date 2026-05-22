import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Format, Quality } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Simulated YouTube fetcher
export async function searchYouTube(query: string): Promise<any[]> {
  // Mock delay
  await new Promise((resolve) => setTimeout(resolve, 800));
  
  if (!query) return [];

  // Generate some mock results based on query
  return Array.from({ length: 12 }).map((_, i) => ({
    id: `yt-mock-${Date.now()}-${i}`,
    title: `${query} - Result ${i + 1} | Full HD Video`,
    thumbnail: `https://picsum.photos/seed/${query}${i}/320/180`,
    duration: '03:45',
    channelName: 'Test Channel',
    // We use a small public test video URL for actual FFmpeg processing testing
    videoUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.480p.webm', 
  }));
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
