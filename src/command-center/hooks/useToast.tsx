import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Radio, CheckCircle2, MapPin, X } from 'lucide-react';

export type ToastType = 'critical' | 'geofence' | 'broadcast' | 'mission' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  body: string;
}

interface ToastContextValue {
  addToast: (type: ToastType, title: string, body: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ addToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS: Record<ToastType, React.ReactNode> = {
  critical: <AlertTriangle className="w-4 h-4 text-red-400" />,
  geofence: <MapPin className="w-4 h-4 text-orange-400" />,
  broadcast: <Radio className="w-4 h-4 text-blue-400" />,
  mission: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  info: <Radio className="w-4 h-4 text-gray-400" />,
};

const BORDER_COLORS: Record<ToastType, string> = {
  critical: 'border-red-500/60',
  geofence: 'border-orange-500/60',
  broadcast: 'border-blue-500/60',
  mission: 'border-green-500/60',
  info: 'border-gray-600',
};

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`relative flex items-start gap-3 bg-[#111827] border ${BORDER_COLORS[toast.type]} rounded-lg p-3 shadow-2xl w-80 backdrop-blur-sm`}
    >
      <div className="mt-0.5 shrink-0">{ICONS[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white font-mono truncate">{toast.title}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-snug line-clamp-2">{toast.body}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-gray-600 hover:text-gray-300 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
  }, []);

  const addToast = useCallback((type: ToastType, title: string, body: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [{ id, type, title, body }, ...prev].slice(0, 5));
    const timer = setTimeout(() => dismiss(id), 8000);
    timers.current.set(id, timer);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
