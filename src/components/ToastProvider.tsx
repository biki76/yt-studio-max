import React, { createContext, useContext, useState, ReactNode } from 'react';

type Toast = { id: string; message: string; type?: 'success' | 'info' | 'error' };

interface ToastContextType {
  addToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 left-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className={`px-4 py-3 rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.5)] text-sm text-white font-medium border transition-all duration-300 ${toast.type === 'error' ? 'bg-rose-500 border-rose-400/20' : toast.type === 'success' ? 'bg-emerald-500 border-emerald-400/20' : 'bg-slate-800 border-white/10'}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};
