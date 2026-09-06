'use client';

import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import styles from './Select.module.css';

// ── Option Type ────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

// ── Select ─────────────────────────────────────────────────

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
}

export function Select({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select...',
  disabled,
  searchable = false,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const autoId = useId();

  const selectedOption = options.find((o) => o.value === value);
  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const close = useCallback(() => {
    setOpen(false);
    setSearch('');
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, close]);

  // Focus search when opened
  useEffect(() => {
    if (open && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open, searchable]);

  return (
    <div ref={containerRef} className={`${styles.selectWrapper} ${className ?? ''}`}>
      {label && (
        <label className={styles.selectLabel} id={`${autoId}-label`}>
          {label}
        </label>
      )}
      <button
        type="button"
        className={`${styles.selectTrigger} ${open ? styles.selectTriggerOpen : ''}`}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={label ? `${autoId}-label` : undefined}
      >
        {selectedOption ? (
          <span>{selectedOption.label}</span>
        ) : (
          <span className={styles.selectPlaceholder}>{placeholder}</span>
        )}
        <ChevronDown
          size={14}
          className={`${styles.selectChevron} ${open ? styles.selectChevronOpen : ''}`}
        />
      </button>
      {open && (
        <div className={styles.selectDropdown} role="listbox">
          {searchable && (
            <input
              ref={searchRef}
              className={styles.selectSearchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter..."
              autoComplete="off"
            />
          )}
          {filtered.length === 0 && (
            <div className={styles.selectEmpty}>No options found</div>
          )}
          {filtered.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              disabled={option.disabled}
              className={`${styles.selectOption} ${
                option.value === value ? styles.selectOptionSelected : ''
              }`}
              onClick={() => {
                onChange(option.value);
                close();
              }}
            >
              <span className={styles.selectCheckIcon}>
                {option.value === value && <Check size={14} />}
              </span>
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
