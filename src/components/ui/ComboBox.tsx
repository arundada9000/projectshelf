'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo, useId } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import styles from './ComboBox.module.css';

// ── ComboBox Option ────────────────────────────────────────

export interface ComboBoxOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

// ── ComboBox ───────────────────────────────────────────────

export interface ComboBoxProps {
  options: ComboBoxOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  allowCreate?: boolean;
  onCreate?: (value: string) => void;
  helpText?: string;
  className?: string;
}

export function ComboBox({
  options,
  value,
  onChange,
  label,
  placeholder = 'Search or select...',
  disabled,
  allowCreate = false,
  onCreate,
  helpText,
  className,
}: ComboBoxProps) {
  const [open, setOpen] = useState(false);
  // null means "showing the selected value"; a string is what the user typed.
  const [draft, setDraft] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoId = useId();
  const listboxId = `${autoId}-listbox`;

  // Derived rather than mirrored into state, so the field cannot drift
  // out of sync with the value it is bound to.
  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;
  const query = draft ?? selectedLabel;

  // Filter options
  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const showCreate =
    allowCreate &&
    query.trim().length > 0 &&
    !options.some((o) => o.label.toLowerCase() === query.trim().toLowerCase());

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        // Abandoning the field discards what was typed.
        setDraft(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
        e.preventDefault();
        setOpen(true);
        return;
      }

      if (!open) return;

      const totalItems = filtered.length + (showCreate ? 1 : 0);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIndex < filtered.length) {
            onChange(filtered[activeIndex].value);
          } else if (showCreate) {
            onCreate?.(query.trim());
          }
          setDraft(null);
          setOpen(false);
          break;
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          setDraft(null);
          break;
      }
    },
    [open, filtered, activeIndex, showCreate, query, onChange, onCreate]
  );

  return (
    <div ref={containerRef} className={`${styles.comboWrapper} ${className ?? ''}`}>
      {label && (
        <label className={styles.comboLabel} htmlFor={autoId}>
          {label}
        </label>
      )}
      <div className={styles.comboInputWrapper}>
        <input
          ref={inputRef}
          id={autoId}
          className={`${styles.comboInput} ${open ? styles.comboInputOpen : ''}`}
          value={query}
          onChange={(e) => {
            setDraft(e.target.value);
            setActiveIndex(0);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
        />
        <ChevronDown
          size={14}
          className={`${styles.comboChevron} ${open ? styles.comboChevronOpen : ''}`}
        />
      </div>

      {open && (
        <div id={listboxId} className={styles.comboDropdown} role="listbox">
          {filtered.length === 0 && !showCreate && (
            <div className={styles.comboEmpty}>No matches found</div>
          )}
          {filtered.map((option, index) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              className={`${styles.comboOption} ${index === activeIndex ? styles.comboOptionActive : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => {
                onChange(option.value);
                setDraft(null);
                setOpen(false);
              }}
            >
              {option.icon && (
                <span className={styles.comboOptionIcon}>{option.icon}</span>
              )}
              {option.label}
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              className={`${styles.comboCreate} ${filtered.length === activeIndex ? styles.comboOptionActive : ''}`}
              onMouseEnter={() => setActiveIndex(filtered.length)}
              onClick={() => {
                onCreate?.(query.trim());
                setDraft(null);
                setOpen(false);
              }}
            >
              <Plus size={14} />
              Create {'“'}{query.trim()}{'”'}
            </button>
          )}
        </div>
      )}

      {helpText && <span className={styles.comboHelpText}>{helpText}</span>}
    </div>
  );
}
