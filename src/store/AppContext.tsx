import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BatchItem, Format, Quality, VideoResult, HistoryItem } from '../types';
import { useToast } from '../components/ToastProvider';

interface AppContextType {
  batchQueue: BatchItem[];
  setBatchQueue: React.Dispatch<React.SetStateAction<BatchItem[]>>;
  addToBatch: (video: VideoResult) => void;
  removeFromBatch: (id: string) => void;
  updateBatchItem: (id: string, updates: Partial<BatchItem>) => void;
  clearBatch: () => void;
  history: HistoryItem[];
  addToHistory: (item: HistoryItem) => void;
  clearHistory: () => void;
  format: Format;
  setFormat: (f: Format) => void;
  quality: Quality;
  setQuality: (q: Quality) => void;
  theme: 'deep-space' | 'midnight-indigo' | 'minimalist-light';
  setTheme: (t: 'deep-space' | 'midnight-indigo' | 'minimalist-light') => void;
  normalizeAudio: boolean;
  setNormalizeAudio: (n: boolean) => void;
  hoverAutoplay: boolean;
  setHoverAutoplay: (s: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (s: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { addToast } = useToast();
  const [batchQueue, setBatchQueue] = useState<BatchItem[]>(() => {
    try {
      const saved = localStorage.getItem('ytsm_batch');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('ytsm_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  const [format, setFormat] = useState<Format>('MP4');
  const [quality, setQuality] = useState<Quality>('Medium');
  const [normalizeAudio, setNormalizeAudio] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ytsm_normalize');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return false;
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ytsm_sound');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return true;
  });
  const [theme, setTheme] = useState<'deep-space' | 'midnight-indigo' | 'minimalist-light'>(() => {
    try {
      const saved = localStorage.getItem('ytsm_theme');
      if (saved) return saved as 'deep-space' | 'midnight-indigo' | 'minimalist-light';
    } catch (e) {}
    return 'deep-space';
  });

  const [hoverAutoplay, setHoverAutoplay] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ytsm_hoverAutoplay');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return false;
  });

  useEffect(() => {
    localStorage.setItem('ytsm_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('ytsm_hoverAutoplay', JSON.stringify(hoverAutoplay));
  }, [hoverAutoplay]);

  useEffect(() => {
    localStorage.setItem('ytsm_batch', JSON.stringify(batchQueue));
  }, [batchQueue]);

  useEffect(() => {
    localStorage.setItem('ytsm_normalize', JSON.stringify(normalizeAudio));
  }, [normalizeAudio]);

  useEffect(() => {
    localStorage.setItem('ytsm_sound', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('ytsm_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const addToHistory = (item: HistoryItem) => {
    setHistory((prev) => [item, ...prev].slice(0, 30));
  };

  const clearHistory = () => {
    setHistory([]);
    addToast('History cleared', 'info');
  };

  const addToBatch = (video: VideoResult) => {
    setBatchQueue((prev) => [
      ...prev,
      {
        id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        videoId: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        duration: video.duration,
        status: 'idle',
        progress: 0,
        videoUrl: video.videoUrl,
      },
    ]);
    addToast(`Added "${video.title}" to batch`, 'success');
  };

  const removeFromBatch = (id: string) => {
    setBatchQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const updateBatchItem = (id: string, updates: Partial<BatchItem>) => {
    setBatchQueue((prev) => prev.map((item) => item.id === id ? { ...item, ...updates } : item));
  };

  const clearBatch = () => {
    setBatchQueue([]);
    addToast('Batch queue cleared', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        batchQueue,
        setBatchQueue,
        addToBatch,
        removeFromBatch,
        updateBatchItem,
        clearBatch,
        history,
        addToHistory,
        clearHistory,
        format,
        setFormat,
        quality,
        setQuality,
        normalizeAudio,
        setNormalizeAudio,
        hoverAutoplay,
        setHoverAutoplay,
        soundEnabled,
        setSoundEnabled,
        theme,
        setTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
