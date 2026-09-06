'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './ContextMenu.module.css';

// ── Types ──────────────────────────────────────────────────

export interface MenuItemData {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface MenuSeparator {
  type: 'separator';
}

export interface MenuLabel {
  type: 'label';
  label: string;
}

export type MenuEntry = MenuItemData | MenuSeparator | MenuLabel;

function isSeparator(entry: MenuEntry): entry is MenuSeparator {
  return 'type' in entry && entry.type === 'separator';
}

function isLabel(entry: MenuEntry): entry is MenuLabel {
  return 'type' in entry && entry.type === 'label';
}

// ── Context Menu (right-click) ─────────────────────────────

export interface ContextMenuProps {
  items: MenuEntry[];
  children: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export function ContextMenu({ items, children, onOpenChange }: ContextMenuProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setPosition(null);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Clamp position to viewport
      const x = Math.min(e.clientX, window.innerWidth - 220);
      const y = Math.min(e.clientY, window.innerHeight - 300);
      setPosition({ x, y });
      onOpenChange?.(true);
    },
    [onOpenChange]
  );

  // Close on click outside or escape
  useEffect(() => {
    if (!position) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [position, close]);

  // Focus first item when opened
  useEffect(() => {
    if (position && menuRef.current) {
      const first = menuRef.current.querySelector<HTMLButtonElement>('button:not(:disabled)');
      first?.focus();
    }
  }, [position]);

  // Keyboard navigation within menu
  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!menuRef.current) return;
      const buttons = Array.from(menuRef.current.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
        buttons[next]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
        buttons[prev]?.focus();
      }
    },
    []
  );

  return (
    <>
      <div onContextMenu={handleContextMenu} style={{ display: 'contents' }}>
        {children}
      </div>
      {position && (
        <>
          <div className={styles.menuOverlay} onClick={close} />
          <div
            ref={menuRef}
            className={styles.menu}
            style={{ left: position.x, top: position.y }}
            role="menu"
            onKeyDown={handleMenuKeyDown}
          >
            {items.map((entry, index) => {
              if (isSeparator(entry)) {
                return <div key={`sep-${index}`} className={styles.menuSeparator} role="separator" />;
              }
              if (isLabel(entry)) {
                return (
                  <div key={`lbl-${index}`} className={styles.menuLabel} role="presentation">
                    {entry.label}
                  </div>
                );
              }
              return (
                <button
                  key={entry.id}
                  type="button"
                  className={`${styles.menuItem} ${entry.danger ? styles.menuItemDanger : ''}`}
                  role="menuitem"
                  disabled={entry.disabled}
                  onClick={() => {
                    entry.onClick?.();
                    close();
                  }}
                >
                  {entry.icon && <span className={styles.menuItemIcon}>{entry.icon}</span>}
                  <span className={styles.menuItemLabel}>{entry.label}</span>
                  {entry.shortcut && (
                    <span className={styles.menuItemShortcut}>{entry.shortcut}</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

// ── Dropdown Menu (button triggered) ───────────────────────

export interface DropdownMenuProps {
  items: MenuEntry[];
  trigger: React.ReactNode;
  align?: 'left' | 'right';
}

export function DropdownMenu({ items, trigger, align = 'right' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
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

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, close]);

  useEffect(() => {
    if (open && menuRef.current) {
      const first = menuRef.current.querySelector<HTMLButtonElement>('button:not(:disabled)');
      first?.focus();
    }
  }, [open]);

  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!menuRef.current) return;
      const buttons = Array.from(menuRef.current.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
        buttons[next]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
        buttons[prev]?.focus();
      }
    },
    []
  );

  return (
    <div ref={containerRef} className={styles.dropdownTrigger}>
      <div onClick={() => setOpen((prev) => !prev)}>{trigger}</div>
      {open && (
        <div
          ref={menuRef}
          className={`${styles.dropdownMenu} ${align === 'left' ? styles.dropdownMenuLeft : ''}`}
          role="menu"
          onKeyDown={handleMenuKeyDown}
        >
          {items.map((entry, index) => {
            if (isSeparator(entry)) {
              return <div key={`sep-${index}`} className={styles.menuSeparator} role="separator" />;
            }
            if (isLabel(entry)) {
              return (
                <div key={`lbl-${index}`} className={styles.menuLabel} role="presentation">
                  {entry.label}
                </div>
              );
            }
            return (
              <button
                key={entry.id}
                type="button"
                className={`${styles.menuItem} ${entry.danger ? styles.menuItemDanger : ''}`}
                role="menuitem"
                disabled={entry.disabled}
                onClick={() => {
                  entry.onClick?.();
                  close();
                }}
              >
                {entry.icon && <span className={styles.menuItemIcon}>{entry.icon}</span>}
                <span className={styles.menuItemLabel}>{entry.label}</span>
                {entry.shortcut && (
                  <span className={styles.menuItemShortcut}>{entry.shortcut}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
