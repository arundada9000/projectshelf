'use client';

import React, { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyText } from '@/lib/clipboard';
import styles from './Select.module.css';

// ── Command Preview ────────────────────────────────────────

export interface CommandPreviewProps {
  title?: string;
  commands: string[];
  meta?: string;
  className?: string;
}

export function CommandPreview({
  title = 'Command',
  commands,
  meta,
  className,
}: CommandPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      const copied = await copyText(commands.join('\n'));
      if (!copied) return;
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The text stays on screen for manual selection.
    }
  }, [commands]);

  return (
    <div className={`${styles.commandPreview} ${className ?? ''}`}>
      <div className={styles.commandHeader}>
        <span className={styles.commandTitle}>{title}</span>
        <button
          type="button"
          className={`${styles.commandCopyBtn} ${copied ? styles.commandCopied : ''}`}
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy to clipboard'}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className={styles.commandBody}>
        <code className={styles.commandCode}>
          {commands.map((line, i) => (
            <span key={i} className={styles.commandLine}>
              {line}
            </span>
          ))}
        </code>
      </div>
      {meta && <div className={styles.commandMeta}>{meta}</div>}
    </div>
  );
}
