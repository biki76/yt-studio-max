import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Search, Youtube, Disc, Loader2, Palette, BookOpen, Twitch, Music, Video, Radio, X, Lock, ExternalLink, Play } from 'lucide-react';
import { AppProvider, useAppContext } from './store/AppContext';
import { BatchQueueSidebar } from './components/BatchQueueSidebar';
import { SearchResult } from './components/SearchResult';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { AdBanner } from './components/AdBanner';
import { searchYouTube } from './lib/utils';
import { VideoResult } from './types';
import { UserManual } from './components/UserManual';
import { PlatformFeed } from './components/PlatformFeed';

import { ToastProvider } from './components/ToastProvider';

function Dashboard() {
  const { theme, setTheme, hoverAutoplay, setHoverAutoplay } = useAppContext();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<VideoResult[]>([]);
  const [searchSources, setSearchSources] = useState<string[]>(['youtube']);
  const [previewVideo, setPreviewVideo] = useState<VideoResult | null>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const [showUserManual, setShowUserManual] = useState(false);
  const [activePlatformFeed, setActivePlatformFeed] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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
    const res = await searchYouTube(query, searchSources);
    setResults(res);
    setIsSearching(false);
    
    // Smooth scroll to top of results grid after a brief delay for rendering
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen bg-black text-white lg:overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200 overflow-y-auto">
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 lg:h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-black to-black min-w-0">
        {activePlatformFeed ? (
          <PlatformFeed
            platform={activePlatformFeed}
            onClose={() => setActivePlatformFeed(null)}
            onPreview={setPreviewVideo}
          />
        ) : (
          <>
            {/* Header Search */}
            <header className="px-8 py-5 border-b border-white/5 relative z-10 shrink-0 backdrop-blur-md bg-black/40">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 group cursor-pointer transition-all">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20 ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-300">
                <Youtube className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight text-white leading-none mb-1">
                  Studio Max
                </h1>
                <span className="text-xs font-semibold text-indigo-400/80 uppercase tracking-widest flex items-center gap-1.5 hover:text-indigo-300 transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  Media Operations Workspace
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowUserManual(true)}
                className="flex items-center justify-center px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all font-medium text-sm"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Manual
              </button>
              <button 
                onClick={() => setHoverAutoplay(!hoverAutoplay)}
                className={`flex items-center justify-center p-2.5 rounded-full border transition-all font-medium ${hoverAutoplay ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-300' : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80'}`}
                title={hoverAutoplay ? "Hover Autoplay: ON" : "Hover Autoplay: OFF"}
              >
                <div className="relative">
                  <Play className="w-4 h-4" />
                  {!hoverAutoplay && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-[20px] h-[2px] bg-white/80 rotate-45" />
                    </div>
                  )}
                </div>
              </button>
              <button 
                onClick={() => setTheme(theme === 'minimalist-light' ? 'deep-space' : 'minimalist-light')} 
                className="flex items-center justify-center p-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all font-medium"
                title="Toggle Theme"
              >
                <Palette className="w-4 h-4" />
              </button>
            </div>
          </div>

          <form id="search-form" onSubmit={handleSearch} className="relative max-w-3xl mx-auto transform transition-all hover:scale-[1.01] flex flex-col gap-3">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-indigo-400" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 rounded-2xl py-4 flex-1 pl-14 pr-36 text-lg text-white placeholder-white/40 transition-all backdrop-blur-md outline-none"
                placeholder="Search across platforms or paste a link..."
              />
              <button 
                type="submit"
                disabled={isSearching || !query.trim()}
                className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 rounded-xl font-medium transition-all shadow-md shadow-indigo-500/20 flex items-center disabled:opacity-50 disabled:cursor-not-allowed group z-10"
              >
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="group-hover:translate-x-0.5 transition-transform">Search</span>}
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-6 mt-2 text-sm text-white/70">
              <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                <input 
                  type="checkbox" 
                  checked={searchSources.includes('youtube')} 
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSearchSources([...searchSources, 'youtube']);
                    } else if (searchSources.length > 1) {
                      setSearchSources(searchSources.filter(s => s !== 'youtube'));
                    }
                  }} 
                  className="rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500/50"
                />
                <Youtube className="w-4 h-4" /> YouTube
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                <input 
                  type="checkbox" 
                  checked={searchSources.includes('vimeo')} 
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSearchSources([...searchSources, 'vimeo']);
                    } else if (searchSources.length > 1) {
                      setSearchSources(searchSources.filter(s => s !== 'vimeo'));
                    }
                  }} 
                  className="rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500/50"
                />
                <Video className="w-4 h-4" /> Vimeo
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                <input 
                  type="checkbox" 
                  checked={searchSources.includes('twitch')} 
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSearchSources([...searchSources, 'twitch']);
                    } else if (searchSources.length > 1) {
                      setSearchSources(searchSources.filter(s => s !== 'twitch'));
                    }
                  }} 
                  className="rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500/50"
                />
                <Twitch className="w-4 h-4" /> Twitch
              </label>
            </div>
          </form>

          {/* Supported Platforms */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <button 
              type="button"
              onClick={() => setActivePlatformFeed('youtube')}
              className="flex items-center gap-2 transition-all opacity-70 hover:opacity-100 text-white/90 hover:text-white"
              title="Open YouTube Feed"
            >
              <Youtube className="w-5 h-5" />
              <span className="text-sm font-medium">YouTube</span>
            </button>
            <button 
              type="button"
              onClick={() => setActivePlatformFeed('twitch')}
              className="flex items-center gap-2 transition-all opacity-70 hover:opacity-100 text-white/90 hover:text-white"
              title="Open Twitch Feed"
            >
              <Twitch className="w-5 h-5" />
              <span className="text-sm font-medium">Twitch</span>
            </button>
            <button 
              type="button"
              onClick={() => setActivePlatformFeed('soundcloud')}
              className="flex items-center gap-2 transition-all opacity-70 hover:opacity-100 text-white/90 hover:text-white"
              title="Open SoundCloud Feed"
            >
              <Music className="w-5 h-5" />
              <span className="text-sm font-medium">SoundCloud</span>
            </button>
            <button 
              type="button"
              onClick={() => setActivePlatformFeed('vimeo')}
              className="flex items-center gap-2 transition-all opacity-70 hover:opacity-100 text-white/90 hover:text-white"
              title="Open Vimeo Feed"
            >
              <Video className="w-5 h-5" />
              <span className="text-sm font-medium">Vimeo</span>
            </button>
            <button 
              type="button"
              onClick={() => setActivePlatformFeed('radio')}
              className="flex items-center gap-2 transition-all opacity-70 hover:opacity-100 text-white/90 hover:text-white"
              title="Open Live Radio Feed"
            >
              <Radio className="w-5 h-5" />
              <span className="text-sm font-medium">Live Radio</span>
            </button>
          </div>
        </header>

        {/* Results Area */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          {results.length === 0 && !isSearching && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="h-full flex flex-col items-center justify-center py-20"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-indigo-600/20 blur-3xl rounded-full scale-150" />
                <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center relative z-10 shadow-2xl backdrop-blur-sm">
                  <Search className="w-10 h-10 text-indigo-400/80" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-white mb-3 tracking-tight">What do you want to create?</h2>
              <p className="text-base max-w-md text-center leading-relaxed text-white/50 mb-10">
                Search for any YouTube video to add it to your processing queue. You can trim, convert, and merge them all within your browser.
              </p>
              
              <div className="px-5 py-3.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 max-w-sm text-center backdrop-blur-md shadow-xl">
                <motion.div 
                  key={tipIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center justify-center gap-2"
                >
                  <span className="text-xl">✨</span>
                  <p className="text-sm font-medium text-indigo-300">
                    {tips[tipIndex]}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}

              {results.length > 0 && (
                <div ref={resultsRef} className="max-w-[1600px] mx-auto pt-8">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white/90">Search Results</h3>
                    <span className="text-sm text-white/50">{results.length} found</span>
                  </div>
                  
                  <div className="mb-8 hidden md:block">
                    <AdBanner type="728x90" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 pb-24">
                    {results.map((v) => (
                      <SearchResult key={v.id} video={v} onPlayPreview={setPreviewVideo} />
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-8 text-center pb-8 opacity-30 hover:opacity-100 transition-opacity text-xs tracking-wider flex flex-col items-center gap-1">
                <div>Crafted by <a href="https://www.facebook.com/biki76" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Biki Akram</a></div>
                <div className="text-[10px] font-mono opacity-50">craftedSpeciallyForShimanto&Rabbi</div>
              </div>
            </main>
          </>
          )}
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
