export interface VideoResult {
  id: string; // The unique id across platforms (e.g. yt-1234)
  videoId?: string; // The platform-specific id
  title: string;
  thumbnail: string;
  duration: string;
  channelName: string;
  videoUrl: string; // The simulated or real raw video url that we can fetch
  platform?: 'youtube' | 'vimeo' | 'twitch';
  isMock?: boolean;
}

export interface HistoryItem {
  id: string;
  title: string;
  thumbnail?: string;
  downloadUrl: string;
  timestamp: number;
  format: string;
  type: 'individual' | 'merge';
}

export type Format = 'MP4' | 'MP3' | 'WAV';
export type Quality = 'High' | 'Medium' | 'Low';

export interface BatchItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  duration: string;
  status: 'idle' | 'converting' | 'completed' | 'error';
  progress: number;
  downloadUrl?: string;
  videoUrl: string;
  startTrim?: string;
  endTrim?: string;
  metadata?: {
    title?: string;
    artist?: string;
  };
  retryCount?: number;
}
