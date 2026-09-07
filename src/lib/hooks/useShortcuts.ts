'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import type { ShortcutDefinition } from '@/lib/db/schema';
import { getAllShortcuts } from '@/lib/db';
import { APP_EVENTS, isAppActionId, type AppActionId } from '@/lib/actions';
import { useHotkeys, type HotkeyAction } from './useHotkeys';

// ── Types ──────────────────────────────────────────────────

export type ActionHandlers = Partial<Record<AppActionId, () => void>>;

// ── Hook ───────────────────────────────────────────────────

/**
 * Loads the user's shortcut bindings from IndexedDB and registers them
 * against the supplied action handlers.
 *
 * Bindings are data, so rebinding a key in settings takes effect without
 * touching any component. Reloads when a shortcut is edited.
 */
export function useShortcuts(handlers: ActionHandlers): {
  shortcuts: ShortcutDefinition[];
  reload: () => void;
} {
  const [shortcuts, setShortcuts] = useState<ShortcutDefinition[]>([]);

  const reload = useCallback(() => {
    getAllShortcuts()
      .then(setShortcuts)
      .catch(() => setShortcuts([]));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Pick up edits made in the settings area.
  useEffect(() => {
    const onChanged = () => reload();
    document.addEventListener(APP_EVENTS.shortcutsChanged, onChanged);
    return () => document.removeEventListener(APP_EVENTS.shortcutsChanged, onChanged);
  }, [reload]);

  const hotkeys = useMemo<HotkeyAction[]>(() => {
    return shortcuts
      .filter((shortcut) => shortcut.keyCombo && isAppActionId(shortcut.actionId))
      .map((shortcut) => {
        const handler = handlers[shortcut.actionId as AppActionId];
        return {
          id: shortcut.id,
          keyCombo: shortcut.keyCombo,
          scope: shortcut.scope,
          enabled: Boolean(handler),
          handler: () => handler?.(),
        };
      });
  }, [shortcuts, handlers]);

  useHotkeys(hotkeys);

  return { shortcuts, reload };
}
