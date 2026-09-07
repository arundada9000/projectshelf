'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { formatKeyCombo } from '@/lib/hooks/useHotkeys';
import styles from './ShortcutRecorder.module.css';

// ── Key Naming ─────────────────────────────────────────────

const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta', 'OS']);

/**
 * Turn a keyboard event into the combo string the shortcut store uses.
 * Returns null while only modifiers are held, so the recorder keeps
 * waiting for a real key.
 */
function comboFromEvent(e: React.KeyboardEvent | KeyboardEvent): string | null {
  if (MODIFIER_KEYS.has(e.key)) return null;

  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('ctrl');
  if (e.altKey) parts.push('alt');
  if (e.shiftKey) parts.push('shift');

  let key = e.key.toLowerCase();

  // Prefer the physical key so layouts and Shift do not change the binding.
  if (/^[a-z]$/.test(key) === false && e.code) {
    const letter = /^Key([A-Z])$/.exec(e.code);
    const digit = /^(?:Digit|Numpad)(\d)$/.exec(e.code);
    if (letter) key = letter[1].toLowerCase();
    else if (digit) key = digit[1];
  }

  if (key === ' ') key = 'space';
  if (key === 'esc') key = 'escape';

  parts.push(key);
  return parts.join('+');
}

// ── Shortcut Recorder ──────────────────────────────────────

export interface ShortcutRecorderProps {
  value: string;
  onChange: (combo: string) => void;
  /** Shown under the field when the captured combo clashes with another. */
  conflict?: string;
  onReset?: () => void;
  disabled?: boolean;
  label?: string;
}

export function ShortcutRecorder({
  value,
  onChange,
  conflict,
  onReset,
  disabled,
  label = 'Shortcut',
}: ShortcutRecorderProps) {
  const [recording, setRecording] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const stop = useCallback(() => setRecording(false), []);

  // While recording, the whole document is captured so the combo being
  // recorded cannot trigger the shortcut it is about to replace.
  useEffect(() => {
    if (!recording) return;

    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        stop();
        return;
      }

      const combo = comboFromEvent(e);
      if (!combo) return;

      onChange(combo);
      stop();
    };

    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
  }, [recording, onChange, stop]);

  return (
    <div className={styles.recorder}>
      <div className={styles.recorderRow}>
        <button
          ref={buttonRef}
          type="button"
          className={`${styles.recorderField} ${recording ? styles.recorderFieldActive : ''} ${
            conflict ? styles.recorderFieldConflict : ''
          }`}
          onClick={() => setRecording((prev) => !prev)}
          onBlur={stop}
          disabled={disabled}
          aria-label={recording ? `Recording ${label}. Press a key combination.` : `${label}: ${value || 'not set'}. Activate to record.`}
        >
          {recording ? (
            <span className={styles.recorderPrompt}>Press keys</span>
          ) : value ? (
            <span className={styles.recorderKeys}>
              {formatKeyCombo(value)
                .split(' + ')
                .map((part, i) => (
                  <kbd key={i}>{part}</kbd>
                ))}
            </span>
          ) : (
            <span className={styles.recorderEmpty}>Not set</span>
          )}
        </button>

        {value && !disabled && (
          <button
            type="button"
            className={styles.recorderAction}
            onClick={() => onChange('')}
            aria-label={`Remove ${label}`}
            title="Remove shortcut"
          >
            <X size={14} />
          </button>
        )}

        {onReset && !disabled && (
          <button
            type="button"
            className={styles.recorderAction}
            onClick={onReset}
            aria-label={`Restore default ${label}`}
            title="Restore default"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {conflict && (
        <p className={styles.recorderConflict} role="alert">
          Already used by {conflict}
        </p>
      )}
    </div>
  );
}
