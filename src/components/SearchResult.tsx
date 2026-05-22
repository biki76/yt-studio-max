import React from 'react';
import { Play, Plus, Check } from 'lucide-react';
import { VideoResult } from '../types';
import { useAppContext } from '../store/AppContext';
import { cn } from '../lib/utils';

interface SearchResultProps {
  video: VideoResult;
  onPlayPreview: (video: VideoResult) => void;
}

export const SearchResult: React.FC<SearchResultProps> = ({ video, onPlayPreview }) => {
  const { addToBatch, batchQueue } = useAppContext();
  
  const inBatch = batchQueue.some(item => item.videoId === video.id);

  return (
    <div className="group relative flex flex-col bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all shadow-md hover:shadow-xl hover:shadow-black/50 overflow-hidden backdrop-blur-sm">
      <div className="relative aspect-video w-full overflow-hidden bg-black/60 cursor-pointer" onClick={() => onPlayPreview(video)}>
        <img 
          src={video.thumbnail} 
          alt={video.title} 
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://picsum.photos/320/180?grayscale';
          }}
        />
        <div className="absolute inset-x-0 bottom-0 mix-blend-overlay bg-gradient-to-t from-black via-black/40 to-transparent h-1/2 pointer-events-none" />
        
        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded-md text-xs font-mono font-medium text-white/90">
          {video.duration}
        </div>
        
        {/* Overlay Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:bg-black/20">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white shadow-xl translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <Play className="w-5 h-5 ml-1 fill-white" />
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-semibold text-white/95 line-clamp-2 leading-snug text-[15px] mb-1.5" title={video.title}>
          {video.title}
        </h3>
        <p className="text-white/40 text-[13px] mb-5 font-medium flex-1">
          {video.channelName}
        </p>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!inBatch) addToBatch(video);
          }}
          disabled={inBatch}
          className={cn(
            "w-full flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
            inBatch 
              ? "bg-white/5 border border-white/10 text-white/40 cursor-default"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg focus:ring-2 focus:ring-indigo-500/50 hover:shadow-indigo-500/25 active:scale-[0.98]"
          )}
        >
          {inBatch ? (
            <>
              <Check className="w-4 h-4 mr-2 text-indigo-400" />
              In Queue
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add to Batch
            </>
          )}
        </button>
      </div>
    </div>
  );
}
