'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextProps {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = (message: string, type: ToastType, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const remove = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const success = (msg: string, dur?: number) => show(msg, 'success', dur);
  const error = (msg: string, dur?: number) => show(msg, 'error', dur);
  const warning = (msg: string, dur?: number) => show(msg, 'warning', dur);
  const info = (msg: string, dur?: number) => show(msg, 'info', dur);

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}
      {/* Toast Portal Container matching reference position */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none w-80">
        {toasts.map(toast => (
          <ToastCard key={toast.id} toast={toast} onClose={() => remove(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const { message, type, duration = 4000 } = toast;
  const [progressWidth, setProgressWidth] = useState(100);

  // Set up progress bar decrement & auto-dismiss
  useEffect(() => {
    const startTime = Date.now();
    const intervalTime = 40; // ~25 fps
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgressWidth(remaining);
      if (elapsed >= duration) {
        clearInterval(timer);
        onClose();
      }
    }, intervalTime);

    return () => {
      clearInterval(timer);
    };
  }, [duration, onClose]);

  let icon = <Lucide.Info className="w-5 h-5 text-blue-500 shrink-0" />;
  let progressBarColor = 'bg-blue-500';

  if (type === 'success') {
    icon = <Lucide.CheckCircle className="w-5 h-5 text-green-500 shrink-0" />;
    progressBarColor = 'bg-green-500';
  } else if (type === 'error') {
    icon = <Lucide.AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />;
    progressBarColor = 'bg-red-500';
  } else if (type === 'warning') {
    icon = <Lucide.AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />;
    progressBarColor = 'bg-amber-500';
  }

  return (
    <div
      className="w-full bg-white rounded-xl shadow-lg border border-slate-100 flex p-4 relative overflow-hidden pointer-events-auto animate-slide-in-right"
      role="alert"
    >
      <div className="flex gap-3 items-start pr-4 w-full select-none">
        {icon}
        <div className="text-xs font-semibold text-slate-700 leading-snug break-words">
          {message}
        </div>
      </div>
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
        aria-label="Dismiss toast"
      >
        <Lucide.X className="w-3.5 h-3.5" />
      </button>

      {/* Progress Bar */}
      <div
        className={`absolute bottom-0 left-0 h-1 transition-all duration-100 ease-out ${progressBarColor}`}
        style={{ width: `${progressWidth}%` }}
      />
    </div>
  );
}
