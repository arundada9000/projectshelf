'use client';

import React, { forwardRef, useId } from 'react';
import { Check, Minus, X } from 'lucide-react';
import styles from './Controls.module.css';

// ── Switch ─────────────────────────────────────────────────

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  /** Accessible name when the switch has no visible label. */
  ariaLabel?: string;
  disabled?: boolean;
  id?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  ariaLabel,
  disabled,
  id: externalId,
}: SwitchProps) {
  const autoId = useId();
  const switchId = externalId ?? autoId;

  return (
    <div className={styles.switchWrapper}>
      <button
        type="button"
        role="switch"
        id={switchId}
        aria-checked={checked}
        aria-label={label ? undefined : ariaLabel}
        disabled={disabled}
        className={styles.switchTrack}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.switchThumb} />
      </button>
      {label && (
        <label htmlFor={switchId} className={styles.switchLabel}>
          {label}
        </label>
      )}
    </div>
  );
}

// ── Checkbox ───────────────────────────────────────────────

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  indeterminate?: boolean;
  disabled?: boolean;
  id?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked, onChange, label, indeterminate, disabled, id: externalId }, ref) => {
    const autoId = useId();
    const cbId = externalId ?? autoId;

    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      const el = inputRef.current;
      if (el) {
        el.indeterminate = !!indeterminate;
      }
    }, [indeterminate]);

    return (
      <label className={styles.checkboxWrapper} htmlFor={cbId}>
        <input
          ref={(node) => {
            (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
          }}
          type="checkbox"
          id={cbId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className={styles.checkboxInput}
        />
        <span className={styles.checkboxBox}>
          {checked && <Check size={12} strokeWidth={3} />}
          {!checked && indeterminate && <Minus size={12} strokeWidth={3} />}
        </span>
        {label && <span className={styles.checkboxLabel}>{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// ── Badge ──────────────────────────────────────────────────

export type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  className?: string;
}

const badgeVariantMap: Record<BadgeVariant, string> = {
  default: styles.badgeDefault,
  accent: styles.badgeAccent,
  success: styles.badgeSuccess,
  warning: styles.badgeWarning,
  danger: styles.badgeDanger,
  info: styles.badgeInfo,
};

export function Badge({ children, variant = 'default', icon, className }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${badgeVariantMap[variant]} ${className ?? ''}`}>
      {icon}
      {children}
    </span>
  );
}

// ── Tag ────────────────────────────────────────────────────

export interface TagProps {
  children: React.ReactNode;
  active?: boolean;
  removable?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

export function Tag({ children, active, removable, onClick, onRemove, className }: TagProps) {
  const classes = [
    styles.tag,
    onClick ? styles.tagClickable : '',
    active ? styles.tagActive : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const removeButton = removable && onRemove && (
    <button
      type="button"
      className={styles.tagRemoveBtn}
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      aria-label="Remove tag"
    >
      <X size={10} />
    </button>
  );

  // A clickable tag is a real button so keyboard and assistive technology
  // get the behaviour for free. `active` is a toggle, hence aria-pressed.
  if (onClick) {
    return (
      <span className={styles.tagWrapper}>
        <button type="button" className={classes} onClick={onClick} aria-pressed={active}>
          {children}
        </button>
        {removeButton}
      </span>
    );
  }

  return (
    <span className={classes}>
      {children}
      {removeButton}
    </span>
  );
}

// ── Segmented Control ──────────────────────────────────────

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div className={`${styles.segmentedControl} ${className ?? ''}`} role="radiogroup">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className={`${styles.segmentedOption} ${value === option.value ? styles.segmentedActive : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
