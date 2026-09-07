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
 * Displays text that becomes an editable input on click.
 * Press Enter or blur to save, Escape to cancel.
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
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
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
      onClick={(e) => {
        if (disabled) return;
        e.stopPropagation();
        setDraft(value);
        setEditing(true);
      }}
      title={disabled ? undefined : 'Click to edit'}
    >
      {value || <span className={styles.placeholder}>{placeholder}</span>}
    </Tag>
  );
}
