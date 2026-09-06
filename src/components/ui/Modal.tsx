'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

// ── Modal ──────────────────────────────────────────────────

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'narrow' | 'default' | 'wide';
  children: React.ReactNode;
  footer?: React.ReactNode;
  footerAlign?: 'end' | 'space-between';
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'default',
  children,
  footer,
  footerAlign = 'end',
  closeOnOverlay = true,
  closeOnEscape = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store focus before opening
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [open]);

  // Focus trap and escape key
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        e.preventDefault();
        onClose();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    // Focus first focusable element
    requestAnimationFrame(() => {
      const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
        'input, select, textarea, button:not([aria-label="Close"])'
      );
      firstFocusable?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      // Return focus
      previousFocusRef.current?.focus();
    };
  }, [open, onClose, closeOnEscape]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnOverlay && e.target === e.currentTarget) {
        onClose();
      }
    },
    [closeOnOverlay, onClose]
  );

  if (!open) return null;

  const sizeClass =
    size === 'wide' ? styles.dialogWide : size === 'narrow' ? styles.dialogNarrow : '';

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${sizeClass}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-describedby={description ? 'modal-desc' : undefined}
      >
        {title && (
          <div className={styles.dialogHeader}>
            <div>
              <h2 className={styles.dialogTitle}>{title}</h2>
              {description && (
                <p id="modal-desc" className={styles.dialogDescription}>
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              className={styles.dialogCloseBtn}
              onClick={onClose}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className={styles.dialogBody}>{children}</div>
        {footer && (
          <div
            className={`${styles.dialogFooter} ${
              footerAlign === 'space-between' ? styles.dialogFooterSpaceBetween : ''
            }`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
