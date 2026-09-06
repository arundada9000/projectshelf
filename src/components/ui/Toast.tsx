'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import styles from './Toast.module.css';

// ── Types ──────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  undoAction?: () => void;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, options?: { duration?: number; undoAction?: () => void }) => void;
  dismiss: (id: string) => void;
}

// ── Context ────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ── Icons ──────────────────────────────────────────────────

const iconMap: Record<ToastType, { icon: React.ReactNode; className: string }> = {
  success: { icon: <CheckCircle2 size={16} />, className: styles.toastIconSuccess },
  error: { icon: <XCircle size={16} />, className: styles.toastIconError },
  info: { icon: <Info size={16} />, className: styles.toastIconInfo },
  warning: { icon: <AlertTriangle size={16} />, className: styles.toastIconWarning },
};

// ── Provider ───────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [exiting, setExiting] = useState<Set<string>>(new Set());
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismiss = useCallback((id: string) => {
    setExiting((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      setExiting((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 200);

    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (
      message: string,
      type: ToastType = 'info',
      options?: { duration?: number; undoAction?: () => void }
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const duration = options?.duration ?? 4000;

      setToasts((prev) => [...prev.slice(-4), { id, message, type, undoAction: options?.undoAction }]);

      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timersRef.current.set(id, timer);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className={styles.toastContainer} role="region" aria-label="Notifications">
        {toasts.map((t) => {
          const { icon, className: iconClass } = iconMap[t.type];
          return (
            <div
              key={t.id}
              className={`${styles.toast} ${exiting.has(t.id) ? styles.toastExiting : ''}`}
              role="status"
              aria-live="polite"
            >
              <span className={`${styles.toastIcon} ${iconClass}`}>{icon}</span>
              <div className={styles.toastContent}>
                <p className={styles.toastMessage}>{t.message}</p>
              </div>
              <div className={styles.toastActions}>
                {t.undoAction && (
                  <button
                    type="button"
                    className={styles.toastUndoBtn}
                    onClick={() => {
                      t.undoAction?.();
                      dismiss(t.id);
                    }}
                  >
                    Undo
                  </button>
                )}
                <button
                  type="button"
                  className={styles.toastDismissBtn}
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
