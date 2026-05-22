import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, CheckCircle2, AlertCircle, Loader2, Scissors, Music } from 'lucide-react';
import { BatchItem } from '../types';
import { useAppContext } from '../store/AppContext';
import { cn, parseDurationToSeconds, formatSecondsToDuration } from '../lib/utils';
import { TrimModal } from './TrimModal';

interface BatchQueueItemProps {
  item: BatchItem;
  showDragTooltip?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export const BatchQueueItem: React.FC<BatchQueueItemProps> = ({ item, showDragTooltip, isSelected, onToggleSelect }) => {
  const { removeFromBatch, updateBatchItem, format } = useAppContext();
  const [showTrimModal, setShowTrimModal] = useState(false);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [metaTitle, setMetaTitle] = useState(item.metadata?.title || '');
  const [metaArtist, setMetaArtist] = useState(item.metadata?.artist || '');
  
  const estimatedSeconds = parseDurationToSeconds(item.duration) / 2; // rough estimate
  const estimatedTimeText = `Estimated conversion time: ${formatSecondsToDuration(estimatedSeconds)}`;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSaveMeta = () => {
    updateBatchItem(item.id, { metadata: { title: metaTitle, artist: metaArtist } });
    setShowMetaModal(false);
  };

  const isAudioFormat = format === 'MP3' || format === 'WAV';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg group relative",
        isDragging && "opacity-50 border-indigo-500/50 z-10"
      )}
    >
      {showDragTooltip && !isDragging && (
        <div className="absolute -top-[22px] left-2 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap animate-pulse pointer-events-none z-20">
          Drag to reorder
          <div className="absolute top-full left-[10px] w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-indigo-600"></div>
        </div>
      )}
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab hover:text-white/80 text-white/30 transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      
      {onToggleSelect && (
        <div className="flex items-center">
          <input 
            type="checkbox" 
            checked={!!isSelected} 
            onChange={onToggleSelect}
            className="w-4 h-4 rounded border-white/20 bg-black/50 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
          />
        </div>
      )}

      <img src={item.thumbnail} alt="" className="w-16 h-9 object-cover rounded bg-black/50" />
      
      <div className="flex-1 min-w-0">
        <h4 className="text-white/90 text-sm font-medium truncate">{item.title}</h4>
        
        {/* Status indicator */}
        <div className="flex items-center mt-1">
          {item.status === 'idle' && <span className="text-xs text-white/40">Queued</span>}
          {item.status === 'converting' && (
            <div className="flex items-center text-indigo-400 text-xs">
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
              {item.progress}%
            </div>
          )}
          {item.status === 'completed' && (
            <div className="flex items-center text-emerald-400 text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Done
            </div>
          )}
          {item.status === 'error' && (
            <div className="flex items-center text-rose-400 text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              Failed
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {item.status === 'idle' && isAudioFormat && (
          <button 
            onClick={() => setShowMetaModal(true)}
            className={cn(
              "p-1.5 rounded-md transition-all group-hover:opacity-100",
              item.metadata?.title || item.metadata?.artist ? "text-indigo-400 bg-indigo-500/10 opacity-100" : "text-white/30 hover:text-indigo-400 hover:bg-indigo-500/10 opacity-0"
            )}
            title="Edit Audio Metadata"
          >
            <Music className="w-4 h-4" />
          </button>
        )}
        
        {item.status === 'idle' && (
          <button 
            onClick={() => setShowTrimModal(true)}
            className={cn(
              "p-1.5 rounded-md transition-all group-hover:opacity-100",
              item.startTrim || item.endTrim ? "text-indigo-400 bg-indigo-500/10 opacity-100" : "text-white/30 hover:text-indigo-400 hover:bg-indigo-500/10 opacity-0"
            )}
            title="Trim Video"
          >
            <Scissors className="w-4 h-4" />
          </button>
        )}

        {item.status === 'completed' && item.downloadUrl ? (
          <a 
            href={item.downloadUrl}
            download={`download-${item.id}.${item.downloadUrl.split('.').pop() || 'mp4'}`}
            className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs rounded transition-colors uppercase font-bold tracking-wider"
          >
            Save
          </a>
        ) : (
          <button 
            onClick={() => removeFromBatch(item.id)}
            className="p-1.5 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Persistent Progress Bar */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 h-0.5 rounded-bl-lg transition-all duration-300",
          item.status === 'idle' ? "bg-white/10 group-hover:bg-white/20" : 
          item.status === 'converting' ? "bg-indigo-500" :
          item.status === 'completed' ? "bg-emerald-500" : "bg-rose-500"
        )}
        style={{ width: item.status === 'idle' || item.status === 'error' ? '100%' : `${item.progress || 100}%` }}
        title={item.status === 'idle' ? estimatedTimeText : undefined}
      />

      {showTrimModal && (
        <TrimModal 
          item={item} 
          onClose={() => setShowTrimModal(false)}
          onSave={(start, end) => {
            updateBatchItem(item.id, { startTrim: start, endTrim: end });
            setShowTrimModal(false);
          }}
        />
      )}
      
      {showMetaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Music className="w-5 h-5 text-indigo-400" />
              Edit ID3 Tags
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Track Title</label>
                <input 
                  type="text" 
                  value={metaTitle}
                  onChange={e => setMetaTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder={item.title}
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Artist / Creator</label>
                <input 
                  type="text" 
                  value={metaArtist}
                  onChange={e => setMetaArtist(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="e.g. Unknown Artist"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-8">
              <button 
                onClick={() => setShowMetaModal(false)}
                className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveMeta}
                className="px-4 py-2 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
              >
                Save Tags
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
