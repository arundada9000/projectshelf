'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './InlineEdit.module.css';

export interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  /** Placeholder shown when value is empty. */
  placeholder?: string;
  /** CSS class applied to the display element. */
  className?: string;
  /** Tag used for the display element. */
  as?: 'span' | 'div' | 'h2' | 'h3';
  /** Whether editing is currently allowed. */
  disabled?: boolean;
}

/**
 * Displays text that becomes an editable input on click or via the keyboard.
 * Press Enter or blur to save, Escape to cancel.
 *
 * The input carries data-escape-local so the global hotkey listener leaves
 * Escape alone while an edit is open; otherwise the capture-phase handler
 * would swallow the key and clear the selection instead of cancelling.
 */
export function InlineEdit({
  value,
  onSave,
  placeholder = 'Untitled',
  className,
  as: Tag = 'span',
  disabled = false,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    } else {
      setDraft(value);
    }
    setEditing(false);
  };

  const beginEditing = () => {
    setDraft(value);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        data-escape-local="true"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            commit();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            cancel();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        aria-label="Edit name"
      />
    );
  }

  return (
    <Tag
      className={`${styles.display} ${disabled ? '' : styles.interactive} ${className ?? ''}`}
      role={disabled ? undefined : 'button'}
      tabIndex={disabled ? undefined : 0}
      onClick={(e) => {
        if (disabled) return;
        e.stopPropagation();
        beginEditing();
      }}
      onKeyDown={(e) => {
        if (disabled) return;
        // Enter and Space are how a button is activated from the keyboard.
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          beginEditing();
        }
      }}
      aria-label={disabled ? undefined : `Rename ${value || placeholder}`}
    >
      {value || <span className={styles.placeholder}>{placeholder}</span>}
    </Tag>
  );
}
