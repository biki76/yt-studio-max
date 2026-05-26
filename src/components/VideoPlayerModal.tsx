import React from 'react';
import { X } from 'lucide-react';
import { VideoResult } from '../types';

interface VideoPlayerModalProps {
  video: VideoResult;
  onClose: () => void;
}

export function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <div 
        className="bg-black/50 border border-white/10 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 backdrop-blur-sm">
          <h3 className="text-white/90 font-semibold truncate pr-4">{video.title}</h3>
          <button 
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-rose-500/20 rounded-full text-white/50 hover:text-rose-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="aspect-video bg-black relative">
          {video.isMock ? (
            <video 
               src={video.videoUrl}
               controls
               className="w-full h-full object-contain"
               autoPlay
            />
          ) : video.platform === 'vimeo' ? (
             <iframe 
               src={`https://player.vimeo.com/video/${video.videoId}?autoplay=1`}
               className="w-full h-full border-0"
               allow="autoplay; fullscreen; picture-in-picture"
               allowFullScreen
            />
          ) : video.platform === 'twitch' ? (
             <iframe 
               src={`https://player.twitch.tv/?video=${video.videoId}&parent=${window.location.hostname}&autoplay=true`}
               className="w-full h-full border-0"
               allowFullScreen
            />
          ) : (
            <iframe 
               src={`https://www.youtube.com/embed/${video.videoId || video.id.replace('yt-', '')}?autoplay=1`}
               className="w-full h-full border-0"
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
               allowFullScreen
            />
          )}
        </div>
      </div>
    </div>
  );
}
