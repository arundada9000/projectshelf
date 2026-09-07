/* ============================================================
   ProjectShelf Action Registry
   The canonical list of things the application can do.

   Shortcuts, the command palette, and context menus all bind to
   these action ids rather than to concrete UI behaviour, so a
   rebound key and a palette entry always run the same code.
   ============================================================ */

import type { ShortcutScope, ShortcutDefinition } from '@/lib/db/schema';

// ── Action Ids ─────────────────────────────────────────────

export type AppActionId =
  // Global
  | 'openCommandPalette'
  | 'focusSearch'
  | 'showShortcuts'
  | 'createProject'
  | 'openSettings'
  | 'openManual'
  // Projects view
  | 'selectAll'
  | 'clearSelection'
  | 'toggleView'
  | 'deleteSelected'
  // Selection
  | 'openInEditor'
  | 'openInTerminal'
  | 'openInExplorer'
  | 'copyPaths'
  | 'copyCommands'
  | 'createLaunchSet'
  // Navigation
  | 'navDashboard'
  | 'navProjects'
  | 'navLaunchSets'
  | 'navSettings';

// ── Action Metadata ────────────────────────────────────────

export interface AppActionMeta {
  id: AppActionId;
  label: string;
  description: string;
  scope: ShortcutScope;
  /** Action only does something when at least one project is selected. */
  requiresSelection?: boolean;
}

export const APP_ACTIONS: AppActionMeta[] = [
  {
    id: 'openCommandPalette',
    label: 'Open command palette',
    description: 'Search every available action',
    scope: 'global',
  },
  {
    id: 'focusSearch',
    label: 'Focus search',
    description: 'Jump to the project search field',
    scope: 'global',
  },
  {
    id: 'showShortcuts',
    label: 'Show keyboard shortcuts',
    description: 'Open the shortcut reference',
    scope: 'global',
  },
  {
    id: 'createProject',
    label: 'Create project',
    description: 'Open the new project dialog',
    scope: 'global',
  },
  {
    id: 'openSettings',
    label: 'Open settings',
    description: 'Go to the settings area',
    scope: 'global',
  },
  {
    id: 'openManual',
    label: 'Open user manual',
    description: 'Go to the built-in documentation',
    scope: 'global',
  },
  {
    id: 'selectAll',
    label: 'Select all projects',
    description: 'Select every project matching the current filters',
    scope: 'projects',
  },
  {
    id: 'clearSelection',
    label: 'Clear selection',
    description: 'Deselect all projects',
    scope: 'projects',
  },
  {
    id: 'toggleView',
    label: 'Toggle grid and list view',
    description: 'Switch between the two project layouts',
    scope: 'projects',
  },
  {
    id: 'deleteSelected',
    label: 'Delete selected projects',
    description: 'Remove the selected projects',
    scope: 'projects',
    requiresSelection: true,
  },
  {
    id: 'openInEditor',
    label: 'Open selection in editor',
    description: 'Generate the editor command for the selection',
    scope: 'selection',
    requiresSelection: true,
  },
  {
    id: 'openInTerminal',
    label: 'Open selection in terminal',
    description: 'Generate the terminal command for the selection',
    scope: 'selection',
    requiresSelection: true,
  },
  {
    id: 'openInExplorer',
    label: 'Open selection in file manager',
    description: 'Generate the file manager command for the selection',
    scope: 'selection',
    requiresSelection: true,
  },
  {
    id: 'copyPaths',
    label: 'Copy selected paths',
    description: 'Copy each selected local path to the clipboard',
    scope: 'selection',
    requiresSelection: true,
  },
  {
    id: 'copyCommands',
    label: 'Copy generated commands',
    description: 'Open the command preview for the selection',
    scope: 'selection',
    requiresSelection: true,
  },
  {
    id: 'createLaunchSet',
    label: 'Create launch set from selection',
    description: 'Save the selected projects as a reusable set',
    scope: 'selection',
    requiresSelection: true,
  },
  {
    id: 'navDashboard',
    label: 'Go to Dashboard',
    description: 'Open the dashboard',
    scope: 'navigation',
  },
  {
    id: 'navProjects',
    label: 'Go to Projects',
    description: 'Open the projects view',
    scope: 'navigation',
  },
  {
    id: 'navLaunchSets',
    label: 'Go to Launch Sets',
    description: 'Open the launch sets view',
    scope: 'navigation',
  },
  {
    id: 'navSettings',
    label: 'Go to Settings',
    description: 'Open settings',
    scope: 'navigation',
  },
];

export const APP_ACTION_MAP: Record<string, AppActionMeta> = Object.fromEntries(
  APP_ACTIONS.map((action) => [action.id, action])
);

export function isAppActionId(value: string): value is AppActionId {
  return value in APP_ACTION_MAP;
}

// ── Cross-Component Events ─────────────────────────────────

/**
 * The projects view owns selection state, so global shortcuts reach it
 * through document events rather than lifted state.
 */
export const APP_EVENTS = {
  createProject: 'projectshelf:create-project',
  toggleView: 'projectshelf:toggle-view',
  selectAll: 'projectshelf:select-all',
  clearSelection: 'projectshelf:clear-selection',
  deleteSelected: 'projectshelf:delete-selected',
  openInEditor: 'projectshelf:open-in-editor',
  openInTerminal: 'projectshelf:open-in-terminal',
  openInExplorer: 'projectshelf:open-in-explorer',
  copyPaths: 'projectshelf:copy-paths',
  copyCommands: 'projectshelf:copy-commands',
  createLaunchSet: 'projectshelf:create-launch-set',
  filterStatus: 'projectshelf:filter-status',
  showShortcuts: 'projectshelf:show-shortcuts',
  shortcutsChanged: 'projectshelf:shortcuts-changed',
  selectionChanged: 'projectshelf:selection-changed',
} as const;

export function emitAppEvent(name: string, detail?: unknown): void {
  if (typeof document === 'undefined') return;
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

// ── Conflict Detection ─────────────────────────────────────

/**
 * Two shortcuts conflict when they share a key combination and their
 * scopes can be active at the same time. 'global' overlaps everything;
 * every other scope only overlaps itself.
 */
export function scopesOverlap(a: ShortcutScope, b: ShortcutScope): boolean {
  return a === b || a === 'global' || b === 'global';
}

/**
 * Returns the ids of every shortcut that collides with another one.
 */
export function findShortcutConflicts(
  shortcuts: ShortcutDefinition[]
): Map<string, ShortcutDefinition[]> {
  const conflicts = new Map<string, ShortcutDefinition[]>();

  for (const shortcut of shortcuts) {
    if (!shortcut.keyCombo) continue;

    const clashing = shortcuts.filter(
      (other) =>
        other.id !== shortcut.id &&
        other.keyCombo &&
        normalizeCombo(other.keyCombo) === normalizeCombo(shortcut.keyCombo) &&
        scopesOverlap(other.scope, shortcut.scope)
    );

    if (clashing.length > 0) conflicts.set(shortcut.id, clashing);
  }

  return conflicts;
}

const MODIFIER_ORDER = ['ctrl', 'alt', 'shift', 'meta'];

/**
 * Canonical form of a combo so 'shift+ctrl+k' and 'ctrl+shift+k' compare equal.
 */
export function normalizeCombo(combo: string): string {
  const parts = combo
    .toLowerCase()
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return '';

  const key = parts[parts.length - 1];
  const modifiers = parts
    .slice(0, -1)
    .map((mod) => {
      if (mod === 'control') return 'ctrl';
      if (mod === 'cmd' || mod === 'command') return 'meta';
      return mod;
    })
    // Ctrl and Cmd are the same primary modifier at match time.
    .map((mod) => (mod === 'meta' ? 'ctrl' : mod));

  const unique = Array.from(new Set(modifiers)).sort(
    (a, b) => MODIFIER_ORDER.indexOf(a) - MODIFIER_ORDER.indexOf(b)
  );

  return [...unique, key].join('+');
}
