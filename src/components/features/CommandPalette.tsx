'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search,
  FolderKanban,
  Settings,
  Plus,
  BookOpen,
  Keyboard,
  LayoutDashboard,
  Layers,
  Palette,
  Type,
  LayoutGrid,
  List,
  Download,
  Upload,
  Trash2,
} from 'lucide-react';
import { formatKeyCombo } from '@/lib/hooks/useHotkeys';
import styles from './CommandPalette.module.css';

// ── Command Palette Item ───────────────────────────────────

export interface PaletteItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  section: string;
  action: () => void;
}

// ── Command Palette ────────────────────────────────────────

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  items: PaletteItem[];
}

export function CommandPalette({ open, onClose, items }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter items
  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q)
    );
  }, [items, query]);

  // Group by section
  const grouped = useMemo(() => {
    const groups = new Map<string, PaletteItem[]>();
    for (const item of filtered) {
      const existing = groups.get(item.section) ?? [];
      existing.push(item);
      groups.set(item.section, existing);
    }
    return groups;
  }, [filtered]);

  // Flat list for keyboard navigation
  const flatList = useMemo(() => filtered, [filtered]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => (prev < flatList.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatList.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (flatList[activeIndex]) {
            flatList[activeIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [flatList, activeIndex, onClose]
  );

  // Scroll active into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) return null;

  let itemIndex = 0;

  return (
    <div
      className={styles.paletteOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.paletteContainer} role="dialog" aria-label="Command palette">
        <div className={styles.paletteInputRow}>
          <Search size={16} className={styles.paletteSearchIcon} />
          <input
            ref={inputRef}
            className={styles.paletteInput}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            autoComplete="off"
            spellCheck={false}
          />
          <span className={styles.paletteHint}>Esc to close</span>
        </div>

        <div ref={listRef} className={styles.paletteResults} role="listbox">
          {flatList.length === 0 ? (
            <div className={styles.paletteEmpty}>
              No commands match "{query}"
            </div>
          ) : (
            Array.from(grouped.entries()).map(([section, sectionItems]) => (
              <div key={section}>
                <div className={styles.paletteSection}>{section}</div>
                {sectionItems.map((item) => {
                  const currentIndex = itemIndex++;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`${styles.paletteItem} ${
                        currentIndex === activeIndex ? styles.paletteItemActive : ''
                      }`}
                      role="option"
                      aria-selected={currentIndex === activeIndex}
                      data-index={currentIndex}
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                      onMouseEnter={() => setActiveIndex(currentIndex)}
                    >
                      {item.icon && (
                        <span className={styles.paletteItemIcon}>{item.icon}</span>
                      )}
                      <span className={styles.paletteItemLabel}>{item.label}</span>
                      {item.shortcut && (
                        <span className={styles.paletteItemShortcut}>
                          {formatKeyCombo(item.shortcut)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className={styles.paletteFooter}>
          <span className={styles.paletteFooterKbd}>
            <kbd>↑↓</kbd> Navigate
          </span>
          <span className={styles.paletteFooterKbd}>
            <kbd>Enter</kbd> Select
          </span>
          <span className={styles.paletteFooterKbd}>
            <kbd>Esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Build Default Palette Items ────────────────────────────

export function buildDefaultPaletteItems(actions: {
  navigate: (page: string) => void;
  createProject: () => void;
  toggleView: () => void;
  showShortcuts: () => void;
  openSettings: () => void;
  openManual: () => void;
  exportData: () => void;
  importData: () => void;
}): PaletteItem[] {
  return [
    // Navigation
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      icon: <LayoutDashboard size={16} />,
      shortcut: 'alt+1',
      section: 'Navigation',
      action: () => actions.navigate('dashboard'),
    },
    {
      id: 'nav-projects',
      label: 'Go to Projects',
      icon: <FolderKanban size={16} />,
      shortcut: 'alt+2',
      section: 'Navigation',
      action: () => actions.navigate('projects'),
    },
    {
      id: 'nav-launch-sets',
      label: 'Go to Launch Sets',
      icon: <Layers size={16} />,
      shortcut: 'alt+3',
      section: 'Navigation',
      action: () => actions.navigate('launch-sets'),
    },

    // Actions
    {
      id: 'create-project',
      label: 'Create New Project',
      icon: <Plus size={16} />,
      shortcut: 'ctrl+n',
      section: 'Actions',
      action: actions.createProject,
    },
    {
      id: 'toggle-view',
      label: 'Toggle Grid / List View',
      icon: <LayoutGrid size={16} />,
      shortcut: 'ctrl+shift+v',
      section: 'Actions',
      action: actions.toggleView,
    },

    // Tools
    {
      id: 'show-shortcuts',
      label: 'Keyboard Shortcuts',
      icon: <Keyboard size={16} />,
      shortcut: 'shift+?',
      section: 'Tools',
      action: actions.showShortcuts,
    },
    {
      id: 'open-settings',
      label: 'Open Settings',
      icon: <Settings size={16} />,
      shortcut: 'ctrl+,',
      section: 'Tools',
      action: actions.openSettings,
    },
    {
      id: 'open-manual',
      label: 'User Manual',
      icon: <BookOpen size={16} />,
      shortcut: 'f1',
      section: 'Tools',
      action: actions.openManual,
    },

    // Data
    {
      id: 'export-data',
      label: 'Export All Data',
      icon: <Download size={16} />,
      section: 'Data',
      action: actions.exportData,
    },
    {
      id: 'import-data',
      label: 'Import Data',
      icon: <Upload size={16} />,
      section: 'Data',
      action: actions.importData,
    },
  ];
}
