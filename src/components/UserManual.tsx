import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, BookOpen, Search, HelpCircle, 
  Settings2, Keyboard, Play, History, 
  Music, Sparkles, RefreshCw, Terminal, 
  FileVideo, HardDrive, Bell 
} from 'lucide-react';

interface ManualSection {
  id: string;
  category: 'getting-started' | 'editing' | 'advanced' | 'shortcuts';
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

export function UserManual({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSectionId, setActiveSectionId] = useState<string>('intro');

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'editing', label: 'Processing & Trimming' },
    { id: 'advanced', label: 'Advanced Features' },
    { id: 'shortcuts', label: 'Shortcuts & Tips' },
  ];

  const sections: ManualSection[] = [
    {
      id: 'intro',
      category: 'getting-started',
      icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
      title: 'Welcome to YouTube Studio Max',
      subtitle: 'In-browser high-performance media transcoding station',
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed text-sm text-white/80">
            YouTube Studio Max is a powerful full-service media studio executing directly in your modern web browser. Powered by <strong>WebAssembly (WASM) and FFmpeg</strong>, files are processed safely on your machine with absolutely no server overhead or privacy leaks.
          </p>
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-2">
            <h4 className="text-sm font-semibold text-indigo-300 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4" /> Why Local Processing?
            </h4>
            <p className="text-xs text-white/70 leading-relaxed">
              traditional converters upload your video to slow, external clouds. YouTube Studio Max downloads the video stream and executes the conversion inside your sandboxed browser thread. Fast, private, and fully offline-cable!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'search-queue',
      category: 'getting-started',
      icon: <Search className="w-4 h-4 text-sky-400" />,
      title: 'Adding Media to the Queue',
      subtitle: 'Start building a custom playlist for batch processing',
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed text-sm text-white/80">
            You can build batch conversion queues by searching or pasting links:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-xs text-white/70">
            <li>Type keywords or paste an absolute video link in the main <strong>Search input field</strong> at the center of the dashboard.</li>
            <li>Click <strong>Search</strong> (or hit <kbd className="bg-white/10 px-1 py-0.5 rounded font-mono text-[10px]">Ctrl+Enter</kbd>).</li>
            <li>In the search results card, press the <strong className="text-indigo-300">+ Queue</strong> button to import it directly to your sidequeue.</li>
          </ol>
          <p className="text-xs text-white/50 leading-relaxed italic">
            Tip: You can queue up to 50 videos concurrently, then customize each conversion's format or clip range individually!
          </p>
        </div>
      )
    },
    {
      id: 'trimming',
      category: 'editing',
      icon: <FileVideo className="w-4 h-4 text-emerald-400" />,
      title: 'Trimming & Clip Boundaries',
      subtitle: 'Specify start/end timestamps to segment media files',
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed text-sm text-white/80">
            Keep only the crucial sections of a media file by configuring precise cropping parameters:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
              <strong className="text-emerald-300 block mb-1">Individual Trimming</strong>
              Press the scissors <kbd className="font-mono text-emerald-300">✂️</kbd> icon next to any queued item to open the crop timeline modal. Key in custom start (e.g., <code className="text-slate-300">00:01:30</code>) and end times.
            </div>
            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
              <strong className="text-emerald-300 block mb-1">Bulk Trim Application</strong>
              Click the bulk crop icon on the top tools rail of the sidebar. You can instantly force the defined trim times onto all current items in the queue.
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'id3-metadata',
      category: 'editing',
      icon: <Music className="w-4 h-4 text-pink-400" />,
      title: 'ID3 Audio Metadata Editing',
      subtitle: 'Apply beautiful tags for MP3 and WAV conversions',
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed text-sm text-white/80">
            When converting video resources to audio formats (<strong>MP3</strong> or <strong>WAV</strong>), you can inject appropriate metadata so that car stereos, smartphone players, and music players organize files seamlessly.
          </p>
          <div className="p-3 bg-pink-500/5 border border-pink-500/10 rounded-xl space-y-2">
            <p className="text-xs text-white/80">
              In any queued item, click the music <strong className="text-pink-300">🎵</strong> icon to open the <strong>ID3 Edit Tags</strong> overlay. Change the input fields:
            </p>
            <ul className="list-disc pl-5 text-[11px] text-white/60 space-y-1">
              <li><strong>Track Title</strong>: Sets the tag title (affects player banner).</li>
              <li><strong>Artist/Creator</strong>: Sets the tag designer.</li>
            </ul>
            <p className="text-[11px] text-white/50 italic">
              Once written, the downloaded audio file automatically adopts the metadata structure and names the exported file as "{'{Artist} - {Title}.mp3'}"!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'quality-config',
      category: 'advanced',
      icon: <Settings2 className="w-4 h-4 text-purple-400" />,
      title: 'Target Quality & Format Selector',
      subtitle: 'Differentiating video and audio format options',
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed text-sm text-white/80">
            Our optimized FFmpeg engine provides two main settings in the sidebar setup panel:
          </p>
          <div className="space-y-3 font-sans text-xs">
            <div className="flex gap-2 items-start">
              <div className="bg-indigo-500/20 px-2 py-0.5 rounded font-bold text-indigo-300">MP4</div>
              <div>
                <p className="font-semibold text-white/90">Standard H.264 Video</p>
                <p className="text-white/60">Delivers high-compatibility compressed output videos playable on almost all hardware and streaming platform.</p>
              </div>
            </div>
            <div className="flex gap-2 items-start">
              <div className="bg-emerald-500/20 px-2 py-0.5 rounded font-bold text-emerald-300">MP3</div>
              <div>
                <p className="font-semibold text-white/90">LAME Encoded Audio Extraction</p>
                <p className="text-white/60">Discards the video frames completely, outputting extremely lightweight audio tracks suitable for audiobooks, podcasts, or music players.</p>
              </div>
            </div>
            <div className="flex gap-2 items-start">
              <div className="bg-amber-500/20 px-2 py-0.5 rounded font-bold text-amber-300">WAV</div>
              <div>
                <p className="font-semibold text-white/90">Lossless Raw PCM Audio</p>
                <p className="text-white/60">Maintains peak sound fidelity without loss of frequency, yielding larger raw files best for sound development or DJ sets.</p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl text-xs space-y-1 border border-white/5">
            <p className="font-semibold text-white/80">Bitrate & Quality Levels:</p>
            <ul className="list-disc pl-4 text-white/60 space-y-1 text-[11px]">
              <li><strong>High</strong>: Maximizes output clarity (CRF 18 for video, 320kbps for audio). Ideal for high-end setups.</li>
              <li><strong>Medium</strong>: The recommended standard (CRF 23 for video, 192kbps for audio). Best visual-to-size sweetspot.</li>
              <li><strong>Low</strong>: Heavily compressed (CRF 28 for video, 128kbps for audio). Perfect for conserving mobile mobile storage bandwidth.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'advanced-recovery',
      category: 'advanced',
      icon: <RefreshCw className="w-4 h-4 text-amber-400" />,
      title: 'Auto-Retry & Log Console',
      subtitle: 'How YouTube Studio Max handles stream processing issues',
      content: (
        <div className="space-y-4 animate-fadeIn">
          <p className="leading-relaxed text-sm text-white/80">
            Media conversion can occasionally face errors due to network glitches or complex container encoding. The app is equipped with production-grade mitigation modules:
          </p>
          <div className="space-y-3 text-xs leading-relaxed">
            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
              <strong className="text-amber-300 block mb-1">🔁 3x Exponential Backoff Retry</strong>
              If an item fails during batch rendering, the processing thread will automatically wait and attempt to transcode it up to three times, backing off longer each time (e.g., waiting 2s, 4s, 8s) before finalizing the item as "error".
            </div>
            
            <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg">
              <strong className="text-indigo-300 block mb-1">📟 Live FFmpeg Webassembly Console Logs</strong>
              To inspect precisely what is happening under the hood (such as frames processed, bitrates, or codec parameters), click <strong>Show Console</strong> in the side action panel to watch real-time transcode feedback streams.
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'desktop-notifications',
      category: 'advanced',
      icon: <Bell className="w-4 h-4 text-indigo-400" />,
      title: 'Desktop Background Alerts',
      subtitle: 'Stay notified on completion without watching the screen',
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed text-sm text-white/80">
            Transcoding large batches can take several minutes. You can safely switch tabs, read emails, or browse the web in other windows:
          </p>
          <ul className="list-disc pl-5 text-xs text-white/70 space-y-2">
            <li>When you first boot up the page, the app bids for standard <strong>system alert notification privileges</strong>.</li>
            <li>As soon as a batch queue completes (or individual merges are finalized), your operating system will trigger an ambient <strong>desktop push alert</strong> to notify you.</li>
          </ul>
          <p className="text-xs text-white/40 italic">
            Note: If you blocked indicators previously, simply tap the padlock icon on your browser URL bar to turn notifications back on.
          </p>
        </div>
      )
    },
    {
      id: 'shortcuts',
      category: 'shortcuts',
      icon: <Keyboard className="w-4 h-4 text-yellow-400" />,
      title: 'Power-User Keyboard Shortcuts',
      subtitle: 'Accelerate your media transcoding workflow',
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed text-sm text-white/80">
            Work hands-on, ultra-fast without touching the trackpad by mastering these system hotkeys:
          </p>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center bg-white/5 hover:bg-white/10 px-4 py-2 border border-white/5 rounded-lg text-xs transition-colors">
              <span className="text-white/80 font-medium">Instantly submit YouTube searches</span>
              <kbd className="bg-slate-800 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded font-mono font-bold text-[11px] shadow-sm">Ctrl + Enter</kbd>
            </div>
            <div className="flex justify-between items-center bg-white/5 hover:bg-white/10 px-4 py-2 border border-white/5 rounded-lg text-xs transition-colors">
              <span className="text-white/80 font-medium">Kickoff batch processing immediately</span>
              <kbd className="bg-slate-800 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded font-mono font-bold text-[11px] shadow-sm">Ctrl + B</kbd>
            </div>
            <div className="flex justify-between items-center bg-white/5 hover:bg-white/10 px-4 py-2 border border-white/5 rounded-lg text-xs transition-colors">
              <span className="text-white/80 font-medium">Merge/Concatenate all files in queue</span>
              <kbd className="bg-slate-800 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded font-mono font-bold text-[11px] shadow-sm">Ctrl + M</kbd>
            </div>
            <div className="flex justify-between items-center bg-white/5 hover:bg-white/10 px-4 py-2 border border-white/5 rounded-lg text-xs transition-colors">
              <span className="text-white/80 font-medium">Reorder files in realtime</span>
              <span className="text-white/40 text-[11px] font-mono select-none">Drag & Drop Handlers ☰</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  const filteredSections = useMemo(() => {
    return sections.filter(section => {
      // Category filter
      if (activeCategory !== 'all' && section.category !== activeCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          section.title.toLowerCase().includes(query) ||
          section.subtitle.toLowerCase().includes(query) ||
          section.id.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  const selectedSection = useMemo(() => {
    return sections.find(s => s.id === activeSectionId) || sections[0];
  }, [activeSectionId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-slate-950 border border-white/10 rounded-2xl w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 bg-black/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  User Studio Guide & Walkthrough
                </h2>
                <p className="text-xs text-white/40">Learn tips, settings details, and how to utilize keyboard hotkeys</p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 text-white/50 hover:text-white rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Categories Bar */}
          <div className="p-4 bg-black/20 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
            <div className="flex flex-wrap gap-1 w-full md:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    // Automatically click on the first visible item in this category if available
                    const firstInCat = sections.find(s => cat.id === 'all' || s.category === cat.id);
                    if (firstInCat) {
                      setActiveSectionId(firstInCat.id);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeCategory === cat.id 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72 shrink-0">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search guide topics..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-500 focus:outline-none rounded-xl py-1.5 pl-9 pr-4 text-xs text-white placeholder-white/30 transition-all font-sans"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/40 hover:text-white bg-white/10 rounded px-1"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Core Body */}
          <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-900/50">
            {/* Left Nav */}
            <div className="w-full md:w-80 border-r border-white/10 overflow-y-auto p-3 space-y-1 custom-scrollbar bg-black/20 shrink-0">
              <div className="text-[10px] uppercase font-bold text-white/30 tracking-widest px-3 mb-2">Available Chapters</div>
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-all relative ${
                    activeSectionId === section.id 
                    ? 'bg-white/5 border-l-2 border-indigo-500 text-white' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {section.icon}
                  </div>
                  <div className="min-w-0 pr-1">
                    <div className="text-xs font-semibold truncate">{section.title}</div>
                    <div className="text-[10px] text-white/40 truncate mt-0.5">{section.subtitle}</div>
                  </div>
                </button>
              ))}

              {filteredSections.length === 0 && (
                <div className="p-6 text-center text-xs text-white/30">
                  <HelpCircle className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  No matching chapters helper found
                </div>
              )}
            </div>

            {/* Right Topic Viewer */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedSection.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6 max-w-2xl"
                >
                  <div className="pb-4 border-b border-white/10 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                      {selectedSection.icon}
                      Chapter Topic Guide
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">{selectedSection.title}</h3>
                    <p className="text-xs text-white/50">{selectedSection.subtitle}</p>
                  </div>

                  <div className="text-white/80 selection:bg-indigo-500/40">
                    {selectedSection.content}
                  </div>

                  {/* Quick Walkthrough Navigation Action */}
                  <div className="pt-6 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                    <div>
                      Read carefully &bull; Secure Browser-side Transcoding
                    </div>
                    <div className="flex gap-2">
                      {sections.findIndex(s => s.id === selectedSection.id) > 0 && (
                        <button 
                          onClick={() => {
                            const idx = sections.findIndex(s => s.id === selectedSection.id);
                            setActiveSectionId(sections[idx - 1].id);
                          }}
                          className="px-2.5 py-1 bg-white/5 rounded hover:bg-white/10 text-white/80 transition-colors"
                        >
                          &larr; Prev
                        </button>
                      )}
                      
                      {sections.findIndex(s => s.id === selectedSection.id) < sections.length - 1 && (
                        <button 
                          onClick={() => {
                            const idx = sections.findIndex(s => s.id === selectedSection.id);
                            setActiveSectionId(sections[idx + 1].id);
                          }}
                          className="px-2.5 py-1 bg-indigo-600 rounded text-white font-medium hover:bg-indigo-500 transition-colors"
                        >
                          Next &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-950 border-t border-white/10 text-center shrink-0">
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">
              YouTube Studio Max &bull; Powered by FFmpeg.wasm &bull; Stable Sandbox Environment
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
