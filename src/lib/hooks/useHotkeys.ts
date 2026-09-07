'use client';

import { useEffect, useRef } from 'react';

// ── Types ──────────────────────────────────────────────────

export interface HotkeyAction {
  id: string;
  keyCombo: string;
  handler: (e?: KeyboardEvent) => void;
  scope?: string;
  enabled?: boolean;
}

// ── Parse key combo ────────────────────────────────────────

export interface ParsedCombo {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string;
}

export function parseKeyCombo(combo: string): ParsedCombo {
  const parts = combo
    .toLowerCase()
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean);

  const modifiers = new Set(parts.slice(0, -1));
  const key = parts[parts.length - 1] ?? '';

  return {
    ctrl: modifiers.has('ctrl') || modifiers.has('control'),
    shift: modifiers.has('shift'),
    alt: modifiers.has('alt'),
    meta: modifiers.has('meta') || modifiers.has('cmd') || modifiers.has('command'),
    key,
  };
}

export function matchesEvent(parsed: ParsedCombo, e: KeyboardEvent): boolean {
  // Primary modifier matching:
  // On Windows/Linux, user presses Ctrl (e.ctrlKey).
  // On Mac, user presses Cmd (e.metaKey).
  // If the combo specifies 'ctrl' or 'meta'/'cmd', we allow either (cross-platform primary modifier).
  const wantsPrimary = parsed.ctrl || parsed.meta;
  const hasPrimary = e.ctrlKey || e.metaKey;

  if (wantsPrimary) {
    if (!hasPrimary) return false;
  } else {
    // If not wanting ctrl/meta, ensure neither is pressed
    if (e.ctrlKey || e.metaKey) return false;
  }

  // Shift modifier matching:
  // If the target key itself is '?' (which requires Shift on US keyboards),
  // allow either parsed.shift or e.key === '?' directly.
  if (parsed.key === '?') {
    if (!e.shiftKey && e.key !== '?') return false;
  } else {
    if (parsed.shift !== e.shiftKey) return false;
  }

  // Alt modifier matching
  if (parsed.alt !== e.altKey) return false;

  // Key matching
  const eventKey = e.key.toLowerCase();
  const targetKey = parsed.key.toLowerCase();

  // 1. Exact match on eventKey
  if (eventKey === targetKey) return true;

  // 2. Special character normalization
  if (targetKey === '?' && (eventKey === '?' || (e.shiftKey && eventKey === '/'))) return true;
  if (targetKey === '/' && eventKey === '/') return true;
  if (targetKey === ',' && eventKey === ',') return true;
  if (targetKey === '.' && eventKey === '.') return true;
  if ((targetKey === 'esc' || targetKey === 'escape') && eventKey === 'escape') return true;
  if ((targetKey === 'del' || targetKey === 'delete') && eventKey === 'delete') return true;
  if (targetKey === 'backspace' && eventKey === 'backspace') return true;
  if ((targetKey === 'enter' || targetKey === 'return') && eventKey === 'enter') return true;
  if ((targetKey === 'space' || targetKey === ' ') && (eventKey === ' ' || eventKey === 'space')) return true;
  if (targetKey === 'tab' && eventKey === 'tab') return true;

  // 3. Function keys F1-F12
  if (/^f\d{1,2}$/.test(targetKey) && eventKey === targetKey) {
    return true;
  }

  // 4. Physical code fallback (crucial for Windows/Chrome with Ctrl+key combos and foreign keyboards)
  if (e.code) {
    const code = e.code.toLowerCase();

    // Letter keys: 'KeyK' -> 'keyk' matches target 'k'
    if (targetKey.length === 1 && targetKey >= 'a' && targetKey <= 'z') {
      if (code === `key${targetKey}`) return true;
    }

    // Number keys: 'Digit1' -> 'digit1' or 'Numpad1' -> 'numpad1' matches target '1'
    if (targetKey.length === 1 && targetKey >= '0' && targetKey <= '9') {
      if (code === `digit${targetKey}` || code === `numpad${targetKey}`) return true;
    }

    // Slash and comma keys
    if (targetKey === '/' && code === 'slash') return true;
    if (targetKey === ',' && code === 'comma') return true;
    if (targetKey === '.' && code === 'period') return true;
  }

  return false;
}

// ── useHotkeys Hook ────────────────────────────────────────

export function useHotkeys(actions: HotkeyAction[]) {
  // Held in a ref so the listener is registered once and still sees the
  // latest handlers. Written in an effect, never during render.
  const actionsRef = useRef(actions);

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isInput =
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target?.isContentEditable === true;

      // Escape belongs to whatever overlay is on top. Without this, closing
      // a dialog with Escape would also run the global Escape shortcut and,
      // for example, wipe the user's selection behind the dialog.
      const overlayOpen = document.querySelector('[role="dialog"]') !== null;

      for (const action of actionsRef.current) {
        if (action.enabled === false) continue;
        const parsed = parseKeyCombo(action.keyCombo);

        if (overlayOpen && (parsed.key === 'escape' || parsed.key === 'esc')) continue;

        if (matchesEvent(parsed, e)) {
          // Don't hijack standard text operations like Ctrl+A, Ctrl+C, Ctrl+V,
          // Ctrl+Z, Ctrl+X while the user is editing text inside an input.
          if (isInput) {
            const isTextEditingKey =
              (parsed.ctrl || parsed.meta) &&
              ['a', 'c', 'v', 'x', 'z', 'y'].includes(parsed.key.toLowerCase());

            if (isTextEditingKey) {
              continue; // Allow user to copy/paste/select in input
            }

            // While an input is focused, only run shortcuts that include a
            // modifier or Escape. A bare '/', '?', 'delete', or 'f1' must keep
            // typing naturally instead of jumping to search or a dialog.
            const hasModifier = parsed.ctrl || parsed.meta || parsed.alt;
            const isEscape =
              parsed.key === 'escape' || parsed.key === 'esc';

            if (!hasModifier && !isEscape) {
              continue;
            }
          }

          // Intercept and prevent browser default (e.g. Chrome Omnibox for Ctrl+K, Find for Ctrl+F, New Window for Ctrl+N)
          e.preventDefault();
          e.stopPropagation();
          action.handler(e);
          return;
        }
      }
    };

    // Use capture phase on window so that browser defaults (like Ctrl+K or Ctrl+F in Chrome) can be prevented
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);
}

// ── Format key combo for display ───────────────────────────

export function formatKeyCombo(combo: string): string {
  return combo
    .split('+')
    .map((part) => {
      const p = part.trim().toLowerCase();
      switch (p) {
        case 'ctrl': return 'Ctrl';
        case 'shift': return 'Shift';
        case 'alt': return 'Alt';
        case 'meta':
        case 'cmd': return 'Cmd';
        case 'escape':
        case 'esc': return 'Esc';
        case 'delete':
        case 'del': return 'Del';
        case 'backspace': return 'Bksp';
        case 'enter': return 'Enter';
        case 'space': return 'Space';
        default: return p.length === 1 ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1);
      }
    })
    .join(' + ');
}
