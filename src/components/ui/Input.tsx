'use client';

import React, { forwardRef, useId } from 'react';
import { Search, X } from 'lucide-react';
import styles from './Input.module.css';

// ── Input ──────────────────────────────────────────────────

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  helpText?: string;
  error?: string;
  inputSize?: 'sm' | 'md' | 'lg';
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helpText,
      error,
      inputSize = 'md',
      startIcon,
      endIcon,
      required,
      className,
      id: externalId,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const inputId = externalId ?? autoId;

    const inputClasses = [
      styles.input,
      inputSize === 'sm' ? styles.inputSm : '',
      inputSize === 'lg' ? styles.inputLg : '',
      startIcon ? styles.hasPrefix : '',
      endIcon ? styles.hasSuffix : '',
      error ? styles.inputError : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={styles.inputWrapper}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <div className={styles.inputContainer}>
          {startIcon && <span className={styles.prefix}>{startIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
            required={required}
            {...props}
          />
          {endIcon && <span className={styles.suffix}>{endIcon}</span>}
        </div>
        {error && (
          <span id={`${inputId}-error`} className={styles.errorText} role="alert">
            {error}
          </span>
        )}
        {!error && helpText && (
          <span id={`${inputId}-help`} className={styles.helpText}>
            {helpText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ── Search Input ───────────────────────────────────────────

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value: string;
  onValueChange: (value: string) => void;
  shortcutHint?: string;
  showClear?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onValueChange,
      shortcutHint = '/',
      showClear = true,
      placeholder = 'Search projects...',
      className,
      ...props
    },
    ref
  ) => {
    const hasClear = showClear && value.length > 0;

    return (
      <div className={`${styles.searchWrapper} ${className ?? ''}`}>
        <Search size={15} className={styles.searchIcon} />
        <input
          ref={ref}
          type="text"
          className={`${styles.searchInput} ${hasClear ? styles.searchHasClear : ''}`}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          role="searchbox"
          aria-label="Search projects"
          {...props}
        />
        {!hasClear && shortcutHint && (
          <kbd className={styles.searchKbd}>{shortcutHint}</kbd>
        )}
        {hasClear && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => onValueChange('')}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

// ── Textarea ───────────────────────────────────────────────

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helpText?: string;
  error?: string;
  required?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, helpText, error, required, className, id: externalId, ...props },
    ref
  ) => {
    const autoId = useId();
    const textareaId = externalId ?? autoId;

    return (
      <div className={styles.inputWrapper}>
        {label && (
          <label htmlFor={textareaId} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`${styles.textarea} ${error ? styles.inputError : ''} ${className ?? ''}`}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${textareaId}-error` : helpText ? `${textareaId}-help` : undefined
          }
          required={required}
          {...props}
        />
        {error && (
          <span id={`${textareaId}-error`} className={styles.errorText} role="alert">
            {error}
          </span>
        )}
        {!error && helpText && (
          <span id={`${textareaId}-help`} className={styles.helpText}>
            {helpText}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
