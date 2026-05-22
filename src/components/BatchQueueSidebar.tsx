import { motion } from 'motion/react';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Settings2, Settings, Download, Layers, Trash2, ListMinus, Loader2, Clock, HardDrive, History, FileVideo, Upload, Save, Search, Shuffle, FilterX, Scissors, Info, ChevronDown } from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useAppContext } from '../store/AppContext';
import { BatchQueueItem } from './BatchQueueItem';
import { AdBanner } from './AdBanner';
import { processIndividualItems, processConcatenation } from '../lib/ffmpegUtils';
import { useFFmpeg } from '../hooks/useFFmpeg';
import { cn, parseDurationToSeconds, formatSecondsToDuration, estimateSize, guessFormatFromQuality, playNotificationFeedback } from '../lib/utils';
import { Format, Quality } from '../types';
import { useToast } from './ToastProvider';

import { BulkTrimModal } from './BulkTrimModal';

export function BatchQueueSidebar() {
  const { batchQueue, setBatchQueue, clearBatch, format, setFormat, quality, setQuality, normalizeAudio, setNormalizeAudio, soundEnabled, setSoundEnabled, history, addToHistory, clearHistory } = useAppContext();
  const { ffmpeg, loaded, loadingError } = useFFmpeg();
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('manual');
  const [showBulkTrim, setShowBulkTrim] = useState(false);
  const [showQualityGuide, setShowQualityGuide] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStart, setProcessingStart] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [logs, setLogs] = useState<{timestamp: number, text: string}[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [globalProgress, setGlobalProgress] = useState(-1); // -1 means idle
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statsExpanded, setStatsExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (window.innerWidth < 1024 && batchQueue.length > 2) {
      setStatsExpanded(false);
    }
  }, [batchQueue.length]);

  const exportHistoryCSV = () => {
    if (history.length === 0) return;
    
    const headers = ['Title', 'Duration', 'Format', 'Quality', 'Date', 'Status'];
    const rows = history.map(item => [
      `"${item.title.replace(/"/g, '""')}"`,
      item.duration || 'N/A',
      item.format || 'Unknown',
      item.quality || 'N/A',
      new Date(item.completedAt).toLocaleString(),
      'Completed'
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processing_history_${new Date().toISOString().slice(0,10)}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!ffmpeg) return;
    const logCb = ({ message }: { message: string }) => {
      setLogs(prev => [...prev.slice(-49), { timestamp: Date.now(), text: message }]);
    };
    ffmpeg.on('log', logCb);
    return () => {
      ffmpeg.off('log', logCb);
    };
  }, [ffmpeg]);

  useEffect(() => {
    let interval: number;
    if (isProcessing && processingStart) {
      interval = window.setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - processingStart) / 1000));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isProcessing, processingStart]);

  const totalDurationSeconds = useMemo(() => {
    return batchQueue.reduce((acc, item) => acc + parseDurationToSeconds(item.duration), 0);
  }, [batchQueue]);

  const estimatedStorage = useMemo(() => {
    return estimateSize(totalDurationSeconds, format, quality);
  }, [totalDurationSeconds, format, quality]);

  const averageDurationSeconds = useMemo(() => {
    return batchQueue.length > 0 ? totalDurationSeconds / batchQueue.length : 0;
  }, [totalDurationSeconds, batchQueue.length]);
  
  const estimatedProcessingTime = useMemo(() => {
    return totalDurationSeconds / 2; // rough estimate
  }, [totalDurationSeconds]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setSortBy('manual');
      setBatchQueue((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSort = (type: string) => {
    setSortBy(type);
    if (type === 'manual') return;
    
    setBatchQueue(prev => {
      const sorted = [...prev].sort((a, b) => {
        if (type === 'duration-asc') {
          return parseDurationToSeconds(a.duration) - parseDurationToSeconds(b.duration);
        } else if (type === 'duration-desc') {
           return parseDurationToSeconds(b.duration) - parseDurationToSeconds(a.duration);
        } else if (type === 'title-asc') {
           return a.title.localeCompare(b.title);
        } else if (type === 'title-desc') {
           return b.title.localeCompare(a.title);
        }
        return 0;
      });
      return sorted;
    });
    addToast('Queue sorted', 'info');
  };

  const handleExportConfig = () => {
    if (batchQueue.length === 0) return;
    const data = JSON.stringify(batchQueue, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ytsm-batch-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Batch configuration exported', 'success');
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json)) {
          const newItems = json.map((item: any) => ({
            ...item,
            id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: 'idle',
            progress: 0,
            downloadUrl: undefined
          }));
          setBatchQueue(prev => [...prev, ...newItems]);
          addToast('Batch configuration imported', 'success');
        } else {
          addToast('Invalid configuration format', 'error');
        }
      } catch (err) {
        console.error("Failed to parse JSON config", err);
        addToast('Failed to parse file', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleClearFinished = () => {
    const hasFinished = batchQueue.some(item => item.status === 'completed' || item.status === 'error');
    if (!hasFinished) {
      addToast('No finished items to clear', 'info');
      return;
    }
    setBatchQueue(prev => prev.filter(item => item.status !== 'completed' && item.status !== 'error'));
    addToast('Cleared finished items', 'info');
  };

  const handleShuffle = () => {
    if (batchQueue.length < 2) return;
    setBatchQueue(prev => {
      const arr = [...prev];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });
    addToast('Queue shuffled', 'info');
  };

  const handleBulkTrimApply = (start?: string, end?: string) => {
    setBatchQueue(prev => prev.map(item => ({ ...item, startTrim: start, endTrim: end })));
    setShowBulkTrim(false);
    addToast('Applied trim boundaries to all items', 'success');
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === batchQueue.length && batchQueue.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(batchQueue.map(item => item.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setBatchQueue(prev => prev.filter(item => !selectedIds.has(item.id)));
    setSelectedIds(new Set());
    addToast('Deleted selected items', 'info');
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredHistory = useMemo(() => {
    if (!historySearchQuery.trim()) return history;
    return history.filter(item => item.title.toLowerCase().includes(historySearchQuery.toLowerCase()));
  }, [history, historySearchQuery]);

  const handleIndividualProcess = async () => {
    if (!ffmpeg || batchQueue.length === 0) return;
    setIsProcessing(true);
    setProcessingStart(Date.now());
    setElapsedSeconds(0);
    setLogs([]);
    
    const updateProgress = (id: string, progress: number, status: any, downloadUrl?: string) => {
      setBatchQueue(q => q.map(item => 
        item.id === id 
          ? { ...item, progress, status, downloadUrl: downloadUrl || item.downloadUrl }
          : item
      ));
    };

    await processIndividualItems(ffmpeg, batchQueue, format, quality, normalizeAudio, updateProgress, (item, url) => {
      addToHistory({
        id: `hist-${Date.now()}-${item.id}`,
        title: item.title,
        thumbnail: item.thumbnail,
        downloadUrl: url,
        timestamp: Date.now(),
        format,
        type: 'individual'
      });
    });
    setIsProcessing(false);
    setProcessingStart(null);
    
    if (soundEnabled) {
      playNotificationFeedback();
    }
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Batch processing complete!', {
        body: `Processed ${batchQueue.length} items.`,
      });
    }
  };

  const handleConcatProcess = async () => {
    if (!ffmpeg || batchQueue.length === 0) return;
    setIsProcessing(true);
    setProcessingStart(Date.now());
    setElapsedSeconds(0);
    setLogs([]);
    
    await processConcatenation(
      ffmpeg, 
      batchQueue, 
      format, 
      quality, 
      normalizeAudio,
      setGlobalProgress, 
      (url) => { 
        console.log('Merged ready', url); 
        addToHistory({
          id: `hist-${Date.now()}`,
          title: `Merged ${batchQueue.length} videos`,
          downloadUrl: url,
          timestamp: Date.now(),
          format,
          type: 'merge'
        });
      },
      (err) => { console.error('Merged failed', err); }
    );
    
    setIsProcessing(false);
    setProcessingStart(null);
    setGlobalProgress(-1);
    
    if (soundEnabled) {
      playNotificationFeedback();
    }
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Merge complete!', {
        body: `Successfully merged items into one file.`,
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isProcessing) return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          if (batchQueue.length > 0 && !isProcessing) {
            handleIndividualProcess();
          }
        } else if (e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          if (batchQueue.length > 1 && !isProcessing) {
            handleConcatProcess();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [batchQueue, isProcessing, ffmpeg, format, quality]);

  return (
    <motion.div 
      initial={false}
      animate={{
        boxShadow: isProcessing ? ['inset 0 0 0px rgba(99, 102, 241, 0)', 'inset 0 0 40px rgba(99, 102, 241, 0.15)', 'inset 0 0 0px rgba(99, 102, 241, 0)'] : 'inset 0 0 0px rgba(99, 102, 241, 0)',
        borderColor: isProcessing ? ['rgba(255, 255, 255, 0.1)', 'rgba(99, 102, 241, 0.5)', 'rgba(255, 255, 255, 0.1)'] : 'rgba(255, 255, 255, 0.05)'
      }}
      transition={isProcessing ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
      className="w-full lg:w-[420px] xl:w-[480px] flex flex-col h-full bg-black/60 backdrop-blur-2xl shrink-0 border-l shadow-2xl relative z-20"
    >
      
      {/* Tabs / Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
          <button
            onClick={() => setActiveTab('queue')}
            className={cn("flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all", activeTab === 'queue' ? "bg-white/10 text-white font-medium shadow-sm" : "text-white/50 hover:text-white/80")}
          >
            <Layers className="w-4 h-4" />
            Queue
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] py-0.5 px-1.5 rounded-full font-mono ml-1">
              {batchQueue.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn("flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all", activeTab === 'history' ? "bg-white/10 text-white font-medium shadow-sm" : "text-white/50 hover:text-white/80")}
          >
            <History className="w-4 h-4" />
            History
            {history.length > 0 && (
              <span className="bg-white/10 text-white/70 text-[10px] py-0.5 px-1.5 rounded-full font-mono ml-1">
                {history.length}
              </span>
            )}
          </button>
        </div>
        
        {activeTab === 'queue' && (
           <div className="flex items-center gap-1 text-white/50">
             <button 
               onClick={() => fileInputRef.current?.click()}
               disabled={isProcessing}
               className="p-1.5 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50"
               title="Import Batch JSON"
             >
               <Upload className="w-4 h-4" />
             </button>
             <input 
               type="file" 
               accept=".json" 
               ref={fileInputRef} 
               className="hidden" 
               onChange={handleImportConfig} 
             />
             {batchQueue.length > 0 && (
               <>
                 <button 
                   onClick={() => setShowBulkTrim(true)}
                   disabled={isProcessing}
                   className="p-1.5 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                   title="Bulk Trim"
                 >
                   <Scissors className="w-4 h-4" />
                 </button>
                 <button 
                   onClick={handleExportConfig}
                   disabled={isProcessing}
                   className="p-1.5 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                   title="Export Batch JSON"
                 >
                   <Save className="w-4 h-4" />
                 </button>
                 <button 
                   onClick={handleShuffle}
                   disabled={isProcessing}
                   className="p-1.5 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                   title="Shuffle Queue"
                 >
                   <Shuffle className="w-4 h-4" />
                 </button>
                 <button 
                   onClick={handleClearFinished}
                   disabled={isProcessing}
                   className="p-1.5 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                   title="Clear Finished"
                 >
                   <FilterX className="w-4 h-4" />
                 </button>
                 {selectedIds.size > 0 ? (
                   <button 
                     onClick={() => {
                       if (window.confirm(`Are you sure you want to delete ${selectedIds.size} selected items?`)) {
                         handleDeleteSelected();
                       }
                     }}
                     disabled={isProcessing}
                     className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded transition-colors disabled:opacity-50"
                     title={`Delete ${selectedIds.size} Selected`}
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 ) : (
                   <button 
                     onClick={() => {
                       if (window.confirm("Are you sure you want to clear the entire queue?")) {
                         clearBatch();
                       }
                     }}
                     disabled={isProcessing}
                     className="p-1.5 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                     title="Clear Queue"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 )}
               </>
             )}
           </div>
        )}
        {activeTab === 'history' && history.length > 0 && (
          <div className="flex items-center gap-1">
            <button 
              onClick={exportHistoryCSV}
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Export History to CSV"
            >
              <Download className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to clear your download history?")) {
                  clearHistory();
                }
              }}
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Clear History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {activeTab === 'queue' ? (
        <>
          {/* Global Config Toggles */}
      <div className="p-4 border-b border-white/10 bg-black/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <Settings2 className="w-4 h-4" />
            Output Configuration
          </div>
          <button 
            onClick={() => setShowQualityGuide(!showQualityGuide)}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            Guide
          </button>
        </div>
        
        {showQualityGuide && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 text-xs text-white/80 space-y-2 overflow-hidden"
          >
            <p><strong className="text-indigo-300">High:</strong> Max quality, largest file size. Great for preservation. <span className="opacity-60 font-mono">(CRF 18 / 320k)</span></p>
            <p><strong className="text-indigo-300">Medium:</strong> Balanced quality. Recommended for everyday use. <span className="opacity-60 font-mono">(CRF 23 / 192k)</span></p>
            <p><strong className="text-indigo-300">Low:</strong> Lower quality, smallest size. Best for sharing & mobile. <span className="opacity-60 font-mono">(CRF 28 / 128k)</span></p>
            <div className="mt-2 pt-2 border-t border-indigo-500/20 flex gap-4">
               <div><strong className="text-indigo-300">MP4:</strong> Standard Video</div>
               <div><strong className="text-indigo-300">MP3:</strong> Audio</div>
               <div><strong className="text-indigo-300">WAV:</strong> Lossless</div>
            </div>
          </motion.div>
        )}
        
        <div className="flex gap-2 mb-3">
          {(['MP4', 'MP3', 'WAV'] as Format[]).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              disabled={isProcessing}
              title={
                f === 'MP4' ? "MPEG-4 Video (libx264) - Standard video format." :
                f === 'MP3' ? "MP3 Audio (libmp3lame) - Compressed audio." :
                "WAV Audio (pcm_s16le) - Lossless uncompressed audio."
              }
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded transition-colors",
                format === f 
                  ? "bg-indigo-500 text-white" 
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
              )}
            >
              <div className="flex items-center justify-center gap-1">
                {f}
                {format === f && (
                  <span className="text-[9px] px-1 py-0.5 bg-black/20 rounded-sm text-white/90">
                    .{f.toLowerCase()}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {(['High', 'Medium', 'Low'] as Quality[]).map((q) => (
            <button
               key={q}
               onClick={() => {
                 setQuality(q);
                 const guessed = guessFormatFromQuality(q);
                 if (guessed !== format) {
                   setFormat(guessed);
                   addToast(`Quality set to ${q}. Auto-switched to ${guessed} based on quality.`, 'info');
                 } else {
                   addToast(`Quality set to ${q}`, 'info');
                 }
               }}
               disabled={isProcessing}
               title={
                 q === 'High' ? "High quality, larger file size. (CRF 18 / 320k)" :
                 q === 'Medium' ? "Balanced quality and file size. (CRF 23 / 192k)" :
                 "Lower quality, smaller file size. (CRF 28 / 128k)"
               }
               className={cn(
                 "flex-1 py-1 text-xs font-medium rounded transition-colors border",
                 quality === q 
                   ? "border-indigo-500 text-indigo-300 bg-indigo-500/10" 
                   : "border-white/10 text-white/40 hover:border-white/30"
               )}
            >
              {q}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs font-medium text-white/70">Audio Normalization</span>
          <button
            onClick={() => setNormalizeAudio(!normalizeAudio)}
            disabled={isProcessing}
            title="Applies the loudnorm filter to audio to normalize volume levels."
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50",
              normalizeAudio ? "bg-indigo-500" : "bg-white/20"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                normalizeAudio ? "translate-x-4" : "translate-x-0"
              )}
            />
          </button>
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs font-medium text-white/70">Sound Notification</span>
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) {
                // Play test sound when enabled
                playNotificationFeedback();
              }
            }}
            disabled={isProcessing}
            title="Play a subtle sound and haptic feedback when batch processing is completed."
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50",
              soundEnabled ? "bg-indigo-500" : "bg-white/20"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                soundEnabled ? "translate-x-4" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </div>

      {/* Summary & Stats Panel */}
      {batchQueue.length > 0 && activeTab === 'queue' && (
        <div className="border-b border-white/10 bg-black/40 flex flex-col">
          <button 
             onClick={() => setStatsExpanded(!statsExpanded)}
             className="w-full flex items-center justify-between p-3 text-[10px] text-white/30 hover:text-white/50 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
          >
             <span>Batch Statistics</span>
             <ChevronDown className={cn("w-4 h-4 transition-transform", statsExpanded ? "rotate-180" : "")} />
          </button>
          
          <motion.div 
            initial={false}
            animate={{ height: statsExpanded ? 'auto' : 0, opacity: statsExpanded ? 1 : 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2 text-[11px] uppercase tracking-wider font-semibold text-white/40">
                <div className="flex flex-col">
              <span>Total Items</span>
              <div className="text-white/90 text-sm font-mono mt-0.5 normal-case tracking-normal">
                {batchQueue.length}
              </div>
            </div>
            
            <div className="flex flex-col">
               <span>Avg. Duration</span>
               <div className="text-white/90 text-sm font-mono mt-0.5 normal-case tracking-normal flex items-center">
                 <Clock className="w-3 h-3 mr-1 text-indigo-400/70" />
                 {formatSecondsToDuration(averageDurationSeconds)}
               </div>
            </div>

            <div className="flex flex-col">
               <span>Est. Size</span>
               <div className="text-white/90 text-sm font-mono mt-0.5 normal-case tracking-normal flex items-center">
                 <HardDrive className="w-3 h-3 mr-1 text-indigo-400/70" />
                 {estimatedStorage}
               </div>
            </div>

            <div className="flex flex-col">
               <span>{isProcessing ? 'Elapsed / Est.' : 'Est. Processing'}</span>
               <div className="text-white/90 text-sm font-mono mt-0.5 normal-case tracking-normal flex items-center">
                 <Settings2 className="w-3 h-3 mr-1 text-indigo-400/70" />
                 {isProcessing ? `${formatSecondsToDuration(elapsedSeconds)} / ` : ''}{formatSecondsToDuration(estimatedProcessingTime)}
               </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
             <span className="text-[10px] uppercase tracking-wider font-semibold text-white/40">Sort By</span>
             <select 
               value={sortBy}
               onChange={(e) => handleSort(e.target.value)}
               disabled={isProcessing}
               className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white/70 outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
             >
               <option value="manual">Manual (Drag & Drop)</option>
               <option value="duration-asc">Duration (Shortest)</option>
               <option value="duration-desc">Duration (Longest)</option>
               <option value="title-asc">Title (A-Z)</option>
               <option value="title-desc">Title (Z-A)</option>
             </select>
          </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col pt-2">
        {batchQueue.length > 0 && (
          <div className="flex items-center gap-2 mb-3 shrink-0 pl-2">
            <input 
              type="checkbox"
              checked={batchQueue.length > 0 && selectedIds.size === batchQueue.length}
              onChange={handleToggleSelectAll}
              className="w-3.5 h-3.5 rounded border-white/20 bg-black/50 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-[10px] uppercase font-semibold tracking-wider text-white/50 cursor-pointer select-none" onClick={handleToggleSelectAll}>Select All</span>
          </div>
        )}
        {batchQueue.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col items-center justify-center space-y-3"
          >
            <motion.div
              animate={{ rotate: [-2, 2, -2] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150" />
              <ListMinus className="w-12 h-12 mb-2 text-indigo-400/50 relative z-10" />
            </motion.div>
            <p className="text-sm font-medium text-white/70">Your queue is empty.</p>
            <p className="text-xs text-center max-w-[200px] leading-relaxed text-white/40">Search for videos and add them to the batch.</p>
          </motion.div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={batchQueue.map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 relative">
                {batchQueue.map((item, index) => (
                  <BatchQueueItem 
                    key={item.id} 
                    item={item} 
                    showDragTooltip={index === 0 && batchQueue.length > 1} 
                    isSelected={selectedIds.has(item.id)}
                    onToggleSelect={() => handleToggleSelect(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
      </>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-4 pt-2 border-b border-white/10 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="Search history..."
                className="w-full bg-black/50 border border-white/10 focus:border-indigo-500 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none placeholder-white/40 transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
            {filteredHistory.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-[200px] flex flex-col items-center justify-center space-y-3 mt-10"
              >
                <motion.div
                  animate={{ scale: [0.95, 1.05, 0.95] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full scale-150" />
                  <History className="w-12 h-12 mb-2 text-indigo-400/50 relative z-10" />
                </motion.div>
                <p className="text-sm font-medium text-white/70">No recent downloads found.</p>
                {historySearchQuery ? (
                  <p className="text-xs text-white/40">No items match your search.</p>
                ) : null}
              </motion.div>
            ) : (
              filteredHistory.map(item => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-lg p-3 flex gap-3 group relative overflow-hidden">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt="" className="w-16 h-9 object-cover rounded bg-black/50 shrink-0" />
                ) : (
                  <div className="w-16 h-9 rounded bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <FileVideo className="w-4 h-4 text-indigo-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-white/90 text-sm font-medium truncate pr-6">{item.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-white/40">{new Date(item.timestamp).toLocaleTimeString()}</span>
                    <span className="text-[10px] bg-white/10 px-1.5 rounded text-white/60">{item.format}</span>
                    {item.type === 'merge' && <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 rounded">Merged</span>}
                  </div>
                </div>
                <a 
                  href={item.downloadUrl}
                  download={`download-${item.id}.${item.format.toLowerCase()}`}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-500 hover:bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 transition-all text-white shadow-lg"
                  title="Download Again"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))
          )}
        </div>
        </div>
      )}

      {/* Adsterra Slot */}
      <div className="p-4 border-t border-white/5 flex justify-center bg-black/20">
        <AdBanner type="300x250" />
      </div>

      {/* Action Center */}
      {activeTab === 'queue' && (
      <div className="p-4 border-t border-white/10 bg-slate-900 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        
        <div className="flex justify-between items-center mb-3">
          {loadingError ? (
            <div className="flex-1 mr-2 p-2 bg-rose-500/10 text-rose-400 text-xs rounded border border-rose-500/20">
              {loadingError}
            </div>
          ) : <div />}
          <button 
             onClick={() => setShowLogs(!showLogs)} 
             className="text-[10px] text-indigo-400 px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 transition-all font-mono">
             {showLogs ? 'Hide Console' : 'Show Console'}
          </button>
        </div>

        {showLogs && (
          <div className="mb-3 h-32 bg-black/60 rounded border border-white/10 overflow-y-auto p-2 font-mono text-[10px] text-green-400 custom-scrollbar flex flex-col-reverse">
             {logs.length === 0 ? <span className="opacity-50">Ready...</span> : logs.slice().reverse().map((log, i) => (
                <div key={i} className="break-all">{log.text}</div>
             ))}
          </div>
        )}

        {globalProgress >= 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-indigo-300 mb-1">
              <span>Merging files...</span>
              <span>{globalProgress}%</span>
            </div>
            <div className="h-1.5 w-full bg-indigo-950 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${globalProgress}%` }} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleIndividualProcess}
            disabled={!loaded || batchQueue.length === 0 || isProcessing}
            className="flex flex-col items-center justify-center py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isProcessing && globalProgress === -1 ? (
              <Loader2 className="w-5 h-5 mb-1 text-indigo-400 auto-spin animate-spin" />
            ) : (
              <Download className="w-5 h-5 mb-1 text-indigo-400 group-hover:scale-110 transition-transform" />
            )}
            <span className="text-sm font-medium">Batch Download</span>
            <span className="text-[10px] text-white/40 mt-0.5">Individual Files</span>
          </button>

          <button
            onClick={handleConcatProcess}
            disabled={!loaded || batchQueue.length < 2 || isProcessing}
            className="flex flex-col items-center justify-center py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isProcessing && globalProgress >= 0 ? (
              <Loader2 className="w-5 h-5 mb-1 auto-spin animate-spin" />
            ) : (
              <Layers className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
            )}
            <span className="text-sm font-medium">Merge Data</span>
            <span className="text-[10px] text-white/70 mt-0.5">Single Output</span>
          </button>
        </div>
      </div>
      )}
      
      {showBulkTrim && (
        <BulkTrimModal 
          onClose={() => setShowBulkTrim(false)}
          onSave={handleBulkTrimApply}
        />
      )}
    </motion.div>
  );
}
