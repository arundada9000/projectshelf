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
  LayoutGrid,
  Trash2,
  Command,
  CheckSquare,
  X,
  Code2,
  Terminal,
  FolderOpen,
  Copy,
  ClipboardList,
} from 'lucide-react';
import type { ShortcutDefinition, ShortcutScope } from '@/lib/db/schema';
import { APP_ACTIONS } from '@/lib/actions';
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
  /** Shown but not activatable, with `reason` explaining why. */
  disabled?: boolean;
  reason?: string;
}

// ── Command Palette ────────────────────────────────────────

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  items: PaletteItem[];
}

export function CommandPalette(props: CommandPaletteProps) {
  // Mounting only while open means the query and highlight start fresh
  // every time, without synchronising state from an effect.
  if (!props.open) return null;
  return <CommandPaletteBody {...props} />;
}

function CommandPaletteBody({ onClose, items }: CommandPaletteProps) {
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

  // Focus the field as soon as the palette appears.
  useEffect(() => {
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

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
        case 'Enter': {
          e.preventDefault();
          const item = flatList[activeIndex];
          if (item && !item.disabled) {
            item.action();
            onClose();
          }
          break;
        }
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
              No commands match &quot;{query}&quot;
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
                      } ${item.disabled ? styles.paletteItemDisabled : ''}`}
                      role="option"
                      aria-selected={currentIndex === activeIndex}
                      aria-disabled={item.disabled}
                      data-index={currentIndex}
                      onClick={() => {
                        if (item.disabled) return;
                        item.action();
                        onClose();
                      }}
                      onMouseEnter={() => setActiveIndex(currentIndex)}
                    >
                      {item.icon && (
                        <span className={styles.paletteItemIcon}>{item.icon}</span>
                      )}
                      <span className={styles.paletteItemLabel}>{item.label}</span>
                      {item.disabled && item.reason && (
                        <span className={styles.paletteItemReason}>{item.reason}</span>
                      )}
                      {!item.disabled && item.shortcut && (
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

// ── Build Palette Items ────────────────────────────────────

const ACTION_ICONS: Record<string, React.ReactNode> = {
  openCommandPalette: <Command size={16} />,
  focusSearch: <Search size={16} />,
  showShortcuts: <Keyboard size={16} />,
  createProject: <Plus size={16} />,
  openSettings: <Settings size={16} />,
  openManual: <BookOpen size={16} />,
  selectAll: <CheckSquare size={16} />,
  clearSelection: <X size={16} />,
  toggleView: <LayoutGrid size={16} />,
  deleteSelected: <Trash2 size={16} />,
  openInEditor: <Code2 size={16} />,
  openInTerminal: <Terminal size={16} />,
  openInExplorer: <FolderOpen size={16} />,
  copyPaths: <Copy size={16} />,
  copyCommands: <ClipboardList size={16} />,
  createLaunchSet: <Layers size={16} />,
  navDashboard: <LayoutDashboard size={16} />,
  navProjects: <FolderKanban size={16} />,
  navLaunchSets: <Layers size={16} />,
  navSettings: <Settings size={16} />,
};

const SCOPE_SECTIONS: Record<ShortcutScope, string> = {
  global: 'Actions',
  projects: 'Projects',
  selection: 'Selection',
  navigation: 'Navigation',
  'command-palette': 'Actions',
};

export interface BuildPaletteOptions {
  /** Action id to behaviour. Actions without a handler are omitted. */
  handlers: Partial<Record<string, () => void>>;
  /** Current bindings, used to display the right key hint. */
  shortcuts: ShortcutDefinition[];
  /** Number of currently selected projects. */
  selectionCount: number;
  /** Extra entries that are not registry actions, such as import and export. */
  extraItems?: PaletteItem[];
}

/**
 * Builds the palette from the action registry so it always matches the
 * shortcut system. Selection actions stay visible but disabled when nothing
 * is selected, with the reason shown, rather than silently disappearing.
 */
export function buildPaletteItems({
  handlers,
  shortcuts,
  selectionCount,
  extraItems = [],
}: BuildPaletteOptions): PaletteItem[] {
  const comboFor = (actionId: string): string | undefined =>
    shortcuts.find((shortcut) => shortcut.actionId === actionId)?.keyCombo;

  const items: PaletteItem[] = APP_ACTIONS.flatMap((action) => {
    const handler = handlers[action.id];
    if (!handler) return [];

    // The palette is already open when it is being read, so offering
    // "open command palette" inside it is noise.
    if (action.id === 'openCommandPalette') return [];

    const needsSelection = action.requiresSelection && selectionCount === 0;

    return [
      {
        id: `action-${action.id}`,
        label: action.label,
        icon: ACTION_ICONS[action.id],
        shortcut: comboFor(action.id),
        section: SCOPE_SECTIONS[action.scope],
        action: handler,
        disabled: needsSelection,
        reason: needsSelection ? 'No projects selected' : undefined,
      },
    ];
  });

  return [...items, ...extraItems];
}
