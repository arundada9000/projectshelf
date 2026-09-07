'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui';
import { getAllShortcuts } from '@/lib/db';
import { APP_EVENTS } from '@/lib/actions';
import { formatKeyCombo } from '@/lib/hooks/useHotkeys';
import type { ShortcutScope, ShortcutDefinition } from '@/lib/db/schema';
import styles from './CommandPalette.module.css';

// ── Scope Labels ───────────────────────────────────────────

const SCOPE_LABELS: Record<ShortcutScope, string> = {
  global: 'Global',
  projects: 'Projects View',
  selection: 'Selection',
  navigation: 'Navigation',
  'command-palette': 'Command Palette',
};

const SCOPE_ORDER: ShortcutScope[] = [
  'global',
  'navigation',
  'projects',
  'selection',
  'command-palette',
];

// ── Shortcuts Cheat Sheet ──────────────────────────────────

export interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  const [shortcuts, setShortcuts] = useState<ShortcutDefinition[]>([]);

  const load = useCallback(() => {
    getAllShortcuts()
      .then(setShortcuts)
      .catch(() => setShortcuts([]));
  }, []);

  // Read the user's live bindings, not the presets, so a rebound key
  // is reflected here immediately.
  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    document.addEventListener(APP_EVENTS.shortcutsChanged, load);
    return () => document.removeEventListener(APP_EVENTS.shortcutsChanged, load);
  }, [load]);

  const grouped = new Map<ShortcutScope, ShortcutDefinition[]>();
  for (const shortcut of shortcuts) {
    if (!shortcut.keyCombo) continue;
    const existing = grouped.get(shortcut.scope) ?? [];
    existing.push(shortcut);
    grouped.set(shortcut.scope, existing);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Keyboard Shortcuts"
      description="All available keyboard shortcuts"
      size="wide"
    >
      <div className={styles.shortcutsGrid}>
        {SCOPE_ORDER.map((scope) => {
          const shortcuts = grouped.get(scope);
          if (!shortcuts || shortcuts.length === 0) return null;

          return (
            <div key={scope} className={styles.shortcutsSection}>
              <div className={styles.shortcutsSectionTitle}>
                {SCOPE_LABELS[scope]}
              </div>
              {shortcuts.map((shortcut) => (
                <div key={shortcut.id} className={styles.shortcutRow}>
                  <span className={styles.shortcutLabel}>
                    {shortcut.description}
                  </span>
                  <span className={styles.shortcutKeys}>
                    {formatKeyCombo(shortcut.keyCombo)
                      .split(' + ')
                      .map((part, i) => (
                        <kbd key={i}>{part}</kbd>
                      ))}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
