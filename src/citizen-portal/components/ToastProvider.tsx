import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  addToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  /** Convenience shorthands */
  success: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Config ───────────────────────────────────────────────────────────────────

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: React.ReactNode; border: string; bg: string; text: string; progress: string }
> = {
  success: {
    icon: <CheckCircle2 className="w-4 h-4 shrink-0" />,
    border: 'border-green-500/40',
    bg: 'bg-[#0d1f14]',
    text: 'text-green-300',
    progress: 'bg-green-500',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4 shrink-0" />,
    border: 'border-yellow-500/40',
    bg: 'bg-[#1c1a0d]',
    text: 'text-yellow-300',
    progress: 'bg-yellow-500',
  },
  error: {
    icon: <XCircle className="w-4 h-4 shrink-0" />,
    border: 'border-red-500/40',
    bg: 'bg-[#1f0e0e]',
    text: 'text-red-300',
    progress: 'bg-red-500',
  },
  info: {
    icon: <Info className="w-4 h-4 shrink-0" />,
    border: 'border-blue-500/40',
    bg: 'bg-[#0e1523]',
    text: 'text-blue-300',
    progress: 'bg-blue-500',
  },
};

// ─── Single Toast Item ────────────────────────────────────────────────────────

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const cfg = VARIANT_CONFIG[toast.variant];
  const duration = toast.duration ?? 4000;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`relative w-80 rounded-xl border ${cfg.border} ${cfg.bg} shadow-2xl overflow-hidden`}
    >
      {/* Content */}
      <div className={`flex items-start gap-3 px-4 py-3 ${cfg.text}`}>
        {cfg.icon}
        <p className="text-sm font-mono flex-1 leading-relaxed">{toast.message}</p>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 opacity-50 hover:opacity-100 transition mt-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 ${cfg.progress}`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        onAnimationComplete={() => onDismiss(toast.id)}
      />
    </motion.div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration = 4000) => {
      const id = `toast-${++counterRef.current}`;
      setToasts((prev) => [...prev.slice(-4), { id, message, variant, duration }]);
    },
    []
  );

  const value: ToastContextValue = {
    addToast,
    success: (msg, dur) => addToast(msg, 'success', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast Stack — bottom-right, fixed */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a <ToastProvider>');
  return ctx;
}
