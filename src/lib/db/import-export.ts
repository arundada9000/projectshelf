/* ============================================================
   ProjectShelf Import / Export
   Full JSON backup and restoration with schema validation,
   duplicate detection, and version checking.
   ============================================================ */

import type { ExportData } from './schema';
import {
  getDB,
  STORES,
  getAllProjects,
  getAllCommands,
  getAllTerminals,
  getAllEditors,
  getAllTools,
  getAllLaunchSets,
  getAllShortcuts,
  getAllTags,
  getSettings,
} from './index';

// ── Current Schema Version ─────────────────────────────────

const SCHEMA_VERSION = 1;

// ── Export All Data ────────────────────────────────────────

export async function exportAllData(): Promise<ExportData> {
  const [
    projects,
    commands,
    terminals,
    editors,
    tools,
    launchSets,
    shortcuts,
    tags,
    settings,
  ] = await Promise.all([
    getAllProjects(),
    getAllCommands(),
    getAllTerminals(),
    getAllEditors(),
    getAllTools(),
    getAllLaunchSets(),
    getAllShortcuts(),
    getAllTags(),
    getSettings(),
  ]);

  return {
    version: SCHEMA_VERSION,
    exportedAt: Date.now(),
    projects,
    commands,
    terminals,
    editors,
    tools,
    launchSets,
    shortcuts,
    tags,
    settings,
  };
}

// ── Download Export as JSON File ────────────────────────────

export function downloadJSON(data: ExportData, filename?: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `projectshelf-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Validation Result ──────────────────────────────────────

export interface ImportValidation {
  valid: boolean;
  version: number | null;
  counts: {
    projects: number;
    commands: number;
    terminals: number;
    editors: number;
    tools: number;
    launchSets: number;
    shortcuts: number;
    tags: number;
  };
  errors: string[];
  warnings: string[];
}

// ── Validate Import Data ───────────────────────────────────

export function validateImportData(raw: unknown): ImportValidation {
  const result: ImportValidation = {
    valid: false,
    version: null,
    counts: {
      projects: 0,
      commands: 0,
      terminals: 0,
      editors: 0,
      tools: 0,
      launchSets: 0,
      shortcuts: 0,
      tags: 0,
    },
    errors: [],
    warnings: [],
  };

  if (!raw || typeof raw !== 'object') {
    result.errors.push('Import data is not a valid object.');
    return result;
  }

  const data = raw as Record<string, unknown>;

  // Version check
  if (typeof data.version !== 'number') {
    result.errors.push('Missing or invalid schema version.');
    return result;
  }

  result.version = data.version;

  if (data.version > SCHEMA_VERSION) {
    result.errors.push(
      `Import version (${data.version}) is newer than the application supports (${SCHEMA_VERSION}). Please update the application.`
    );
    return result;
  }

  // Validate arrays
  const arrayFields = [
    'projects',
    'commands',
    'terminals',
    'editors',
    'tools',
    'launchSets',
    'shortcuts',
    'tags',
  ] as const;

  for (const field of arrayFields) {
    if (data[field] !== undefined) {
      if (!Array.isArray(data[field])) {
        result.errors.push(`"${field}" must be an array.`);
      } else {
        const arr = data[field] as Array<Record<string, unknown>>;
        result.counts[field] = arr.length;

        // Check each item has an id
        const missingIds = arr.filter((item) => !item.id);
        if (missingIds.length > 0) {
          result.warnings.push(
            `${missingIds.length} item(s) in "${field}" are missing an ID and will be skipped.`
          );
        }
      }
    }
  }

  // Settings validation
  if (data.settings !== undefined && typeof data.settings !== 'object') {
    result.warnings.push('Settings data is invalid and will be skipped.');
  }

  if (result.errors.length === 0) {
    result.valid = true;
  }

  return result;
}

// ── Import Data ────────────────────────────────────────────

export interface ImportResult {
  success: boolean;
  imported: {
    projects: number;
    commands: number;
    terminals: number;
    editors: number;
    tools: number;
    launchSets: number;
    shortcuts: number;
    tags: number;
  };
  skipped: number;
  errors: string[];
}

export async function importData(
  data: ExportData,
  mode: 'merge' | 'replace' = 'merge'
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    imported: {
      projects: 0,
      commands: 0,
      terminals: 0,
      editors: 0,
      tools: 0,
      launchSets: 0,
      shortcuts: 0,
      tags: 0,
    },
    skipped: 0,
    errors: [],
  };

  try {
    const db = await getDB();

    // If replace mode, clear existing data first
    if (mode === 'replace') {
      const storeNames = Object.values(STORES);
      for (const storeName of storeNames) {
        const tx = db.transaction(storeName, 'readwrite');
        await tx.store.clear();
        await tx.done;
      }
    }

    // Import each entity type
    const importStore = async <T extends { id: string }>(
      storeName: string,
      items: T[] | undefined,
      field: keyof typeof result.imported
    ) => {
      if (!items || items.length === 0) return;

      const tx = db.transaction(storeName, 'readwrite');
      for (const item of items) {
        if (!item.id) {
          result.skipped++;
          continue;
        }
        try {
          if (mode === 'merge') {
            await tx.store.put(item);
          } else {
            await tx.store.add(item);
          }
          result.imported[field]++;
        } catch {
          result.skipped++;
        }
      }
      await tx.done;
    };

    await importStore(STORES.projects, data.projects, 'projects');
    await importStore(STORES.commands, data.commands, 'commands');
    await importStore(STORES.terminals, data.terminals, 'terminals');
    await importStore(STORES.editors, data.editors, 'editors');
    await importStore(STORES.tools, data.tools, 'tools');
    await importStore(STORES.launchSets, data.launchSets, 'launchSets');
    await importStore(STORES.shortcuts, data.shortcuts, 'shortcuts');
    await importStore(STORES.tags, data.tags, 'tags');

    // Import settings
    if (data.settings && typeof data.settings === 'object') {
      await db.put(STORES.settings, data.settings, 'user');
    }

    result.success = true;
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : 'An unexpected error occurred during import.'
    );
  }

  return result;
}

// ── Read File as JSON ──────────────────────────────────────

export function readFileAsJSON(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        resolve(parsed);
      } catch {
        reject(new Error('Failed to parse JSON file. Please check the file format.'));
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file.'));
    };
    reader.readAsText(file);
  });
}
