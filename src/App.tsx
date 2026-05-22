import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Youtube, Disc, Loader2, Palette, BookOpen } from 'lucide-react';
import { AppProvider, useAppContext } from './store/AppContext';
import { BatchQueueSidebar } from './components/BatchQueueSidebar';
import { SearchResult } from './components/SearchResult';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { AdBanner } from './components/AdBanner';
import { searchYouTube } from './lib/utils';
import { VideoResult } from './types';
import { SummaryDashboard } from './components/SummaryDashboard';
import { UserManual } from './components/UserManual';

import { ToastProvider } from './components/ToastProvider';

function Dashboard() {
  const { theme, setTheme } = useAppContext();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<VideoResult[]>([]);
  const [previewVideo, setPreviewVideo] = useState<VideoResult | null>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const [showUserManual, setShowUserManual] = useState(false);

  const tips = [
    "Quick Tip: Press Ctrl + Enter to quickly search.",
    "Quick Tip: Press Ctrl + B to start Batch Processing.",
    "Quick Tip: Press Ctrl + M to Merge all queued videos.",
    "Quick Tip: Drag and drop items in the queue to reorder them.",
    "Quick Tip: Use the bulk trim tool (✂️) to apply cuts to all videos."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter to search
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!isSearching && query.trim()) {
          const form = document.getElementById('search-form');
          if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [query, isSearching]);

  const handleSearch = async (e: React.FormEvent | Event) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    const res = await searchYouTube(query);
    setResults(res);
    setIsSearching(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-black text-white overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black">
        
        {/* Header Search */}
        <header className="p-6 pb-2 border-b border-white/5 relative z-10 shrink-0">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
                <Youtube className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold tracking-tight text-white leading-none">
                  YouTube Studio Max
                </h1>
                <span className="text-[10px] font-semibold text-indigo-400/80 mt-1.5 uppercase tracking-widest">
                  Crafted by Biki Akram ✨
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowUserManual(true)}
                className="flex items-center justify-center px-3 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 transition-all font-semibold text-xs"
                title="Open Help manual"
              >
                <BookOpen className="w-4 h-4 mr-1.5" />
                User Manual
              </button>
              <button 
                onClick={() => setTheme(theme === 'minimalist-light' ? 'deep-space' : 'minimalist-light')} 
                className="flex items-center justify-center p-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 transition-all font-semibold text-xs"
                title="Toggle Light/Dark Theme"
              >
                <Palette className="w-4 h-4 mr-1.5" />
                {theme === 'minimalist-light' ? 'Dark Mode' : 'Light Mode'}
              </button>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20 hidden sm:flex">
                <Disc className="w-3.5 h-3.5" />
                WASM Engine Active
              </a>
            </div>
          </div>

          <form id="search-form" onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-white/40" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl py-4 pl-12 pr-32 text-base text-white placeholder-white/30 transition-all backdrop-blur-md outline-none"
              placeholder="Search or paste YouTube URL..."
            />
            <button 
              type="submit"
              disabled={isSearching || !query.trim()}
              className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 rounded-xl font-medium transition-all shadow-md flex items-center disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </form>
        </header>

        {/* Results Area */}
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
          <SummaryDashboard />
          {results.length === 0 && !isSearching && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="h-full flex flex-col items-center justify-center"
            >
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150" />
                <Youtube className="w-24 h-24 mb-6 text-indigo-500/50 relative z-10" />
              </motion.div>
              <p className="text-lg font-medium text-white/70">Search to build your queue</p>
              <p className="text-sm mt-2 max-w-sm text-center leading-relaxed text-white/40">
                Add videos to your batch list, reorder them, convert formats, or merge them entirely in your browser using secure WebAssembly.
              </p>
              
              <div className="mt-8 px-4 py-3 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 min-w-[300px] text-center">
                <motion.p 
                  key={tipIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-[13px] font-medium text-indigo-400"
                >
                  <span className="opacity-70 mr-2">✨</span>
                  {tips[tipIndex]}
                </motion.p>
              </div>
            </motion.div>
          )}

          {results.length > 0 && (
            <div className="max-w-7xl mx-auto">
              {/* Top Banner Ad */}
              <div className="mb-8 hidden md:block">
                <AdBanner type="728x90" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-24">
                {results.map((v) => (
                  <SearchResult key={v.id} video={v} onPlayPreview={setPreviewVideo} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Sidebar */}
      <BatchQueueSidebar />

      {/* Modals */}
      {previewVideo && (
         <VideoPlayerModal video={previewVideo} onClose={() => setPreviewVideo(null)} />
      )}
      
      <UserManual isOpen={showUserManual} onClose={() => setShowUserManual(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <Dashboard />
      </AppProvider>
    </ToastProvider>
  );
}
