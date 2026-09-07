/* ============================================================
   ProjectShelf IndexedDB Database
   Persistent local storage using idb wrapper.
   Handles connection, schema migration, and seeding defaults.
   ============================================================ */

import { openDB, type IDBPDatabase } from 'idb';
import type {
  Project,
  CommandDefinition,
  TerminalDefinition,
  EditorDefinition,
  ToolDefinition,
  LaunchSet,
  ShortcutDefinition,
  Tag,
  UserSettings,
} from './schema';
import {
  DEFAULT_TERMINALS,
  DEFAULT_EDITORS,
  DEFAULT_TOOLS,
  DEFAULT_COMMANDS,
  DEFAULT_SHORTCUTS,
  DEFAULT_SETTINGS,
} from './presets';

// ── Database Constants ─────────────────────────────────────

const DB_NAME = 'projectshelf';
const DB_VERSION = 1;

// ── Store Names ────────────────────────────────────────────

export const STORES = {
  projects: 'projects',
  commands: 'commands',
  terminals: 'terminals',
  editors: 'editors',
  tools: 'tools',
  launchSets: 'launchSets',
  shortcuts: 'shortcuts',
  tags: 'tags',
  settings: 'settings',
} as const;

// ── Database Schema Type ───────────────────────────────────

interface ProjectShelfDB {
  projects: {
    key: string;
    value: Project;
    indexes: {
      'by-name': string;
      'by-status': string;
      'by-updatedAt': number;
      'by-createdAt': number;
    };
  };
  commands: {
    key: string;
    value: CommandDefinition;
    indexes: { 'by-category': string; 'by-order': number };
  };
  terminals: {
    key: string;
    value: TerminalDefinition;
    indexes: { 'by-order': number };
  };
  editors: {
    key: string;
    value: EditorDefinition;
    indexes: { 'by-order': number };
  };
  tools: {
    key: string;
    value: ToolDefinition;
    indexes: { 'by-category': string; 'by-order': number };
  };
  launchSets: {
    key: string;
    value: LaunchSet;
    indexes: { 'by-lastUsedAt': number };
  };
  shortcuts: {
    key: string;
    value: ShortcutDefinition;
    indexes: { 'by-scope': string; 'by-actionId': string };
  };
  tags: {
    key: string;
    value: Tag;
    indexes: { 'by-name': string; 'by-order': number };
  };
  settings: {
    key: string;
    value: UserSettings;
  };
}

// ── Database Connection ────────────────────────────────────

// The connection is cached as a *promise*, not as a resolved instance.
// Several components hit the database on mount, so caching the resolved
// value would let every one of them run openDB + seedDefaults in parallel
// before the first call finished, seeding the presets multiple times.
let dbPromise: Promise<IDBPDatabase<ProjectShelfDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<ProjectShelfDB>> {
  if (!dbPromise) {
    dbPromise = openAndSeed().catch((err) => {
      // Let a later call retry instead of caching the failure forever.
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

async function openAndSeed(): Promise<IDBPDatabase<ProjectShelfDB>> {
  const db = await openDB<ProjectShelfDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        // Projects store
        const projectStore = db.createObjectStore(STORES.projects, { keyPath: 'id' });
        projectStore.createIndex('by-name', 'name');
        projectStore.createIndex('by-status', 'status');
        projectStore.createIndex('by-updatedAt', 'updatedAt');
        projectStore.createIndex('by-createdAt', 'createdAt');

        // Commands store
        const commandStore = db.createObjectStore(STORES.commands, { keyPath: 'id' });
        commandStore.createIndex('by-category', 'category');
        commandStore.createIndex('by-order', 'order');

        // Terminals store
        const terminalStore = db.createObjectStore(STORES.terminals, { keyPath: 'id' });
        terminalStore.createIndex('by-order', 'order');

        // Editors store
        const editorStore = db.createObjectStore(STORES.editors, { keyPath: 'id' });
        editorStore.createIndex('by-order', 'order');

        // Tools store
        const toolStore = db.createObjectStore(STORES.tools, { keyPath: 'id' });
        toolStore.createIndex('by-category', 'category');
        toolStore.createIndex('by-order', 'order');

        // Launch Sets store
        const launchSetStore = db.createObjectStore(STORES.launchSets, { keyPath: 'id' });
        launchSetStore.createIndex('by-lastUsedAt', 'lastUsedAt');

        // Shortcuts store
        const shortcutStore = db.createObjectStore(STORES.shortcuts, { keyPath: 'id' });
        shortcutStore.createIndex('by-scope', 'scope');
        shortcutStore.createIndex('by-actionId', 'actionId');

        // Tags store
        const tagStore = db.createObjectStore(STORES.tags, { keyPath: 'id' });
        tagStore.createIndex('by-name', 'name');
        tagStore.createIndex('by-order', 'order');

        // Settings store (single record keyed by 'user')
        db.createObjectStore(STORES.settings);
      }
    },
  });

  // Seed defaults if empty
  await seedDefaults(db);

  return db;
}

// ── Seed Defaults ──────────────────────────────────────────

/**
 * Write a preset collection into an empty store.
 * Uses put() rather than add() so a second tab racing the same seed
 * overwrites identical records instead of aborting the transaction.
 */
async function seedStore<K extends 'terminals' | 'editors' | 'tools' | 'commands' | 'shortcuts'>(
  db: IDBPDatabase<ProjectShelfDB>,
  storeName: K,
  records: ProjectShelfDB[K]['value'][]
): Promise<void> {
  const count = await db.count(storeName);
  if (count > 0) return;

  const tx = db.transaction(storeName, 'readwrite');
  for (const record of records) {
    await tx.store.put(record);
  }
  await tx.done;
}

async function seedDefaults(db: IDBPDatabase<ProjectShelfDB>): Promise<void> {
  const existingSettings = await db.get(STORES.settings, 'user');
  if (!existingSettings) {
    await db.put(STORES.settings, DEFAULT_SETTINGS, 'user');
  }

  await seedStore(db, STORES.terminals, DEFAULT_TERMINALS);
  await seedStore(db, STORES.editors, DEFAULT_EDITORS);
  await seedStore(db, STORES.tools, DEFAULT_TOOLS);
  await seedStore(db, STORES.commands, DEFAULT_COMMANDS);
  await seedStore(db, STORES.shortcuts, DEFAULT_SHORTCUTS);
}

// ── Utility: Generate ID ───────────────────────────────────

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

// ══════════════════════════════════════════════════════════
//  CRUD Operations
// ══════════════════════════════════════════════════════════

// ── Projects ───────────────────────────────────────────────

export async function getAllProjects(): Promise<Project[]> {
  const db = await getDB();
  return db.getAll(STORES.projects);
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDB();
  return db.get(STORES.projects, id);
}

export async function addProject(project: Project): Promise<void> {
  const db = await getDB();
  await db.add(STORES.projects, project);
}

export async function updateProject(project: Project): Promise<void> {
  const db = await getDB();
  await db.put(STORES.projects, project);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.projects, id);
}

export async function deleteProjects(ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORES.projects, 'readwrite');
  for (const id of ids) {
    await tx.store.delete(id);
  }
  await tx.done;
}

// ── Commands ───────────────────────────────────────────────

export async function getAllCommands(): Promise<CommandDefinition[]> {
  const db = await getDB();
  return db.getAll(STORES.commands);
}

export async function addCommand(command: CommandDefinition): Promise<void> {
  const db = await getDB();
  await db.add(STORES.commands, command);
}

export async function updateCommand(command: CommandDefinition): Promise<void> {
  const db = await getDB();
  await db.put(STORES.commands, command);
}

export async function deleteCommand(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.commands, id);
}

// ── Terminals ──────────────────────────────────────────────

export async function getAllTerminals(): Promise<TerminalDefinition[]> {
  const db = await getDB();
  return db.getAll(STORES.terminals);
}

export async function addTerminal(terminal: TerminalDefinition): Promise<void> {
  const db = await getDB();
  await db.add(STORES.terminals, terminal);
}

export async function updateTerminal(terminal: TerminalDefinition): Promise<void> {
  const db = await getDB();
  await db.put(STORES.terminals, terminal);
}

export async function deleteTerminal(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.terminals, id);
}

// ── Editors ────────────────────────────────────────────────

export async function getAllEditors(): Promise<EditorDefinition[]> {
  const db = await getDB();
  return db.getAll(STORES.editors);
}

export async function addEditor(editor: EditorDefinition): Promise<void> {
  const db = await getDB();
  await db.add(STORES.editors, editor);
}

export async function updateEditor(editor: EditorDefinition): Promise<void> {
  const db = await getDB();
  await db.put(STORES.editors, editor);
}

export async function deleteEditor(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.editors, id);
}

// ── Tools ──────────────────────────────────────────────────

export async function getAllTools(): Promise<ToolDefinition[]> {
  const db = await getDB();
  return db.getAll(STORES.tools);
}

export async function addTool(tool: ToolDefinition): Promise<void> {
  const db = await getDB();
  await db.add(STORES.tools, tool);
}

export async function updateTool(tool: ToolDefinition): Promise<void> {
  const db = await getDB();
  await db.put(STORES.tools, tool);
}

export async function deleteTool(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.tools, id);
}

// ── Launch Sets ────────────────────────────────────────────

export async function getAllLaunchSets(): Promise<LaunchSet[]> {
  const db = await getDB();
  return db.getAll(STORES.launchSets);
}

export async function getLaunchSet(id: string): Promise<LaunchSet | undefined> {
  const db = await getDB();
  return db.get(STORES.launchSets, id);
}

export async function addLaunchSet(launchSet: LaunchSet): Promise<void> {
  const db = await getDB();
  await db.add(STORES.launchSets, launchSet);
}

export async function updateLaunchSet(launchSet: LaunchSet): Promise<void> {
  const db = await getDB();
  await db.put(STORES.launchSets, launchSet);
}

export async function deleteLaunchSet(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.launchSets, id);
}

// ── Shortcuts ──────────────────────────────────────────────

export async function getAllShortcuts(): Promise<ShortcutDefinition[]> {
  const db = await getDB();
  return db.getAll(STORES.shortcuts);
}

export async function updateShortcut(shortcut: ShortcutDefinition): Promise<void> {
  const db = await getDB();
  await db.put(STORES.shortcuts, shortcut);
}

export async function deleteShortcut(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.shortcuts, id);
}

export async function resetShortcuts(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORES.shortcuts, 'readwrite');
  await tx.store.clear();
  for (const shortcut of DEFAULT_SHORTCUTS) {
    await tx.store.add(shortcut);
  }
  await tx.done;
}

// ── Tags ───────────────────────────────────────────────────

export async function getAllTags(): Promise<Tag[]> {
  const db = await getDB();
  return db.getAll(STORES.tags);
}

export async function addTag(tag: Tag): Promise<void> {
  const db = await getDB();
  await db.add(STORES.tags, tag);
}

export async function updateTag(tag: Tag): Promise<void> {
  const db = await getDB();
  await db.put(STORES.tags, tag);
}

export async function deleteTag(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.tags, id);
}

// ── Settings ───────────────────────────────────────────────

export async function getSettings(): Promise<UserSettings> {
  const db = await getDB();
  const settings = await db.get(STORES.settings, 'user');
  // Merge over the defaults so records written by an earlier version pick
  // up newly added fields without a schema migration.
  return settings ? { ...DEFAULT_SETTINGS, ...settings } : DEFAULT_SETTINGS;
}

export async function updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const db = await getDB();
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await db.put(STORES.settings, updated, 'user');
  return updated;
}

// ── Danger Zone ────────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const storeNames = Object.values(STORES);
  for (const storeName of storeNames) {
    const tx = db.transaction(storeName, 'readwrite');
    await tx.store.clear();
    await tx.done;
  }
  // Re-seed defaults
  await seedDefaults(db);
}
