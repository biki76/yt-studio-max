import React, { useState } from 'react';
import { X } from 'lucide-react';
import { BatchItem } from '../types';

interface TrimModalProps {
  item: BatchItem;
  onClose: () => void;
  onSave: (start?: string, end?: string) => void;
}

export function TrimModal({ item, onClose, onSave }: TrimModalProps) {
  const [start, setStart] = useState(item.startTrim || '');
  const [end, setEnd] = useState(item.endTrim || '');

  const handleSave = () => {
    onSave(start.trim() || undefined, end.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-sm shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Trim Video</h3>
          <button 
            onClick={onClose}
            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-4 text-xs text-white/50">
          <p className="truncate mb-1">{item.title}</p>
          <p>Full Duration: {item.duration}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Start (MM:SS)</label>
            <input 
              type="text" 
              placeholder="e.g. 00:15"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full bg-black/50 border border-white/10 focus:border-indigo-500 rounded px-3 py-2 text-sm text-white outline-none placeholder-white/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">End (MM:SS)</label>
            <input 
              type="text" 
              placeholder="e.g. 01:30"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full bg-black/50 border border-white/10 focus:border-indigo-500 rounded px-3 py-2 text-sm text-white outline-none placeholder-white/20 transition-colors"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-500/20 transition-all"
          >
            Save Trims
          </button>
        </div>
      </div>
    </div>
  );
}
