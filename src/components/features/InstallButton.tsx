'use client';

import React, { useState } from 'react';
import { Download, Check } from 'lucide-react';
import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt';
import styles from './InstallButton.module.css';

export interface InstallButtonProps {
  /** 'sidebar' matches the app navigation; 'standalone' suits the footer. */
  variant?: 'sidebar' | 'standalone';
  /** Hide the label, leaving the icon, for a collapsed sidebar. */
  compact?: boolean;
}

/**
 * Offers installation only when the browser says it is possible, and says
 * nothing at all once the app is installed. No dismissable banner, no nagging.
 */
export function InstallButton({ variant = 'standalone', compact }: InstallButtonProps) {
  const { canInstall, isInstalled, install } = useInstallPrompt();
  const [busy, setBusy] = useState(false);

  if (isInstalled) {
    if (variant !== 'standalone') return null;
    return (
      <span className={`${styles.installed}`}>
        <Check size={14} />
        Installed
      </span>
    );
  }

  if (!canInstall) return null;

  return (
    <button
      type="button"
      className={`${styles.button} ${styles[variant]} ${compact ? styles.compact : ''}`}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await install();
        } finally {
          setBusy(false);
        }
      }}
      title={compact ? 'Install ProjectShelf' : undefined}
    >
      <span className={styles.icon}>
        <Download size={variant === 'sidebar' ? 18 : 15} />
      </span>
      <span className={styles.label}>Install app</span>
    </button>
  );
}
