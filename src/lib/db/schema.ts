/* ============================================================
   ProjectShelf Data Models
   TypeScript type definitions for all application entities.
   ============================================================ */

// ── Project ────────────────────────────────────────────────

export type ProjectStatus =
  | 'active'
  | 'experiment'
  | 'paused'
  | 'finished'
  | 'archived'
  | 'abandoned';

export interface Project {
  id: string;
  name: string;
  localPath: string;
  githubUrl: string;
  hostedUrl: string;
  description: string;
  tags: string[];
  status: ProjectStatus;
  tech: string;
  language: string;
  packageManager: string;
  devCommand: string;
  branch: string;
  notes: string;
  isPinned: boolean;
  icon: string;
  editorOverride: string;     // editor id or empty for global default
  terminalOverride: string;   // terminal id or empty for global default
  createdAt: number;          // unix timestamp ms
  updatedAt: number;          // unix timestamp ms
}

// ── Command Definition ─────────────────────────────────────

export type CommandCategory =
  | 'editor'
  | 'terminal'
  | 'file-manager'
  | 'git'
  | 'build'
  | 'custom';

export interface CommandDefinition {
  id: string;
  name: string;
  template: string;          // e.g. 'cd "{path}" && code .'
  category: CommandCategory;
  toolId: string;            // terminal/editor/tool id this belongs to
  enabled: boolean;
  order: number;
  description: string;
  isBuiltIn: boolean;
}

// ── Terminal Definition ────────────────────────────────────

export interface TerminalDefinition {
  id: string;
  name: string;
  executable: string;
  defaultArgs: string;
  commandPrefix: string;     // e.g. 'cd /d' for cmd
  icon: string;              // lucide icon name
  enabled: boolean;
  isDefault: boolean;
  isBuiltIn: boolean;
  order: number;
}

// ── Editor Definition ──────────────────────────────────────

export interface EditorDefinition {
  id: string;
  name: string;
  executable: string;
  openCommandTemplate: string; // e.g. 'code "{path}"'
  icon: string;
  enabled: boolean;
  isDefault: boolean;
  isBuiltIn: boolean;
  order: number;
}

// ── Tool Definition (File Managers, Browsers, etc.) ────────

export interface ToolDefinition {
  id: string;
  name: string;
  category: string;           // 'file-manager', 'browser', 'git-tool', etc.
  executable: string;
  commandTemplate: string;
  icon: string;
  enabled: boolean;
  isDefault: boolean;
  isBuiltIn: boolean;
  order: number;
}

// ── Launch Set ─────────────────────────────────────────────

export interface LaunchSet {
  id: string;
  name: string;
  description: string;
  projectIds: string[];
  createdAt: number;
  lastUsedAt: number;
}

// ── Keyboard Shortcut ──────────────────────────────────────

export type ShortcutScope =
  | 'global'
  | 'projects'
  | 'selection'
  | 'navigation'
  | 'command-palette';

export interface ShortcutDefinition {
  id: string;
  actionId: string;
  keyCombo: string;           // e.g. 'ctrl+k', 'shift+?'
  scope: ShortcutScope;
  description: string;
  isBuiltIn: boolean;
}

// ── User Settings ──────────────────────────────────────────

export type ThemeName =
  | 'system'
  | 'light'
  | 'dark'
  | 'midnight'
  | 'graphite'
  | 'slate'
  | 'paper'
  | 'nordic'
  | 'forest'
  | 'ocean'
  | 'plum'
  | 'amber'
  | 'monochrome';

export type FontName =
  | 'inter'
  | 'jakarta'
  | 'geist'
  | 'outfit'
  | 'mono';

export type DensityMode = 'comfortable' | 'compact';

export type ViewMode = 'grid' | 'list';

export type SortField =
  | 'name'
  | 'updatedAt'
  | 'createdAt'
  | 'status'
  | 'localPath';

export type SortDirection = 'asc' | 'desc';

export interface UserSettings {
  theme: ThemeName;
  font: FontName;
  density: DensityMode;
  defaultView: ViewMode;
  defaultTerminalId: string;
  defaultEditorId: string;
  defaultFileManagerId: string;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  confirmDestructive: boolean;
  firstRunCompleted: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  sidebarCollapsed: boolean;
}

// ── Tag Entity ─────────────────────────────────────────────

export interface Tag {
  id: string;
  name: string;
  color: string;              // hsl or hex, theme-aware
  order: number;
}

// ── Status Config ──────────────────────────────────────────

export interface StatusConfig {
  id: ProjectStatus;
  label: string;
  color: string;
  icon: string;               // lucide icon name
  order: number;
}

// ── Export / Import Schema ─────────────────────────────────

export interface ExportData {
  version: number;
  exportedAt: number;
  projects: Project[];
  commands: CommandDefinition[];
  terminals: TerminalDefinition[];
  editors: EditorDefinition[];
  tools: ToolDefinition[];
  launchSets: LaunchSet[];
  shortcuts: ShortcutDefinition[];
  tags: Tag[];
  settings: UserSettings;
}
