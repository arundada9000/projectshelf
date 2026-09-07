'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import type { ShortcutDefinition, ShortcutScope } from '@/lib/db/schema';
import { getAllShortcuts, updateShortcut, resetShortcuts } from '@/lib/db';
import {
  APP_ACTIONS,
  APP_ACTION_MAP,
  APP_EVENTS,
  emitAppEvent,
  findShortcutConflicts,
} from '@/lib/actions';
import { DEFAULT_SHORTCUTS } from '@/lib/db/presets';
import { Button, ShortcutRecorder, useToast } from '@/components/ui';
import { useLoadOnMount } from '@/lib/hooks/useLoadOnMount';
import styles from '../Settings.module.css';

// ── Scope Labels ───────────────────────────────────────────

const SCOPE_LABELS: Record<ShortcutScope, string> = {
  global: 'Global',
  navigation: 'Navigation',
  projects: 'Projects view',
  selection: 'With a selection',
  'command-palette': 'Command palette',
};

const SCOPE_ORDER: ShortcutScope[] = [
  'global',
  'navigation',
  'projects',
  'selection',
  'command-palette',
];

const SCOPE_HINTS: Record<ShortcutScope, string> = {
  global: 'Available anywhere in the application.',
  navigation: 'Moves between the main areas.',
  projects: 'Applies while the projects view is open.',
  selection: 'Applies to the projects you have selected.',
  'command-palette': 'Applies while the palette is open.',
};

// ── Shortcuts Section ──────────────────────────────────────

export function ShortcutsSection() {
  const { toast } = useToast();
  const [shortcuts, setShortcuts] = useState<ShortcutDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setShortcuts(await getAllShortcuts());
    } catch {
      toast('Could not load shortcuts', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useLoadOnMount(load);

  const conflicts = useMemo(() => findShortcutConflicts(shortcuts), [shortcuts]);

  const handleChange = useCallback(
    async (shortcut: ShortcutDefinition, keyCombo: string) => {
      const updated = { ...shortcut, keyCombo };
      // Update locally first so the field responds immediately.
      setShortcuts((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      try {
        await updateShortcut(updated);
        emitAppEvent(APP_EVENTS.shortcutsChanged);
      } catch {
        toast('Could not save the shortcut', 'error');
        load();
      }
    },
    [toast, load]
  );

  const handleResetOne = useCallback(
    (shortcut: ShortcutDefinition) => {
      const preset = DEFAULT_SHORTCUTS.find((s) => s.id === shortcut.id);
      if (!preset) return;
      handleChange(shortcut, preset.keyCombo);
    },
    [handleChange]
  );

  const handleResetAll = useCallback(async () => {
    try {
      await resetShortcuts();
      await load();
      emitAppEvent(APP_EVENTS.shortcutsChanged);
      toast('Shortcuts restored to defaults', 'success');
    } catch {
      toast('Could not restore defaults', 'error');
    }
  }, [load, toast]);

  if (loading) return null;

  // Group by the scope recorded on each binding, ordered for reading.
  const grouped = new Map<ShortcutScope, ShortcutDefinition[]>();
  for (const shortcut of shortcuts) {
    const list = grouped.get(shortcut.scope) ?? [];
    list.push(shortcut);
    grouped.set(shortcut.scope, list);
  }

  const conflictCount = conflicts.size;

  return (
    <>
      <div className={styles.settingsSection}>
        <div className={styles.settingsSectionHeader}>
          <div>
            <h3 className={styles.settingsSectionTitle}>Keyboard Shortcuts</h3>
            <p className={styles.settingsSectionDesc}>
              Select a shortcut to record a new key combination. Press Escape while recording
              to cancel.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<RotateCcw size={14} />}
            onClick={handleResetAll}
          >
            Restore defaults
          </Button>
        </div>

        {conflictCount > 0 && (
          <div className={styles.settingsNotice} role="status">
            <AlertTriangle size={15} className={styles.settingsNoticeIcon} />
            <span>
              {conflictCount === 1
                ? '1 shortcut conflicts with another binding.'
                : `${conflictCount} shortcuts conflict with other bindings.`}{' '}
              Conflicting keys are marked below. Only one of them will fire.
            </span>
          </div>
        )}
      </div>

      {SCOPE_ORDER.map((scope) => {
        const list = grouped.get(scope);
        if (!list || list.length === 0) return null;

        return (
          <div key={scope} className={styles.settingsSection}>
            <h4 className={styles.settingsSubsectionTitle}>{SCOPE_LABELS[scope]}</h4>
            <p className={styles.settingsSectionDesc}>{SCOPE_HINTS[scope]}</p>

            {list.map((shortcut) => {
              const action = APP_ACTION_MAP[shortcut.actionId];
              const clashes = conflicts.get(shortcut.id);
              const preset = DEFAULT_SHORTCUTS.find((s) => s.id === shortcut.id);
              const isModified = preset ? preset.keyCombo !== shortcut.keyCombo : false;

              return (
                <div key={shortcut.id} className={styles.settingsRow}>
                  <div className={styles.settingsRowInfo}>
                    <span className={styles.settingsRowLabel}>
                      {action?.label ?? shortcut.description}
                      {isModified && <span className={styles.settingsBadge}>Changed</span>}
                    </span>
                    <span className={styles.settingsRowDesc}>
                      {action?.description ?? shortcut.description}
                    </span>
                  </div>
                  <div className={styles.settingsRowControl}>
                    <ShortcutRecorder
                      label={action?.label ?? shortcut.description}
                      value={shortcut.keyCombo}
                      onChange={(combo) => handleChange(shortcut, combo)}
                      onReset={isModified ? () => handleResetOne(shortcut) : undefined}
                      conflict={
                        clashes && clashes.length > 0
                          ? clashes
                              .map((c) => APP_ACTION_MAP[c.actionId]?.label ?? c.description)
                              .join(', ')
                          : undefined
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Actions the registry knows about but no binding exists for. */}
      {(() => {
        const bound = new Set(shortcuts.map((s) => s.actionId));
        const unbound = APP_ACTIONS.filter((a) => !bound.has(a.id));
        if (unbound.length === 0) return null;

        return (
          <div className={styles.settingsSection}>
            <h4 className={styles.settingsSubsectionTitle}>Without a shortcut</h4>
            <p className={styles.settingsSectionDesc}>
              These actions are available from the command palette but have no key bound.
            </p>
            {unbound.map((action) => (
              <div key={action.id} className={styles.settingsRow}>
                <div className={styles.settingsRowInfo}>
                  <span className={styles.settingsRowLabel}>{action.label}</span>
                  <span className={styles.settingsRowDesc}>{action.description}</span>
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </>
  );
}
