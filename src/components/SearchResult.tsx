import React from 'react';
import { Play, Plus } from 'lucide-react';
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
    <div className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
      <div className="relative aspect-video w-full overflow-hidden">
        <img 
          src={video.thumbnail} 
          alt={video.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-xs font-mono text-white/90 glass-panel">
          {video.duration}
        </div>
        
        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button 
            onClick={() => onPlayPreview(video)}
            className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white mx-2 transition-transform hover:scale-110"
            title="Preview Video"
          >
            <Play className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-medium text-white/90 line-clamp-2 leading-snug text-sm mb-1">{video.title}</h3>
        <p className="text-white/50 text-xs mb-4">{video.channelName}</p>
        
        <button
          onClick={() => addToBatch(video)}
          disabled={inBatch}
          className={cn(
            "w-full flex items-center justify-center py-2 rounded-lg text-sm font-medium transition-all",
            inBatch 
              ? "bg-indigo-500/20 text-indigo-300 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
          )}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          {inBatch ? 'Added to Batch' : 'Add to Batch'}
        </button>
      </div>
    </div>
  );
}
