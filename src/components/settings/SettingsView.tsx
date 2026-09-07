'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Palette,
  Terminal,
  Code2,
  Keyboard,
  Database,
  Download,
  Upload,
  Trash2,
  SlidersHorizontal,
  AppWindow,
  SquareTerminal,
  AlertTriangle,
} from 'lucide-react';
import type {
  ThemeName,
  FontName,
  DensityMode,
  FontSizeScale,
  IconSizeScale,
  ViewMode,
  UserSettings,
  TerminalDefinition,
  EditorDefinition,
  ToolDefinition,
  ExportData,
} from '@/lib/db/schema';
import {
  getSettings,
  updateSettings,
  clearAllData,
  getAllTerminals,
  addTerminal,
  updateTerminal,
  deleteTerminal,
  getAllEditors,
  addEditor,
  updateEditor,
  deleteEditor,
  getAllTools,
  addTool,
  updateTool,
  deleteTool,
  generateId,
} from '@/lib/db';
import {
  exportAllData,
  downloadJSON,
  validateImportData,
  importData,
  type ImportValidation,
} from '@/lib/db/import-export';
import { Button, Switch, Select, Modal, useToast } from '@/components/ui';
import { applyAppearance } from '@/lib/appearance';
import { setSoundEnabled } from '@/lib/sound';
import { setHapticsEnabled } from '@/lib/haptics';
import { CollectionSection, type CollectionField } from './sections/CollectionSection';
import { CommandsSection } from './sections/CommandsSection';
import { ShortcutsSection } from './sections/ShortcutsSection';
import styles from './Settings.module.css';

// ── Field Definitions for Configurable Collections ─────────

const TERMINAL_FIELDS: CollectionField[] = [
  {
    key: 'executable',
    label: 'Executable',
    placeholder: 'powershell.exe',
    helpText: 'The program launched for this terminal.',
  },
  {
    key: 'commandPrefix',
    label: 'Directory change prefix',
    placeholder: 'cd',
    helpText: 'How this shell changes directory. Command Prompt uses "cd /d".',
    advanced: true,
  },
  {
    key: 'defaultArgs',
    label: 'Default arguments',
    placeholder: '-NoExit',
    advanced: true,
  },
];

const EDITOR_FIELDS: CollectionField[] = [
  {
    key: 'openCommandTemplate',
    label: 'Open command',
    placeholder: 'code "{path}"',
    helpText: 'Use {path} for the project folder.',
  },
  {
    key: 'executable',
    label: 'Executable',
    placeholder: 'code',
    advanced: true,
  },
];

const TOOL_FIELDS: CollectionField[] = [
  {
    key: 'category',
    label: 'Category',
    placeholder: 'file-manager',
    helpText: 'Free text, for example file-manager, browser, or git-tool.',
  },
  {
    key: 'commandTemplate',
    label: 'Command',
    placeholder: 'explorer "{path}"',
    helpText: 'Use {path}, {name}, {github}, or {url}.',
  },
  {
    key: 'executable',
    label: 'Executable',
    placeholder: 'explorer.exe',
    advanced: true,
  },
];

// ── Theme Definitions ──────────────────────────────────────

const THEMES: { id: ThemeName; label: string; bg: string; surface: string; accent: string }[] = [
  { id: 'system', label: 'System', bg: '#ffffff', surface: '#18181b', accent: '#3b82f6' },
  { id: 'light', label: 'Light', bg: '#ffffff', surface: '#f4f4f5', accent: '#3b82f6' },
  { id: 'dark', label: 'Dark', bg: '#09090b', surface: '#18181b', accent: '#3b82f6' },
  { id: 'midnight', label: 'Midnight', bg: '#020617', surface: '#0f172a', accent: '#6366f1' },
  { id: 'graphite', label: 'Graphite', bg: '#1a1a1e', surface: '#232328', accent: '#a1a1aa' },
  { id: 'slate', label: 'Slate', bg: '#0f172a', surface: '#1e293b', accent: '#38bdf8' },
  { id: 'paper', label: 'Paper', bg: '#faf8f5', surface: '#f0ece4', accent: '#b45309' },
  { id: 'nordic', label: 'Nordic', bg: '#2e3440', surface: '#3b4252', accent: '#88c0d0' },
  { id: 'forest', label: 'Forest', bg: '#1a1f16', surface: '#252b1f', accent: '#84cc16' },
  { id: 'ocean', label: 'Ocean', bg: '#0c1222', surface: '#162032', accent: '#22d3ee' },
  { id: 'plum', label: 'Plum', bg: '#1a0f1f', surface: '#261628', accent: '#d946ef' },
  { id: 'amber', label: 'Amber', bg: '#1c1408', surface: '#2a1f0e', accent: '#f59e0b' },
  { id: 'monochrome', label: 'Monochrome', bg: '#111111', surface: '#1a1a1a', accent: '#e5e5e5' },
];

// ── Font Definitions ───────────────────────────────────────

const FONTS: { id: FontName; label: string; sample: string; family: string }[] = [
  { id: 'inter', label: 'Inter', sample: 'Aa', family: 'var(--font-inter)' },
  { id: 'jakarta', label: 'Jakarta Sans', sample: 'Aa', family: 'var(--font-jakarta)' },
  { id: 'geist', label: 'Geist', sample: 'Aa', family: 'var(--font-geist)' },
  { id: 'outfit', label: 'Outfit', sample: 'Aa', family: 'var(--font-outfit)' },
  { id: 'mono', label: 'JetBrains Mono', sample: 'Aa', family: 'var(--font-jetbrains-mono)' },
];

// ── Settings Sections ──────────────────────────────────────

type SettingsTab =
  | 'general'
  | 'appearance'
  | 'terminals'
  | 'editors'
  | 'applications'
  | 'commands'
  | 'shortcuts'
  | 'data';

interface SettingsTabDef {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
}

const SETTINGS_TABS: SettingsTabDef[] = [
  { id: 'general', label: 'General', icon: <SlidersHorizontal size={16} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
  { id: 'terminals', label: 'Terminals', icon: <Terminal size={16} /> },
  { id: 'editors', label: 'Editors', icon: <Code2 size={16} /> },
  { id: 'applications', label: 'Applications', icon: <AppWindow size={16} /> },
  { id: 'commands', label: 'Commands', icon: <SquareTerminal size={16} /> },
  { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard size={16} /> },
  { id: 'data', label: 'Data', icon: <Database size={16} /> },
];

// ── Settings View ──────────────────────────────────────────

export function SettingsView() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [terminals, setTerminals] = useState<TerminalDefinition[]>([]);
  const [editors, setEditors] = useState<EditorDefinition[]>([]);
  const [fileManagers, setFileManagers] = useState<ToolDefinition[]>([]);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import is a two-step flow: validate and show what will happen, then apply.
  const [pendingImport, setPendingImport] = useState<{
    raw: unknown;
    validation: ImportValidation;
  } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Local storage usage, refreshed when the data tab opens or data changes.
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageQuota, setStorageQuota] = useState(0);

  useEffect(() => {
    if (activeTab !== 'data') return;
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return;
    let cancelled = false;
    navigator.storage.estimate().then((estimate) => {
      if (cancelled) return;
      setStorageUsed(estimate.usage ?? 0);
      setStorageQuota(estimate.quota ?? 0);
    });
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  /** Reload the tool collections that the default pickers depend on. */
  const reloadTools = useCallback(() => {
    Promise.all([getAllTerminals(), getAllEditors(), getAllTools()]).then(
      ([t, e, tools]) => {
        setTerminals(t);
        setEditors(e);
        setFileManagers(tools);
      }
    );
  }, []);

  useEffect(() => {
    getSettings().then(setSettings);
    reloadTools();
  }, [reloadTools]);

  const update = useCallback(
    async (partial: Partial<UserSettings>) => {
      const updated = await updateSettings(partial);
      setSettings(updated);

      setSoundEnabled(updated.soundEnabled);
      setHapticsEnabled(updated.hapticsEnabled);

      // Apply to the document and mirror to localStorage so the choice
      // survives a reload.
      applyAppearance({
        theme: partial.theme,
        font: partial.font,
        density: partial.density,
        fontSize: partial.fontSize,
        iconSize: partial.iconSize,
      });
    },
    []
  );

  const handleExport = useCallback(async () => {
    try {
      const data = await exportAllData();
      downloadJSON(data);
      toast('Data exported successfully', 'success');
    } catch {
      toast('Export failed', 'error');
    }
  }, [toast]);

  /** Step one: read and validate, then show the user what the file holds. */
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const raw = JSON.parse(await file.text());
      setPendingImport({ raw, validation: validateImportData(raw) });
    } catch {
      toast('That file is not valid JSON', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /** Step two: apply, once the user has seen the record counts. */
  const handleConfirmImport = useCallback(async () => {
    if (!pendingImport) return;
    try {
      // Shape already checked by validateImportData before this dialog opened.
      const result = await importData(pendingImport.raw as ExportData, 'merge');
      setPendingImport(null);
      setSettings(await getSettings());
      reloadTools();
      toast(
        `Imported ${result.imported.projects} projects and ${result.imported.launchSets} launch sets`,
        'success'
      );
    } catch {
      toast('Import failed. Your existing data is unchanged.', 'error');
    }
  }, [pendingImport, toast, reloadTools]);

  const handleClearData = useCallback(async () => {
    try {
      await clearAllData();
      setConfirmClear(false);
      setSettings(await getSettings());
      reloadTools();
      toast('All data cleared and presets restored', 'success');
    } catch {
      toast('Could not clear the data', 'error');
    }
  }, [toast, reloadTools]);

  if (!settings) return null;

  const storagePercent = storageQuota > 0 ? (storageUsed / storageQuota) * 100 : 0;

  return (
    <div className={styles.settingsLayout}>
      {/* Sidebar Nav */}
      <nav className={styles.settingsNav} aria-label="Settings sections">
        {SETTINGS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`${styles.settingsNavItem} ${
              activeTab === tab.id ? styles.settingsNavItemActive : ''
            }`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className={styles.settingsContent}>
        {activeTab === 'appearance' && (
          <>
            {/* Theme */}
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>Theme</h3>
              <p className={styles.settingsSectionDesc}>
                Twelve palettes, plus System to follow your operating system.
              </p>
              <div className={styles.themeGrid}>
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    className={`${styles.themeCard} ${settings.theme === theme.id ? styles.themeCardActive : ''}`}
                    onClick={() => update({ theme: theme.id })}
                  >
                    <div className={styles.themePreview}>
                      <div className={styles.themePreviewBg} style={{ backgroundColor: theme.bg }} />
                      <div className={styles.themePreviewSurface} style={{ backgroundColor: theme.surface }} />
                      <div className={styles.themePreviewAccent} style={{ backgroundColor: theme.accent }} />
                    </div>
                    <span className={styles.themeLabel}>{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font */}
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>Font</h3>
              <p className={styles.settingsSectionDesc}>
                Select a font family for the interface. Monospace font for code is always JetBrains Mono.
              </p>
              <div className={styles.fontGrid}>
                {FONTS.map((font) => (
                  <button
                    key={font.id}
                    type="button"
                    className={`${styles.fontCard} ${settings.font === font.id ? styles.fontCardActive : ''}`}
                    onClick={() => update({ font: font.id })}
                    style={{ fontFamily: font.family }}
                  >
                    <span className={styles.fontSample} style={{ fontFamily: font.family }}>
                      {font.sample}
                    </span>
                    <span className={styles.fontName}>{font.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Density */}
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>Density</h3>
              <p className={styles.settingsSectionDesc}>
                Control the spacing and sizing of interface elements.
              </p>
              <div className={styles.settingsRow}>
                <div className={styles.settingsRowInfo}>
                  <span className={styles.settingsRowLabel}>Interface Density</span>
                  <span className={styles.settingsRowDesc}>Comfortable provides more whitespace, Compact fits more content</span>
                </div>
                <div className={styles.settingsRowControl}>
                  <Select
                    options={[
                      { value: 'comfortable', label: 'Comfortable' },
                      { value: 'compact', label: 'Compact' },
                    ]}
                    value={settings.density}
                    onChange={(v) => update({ density: v as DensityMode })}
                  />
                </div>
              </div>

              {/* Font size */}
              <div className={styles.settingsRow}>
                <div className={styles.settingsRowInfo}>
                  <span className={styles.settingsRowLabel}>Font size</span>
                  <span className={styles.settingsRowDesc}>Smaller or larger text across the whole interface</span>
                </div>
                <div className={styles.settingsRowControl}>
                  <Select
                    options={[
                      { value: 'small', label: 'Small' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'large', label: 'Large' },
                    ]}
                    value={settings.fontSize}
                    onChange={(v) => update({ fontSize: v as FontSizeScale })}
                  />
                </div>
              </div>

              {/* Icon size */}
              <div className={styles.settingsRow}>
                <div className={styles.settingsRowInfo}>
                  <span className={styles.settingsRowLabel}>Icon size</span>
                  <span className={styles.settingsRowDesc}>Scales all interface icons while keeping their relative sizes</span>
                </div>
                <div className={styles.settingsRowControl}>
                  <Select
                    options={[
                      { value: 'small', label: 'Small' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'large', label: 'Large' },
                    ]}
                    value={settings.iconSize}
                    onChange={(v) => update({ iconSize: v as IconSizeScale })}
                  />
                </div>
              </div>
            </div>

            {/* Behavior */}
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>Behavior</h3>
              <div className={styles.settingsRow}>
                <div className={styles.settingsRowInfo}>
                  <span className={styles.settingsRowLabel}>Confirm destructive actions</span>
                  <span className={styles.settingsRowDesc}>Show a confirmation dialog before deleting projects</span>
                </div>
                <div className={styles.settingsRowControl}>
                  <Switch
                    checked={settings.confirmDestructive}
                    onChange={(v) => update({ confirmDestructive: v })}
                  />
                </div>
              </div>
              <div className={styles.settingsRow}>
                <div className={styles.settingsRowInfo}>
                  <span className={styles.settingsRowLabel}>Sound feedback</span>
                  <span className={styles.settingsRowDesc}>
                    Play a short, subtle sound after important actions
                  </span>
                </div>
                <div className={styles.settingsRowControl}>
                  <Switch
                    checked={settings.soundEnabled}
                    onChange={(v) => update({ soundEnabled: v })}
                  />
                </div>
              </div>
              <div className={styles.settingsRow}>
                <div className={styles.settingsRowInfo}>
                  <span className={styles.settingsRowLabel}>Haptic feedback</span>
                  <span className={styles.settingsRowDesc}>
                    Vibrate briefly on meaningful actions (touch devices only)
                  </span>
                </div>
                <div className={styles.settingsRowControl}>
                  <Switch
                    checked={settings.hapticsEnabled}
                    onChange={(v) => update({ hapticsEnabled: v })}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'general' && (
          <>
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>Defaults</h3>
              <p className={styles.settingsSectionDesc}>
                Used whenever an action does not specify a tool. A project can override
                these, and any single action can be run with a different tool through
                &quot;Open with&quot;.
              </p>

              <div className={styles.settingsRow}>
                <div className={styles.settingsRowInfo}>
                  <span className={styles.settingsRowLabel}>Default editor</span>
                  <span className={styles.settingsRowDesc}>
                    Used by the Open in editor action
                  </span>
                </div>
                <div className={styles.settingsRowControl}>
                  <Select
                    options={editors
                      .filter((e) => e.enabled)
                      .map((e) => ({ value: e.id, label: e.name }))}
                    value={settings.defaultEditorId}
                    onChange={(v) => update({ defaultEditorId: v })}
                  />
                </div>
              </div>

              <div className={styles.settingsRow}>
                <div className={styles.settingsRowInfo}>
                  <span className={styles.settingsRowLabel}>Default terminal</span>
                  <span className={styles.settingsRowDesc}>
                    Used by the Open in terminal action
                  </span>
                </div>
                <div className={styles.settingsRowControl}>
                  <Select
                    options={terminals
                      .filter((t) => t.enabled)
                      .map((t) => ({ value: t.id, label: t.name }))}
                    value={settings.defaultTerminalId}
                    onChange={(v) => update({ defaultTerminalId: v })}
                  />
                </div>
              </div>

              <div className={styles.settingsRow}>
                <div className={styles.settingsRowInfo}>
                  <span className={styles.settingsRowLabel}>Default file manager</span>
                  <span className={styles.settingsRowDesc}>
                    Used by the Open folder action
                  </span>
                </div>
                <div className={styles.settingsRowControl}>
                  <Select
                    options={fileManagers
                      .filter((t) => t.enabled)
                      .map((t) => ({ value: t.id, label: t.name }))}
                    value={settings.defaultFileManagerId}
                    onChange={(v) => update({ defaultFileManagerId: v })}
                  />
                </div>
              </div>
            </div>

            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>Behaviour</h3>

              <div className={styles.settingsRow}>
                <div className={styles.settingsRowInfo}>
                  <span className={styles.settingsRowLabel}>
                    Confirm before deleting
                  </span>
                  <span className={styles.settingsRowDesc}>
                    Ask first when deleting projects, launch sets, or all local data
                  </span>
                </div>
                <div className={styles.settingsRowControl}>
                  <Switch
                    checked={settings.confirmDestructive}
                    onChange={(v) => update({ confirmDestructive: v })}
                    ariaLabel="Confirm before deleting"
                  />
                </div>
              </div>

              <div className={styles.settingsRow}>
                <div className={styles.settingsRowInfo}>
                  <span className={styles.settingsRowLabel}>Default project view</span>
                  <span className={styles.settingsRowDesc}>
                    The layout the projects view opens in
                  </span>
                </div>
                <div className={styles.settingsRowControl}>
                  <Select
                    options={[
                      { value: 'grid', label: 'Grid' },
                      { value: 'list', label: 'List' },
                    ]}
                    value={settings.defaultView}
                    onChange={(v) => update({ defaultView: v as ViewMode })}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'terminals' && (
          <CollectionSection<TerminalDefinition>
            title="Terminals"
            description="Shells the command generator can target. The presets assume Windows; add your own for macOS or Linux."
            itemNoun="terminal"
            metaKey="executable"
            emptyMessage="No terminals configured. Add one to generate terminal commands."
            supportsDefault
            fields={TERMINAL_FIELDS}
            load={getAllTerminals}
            create={addTerminal}
            update={updateTerminal}
            remove={deleteTerminal}
            makeBlank={(order) => ({
              id: generateId(),
              name: '',
              executable: '',
              defaultArgs: '',
              commandPrefix: '',
              icon: 'terminal',
              enabled: true,
              isDefault: false,
              isBuiltIn: false,
              order,
            })}
            onDefaultChange={(id) => update({ defaultTerminalId: id })}
            onChanged={reloadTools}
          />
        )}

        {activeTab === 'editors' && (
          <CollectionSection<EditorDefinition>
            title="Editors"
            description="Editors and IDEs you open projects with. Add any command line launcher."
            itemNoun="editor"
            metaKey="openCommandTemplate"
            emptyMessage="No editors configured. Add one to open projects in an editor."
            supportsDefault
            fields={EDITOR_FIELDS}
            load={getAllEditors}
            create={addEditor}
            update={updateEditor}
            remove={deleteEditor}
            makeBlank={(order) => ({
              id: generateId(),
              name: '',
              executable: '',
              openCommandTemplate: '',
              icon: 'code',
              enabled: true,
              isDefault: false,
              isBuiltIn: false,
              order,
            })}
            onDefaultChange={(id) => update({ defaultEditorId: id })}
            onChanged={reloadTools}
          />
        )}

        {activeTab === 'applications' && (
          <CollectionSection<ToolDefinition>
            title="Applications"
            description="File managers, browsers, git clients, and anything else you launch against a project. Set the category to group them."
            itemNoun="application"
            metaKey="commandTemplate"
            emptyMessage="No applications configured yet."
            fields={TOOL_FIELDS}
            load={getAllTools}
            create={addTool}
            update={updateTool}
            remove={deleteTool}
            makeBlank={(order) => ({
              id: generateId(),
              name: '',
              category: 'custom',
              executable: '',
              commandTemplate: '',
              icon: 'app-window',
              enabled: true,
              isDefault: false,
              isBuiltIn: false,
              order,
            })}
            onChanged={reloadTools}
          />
        )}

        {activeTab === 'commands' && <CommandsSection onChanged={reloadTools} />}

        {activeTab === 'shortcuts' && <ShortcutsSection />}

        {activeTab === 'data' && (
          <>
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>Export & Import</h3>
              <p className={styles.settingsSectionDesc}>
                Back up your data as JSON or restore from a previous backup.
              </p>
              <div className={styles.settingsRow}>
                <div className={styles.settingsRowInfo}>
                  <span className={styles.settingsRowLabel}>Export all data</span>
                  <span className={styles.settingsRowDesc}>Download a JSON backup of all projects, settings, commands, and shortcuts</span>
                </div>
                <div className={styles.settingsRowControl}>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Download size={14} />}
                    onClick={handleExport}
                  >
                    Export
                  </Button>
                </div>
              </div>

              <div className={styles.settingsRow}>
                <div className={styles.settingsRowInfo}>
                  <span className={styles.settingsRowLabel}>Import backup</span>
                  <span className={styles.settingsRowDesc}>Restore projects, launch sets, and settings from a JSON backup file</span>
                </div>
                <div className={styles.settingsRowControl}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    style={{ display: 'none' }}
                    onChange={handleImportFile}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Upload size={14} />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Import JSON
                  </Button>
                </div>
              </div>
            </div>

            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>Storage</h3>
              <p className={styles.settingsSectionDesc}>
                ProjectShelf stores everything in your browser&apos;s local storage. Nothing is
                uploaded anywhere.
              </p>
              <div className={styles.storageRow}>
                <div className={styles.storageInfo}>
                  <span className={styles.settingsRowLabel}>Used by ProjectShelf</span>
                  <span className={styles.settingsRowDesc}>The amount of space your projects and settings currently occupy</span>
                </div>
                <div className={styles.storageBar}>
                  <div className={styles.storageTrack}>
                    <div
                      className={styles.storageFill}
                      style={{ width: storagePercent ? `${Math.min(storagePercent, 100)}%` : '0%' }}
                    />
                  </div>
                  <div className={styles.storageNumbers}>
                    <span>{formatBytes(storageUsed)}</span>
                    <span>{formatBytes(storageQuota)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>Danger Zone</h3>
              <div className={styles.dangerZone}>
                <div className={styles.dangerTitle}>Clear All Data</div>
                <p className={styles.dangerDesc}>
                  This will permanently delete all projects, launch sets, and custom configurations.
                  Default presets will be restored. This action cannot be undone.
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 size={14} />}
                  onClick={() =>
                    settings.confirmDestructive ? setConfirmClear(true) : handleClearData()
                  }
                >
                  Clear All Data
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Import preview: what the file holds, before anything is written. */}
      <Modal
        open={pendingImport !== null}
        onClose={() => setPendingImport(null)}
        title="Import backup"
        description={
          pendingImport?.validation.valid
            ? 'These records will be merged into your existing data. Records with matching ids are replaced.'
            : 'This file cannot be imported.'
        }
        size="default"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingImport(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!pendingImport?.validation.valid}
              onClick={handleConfirmImport}
            >
              Import
            </Button>
          </>
        }
      >
        {pendingImport && (
          <div className={styles.collectionList}>
            {pendingImport.validation.errors.length > 0 && (
              <div className={styles.settingsNotice} role="alert">
                <AlertTriangle size={15} className={styles.settingsNoticeIcon} />
                <span>{pendingImport.validation.errors.join('. ')}</span>
              </div>
            )}

            {pendingImport.validation.warnings.length > 0 && (
              <div className={styles.settingsNotice} role="status">
                <AlertTriangle size={15} className={styles.settingsNoticeIcon} />
                <span>{pendingImport.validation.warnings.join('. ')}</span>
              </div>
            )}

            {pendingImport.validation.valid && (
              <>
                <div className={styles.settingsRow}>
                  <div className={styles.settingsRowInfo}>
                    <span className={styles.settingsRowLabel}>Backup format version</span>
                  </div>
                  <div className={styles.settingsRowControl}>
                    {pendingImport.validation.version ?? 'unknown'}
                  </div>
                </div>

                {Object.entries(pendingImport.validation.counts).map(([key, count]) => (
                  <div key={key} className={styles.settingsRow}>
                    <div className={styles.settingsRowInfo}>
                      <span className={styles.settingsRowLabel}>
                        {IMPORT_LABELS[key] ?? key}
                      </span>
                    </div>
                    <div className={styles.settingsRowControl}>{count}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Clearing local data is irreversible, so it always confirms. */}
      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear all data?"
        description="Every project, launch set, and customisation stored in this browser is deleted and the built-in presets are restored. This cannot be undone. Export a backup first if you want to keep anything."
        size="narrow"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleClearData}>
              Delete everything
            </Button>
          </>
        }
      >
        <span />
      </Modal>
    </div>
  );
}

// ── Import Preview Labels ──────────────────────────────────

const IMPORT_LABELS: Record<string, string> = {
  projects: 'Projects',
  commands: 'Commands',
  terminals: 'Terminals',
  editors: 'Editors',
  tools: 'Applications',
  launchSets: 'Launch sets',
  shortcuts: 'Shortcuts',
  tags: 'Tags',
};

// ── Byte Formatting ────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
