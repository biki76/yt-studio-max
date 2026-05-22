import React from 'react';
import { X } from 'lucide-react';
import { VideoResult } from '../types';

interface VideoPlayerModalProps {
  video: VideoResult;
  onClose: () => void;
}

export function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white font-medium truncate pr-4">{video.title}</h3>
          <button 
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="aspect-video bg-black relative">
          <video 
             src={video.videoUrl}
             controls
             className="w-full h-full object-contain"
             autoPlay
          />
        </div>
      </div>
    </div>
  );
}
