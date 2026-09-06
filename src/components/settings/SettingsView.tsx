'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Palette,
  Type,
  Terminal,
  Code2,
  Keyboard,
  Database,
  Download,
  Upload,
  Trash2,
} from 'lucide-react';
import type { ThemeName, FontName, DensityMode, UserSettings } from '@/lib/db/schema';
import { getSettings, updateSettings, clearAllData } from '@/lib/db';
import { exportAllData, downloadJSON } from '@/lib/db/import-export';
import { Button, Switch, Select, useToast } from '@/components/ui';
import styles from './Settings.module.css';

// ── Theme Definitions ──────────────────────────────────────

const THEMES: { id: ThemeName; label: string; bg: string; surface: string; accent: string }[] = [
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

type SettingsTab = 'appearance' | 'data';

// ── Settings View ──────────────────────────────────────────

export function SettingsView() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const update = useCallback(
    async (partial: Partial<UserSettings>) => {
      const updated = await updateSettings(partial);
      setSettings(updated);

      // Apply theme/font/density to DOM immediately
      if (partial.theme) {
        document.documentElement.setAttribute('data-theme', partial.theme);
      }
      if (partial.font) {
        document.documentElement.setAttribute('data-font', partial.font);
      }
      if (partial.density) {
        document.documentElement.setAttribute('data-density', partial.density);
      }
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

  const handleClearData = useCallback(async () => {
    try {
      await clearAllData();
      const fresh = await getSettings();
      setSettings(fresh);
      toast('All data cleared and defaults restored', 'success');
    } catch {
      toast('Failed to clear data', 'error');
    }
  }, [toast]);

  if (!settings) return null;

  return (
    <div className={styles.settingsLayout}>
      {/* Sidebar Nav */}
      <nav className={styles.settingsNav}>
        <button
          type="button"
          className={`${styles.settingsNavItem} ${activeTab === 'appearance' ? styles.settingsNavItemActive : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          <Palette size={16} />
          Appearance
        </button>
        <button
          type="button"
          className={`${styles.settingsNavItem} ${activeTab === 'data' ? styles.settingsNavItemActive : ''}`}
          onClick={() => setActiveTab('data')}
        >
          <Database size={16} />
          Data
        </button>
      </nav>

      {/* Content */}
      <div className={styles.settingsContent}>
        {activeTab === 'appearance' && (
          <>
            {/* Theme */}
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>Theme</h3>
              <p className={styles.settingsSectionDesc}>
                Choose a color theme for the interface. 12 handcrafted palettes.
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
            </div>
          </>
        )}

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
                  onClick={handleClearData}
                >
                  Clear All Data
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
