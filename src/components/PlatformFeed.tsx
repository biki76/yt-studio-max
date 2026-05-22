import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2, ArrowLeft, Plus, Play } from 'lucide-react';
import { getTrendingVideos } from '../lib/utils';
import { VideoResult } from '../types';
import { useAppContext } from '../store/AppContext';
import { SearchResult } from './SearchResult';

interface PlatformFeedProps {
  platform: string;
  onClose: () => void;
  onPreview: (video: VideoResult) => void;
}

export function PlatformFeed({ platform, onClose, onPreview }: PlatformFeedProps) {
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { batchQueue, setBatchQueue, addToast } = useAppContext();

  useEffect(() => {
    if (platform === 'youtube') {
      setLoading(true);
      getTrendingVideos()
        .then(data => {
          setVideos(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      // Mock for other platforms
      setTimeout(() => {
        setVideos([]);
        setLoading(false);
      }, 1000);
    }
  }, [platform]);

  const handleAddBatch = (video: VideoResult) => {
    if (batchQueue.some(item => item.id === video.id)) {
      addToast('Already in batch queue', 'warning');
      return;
    }
    
    setBatchQueue([
      ...batchQueue,
      {
        ...video,
        status: 'idle',
        progress: 0,
      },
    ]);
    addToast(`Added "${video.title}" to batch`, 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-white/10 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-medium text-white capitalize">{platform} Trending Feed</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-white/50">Loading {platform} feed...</p>
          </div>
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video, idx) => {
              const inQueue = batchQueue.some(q => q.id === video.id);
              return (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all cursor-pointer flex flex-col"
                  onClick={() => onPreview(video)}
                >
                  <div className="relative aspect-video w-full bg-black/50 overflow-hidden">
                    <img 
                      src={video.thumbnail} 
                      alt="" 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded block text-xs font-mono text-white/90">
                      {video.duration}
                    </div>
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20 transform group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 text-white ml-1 pl-0.5" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-sm font-medium text-white/90 line-clamp-2 leading-relaxed mb-2 group-hover:text-indigo-300 transition-colors">
                      {video.title}
                    </h3>
                    <div className="text-xs text-white/50 mb-4 mt-auto">
                      {video.channelName}
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddBatch(video);
                      }}
                      disabled={inQueue}
                      className={`w-full py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-medium transition-colors ${
                        inQueue 
                          ? 'bg-white/5 text-emerald-400 border border-emerald-500/20 cursor-default' 
                          : 'bg-white/5 hover:bg-indigo-500 hover:text-white border border-white/10 hover:border-transparent text-white/70'
                      }`}
                    >
                      {inQueue ? (
                        'In Queue'
                      ) : (
                        <>
                          <Plus className="w-4 h-4" /> Add to Batch
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
              <span className="text-2xl">🚧</span>
            </div>
            <p className="text-white/70 font-medium">Native feed for {platform} is coming soon!</p>
            <p className="text-white/40 text-sm max-w-sm">We're working on adding native browsing support for other platforms.</p>
          </div>
        )}
      </div>
    </div>
  );
}
